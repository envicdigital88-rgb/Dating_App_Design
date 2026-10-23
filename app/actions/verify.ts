'use server'

import { db } from '@/lib/db';
import { getSession, createSession } from '@/lib/session';
import { Resend } from 'resend';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  formatNotifyPhoneNumber,
  getPhoneVariants,
  validatePhoneNumber,
  maskPhoneNumber,
  sendVerificationOtpSms
} from '@/lib/notify';
import { Temporal } from 'temporal-polyfill';

const secretKey = process.env.SESSION_SECRET || 'winglemingle_session_jwt_secret_key_2026_super_secure_auth_token_99x';
const encodedKey = new TextEncoder().encode(secretKey);

const VERIFY_COOKIE_NAME = 'wm_email_verify_token';
const PHONE_VERIFY_COOKIE_NAME = 'wm_phone_verify_token';
const PENDING_REG_COOKIE_NAME = 'wm_pending_reg_token';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function computeOtpHash(otp: string, identifier: string, salt: string): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update(`${otp.trim()}:${identifier.trim().toLowerCase()}:${salt.trim()}`)
    .digest('hex');
}

async function sendOtpEmail(toEmail: string, otp: string) {
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

  try {
    const sendRes = await resend.emails.send({
      from: 'Wingle Mingle <no-reply@winglemingle.com>',
      to: toEmail,
      subject: `${otp} is your Wingle Mingle verification code`,
      html: htmlContent
    });

    if (sendRes.error) {
      console.error('[Resend] Send error:', sendRes.error);
      return { ok: false, error: sendRes.error.message || 'Failed to deliver verification email. Please check the address.' };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('[Resend] Send exception:', err);
    return { ok: false, error: err?.message || 'Failed to send verification email' };
  }
}

// ==============================================================================
// 1. PENDING REGISTRATION FLOW (Via Mobile SMS OTP: NO user saved in DB until verified)
// ==============================================================================

export async function startPendingRegistration(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  age?: number;
  gender?: string;
  intention?: string;
}) {
  try {
    const cleanName = data.name?.trim();
    if (!cleanName || cleanName.length < 2) {
      return { ok: false, error: 'Name must be at least 2 characters.' };
    }

    const cleanEmail = data.email?.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }

    // Strict phone number validation (Sri Lankan or international format)
    const phoneValidation = validatePhoneNumber(data.phone);
    if (!phoneValidation.valid) {
      return { ok: false, error: phoneValidation.error || 'Please enter a valid mobile number.' };
    }
    const formattedPhone = phoneValidation.formatted;
    const maskedPhone = maskPhoneNumber(formattedPhone);

    if (!data.password || data.password.length < 8) {
      return { ok: false, error: 'Password must be at least 8 characters.' };
    }

    // Check if email already in use by an active account
    const existingEmail = await db.orm.public.User.where({ email: cleanEmail }).first();
    if (existingEmail) {
      return { ok: false, error: 'This email is already in use by an active account.' };
    }

    // Check if phone already in use across any standard format variant (prevents duplicate accounts)
    const phoneVariants = getPhoneVariants(formattedPhone);
    const existingPhone = await db.orm.public.User.where(u => u.phone.in(phoneVariants)).first();
    if (existingPhone) {
      return { ok: false, error: 'This mobile number is already registered to an account. Please sign in.' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = computeOtpHash(otp, formattedPhone, cleanEmail);

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store pending registration data in signed JWT cookie (NO DB ROW CREATED UNTIL VERIFIED!)
    const token = await new SignJWT({
      name: cleanName,
      email: cleanEmail,
      phone: formattedPhone,
      maskedPhone,
      hashedPassword,
      age: data.age || 20,
      gender: data.gender || 'woman',
      intention: data.intention || 'Long-term relationship',
      otpHash,
      expiresAt,
      attempts: 0
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(encodedKey);

    const cookieStore = await cookies();
    cookieStore.set(PENDING_REG_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(expiresAt),
      maxAge: 10 * 60,
      sameSite: 'lax',
      path: '/'
    });

    // Send 6-digit verification code directly to mobile phone via SMS
    const sendResult = await sendVerificationOtpSms(formattedPhone, otp);
    if (!sendResult.ok) {
      console.error('[SMS Verify] Send error:', sendResult.error);
      return {
        ok: false,
        error: sendResult.error || 'Failed to send SMS verification code. Please check your mobile number.'
      };
    }

    return {
      ok: true,
      phone: formattedPhone,
      maskedPhone,
      email: cleanEmail,
      message: `Verification code sent via SMS to ${maskedPhone}`
    };
  } catch (error: any) {
    console.error('startPendingRegistration error:', error);
    return { ok: false, error: error?.message || 'Failed to start registration' };
  }
}

export async function getPendingRegistrationStatus() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PENDING_REG_COOKIE_NAME)?.value;
    if (!token) return { hasPending: false };

    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
    if (!payload?.phone || (payload.expiresAt && Date.now() > (payload.expiresAt as number))) {
      return { hasPending: false };
    }

    return {
      hasPending: true,
      phone: payload.phone as string,
      maskedPhone: (payload.maskedPhone as string) || maskPhoneNumber(payload.phone as string),
      email: (payload.email as string) || ''
    };
  } catch {
    return { hasPending: false };
  }
}

