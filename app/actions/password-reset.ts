'use server';

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { after } from 'next/server';
import { Temporal } from 'temporal-polyfill';
import { db } from '@/lib/db';
import { deleteSession } from '@/lib/session';
import { sendPasswordResetEmail } from '@/lib/password-reset-email';

const CHALLENGE_COOKIE = 'wm_password_reset_challenge';
const GRANT_COOKIE = 'wm_password_reset_grant';
const EMAIL_COOKIE = 'wm_password_reset_email';
const TEN_MINUTES = 10 * 60_000;
const FIVE_MINUTES = 5 * 60_000;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
const invalidCode = () => ({ ok: false as const, error: 'Invalid or expired code. Please check it or request a new code.' });
const invalidGrant = () => ({ ok: false as const, error: 'Your reset session has expired. Please request a new code.' });
const stamp = (time: number) => Temporal.Instant.fromEpochMilliseconds(time);
const timestamp = (value: { toString(): string }) => Date.parse(value.toString());
const tokenHash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

function otpHash(code: string, challengeId: string, userId: string) {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error('Password reset secret is not configured');
  return crypto.createHmac('sha256', secret).update(`password-reset-code:${challengeId}:${userId}:${code}`).digest('hex');
}

function equalHash(a: string, b: string | null) {
  return !!b && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

async function lockAccount(tx: Transaction, userId: string) {
  const plan = tx.sql.public.user.update(f => ({ sessionVersion: f.sessionVersion }))
    .where((f, fn) => fn.eq(f.id, userId)).build();
  return (await tx.execute(plan)).affectedRows === 1;
}

async function setResetCookie(name: string, value: string, maxAge: number) {
  (await cookies()).set(name, value, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge,
  });
}

export async function requestPasswordReset(email: string) {
  const parsed = z.string().trim().toLowerCase().email().max(254).safeParse(email);
  if (!parsed.success) return { ok: false as const, error: 'Please enter a valid email address.' };
  if (!process.env.RESEND_API_KEY?.trim() || !process.env.SESSION_SECRET?.trim()) {
    return { ok: false as const, error: 'Password reset email is temporarily unavailable. Please try again later.' };
  }
  try {
    let challengeId = crypto.randomBytes(32).toString('hex');
    const emailTag = crypto.createHmac('sha256', process.env.SESSION_SECRET!.trim())
      .update(`password-reset-email:${parsed.data}`).digest('hex');
    const jar = await cookies();
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const account = await db.orm.public.User.select('id').first({ email: parsed.data });
    let issued = false;
    if (account) {
      issued = await db.transaction(async tx => {
        if (!await lockAccount(tx, account.id)) return false;
        const user = await tx.orm.public.User.select('email', 'password').first({ id: account.id });
        if (!user || user.email !== parsed.data) return false;
        const previous = await tx.orm.public.PasswordReset.first({ userId: account.id });
        const now = Date.now();
        const inWindow = previous && now - timestamp(previous.requestWindowStart) < 60 * 60_000;
        if (previous && (now - timestamp(previous.requestedAt) < 60_000 || (inWindow && previous.requestCount >= 5))) return false;
        const record = {
          challengeId, email: user.email, passwordHash: user.password,
          otpHash: otpHash(code, challengeId, account.id), expiresAt: stamp(now + TEN_MINUTES),
          attempts: 0, requestedAt: stamp(now), requestWindowStart: inWindow ? previous.requestWindowStart : stamp(now),
          requestCount: inWindow ? previous.requestCount + 1 : 1,
          verifiedAt: null, resetTokenHash: null, usedAt: null,
        };
        if (previous) await tx.orm.public.PasswordReset.where({ userId: account.id }).update(record);
        else await tx.orm.public.PasswordReset.create({ userId: account.id, ...record });
        return true;
      });
    }
    // A reload or double request during cooldown can still use its original code.
    // Do the same for unknown addresses so cookie behavior does not reveal an account.
    const previousChallenge = jar.get(CHALLENGE_COOKIE)?.value;
    if (!issued && jar.get(EMAIL_COOKIE)?.value === emailTag && previousChallenge && /^[a-f0-9]{64}$/.test(previousChallenge)) {
      challengeId = previousChallenge;
    }
    // Unknown/rate-limited addresses get the same response and an opaque, unusable challenge.
    await setResetCookie(CHALLENGE_COOKIE, challengeId, TEN_MINUTES / 1000);
    await setResetCookie(EMAIL_COOKIE, emailTag, TEN_MINUTES / 1000);
    await setResetCookie(GRANT_COOKIE, '', 0);
    if (issued) after(async () => {
      try {
        const current = await db.orm.public.PasswordReset.first({ challengeId });
        if (current && !current.usedAt && !current.verifiedAt && timestamp(current.expiresAt) > Date.now()) {
          await sendPasswordResetEmail(parsed.data, code);
        }
      } catch { console.error('Password reset email could not be dispatched.'); }
    });
    return { ok: true as const, message: 'If an account matches that email, a reset code will arrive shortly.' };
  } catch {
    console.error('Password reset request failed.');
    return { ok: false as const, error: 'Could not request a reset code. Please try again.' };
  }
}

