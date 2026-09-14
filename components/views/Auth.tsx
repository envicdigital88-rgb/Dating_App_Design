'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from 'lucide-react';
import { useStore } from '@/lib/contexts/StoreContext';
import { heroImage } from '@/lib/data/seed';

export function Auth({ mode }: {mode: 'signin' | 'register';}) {
  const router = useRouter();
  const { login, register } = useStore();
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(isRegister ? '' : 'demo@winglemingle.app');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(isRegister ? '' : 'winglemingle123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const result = isRegister ?
    register({ name, email, phone, password }) :
    login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (isRegister) {
      toast.success('Account created — let\'s build your profile');
      router.push('/onboarding');
      return;
    }
    toast.success(`Welcome back, ${result.data.name.split(' ')[0]}`);
    router.push(result.data.role === 'admin' ? '/admin' : '/discover');
  };

  return (
    <div className="grid min-h-full w-full lg:grid-cols-[1fr_1.05fr]">

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

        {/* Back to home */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-white/50 transition-colors duration-150 hover:text-white">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>

        {/* Form card */}
        <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">

          {/* Logo + brand */}
          <div className="mb-7 flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="Wingle Mingle" width={68} height={68} className="rounded-2xl object-contain" />
            <span className="bg-gradient-to-r from-[#ec4899] to-[#0ea5e9] bg-clip-text font-display text-lg font-semibold text-transparent">
              Wingle Mingle
            </span>
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="font-display text-[30px] font-bold leading-tight text-white">
              {isRegister ? 'Create account' : 'Welcome back'}{' '}
              <span className="text-[#ec4899]">{isRegister ? '✨' : '♡'}</span>
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-white/50">
              {isRegister
                ? 'Two minutes here, then we\'ll set up your profile.'
                : 'Sign in to pick up your wingles and conversations.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-3" noValidate>

            {/* Name (register only) */}
            {isRegister && (
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">First name</div>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sam"
                  autoComplete="given-name"
                  required
                  className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-4 pt-7 text-[14px] text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Email</div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-4 pt-7 text-[14px] text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
            </div>

            {/* Phone (register only) */}
            {isRegister && (
              <div className="relative">
                <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Mobile</div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7700 900000"
                  autoComplete="tel"
                  className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-4 pt-7 text-[14px] text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Password</div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                className="w-full rounded-2xl border border-white/10 pb-3 pl-11 pr-12 pt-7 text-[14px] text-white placeholder-white/20 outline-none transition-all focus:border-[#0ea5e9]/50 focus:ring-1 focus:ring-[#0ea5e9]/25"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/70">
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-400">
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[15px] font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(236,72,153,0.35)] active:scale-[0.98] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b2fc9 50%, #0ea5e9 100%)' }}>
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {isRegister ? 'Create account' : 'Sign in'}
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <p className="text-[13px] text-white/40">
              {isRegister ? 'Already a member? ' : 'New to Wingle Mingle? '}
              <Link
                href={isRegister ? '/sign-in' : '/sign-up'}
                className="font-semibold text-[#0ea5e9] transition-colors hover:text-[#38bdf8]">
                {isRegister ? 'Sign in' : 'Create your profile'}
              </Link>
            </p>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Demo accounts */}
          {!isRegister && (
            <div
              className="mt-5 rounded-2xl border border-white/8 p-4 text-[12px] leading-relaxed text-white/35"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="mb-1 font-semibold text-white/55">Demo accounts</p>
              <p>Member — <span className="font-mono text-white/50">demo@winglemingle.app</span> / <span className="font-mono text-white/50">winglemingle123</span></p>
              <p>Admin — <span className="font-mono text-white/50">admin@winglemingle.app</span> / <span className="font-mono text-white/50">admin123</span></p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Image side — unchanged ── */}
      <div className="relative hidden lg:block">
        <img
          src={heroImage}
          alt="Two people laughing together at an outdoor café table"
          className="h-full w-full object-cover" />
        <div className="absolute inset-x-8 bottom-8 rounded-4xl bg-plum-600/85 p-7 text-cream backdrop-blur-sm">
          <p className="font-display text-2xl leading-snug">
            "I sent four wingles, had two real dates, and deleted the app."
          </p>
          <p className="mt-3 text-[13px] text-cream/70">Cora · Manchester</p>
        </div>
      </div>
    </div>
  );
}
