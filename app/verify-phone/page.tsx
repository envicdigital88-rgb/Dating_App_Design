'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneIcon, ArrowRightIcon, ShieldCheckIcon, RotateCwIcon, ArrowLeftIcon, SmartphoneIcon } from 'lucide-react';
import { useStore } from '@/lib/contexts/StoreContext';
import {
  getPendingRegistrationStatus,
  resendPendingRegistrationOtp,
  confirmPendingRegistration,
  sendPhoneVerificationOtp,
  confirmPhoneOtp
} from '@/app/actions/verify';
import { validatePhoneNumber, maskPhoneNumber } from '@/lib/notify';

export default function VerifyPhonePage() {
  const { updateProfile, currentUser, isHydrated } = useStore();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isPendingReg, setIsPendingReg] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);

  // Check pending registration status or existing user on mount
  useEffect(() => {
    let mounted = true;

    async function checkPending() {
      try {
        const pending = await getPendingRegistrationStatus();
        if (mounted && pending.hasPending && pending.phone) {
          setIsPendingReg(true);
          setPhone(pending.phone);
          setMaskedPhone(pending.maskedPhone || maskPhoneNumber(pending.phone));
          setStep('otp');
          setResendCooldown(60);
          setCheckingPending(false);
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

    // If neither pending registration nor a signed-in user exists, redirect to sign-up
    if (!isPendingReg && !currentUser) {
      window.location.href = '/sign-up';
    }
  }, [currentUser, isHydrated, isPendingReg, checkingPending]);

  // Pre-fill phone for signed-in users
  useEffect(() => {
    if (!isPendingReg && currentUser?.phone) {
      setPhone(currentUser.phone);
      setMaskedPhone(maskPhoneNumber(currentUser.phone));
    }
  }, [currentUser, isPendingReg]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePhoneNumber(phone);
    if (!validation.valid) {
      toast.error(validation.error || 'Please enter a valid mobile number.');
      return;
    }
    setBusy(true);
    
    const result = await sendPhoneVerificationOtp(validation.formatted);
    setBusy(false);
    
    if (result.ok) {
      setMaskedPhone(result.maskedPhone || maskPhoneNumber(validation.formatted));
      setStep('otp');
      setResendCooldown(60);
      toast.success(result.message || 'SMS verification code sent!');
    } else {
      toast.error(result.error || 'Failed to send SMS verification code.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || busy) return;
    setBusy(true);

    let result;
    if (isPendingReg) {
      result = await resendPendingRegistrationOtp();
    } else {
      const validation = validatePhoneNumber(phone);
      result = await sendPhoneVerificationOtp(validation.valid ? validation.formatted : phone);
    }
    setBusy(false);

    if (result.ok) {
      setResendCooldown(60);
      setOtp('');
      toast.success(`New verification code sent via SMS to ${maskedPhone || phone}`);
    } else {
      toast.error(result.error || 'Failed to resend SMS verification code.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit SMS verification code.');
      return;
    }
    setBusy(true);
    
    let result;
    if (isPendingReg) {
      result = await confirmPendingRegistration(cleanOtp);
    } else {
      result = await confirmPhoneOtp(phone, cleanOtp);
    }
    setBusy(false);

    if (result.ok) {
      updateProfile({ phone, verified: true });
      toast.success('Mobile number verified successfully! Welcome to Wingle Mingle.');
      if ((result as any)?.data?.onboarded || (currentUser && currentUser.onboarded)) {
        window.location.href = '/discover';
      } else {
        window.location.href = '/onboarding';
      }
    } else {
      toast.error(result.error || 'Incorrect code. Please enter the 6-digit code sent to your phone.');
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
            {step === 'phone' ? (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Heading */}
                <div className="mb-7 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ec4899]/20 to-[#8b2fc9]/20 border border-white/10 text-[#ec4899]">
                    <SmartphoneIcon className="h-6 w-6" />
                  </div>
                  <h1 className="font-display text-[28px] font-bold leading-tight text-white">
                    Verify Your Mobile Number
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                    To prevent fake profiles and secure your account, we will send a 6-digit SMS code to your phone number.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handlePhoneSubmit} className="space-y-4" noValidate>
                  <div className="relative">
                    <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Mobile Number</div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="077 123 4567 or +94 77 123 4567"
                      autoComplete="tel"
                      required
                      className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-4 pt-7 text-[14px] text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    />
                  </div>
                  <p className="text-[11px] text-white/40 px-2">
                    Must be an active mobile number capable of receiving SMS (07X XXX XXXX).
                  </p>

                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(236,72,153,0.35)] active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 50%, #0ea5e9 100%)' }}>
                    {busy ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        Send Verification SMS
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
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0ea5e9]/20 to-[#8b2fc9]/20 border border-white/10 text-[#0ea5e9]">
                    <ShieldCheckIcon className="h-6 w-6" />
                  </div>
                  <h1 className="font-display text-[28px] font-bold leading-tight text-white">
                    Enter Verification Code
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                    We just sent a 6-digit code via SMS to{' '}
                    <span className="text-white font-semibold tracking-wider">{maskedPhone || phone}</span>.
                    Enter it below to complete your setup.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
                  <div className="relative">
                    <ShieldCheckIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">6-Digit SMS Code</div>
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
                      className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-4 pt-7 text-[19px] tracking-[8px] font-mono text-center text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
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
                      {resendCooldown > 0 ? `Resend SMS in ${resendCooldown}s` : 'Didn’t receive the SMS? Resend code'}
                    </button>

                    <Link
                      href="/sign-up"
                      className="text-[12px] text-white/40 hover:text-white/80 transition-colors"
                    >
                      Change phone number / Back to sign up
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