export async function verifyPasswordResetCode(code: string) {
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return invalidCode();
  try {
    const challengeId = (await cookies()).get(CHALLENGE_COOKIE)?.value;
    if (!challengeId || !/^[a-f0-9]{64}$/.test(challengeId)) return invalidCode();
    const challenge = await db.orm.public.PasswordReset.first({ challengeId });
    if (!challenge) return invalidCode();
    const result = await db.transaction(async tx => {
      if (!await lockAccount(tx, challenge.userId)) return invalidCode();
      const current = await tx.orm.public.PasswordReset.first({ userId: challenge.userId });
      const user = await tx.orm.public.User.select('email', 'password').first({ id: challenge.userId });
      if (!current || current.challengeId !== challengeId || !user || current.email !== user.email ||
        current.passwordHash !== user.password || current.usedAt || current.verifiedAt ||
        timestamp(current.expiresAt) <= Date.now() || current.attempts >= 5) return invalidCode();
      if (!equalHash(otpHash(code, challengeId, challenge.userId), current.otpHash)) {
        await tx.orm.public.PasswordReset.where({ userId: challenge.userId }).update({ attempts: current.attempts + 1 });
        return invalidCode();
      }
      const grant = crypto.randomBytes(32).toString('hex');
      await tx.orm.public.PasswordReset.where({ userId: challenge.userId }).update({
        otpHash: '', verifiedAt: stamp(Date.now()), resetTokenHash: tokenHash(grant),
        expiresAt: stamp(Date.now() + FIVE_MINUTES),
      });
      return { ok: true as const, grant };
    });
    if (!result.ok) return result;
    await setResetCookie(GRANT_COOKIE, result.grant, FIVE_MINUTES / 1000);
    return { ok: true as const };
  } catch { return invalidCode(); }
}

export async function resetPassword(newPassword: string) {
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return { ok: false as const, error: 'Your password must contain at least 8 characters.' };
  }
  if (Buffer.byteLength(newPassword, 'utf8') > 72) return { ok: false as const, error: 'Please use a shorter password.' };
  try {
    const jar = await cookies();
    const challengeId = jar.get(CHALLENGE_COOKIE)?.value;
    const grant = jar.get(GRANT_COOKIE)?.value;
    if (!challengeId || !grant || !/^[a-f0-9]{64}$/.test(grant)) return invalidGrant();
    const challenge = await db.orm.public.PasswordReset.first({ challengeId });
    if (!challenge || !challenge.verifiedAt || challenge.usedAt || timestamp(challenge.expiresAt) <= Date.now() ||
      !equalHash(tokenHash(grant), challenge.resetTokenHash)) return invalidGrant();
    const password = await bcrypt.hash(newPassword, 12);
    const result = await db.transaction(async tx => {
      if (!await lockAccount(tx, challenge.userId)) return invalidGrant();
      const current = await tx.orm.public.PasswordReset.first({ userId: challenge.userId });
      const user = await tx.orm.public.User.select('email', 'password', 'sessionVersion').first({ id: challenge.userId });
      if (!current || current.challengeId !== challengeId || !current.verifiedAt || current.usedAt ||
        timestamp(current.expiresAt) <= Date.now() || !equalHash(tokenHash(grant), current.resetTokenHash) ||
        !user || current.passwordHash !== user.password || current.email !== user.email) return invalidGrant();
      await tx.orm.public.User.where({ id: challenge.userId }).update({ password, sessionVersion: user.sessionVersion + 1 });
      await tx.orm.public.PasswordReset.where({ userId: challenge.userId }).update({
        usedAt: stamp(Date.now()), otpHash: '', resetTokenHash: null, passwordHash: '',
      });
      return { ok: true as const };
    });
    if (!result.ok) return result;
    await setResetCookie(CHALLENGE_COOKIE, '', 0);
    await setResetCookie(EMAIL_COOKIE, '', 0);
    await setResetCookie(GRANT_COOKIE, '', 0);
    await deleteSession();
    return { ok: true as const };
  } catch {
    console.error('Password reset could not be completed.');
    return { ok: false as const, error: 'Could not reset your password. Please try again.' };
  }
}
