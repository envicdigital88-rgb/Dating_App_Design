'use server'

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { Resend } from 'resend';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

const secretKey = process.env.SESSION_SECRET || 'winglemingle_session_jwt_secret_key_2026_super_secure_auth_token_99x';
const encodedKey = new TextEncoder().encode(secretKey);
const VERIFY_COOKIE_NAME = 'wm_email_verify_token';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function computeOtpHash(otp: string, email: string, userId: string): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update(`${otp.trim()}:${email.toLowerCase().trim()}:${userId}`)
    .digest('hex');
}

export async function verifyEmailAddress(email: string) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { ok: false, error: 'Unauthorized. Please sign in to verify your email.' };
    }
    const userId = session.userId as string;

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    // Check if email is already taken by another account
    const existing = await db.orm.public.User.where({ email: normalizedEmail }).first();
    if (existing && existing.id !== userId) {
      return { ok: false, error: 'This email address is already in use by another account.' };
    }

    // Generate secure 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = computeOtpHash(otp, normalizedEmail, userId);

    // Expire code in 10 minutes
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const token = await new SignJWT({
      userId,
      email: normalizedEmail,
      otpHash,
      attempts: 0,
      expiresAt
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(encodedKey);

    const cookieStore = await cookies();
    cookieStore.set(VERIFY_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(expiresAt),
      maxAge: 10 * 60,
      sameSite: 'lax',
      path: '/'
    });

    const resend = getResendClient();
    if (!resend) {
      console.warn('[Resend] RESEND_API_KEY not configured.');
      return { ok: false, error: 'Email service is currently unavailable. Please try again later.' };
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Wingle Mingle Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07061a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #07061a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #12102e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <span style="font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #ec4899 0%, #8b2fc9 60%, #0ea5e9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px;">
                Wingle Mingle
              </span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">Verify Your Email</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.65);">
                Please enter this 6-digit verification code to confirm your email and complete your Wingle Mingle account setup:
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <div style="display: inline-block; background: rgba(236, 72, 153, 0.12); border: 2px solid #ec4899; border-radius: 16px; padding: 16px 36px; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', Courier, monospace;">
                ${otp}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: rgba(255, 255, 255, 0.45);">
                This code will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;" align="center">
              <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.3);">
                © ${new Date().getFullYear()} Wingle Mingle. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const sendRes = await resend.emails.send({
      from: 'Wingle Mingle <no-reply@winglemingle.com>',
      to: normalizedEmail,
      subject: `${otp} is your Wingle Mingle verification code`,
      html: htmlContent
    });

    if (sendRes.error) {
      console.error('[Resend] Send error:', sendRes.error);
      return { ok: false, error: sendRes.error.message || 'Failed to deliver verification email. Please check the address.' };
    }

    return { ok: true, message: `Verification code sent to ${normalizedEmail}` };
  } catch (error: any) {
    console.error('Verify email error:', error);
    return { ok: false, error: error?.message || 'Failed to send verification code email' };
  }
}

export async function confirmEmailOtp(email: string, enteredOtp: string) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { ok: false, error: 'Unauthorized. Please sign in.' };
    }
    const userId = session.userId as string;

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = enteredOtp.trim().replace(/\D/g, '');

    if (cleanOtp.length !== 6) {
      return { ok: false, error: 'Please enter the complete 6-digit verification code.' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(VERIFY_COOKIE_NAME)?.value;

    if (!token) {
      return { ok: false, error: 'Verification code not found or expired. Please click "Change email" and request a new code.' };
    }

    let payload: any;
    try {
      const verifyResult = await jwtVerify(token, encodedKey, {
        algorithms: ['HS256']
      });
      payload = verifyResult.payload;
    } catch (jwtErr) {
      return { ok: false, error: 'Your verification code has expired. Please request a new code.' };
    }

    if (!payload || payload.userId !== userId) {
      return { ok: false, error: 'Unauthorized verification request.' };
    }

    if (payload.email !== normalizedEmail) {
      return { ok: false, error: 'The email address does not match the one the code was sent to.' };
    }

    if (Date.now() > payload.expiresAt) {
      cookieStore.set(VERIFY_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return { ok: false, error: 'Your verification code has expired. Please request a new one.' };
    }

    const currentAttempts = (payload.attempts || 0) + 1;
    if (currentAttempts > 5) {
      cookieStore.set(VERIFY_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return { ok: false, error: 'Too many incorrect attempts. Please request a new verification code.' };
    }

    // Verify code against cryptographic hash
    const expectedHash = computeOtpHash(cleanOtp, normalizedEmail, userId);

    if (expectedHash !== payload.otpHash) {
      // Update attempts in token cookie
      const updatedToken = await new SignJWT({
        ...payload,
        attempts: currentAttempts
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(new Date(payload.expiresAt))
        .sign(encodedKey);

      cookieStore.set(VERIFY_COOKIE_NAME, updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(payload.expiresAt),
        maxAge: Math.max(0, Math.floor((payload.expiresAt - Date.now()) / 1000)),
        sameSite: 'lax',
        path: '/'
      });

      const remainingAttempts = 5 - currentAttempts;
      return {
        ok: false,
        error: `Incorrect verification code. Please check your email and enter the code sent to you. (${remainingAttempts} attempts remaining)`
      };
    }

    // Correct code entered! Check if email is already in use by another user
    const existing = await db.orm.public.User.where({ email: normalizedEmail }).first();
    if (existing && existing.id !== userId) {
      return { ok: false, error: 'This email is already in use by another account.' };
    }

    // Update user in DB with verified email
    await db.orm.public.User.where({ id: userId }).update({
      email: normalizedEmail,
      verified: true
    });

    // Clear verification cookie
    cookieStore.set(VERIFY_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/'
    });

    return { ok: true, message: 'Email verified successfully!' };
  } catch (error: any) {
    console.error('Confirm OTP error:', error);
    return { ok: false, error: error?.message || 'Failed to verify code' };
  }
}
