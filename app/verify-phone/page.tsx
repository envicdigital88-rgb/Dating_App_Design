'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, PhoneIcon, ShieldCheckIcon } from 'lucide-react';
import { useStore } from '@/lib/contexts/StoreContext';

export default function VerifyPhonePage() {
  const router = useRouter();
  const { updateProfile } = useStore();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Please enter a valid mobile number.');
      return;
    }
    setBusy(true);
    // Simulate sending OTP
    setTimeout(() => {
      setBusy(false);
      setStep('otp');
      toast.success(`OTP sent to ${phone}`);
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error('Please enter the OTP sent to your phone.');
      return;
    }
    setBusy(true);
    // Simulate verifying OTP
    setTimeout(() => {
      setBusy(false);
      // Update the user's phone number in the store
      updateProfile({ phone });
      toast.success('Registration complete! Please sign in.');
      router.push('/sign-in');
    }, 1500);
  };

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

        {/* Watermark logo */}
        <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 select-none opacity-[0.06]">
          <Image src="/logo.png" alt="" width={380} height={380} className="object-contain" />
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
                  <h1 className="font-display text-[30px] font-bold leading-tight text-white">
                    Verify it's you
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                    To keep Wingle Mingle safe, we need to verify your mobile number before continuing.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handlePhoneSubmit} className="space-y-4" noValidate>
                  <div className="relative">
                    <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Mobile</div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 7700 900000"
                      autoComplete="tel"
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
                        Send OTP
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
                    Enter OTP
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                    We just sent a code to <span className="text-white font-medium">{phone}</span>. Enter it below to complete setup.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
                  <div className="relative">
                    <ShieldCheckIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Verification Code</div>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      autoComplete="one-time-code"
                      required
                      className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-4 pt-7 text-[14px] tracking-widest font-mono text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || otp.length < 4}
                    className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(236,72,153,0.35)] active:scale-[0.98] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 50%, #0ea5e9 100%)' }}>
                    {busy ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        Verify & Continue
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  
                  <div className="text-center mt-6">
                    <button type="button" onClick={() => setStep('phone')} className="text-[12px] text-white/50 hover:text-white transition-colors">
                      Change mobile number
                    </button>
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
