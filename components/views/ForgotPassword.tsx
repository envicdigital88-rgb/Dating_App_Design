'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { requestPasswordReset, resetPassword, verifyPasswordResetCode } from '@/app/actions/password-reset';

const field = 'mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-berry-400 focus:ring-2 focus:ring-berry-400/25 disabled:opacity-60';

export function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const submitting = useRef(false);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = window.setTimeout(() => setCooldown(seconds => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function run(task: () => Promise<void>) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try { await task(); }
    catch { setError('Something went wrong. Please try again.'); }
    finally { submitting.current = false; setBusy(false); }
  }

  async function sendCode() {
    const result = await requestPasswordReset(email.trim().toLowerCase());
    if (!result.ok) { setError(result.error); return; }
    setMessage(result.message);
    setCode('');
    setCooldown(60);
    setStep('code');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      if (step === 'email') return sendCode();
      if (step === 'code') {
        const result = await verifyPasswordResetCode(code);
        if (!result.ok) { setError(result.error); return; }
        setCode('');
        setMessage('Email verified. Choose your new password.');
        setStep('password');
      } else if (step === 'password') {
        if (password !== confirmation) { setError('Your passwords do not match.'); return; }
        const result = await resetPassword(password);
        if (!result.ok) { setError(result.error); return; }
        setPassword('');
        setConfirmation('');
        setStep('done');
      }
    });
  }

  const heading = step === 'email' ? 'Forgot your password?' : step === 'code' ? 'Check your email'
    : step === 'password' ? 'Choose a new password' : 'Password updated';

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#07061a] px-5 py-10 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#8b2fc9]/25 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[350px] w-[350px] rounded-full bg-berry-500/15 blur-[90px]" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-7 flex justify-center">
          <Image src="/logo.png" alt="Wingle Mingle" width={120} height={120} priority />
        </div>
        <h1 className="text-center font-display text-[30px] font-bold leading-tight">{heading}</h1>
        {step === 'done' ? (
          <div className="mt-6 text-center" role="status">
            <CheckCircle2Icon className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
            <p className="text-sm leading-relaxed text-white/65">Your password has been reset. Sign in with your new password to continue.</p>
            <a href="/sign-in" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-plum-500 via-purple-600 to-berry-500 px-4 py-4 text-sm font-semibold">
              Back to sign in <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-white/60">
              {step === 'email' ? 'Enter the email address you use for Wingle Mingle. We’ll send you a password reset code.'
                : step === 'code' ? `Enter the 6-digit code sent to ${email.trim()}. The code expires in 10 minutes.`
                : 'Use at least 8 characters. Your other signed-in sessions will be signed out.'}
            </p>
            {message && <p role="status" className="mt-4 rounded-xl bg-berry-500/10 p-3 text-xs leading-relaxed text-berry-200">{message}</p>}
            <form onSubmit={submit} className="mt-6 space-y-4">
              {step === 'email' && (
                <label htmlFor="reset-email" className="block text-xs font-medium text-white/70">
                  Email
                  <input id="reset-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} placeholder="you@email.com" className={field} />
                </label>
              )}
              {step === 'code' && (
                <label htmlFor="reset-code" className="block text-xs font-medium text-white/70">
                  Verification code
                  <input id="reset-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code}
                    onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required disabled={busy}
                    placeholder="000000" className={`${field} text-center text-2xl tracking-[0.4em]`} />
                </label>
              )}
              {step === 'password' && (
                <>
                  <label htmlFor="reset-password" className="block text-xs font-medium text-white/70">
                    New password
                    <input id="reset-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={password}
                      onChange={event => setPassword(event.target.value)} required disabled={busy} className={field} />
                  </label>
                  <label htmlFor="reset-confirmation" className="block text-xs font-medium text-white/70">
                    Confirm new password
                    <input id="reset-confirmation" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={confirmation}
                      onChange={event => setConfirmation(event.target.value)} required disabled={busy} className={field} />
                  </label>
                  <button type="button" onClick={() => setShowPassword(value => !value)} className="flex items-center gap-2 text-xs text-white/60 hover:text-white">
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />} {showPassword ? 'Hide passwords' : 'Show passwords'}
                  </button>
                </>
              )}
              {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              <button type="submit" disabled={busy || (step === 'code' && code.length !== 6)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-plum-500 via-purple-600 to-berry-500 px-4 py-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50">
                {busy && <Loader2Icon className="h-4 w-4 animate-spin" />}
                {step === 'email' ? 'Send reset code' : step === 'code' ? 'Verify code' : 'Update password'}
                {!busy && <ArrowRightIcon className="h-4 w-4" />}
              </button>
            </form>
            {step === 'code' && (
              <div className="mt-5 flex flex-col items-center gap-3 text-xs">
                <button type="button" disabled={busy || cooldown > 0} onClick={() => { void run(sendCode); }} className="font-medium text-berry-400 hover:text-berry-300 disabled:text-white/40">
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
                <button type="button" disabled={busy} onClick={() => { setStep('email'); setError(''); setMessage(''); }} className="text-white/60 hover:text-white">Use a different email</button>
              </div>
            )}
            <Link href="/sign-in" className="mt-7 flex items-center justify-center gap-2 text-[13px] text-white/60 hover:text-white">
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
