'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, PhoneIcon, UserIcon, XCircleIcon, CheckCircle2Icon } from 'lucide-react';
import { useStore } from '@/lib/contexts/StoreContext';
import { heroImage } from '@/lib/data/seed';

export function Auth({ mode }: {mode: 'signin' | 'register';}) {
  const router = useRouter();
  const { login, register } = useStore();
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(isRegister ? '' : 'demo@winglemingle.app');
  const [password, setPassword] = useState(isRegister ? '' : 'winglemingle123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegister) {
      const pwHasLength = password.length >= 8;
      const pwHasUpperLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
      const pwHasNumber = /[0-9]/.test(password);
      const pwHasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      if (!(pwHasLength && pwHasUpperLower && pwHasNumber && pwHasSymbol)) {
        setError('Please meet all password requirements.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }
    
    setBusy(true);
    const result = isRegister ?
    register({ name, email, phone: '', password }) :
    login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (isRegister) {
      toast.success('Account created — please verify your phone number');
      router.push('/verify-phone');
      return;
    }
    toast.success(`Welcome back, ${result.data.name.split(' ')[0]}`);
    router.push(result.data.role === 'admin' ? '/admin' : '/discover');
  };

  const handleGoogleSignup = () => {
    if (isRegister) {
      const result = register({ name: 'Google User', email: 'google@example.com', phone: '', password: 'googlepassword123' });
      if (result.ok) {
        toast.success('Signed up with Google — please verify your phone number');
        router.push('/verify-phone');
      } else {
        toast.error(result.error);
      }
    } else {
      const result = login('google@example.com', 'googlepassword123');
      if (result.ok) {
        toast.success(`Welcome back, ${result.data.name.split(' ')[0]}`);
        router.push(result.data.role === 'admin' ? '/admin' : '/discover');
      } else {
        const regResult = register({ name: 'Google User', email: 'google@example.com', phone: '', password: 'googlepassword123' });
        if (regResult.ok) {
          toast.success('Account created via Google — please verify your phone number');
          router.push('/verify-phone');
        } else {
          toast.error('Could not authenticate with Google');
        }
      }
    }
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
            <Image src="/logo.png" alt="Wingle Mingle" width={120} height={120} className="object-contain" priority />
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="font-display text-[30px] font-bold leading-tight text-white">
              {isRegister ? 'Create account' : 'Welcome back'}
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



            {/* Password */}
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Password</div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
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

            {/* Password Rules */}
            {isRegister && isPasswordFocused && (
              <div className="rounded-2xl border border-white/5 bg-[#0a0a0a]/50 p-4 space-y-2.5">
                {[
                  { label: '8 or more characters', valid: password.length >= 8 },
                  { label: 'Uppercase & lowercase letters', valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
                  { label: 'At least one number', valid: /[0-9]/.test(password) },
                  { label: 'At least one symbol', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    {rule.valid ? (
                      <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-red-500/80" />
                    )}
                    <span className={`text-[12px] font-medium transition-colors ${rule.valid ? 'text-emerald-500/90' : 'text-red-400/80'}`}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Confirm Password */}
            {isRegister && (
              <div>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <div className="absolute left-11 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">Confirm Password</div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    required
                    className={`w-full rounded-2xl border pb-3 pl-11 pr-12 pt-7 text-[14px] text-white placeholder-white/20 outline-none transition-all focus:ring-1 ${
                      confirmPassword.length > 0 && password === confirmPassword
                        ? 'border-emerald-500/80 focus:border-emerald-500 focus:ring-emerald-500/25'
                        : confirmPassword.length > 0 && password !== confirmPassword
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/25'
                        : 'border-white/10 focus:border-[#0ea5e9]/50 focus:ring-[#0ea5e9]/25'
                    }`}
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white/70">
                    {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {isConfirmPasswordFocused && confirmPassword.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-2 px-4">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                        <span className="text-[12px] font-medium text-emerald-500/90">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 text-red-500/80" />
                        <span className="text-[12px] font-medium text-red-400/80">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

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

            {/* Divider */}
            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-white/10" />
              <span className="mx-4 text-[12px] uppercase tracking-wide text-white/40">
                Or continue with
              </span>
              <div className="flex-grow border-t border-white/10" />
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3.5 text-[14px] font-medium text-white transition-all hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
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
      </div>
    </div>
  );
}