export async function resendPendingRegistrationOtp() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PENDING_REG_COOKIE_NAME)?.value;
    if (!token) {
      return { ok: false, error: 'Registration session expired. Please sign up again.' };
    }

    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
    if (!payload?.phone || !payload?.email) {
      return { ok: false, error: 'Invalid registration session. Please sign up again.' };
    }

    const phone = payload.phone as string;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = computeOtpHash(otp, phone, payload.email as string);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const updatedToken = await new SignJWT({
      ...payload,
      otpHash,
      expiresAt,
      attempts: 0
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(encodedKey);

    cookieStore.set(PENDING_REG_COOKIE_NAME, updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(expiresAt),
      maxAge: 10 * 60,
      sameSite: 'lax',
      path: '/'
    });

    const sendRes = await sendVerificationOtpSms(phone, otp);
    if (!sendRes.ok) {
      return { ok: false, error: sendRes.error || 'Failed to resend SMS verification code' };
    }

    return {
      ok: true,
      phone,
      maskedPhone: (payload.maskedPhone as string) || maskPhoneNumber(phone)
    };
  } catch (error: any) {
    console.error('resendPendingRegistrationOtp error:', error);
    return { ok: false, error: error?.message || 'Failed to resend code' };
  }
}

export async function confirmPendingRegistration(enteredOtp: string) {
  try {
    const cleanOtp = enteredOtp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      return { ok: false, error: 'Please enter the complete 6-digit verification code.' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(PENDING_REG_COOKIE_NAME)?.value;
    if (!token) {
      return { ok: false, error: 'Registration session expired. Please sign up again.' };
    }

    let payload: any;
    try {
      const verifyResult = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
      payload = verifyResult.payload;
    } catch {
      return { ok: false, error: 'Your verification code has expired. Please sign up again.' };
    }

    if (!payload?.phone || !payload?.email || !payload?.hashedPassword) {
      return { ok: false, error: 'Invalid registration session.' };
    }

    if (Date.now() > payload.expiresAt) {
      cookieStore.set(PENDING_REG_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return { ok: false, error: 'Your verification code has expired. Please request a new one.' };
    }

    const currentAttempts = (payload.attempts || 0) + 1;
    if (currentAttempts > 5) {
      cookieStore.set(PENDING_REG_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return { ok: false, error: 'Too many incorrect attempts. Please sign up again.' };
    }

    const expectedHash = computeOtpHash(cleanOtp, payload.phone, payload.email);
    if (expectedHash !== payload.otpHash) {
      // Update attempts in cookie
      const updatedToken = await new SignJWT({
        ...payload,
        attempts: currentAttempts
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(new Date(payload.expiresAt))
        .sign(encodedKey);

      cookieStore.set(PENDING_REG_COOKIE_NAME, updatedToken, {
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
        error: `Incorrect verification code. Please check your SMS and enter the code sent to you. (${remainingAttempts} attempts remaining)`
      };
    }

    // CODE IS CORRECT!
    // Strict uniqueness check before creating the user in database
    const existingEmail = await db.orm.public.User.where({ email: payload.email }).first();
    if (existingEmail) {
      return { ok: false, error: 'This email is already in use by another account.' };
    }

    const phoneVariants = getPhoneVariants(payload.phone);
    const existingPhone = await db.orm.public.User.where(u => u.phone.in(phoneVariants)).first();
    if (existingPhone) {
      return { ok: false, error: 'This mobile number is already registered to an account. Please sign in.' };
    }

    const pendingSecretWingles = await db.orm.public.SecretWingle.where(sw =>
      sw.targetPhone.in(phoneVariants)
    ).all();

    const secretBonus = pendingSecretWingles.length * 20;

    const user = await db.transaction(async (tx) => {
      const newUser = await tx.orm.public.User.create({
        name: payload.name,
        email: payload.email,
        phone: payload.phone, // Clean standardized mobile number (e.g. 947XXXXXXXX)
        password: payload.hashedPassword,
        age: payload.age || 20,
        gender: payload.gender || 'woman',
        intention: payload.intention || 'Long-term relationship',
        verified: true, // VERIFIED IS TRUE!
        onboarded: false,
        wingitsBalance: secretBonus,
        lastDailyBonusAt: Temporal.Instant.from(new Date().toISOString()),
        interests: '[]',
        traits: '[]',
        lifestyle: JSON.stringify({
          drinking: '',
          smoking: '',
          exercise: '',
          pets: '',
          children: '',
          education: '',
          work: ''
        })
      });

      if (secretBonus > 0) {
        await tx.orm.public.WingitsTransaction.create({
          id: crypto.randomUUID(),
          userId: newUser.id,
          amount: secretBonus,
          type: 'bonus',
          description: `Secret Wingle welcome gift (+${secretBonus} Wingits)`
        });
      }

      return newUser;
    });

    // Create verified session
    await createSession(user.id, true);

    // Clear pending registration cookie
    cookieStore.set(PENDING_REG_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/'
    });

    return {
      ok: true,
      data: {
        userId: user.id,
        name: user.name,
        role: user.role,
        onboarded: false
      }
    };
  } catch (error: any) {
    console.error('confirmPendingRegistration error:', error);
    return { ok: false, error: error?.message || 'Failed to complete registration' };
  }
}


// ==============================================================================
// 2. EXISTING LOGGED-IN USER EMAIL VERIFICATION
// ==============================================================================

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

    const sendRes = await sendOtpEmail(normalizedEmail, otp);
    if (!sendRes.ok) {
      return { ok: false, error: sendRes.error };
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
      return { ok: false, error: 'Verification code not found or expired. Please request a new code.' };
    }

    let payload: any;
    try {
      const verifyResult = await jwtVerify(token, encodedKey, {
        algorithms: ['HS256']
      });
      payload = verifyResult.payload;
    } catch {
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

    const expectedHash = computeOtpHash(cleanOtp, normalizedEmail, userId);

    if (expectedHash !== payload.otpHash) {
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

    // Check if email taken
    const existing = await db.orm.public.User.where({ email: normalizedEmail }).first();
    if (existing && existing.id !== userId) {
      return { ok: false, error: 'This email is already in use by another account.' };
    }

    // Update user in DB
    await db.orm.public.User.where({ id: userId }).update({
      email: normalizedEmail,
      verified: true
    });

    // Update session to verified
    await createSession(userId, true);

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

// ==============================================================================
// 3. EXISTING LOGGED-IN USER PHONE VERIFICATION
// ==============================================================================

export async function sendPhoneVerificationOtp(phone: string) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { ok: false, error: 'Unauthorized. Please sign in to verify your mobile number.' };
    }
    const userId = session.userId as string;

    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.valid) {
      return { ok: false, error: phoneValidation.error || 'Please enter a valid mobile number.' };
    }
    const formattedPhone = phoneValidation.formatted;

    // Check if phone taken by another user
    const phoneVariants = getPhoneVariants(formattedPhone);
    const existing = await db.orm.public.User.where(u => u.phone.in(phoneVariants)).all();
    const takenByOther = existing.some(u => u.id !== userId);
    if (takenByOther) {
      return { ok: false, error: 'This mobile number is already in use by another account.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = computeOtpHash(otp, formattedPhone, userId);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const token = await new SignJWT({
      userId,
      phone: formattedPhone,
      otpHash,
      attempts: 0,
      expiresAt
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(encodedKey);

    const cookieStore = await cookies();
    cookieStore.set(PHONE_VERIFY_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(expiresAt),
      maxAge: 10 * 60,
      sameSite: 'lax',
      path: '/'
    });

    const sendRes = await sendVerificationOtpSms(formattedPhone, otp);
    if (!sendRes.ok) {
      return { ok: false, error: sendRes.error || 'Failed to send SMS verification code.' };
    }

    return {
      ok: true,
      phone: formattedPhone,
      maskedPhone: maskPhoneNumber(formattedPhone),
      message: `Verification code sent to ${maskPhoneNumber(formattedPhone)}`
    };
  } catch (error: any) {
    console.error('sendPhoneVerificationOtp error:', error);
    return { ok: false, error: error?.message || 'Failed to send SMS verification code.' };
  }
}

export async function confirmPhoneOtp(phone: string, enteredOtp: string) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return { ok: false, error: 'Unauthorized. Please sign in.' };
    }
    const userId = session.userId as string;

    const phoneValidation = validatePhoneNumber(phone);
    const formattedPhone = phoneValidation.valid ? phoneValidation.formatted : formatNotifyPhoneNumber(phone);
    const cleanOtp = enteredOtp.trim().replace(/\D/g, '');

    if (cleanOtp.length !== 6) {
      return { ok: false, error: 'Please enter the complete 6-digit verification code.' };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(PHONE_VERIFY_COOKIE_NAME)?.value;

    if (!token) {
      return { ok: false, error: 'Verification code not found or expired. Please request a new code.' };
    }

    let payload: any;
    try {
      const verifyResult = await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
      payload = verifyResult.payload;
    } catch {
      return { ok: false, error: 'Your verification code has expired. Please request a new code.' };
    }

    if (!payload || payload.userId !== userId) {
      return { ok: false, error: 'Unauthorized verification request.' };
    }

    if (payload.phone !== formattedPhone) {
      return { ok: false, error: 'The mobile number does not match the one the code was sent to.' };
    }

    if (Date.now() > payload.expiresAt) {
      cookieStore.set(PHONE_VERIFY_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return { ok: false, error: 'Your verification code has expired. Please request a new code.' };
    }

    const currentAttempts = (payload.attempts || 0) + 1;
    if (currentAttempts > 5) {
      cookieStore.set(PHONE_VERIFY_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return { ok: false, error: 'Too many incorrect attempts. Please request a new verification code.' };
    }

    const expectedHash = computeOtpHash(cleanOtp, formattedPhone, userId);
    if (expectedHash !== payload.otpHash) {
      const updatedToken = await new SignJWT({
        ...payload,
        attempts: currentAttempts
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(new Date(payload.expiresAt))
        .sign(encodedKey);

      cookieStore.set(PHONE_VERIFY_COOKIE_NAME, updatedToken, {
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
        error: `Incorrect verification code. Please check your SMS. (${remainingAttempts} attempts remaining)`
      };
    }

    // Double check phone collision
    const phoneVariants = getPhoneVariants(formattedPhone);
    const allMatching = await db.orm.public.User.where(u => u.phone.in(phoneVariants)).all();
    if (allMatching.some(u => u.id !== userId)) {
      return { ok: false, error: 'This mobile number is already in use by another account.' };
    }

    // Update user in DB
    await db.orm.public.User.where({ id: userId }).update({
      phone: formattedPhone,
      verified: true
    });

    // Update session to verified
    await createSession(userId, true);

    cookieStore.set(PHONE_VERIFY_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/'
    });

    return { ok: true, message: 'Mobile number verified successfully!' };
  } catch (error: any) {
    console.error('Confirm Phone OTP error:', error);
    return { ok: false, error: error?.message || 'Failed to verify code' };
  }
}

