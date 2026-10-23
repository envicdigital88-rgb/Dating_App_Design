'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MailIcon, ArrowRightIcon, ShieldCheckIcon, RotateCwIcon, ArrowLeftIcon } from 'lucide-react';
import { useStore } from '@/lib/contexts/StoreContext';
import {
  getPendingRegistrationStatus,
  verifyEmailAddress,
  confirmEmailOtp
} from '@/app/actions/verify';

export default function VerifyEmailPage() {
  const { updateProfile, currentUser, isHydrated } = useStore();
  
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingPending, setCheckingPending] = useState(true);

  // Check pending registration status or existing user on mount
  useEffect(() => {
    let mounted = true;

    async function checkPending() {
      try {
        const pending = await getPendingRegistrationStatus();
        if (mounted && pending.hasPending) {
          window.location.href = '/verify-phone';
          return;
        }
      } catch (err) {
        console.error('Error checking pending registration:', err);
      }

      if (mounted) {
        setCheckingPending(false);
      }
    }

    checkPending();
    return () => { mounted = false; };
  }, []);

  // Handle redirect if user is already verified or if visitor has no session and no pending signup
  useEffect(() => {
    if (checkingPending || !isHydrated) return;

    if (currentUser?.verified) {
      if (!currentUser.onboarded) {
        window.location.href = '/onboarding';
      } else {
        window.location.href = '/discover';
      }
      return;
    }

    if (currentUser && !currentUser.verified) {
      window.location.href = '/verify-phone';
      return;
    }

    // If not signed in, redirect to sign-up
    if (!currentUser) {
      window.location.href = '/sign-up';
    }
  }, [currentUser, isHydrated, checkingPending]);

  // Pre-fill email for signed-in users with non-temp emails
  useEffect(() => {
    if (currentUser?.email && !currentUser.email.includes('@temp.winglemingle.com')) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    
    const result = await verifyEmailAddress(cleanEmail);
    setBusy(false);
    
    if (result.ok) {
      setStep('otp');
      setResendCooldown(60);
      toast.success(`Verification code sent to ${cleanEmail}`);
    } else {
      toast.error(result.error || 'Failed to send verification code.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || busy) return;
    setBusy(true);

    const result = await verifyEmailAddress(email.trim().toLowerCase());
    setBusy(false);

    if (result.ok) {
      setResendCooldown(60);
      setOtp('');
      toast.success(`New verification code sent to ${email}`);
    } else {
      toast.error(result.error || 'Failed to resend verification code.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      toast.error('Please enter the 6-digit code sent to your email.');
      return;
    }
    setBusy(true);
    
    const result = await confirmEmailOtp(email.trim().toLowerCase(), cleanOtp);
    setBusy(false);

    if (result.ok) {
      updateProfile({ email: email.trim().toLowerCase(), verified: true });
      toast.success('Email verified successfully! Welcome to Wingle Mingle.');
      if ((result as any)?.data?.onboarded || (currentUser && currentUser.onboarded)) {
        window.location.href = '/discover';
      } else {
        window.location.href = '/onboarding';
      }
    } else {
      toast.error(result.error || 'Incorrect code. Please enter the code sent to your email.');
    }
  };

  if (checkingPending && !isHydrated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#07061a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ec4899] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[1fr_1.05fr]">

      {/* ── LEFT: Glassmorphism form side ── */}
      <div className="relative flex flex-col overflow-hidden bg-[#07061a] px-5 py-8 sm:px-10 lg:px-14 lg:py-12">

        {/* Glowing orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#8b2fc9] opacity-35 blur-[100px]" />
          <div className="absolute -bottom-32 right-0 h-[350px] w-[350px] rounded-full bg-[#0ea5e9] opacity-25 blur-[90px]" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ec4899] opacity-10 blur-[80px]" />
        </div>

        {/* Back to sign-up link */}
        <div className="relative z-10">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-white/50 transition-colors duration-150 hover:text-white"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to sign up
          </Link>
        </div>

        {/* Form card */}
        <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">

          {/* Logo + brand */}
          <div className="mb-7 flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="Wingle Mingle" width={120} height={120} className="object-contain" priority />
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Heading */}
                <div className="mb-7 text-center">
                  <h1 className="font-display text-[30px] font-bold leading-tight text-white">
                    Verify your email
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                    To keep Wingle Mingle safe, we will send a 6-digit verification code to your email address.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
                  <div className="relative">
                    <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Email</div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-4 pt-7 text-[14px] text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(236,72,153,0.35)] active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 50%, #0ea5e9 100%)' }}>
                    {busy ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Heading */}
                <div className="mb-7 text-center">
                  <h1 className="font-display text-[30px] font-bold leading-tight text-white">
                    Enter Verification Code
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                    We just sent a 6-digit code to <span className="text-white font-medium break-all">{email}</span>. Enter it below to complete your account setup.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
                  <div className="relative">
                    <ShieldCheckIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">6-Digit Code</div>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      autoComplete="one-time-code"
                      autoFocus
                      required
                      className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-4 pt-7 text-[18px] tracking-[6px] font-mono text-center text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || otp.length !== 6}
                    className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(236,72,153,0.35)] active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 50%, #0ea5e9 100%)' }}>
                    {busy ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        Verify & Complete Account
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  
                  {/* Action links */}
                  <div className="flex flex-col items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || busy}
                      className="inline-flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white transition-colors disabled:opacity-40"
                    >
                      <RotateCwIcon className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Didn’t receive the code? Resend'}
                    </button>

                    <Link
                      href="/sign-up"
                      className="text-[12px] text-white/40 hover:text-white/80 transition-colors"
                    >
                      Change details / Back to sign up
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT: Desktop Image side ── */}
      <div className="hidden lg:block relative h-full w-full overflow-hidden bg-plum-950">
        <div className="absolute inset-0 z-10 bg-plum-900/20 mix-blend-multiply" />
        <img
          src="/41c76259-ba28-4b8f-a0f0-db6538f534a4.jpg"
          alt="Couple smiling"
          className="h-full w-full object-cover object-center opacity-80"
        />
        {/* Subtle vignette */}
        <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(13,11,40,0.6)_100%)]" />
      </div>
    </div>
  );
}
