'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import {
  BarChart3Icon,
  CreditCardIcon,
  ImageIcon,
  LayersIcon,
  LogOutIcon,
  SendIcon,
  UsersIcon } from
'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { useStore } from '@/lib/contexts/StoreContext';
import { cn } from '@/lib/utils/format';

const items = [
{ to: '/admin', label: 'Overview', icon: <BarChart3Icon className="h-[18px] w-[18px]" />, end: true },
{ to: '/admin/users', label: 'Users', icon: <UsersIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/moderation', label: 'Moderation', icon: <ImageIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/activity', label: 'Wingles & chat', icon: <SendIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/packages', label: 'Packages', icon: <LayersIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/payments', label: 'Payments', icon: <CreditCardIcon className="h-[18px] w-[18px]" /> }];


export function AdminShell({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useStore();

  return (
    <div className="min-h-full w-full bg-cream">
      <div className="mx-auto flex w-full max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sand/70 bg-plum-600 px-4 py-6 lg:flex">
          <div className="mb-1 px-1">
            <BrandMark />
          </div>
          <p className="mb-7 px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-cream/45">
            Admin console
          </p>

          <nav aria-label="Admin" className="space-y-1">
            {items.map((item) => {
              const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors duration-150 ease-soft',
                    isActive ? 'bg-cream/12 text-cream' : 'text-cream/65 hover:bg-cream/8 hover:text-cream'
                  )}>
                    {item.icon}
                    {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1 border-t border-cream/12 pt-4">
            <button
              onClick={() => router.push('/discover')}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-cream/65 transition-colors duration-150 ease-soft hover:bg-cream/8 hover:text-cream">
              
              <UsersIcon className="h-[18px] w-[18px]" />
              Member view
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-cream/65 transition-colors duration-150 ease-soft hover:bg-cream/8 hover:text-cream">
              
              <LogOutIcon className="h-[18px] w-[18px]" />
              Sign out
            </button>
            <p className="px-3 pt-2 text-[12px] text-cream/40">{currentUser?.email}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-sand/70 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between">
              <BrandMark />
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-berry-500">
                Admin
              </span>
            </div>
            <nav aria-label="Admin" className="k-scroll-hide -mx-1 mt-3 flex gap-1 overflow-x-auto">
              {items.map((item) => {
                const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    className={cn(
                      'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-150 ease-soft',
                      isActive ? 'bg-plum-500 text-cream' : 'bg-cream-deep text-ink-soft'
                    )}>
                      {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>);
}

export function AdminHeader({
  title,
  body,
  action
}: {title: string;body?: string;action?: React.ReactNode;}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[28px] leading-tight text-ink sm:text-[32px]">{title}</h1>
        {body && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">{body}</p>}
      </div>
      {action}
    </div>);
}

export function StatTile({
  label,
  value,
  hint,
  emphasis = false
}: {label: string;value: string | number;hint?: string;emphasis?: boolean;}) {
  return (
    <div
      className={cn(
        'rounded-3xl p-5',
        emphasis ? 'bg-plum-500 text-cream' : 'bg-cream-deep text-ink shadow-card'
      )}>
      
      <p className={cn('text-[12px]', emphasis ? 'text-cream/65' : 'text-ink-muted')}>{label}</p>
      <p className="mt-2 font-display text-[30px] leading-none">{value}</p>
      {hint &&
      <p className={cn('mt-2 text-[12px]', emphasis ? 'text-cream/60' : 'text-ink-muted')}>{hint}</p>
      }
    </div>);
}
