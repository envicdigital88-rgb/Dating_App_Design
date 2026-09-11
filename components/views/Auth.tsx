'use client';
import { useRouter } from 'next/navigation';

import React, { useState } from 'react';
import Link from 'next/link';

import { toast } from 'sonner';
import { ArrowLeftIcon, MailIcon, PhoneIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label } from '@/components/ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import { heroImage } from '@/lib/data/seed';

export function Auth({ mode }: {mode: 'signin' | 'register';}) {
  const router = useRouter();
  const { login, register } = useStore();
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(isRegister ? '' : 'demo@kindred.app');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(isRegister ? '' : 'kindred123');
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
      toast.success('Account created — let’s build your profile');
      router.push('/onboarding');
      return;
    }
    toast.success(`Welcome back, ${result.data.name.split(' ')[0]}`);
    router.push(result.data.role === 'admin' ? '/admin' : '/discover');
  };

  return (
    <div className="grid min-h-full w-full bg-cream lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Kindred home">
            <BrandMark />
          </Link>
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors duration-150 ease-soft hover:text-berry-600">
            
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-[34px] leading-tight text-ink">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            {isRegister ?
            'Two minutes here, then we will set up your profile and photos.' :
            'Sign in to pick up your wingles and conversations.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            {isRegister &&
            <div>
                <Label htmlFor="name">First name</Label>
                <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sam"
                autoComplete="given-name"
                required />
              
              </div>
            }
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="pl-11"
                  required />
                
              </div>
            </div>
            {isRegister &&
            <div>
                <Label htmlFor="phone">Mobile number</Label>
                <div className="relative">
                  <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7700 900000"
                  autoComplete="tel"
                  className="pl-11" />
                
                </div>
                <p className="mt-1.5 text-[12px] text-ink-muted">
                  Used for account security only. Never shown on your profile.
                </p>
              </div>
            }
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required />
              
            </div>
            <FieldError>{error}</FieldError>

            <Button type="submit" block size="lg" loading={busy}>
              {isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-[14px] text-ink-soft">
            {isRegister ? 'Already a member? ' : 'New to Kindred? '}
            <Link href={isRegister ? '/sign-in' : '/sign-up'}
              className="font-medium text-berry-600 underline decoration-berry-200 underline-offset-4">
              
              {isRegister ? 'Sign in' : 'Create your profile'}
            </Link>
          </p>

          <div className="mt-8 rounded-3xl border border-sand bg-cream-deep p-4 text-[13px] leading-relaxed text-ink-soft">
            <p className="font-medium text-ink">Demo accounts</p>
            <p className="mt-1">
              Member — <span className="font-mono">demo@kindred.app</span> /{' '}
              <span className="font-mono">kindred123</span>
            </p>
            <p>
              Admin — <span className="font-mono">admin@kindred.app</span> /{' '}
              <span className="font-mono">admin123</span>
            </p>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <img
          src={heroImage}
          alt="Two people laughing together at an outdoor café table"
          className="h-full w-full object-cover" />
        
        <div className="absolute inset-x-8 bottom-8 rounded-4xl bg-plum-600/85 p-7 text-cream backdrop-blur-sm">
          <p className="font-display text-2xl leading-snug">
            “I sent four wingles, had two real dates, and deleted the app.”
          </p>
          <p className="mt-3 text-[13px] text-cream/70">Cora · Manchester</p>
        </div>
      </div>
    </div>);

}
