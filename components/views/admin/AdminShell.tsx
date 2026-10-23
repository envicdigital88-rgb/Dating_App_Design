'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

import {
  BarChart3Icon,
  CreditCardIcon,
  ImageIcon,
  LayersIcon,
  LogOutIcon,
  SendIcon,
  ShieldCheckIcon,
  UsersIcon } from
'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { useStore } from '@/lib/contexts/StoreContext';
import { cn } from '@/lib/utils/format';
import { getAdminPendingModerationCountAction } from '@/app/actions/admin';

const items = [
{ to: '/admin', label: 'Overview', icon: <BarChart3Icon className="h-[18px] w-[18px]" />, end: true },
{ to: '/admin/users', label: 'Users', icon: <UsersIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/admins', label: 'Admins', icon: <ShieldCheckIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/moderation', label: 'Moderation', icon: <ImageIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/activity', label: 'Wingles & chat', icon: <SendIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/packages', label: 'Packages', icon: <LayersIcon className="h-[18px] w-[18px]" /> },
{ to: '/admin/payments', label: 'Payments', icon: <CreditCardIcon className="h-[18px] w-[18px]" /> }];


export function AdminShell({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useStore();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPendingCount = async () => {
      try {
        const res = await getAdminPendingModerationCountAction();
        if (res.ok && mounted) {
          const newCount = res.count ?? 0;
          if (prevCountRef.current !== null && newCount > prevCountRef.current) {
            const diff = newCount - prevCountRef.current;
            toast.info(`📸 ${diff} new verification selfie${diff > 1 ? 's' : ''} submitted for review!`, {
              action: {
                label: 'Review',
                onClick: () => router.push('/admin/moderation')
              }
            });
          }
          prevCountRef.current = newCount;
          setPendingCount(newCount);
        }
      } catch (err) {
        console.error('Failed to fetch pending moderation count:', err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000);

    const handleUpdate = () => {
      fetchPendingCount();
    };
    window.addEventListener('admin-moderation-updated', handleUpdate);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('admin-moderation-updated', handleUpdate);
    };
  }, [router]);

  return (
    <div className="min-h-full w-full bg-cream">
      <div className="mx-auto flex w-full max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sand/70 bg-black px-4 py-6 lg:flex">
          <div className="mb-1 px-1">
            <BrandMark />
          </div>
          <p className="mb-7 px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
            Admin console
          </p>

          <nav aria-label="Admin" className="space-y-1">
            {items.map((item) => {
              const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
              const isModeration = item.to === '/admin/moderation';
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors duration-150 ease-soft',
                    isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'
                  )}>
                    {item.icon}
                    <span className="flex-1 truncate">{item.label}</span>
                    {isModeration && pendingCount > 0 && (
                      <span
                        title={`${pendingCount} pending moderation item${pendingCount > 1 ? 's' : ''}`}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-plum-500 to-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-[0_0_12px_rgba(236,72,153,0.5)] ring-1 ring-white/20 transition-transform group-hover:scale-105"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
                        </span>
                        <span>{pendingCount > 99 ? '99+' : pendingCount}</span>
                      </span>
                    )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
            <button
              onClick={() => router.push('/discover')}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/65 transition-colors duration-150 ease-soft hover:bg-white/10 hover:text-white">
              
              <UsersIcon className="h-[18px] w-[18px]" />
              Member view
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/65 transition-colors duration-150 ease-soft hover:bg-white/10 hover:text-white">
              
              <LogOutIcon className="h-[18px] w-[18px]" />
              Sign out
            </button>
            <p className="px-3 pt-2 text-[12px] text-white/40">{currentUser?.email}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-sand/70 bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BrandMark />
                <span className="rounded-full bg-berry-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-berry-600 border border-berry-100">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/discover')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cream-deep border border-sand px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-sand/40 transition-colors shadow-sm"
                  title="Switch to Member view"
                >
                  <UsersIcon className="h-3.5 w-3.5 text-berry-500" />
                  <span>Member view</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  className="p-1.5 rounded-full bg-cream-deep border border-sand text-ink-soft hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOutIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <nav aria-label="Admin" className="k-scroll-hide -mx-1 mt-3 flex gap-1 overflow-x-auto pb-0.5">
              {items.map((item) => {
                const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
                const isModeration = item.to === '/admin/moderation';
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-150 ease-soft font-medium',
                      isActive ? 'bg-plum-500 text-cream' : 'bg-cream-deep text-ink-soft border border-sand/40'
                    )}>
                      <span>{item.label}</span>
                      {isModeration && pendingCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-plum-500 to-rose-600 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20">
                          {pendingCount > 99 ? '99+' : pendingCount}
                        </span>
                      )}
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
