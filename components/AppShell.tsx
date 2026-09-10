'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import {
  BellIcon,
  CompassIcon,
  CreditCardIcon,
  HeartIcon,
  ImageIcon,
  LogOutIcon,
  MessageCircleIcon,
  SendIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
  WifiOffIcon } from
'lucide-react';
import { BrandMark } from './BrandMark';
import { UsageMeter } from './UsageMeter';
import { Avatar, Badge } from './ui/Bits';
import { ChatPopup } from './ui/ChatPopup';
import { Button } from './ui/Button';
import { useStore } from '@/lib/contexts/StoreContext';
import { usePwa } from './PwaProvider';
import { cn } from '@/lib/utils/format';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { offline } = usePwa();
  const {
    currentUser,
    entitlements,
    photosOf,
    conversationsOf,
    messagesOf,
    incomingRequests,
    likesReceived,
    notificationsOf,
    logout
  } = useStore();

  if (!currentUser || !entitlements) return null;

  const unreadMessages = conversationsOf().reduce(
    (total, c) =>
    total + messagesOf(c.id).filter((m) => m.senderId !== currentUser.id && !m.readAt).length,
    0
  );
  const pendingIncoming = incomingRequests().filter((r) => r.status === 'pending').length;
  const unreadNotifications = notificationsOf().filter((n) => !n.read).length;
  const primaryPhoto = photosOf(currentUser.id)[0];

  const main: NavItem[] = [
  { to: '/discover', label: 'Discover', icon: <CompassIcon className="h-[18px] w-[18px]" /> },
  { to: '/likes', label: 'Likes', icon: <HeartIcon className="h-[18px] w-[18px]" />, badge: likesReceived().length },
  { to: '/requests', label: 'Requests', icon: <SendIcon className="h-[18px] w-[18px]" />, badge: pendingIncoming },
  { to: '/connections', label: 'Connections', icon: <UsersIcon className="h-[18px] w-[18px]" /> },
  { to: '/messages', label: 'Messages', icon: <MessageCircleIcon className="h-[18px] w-[18px]" />, badge: unreadMessages },
  { to: '/photos', label: 'Photos', icon: <ImageIcon className="h-[18px] w-[18px]" /> },
  { to: '/notifications', label: 'Notifications', icon: <BellIcon className="h-[18px] w-[18px]" />, badge: unreadNotifications }];


  const account: NavItem[] = [
  { to: '/profile', label: 'My profile', icon: <UserIcon className="h-[18px] w-[18px]" /> },
  { to: '/packages', label: 'Packages', icon: <SparklesIcon className="h-[18px] w-[18px]" /> },
  { to: '/subscription', label: 'Subscription', icon: <CreditCardIcon className="h-[18px] w-[18px]" /> },
  { to: '/settings', label: 'Settings', icon: <SettingsIcon className="h-[18px] w-[18px]" /> }];


  const mobileNav: NavItem[] = [
  main[0],
  main[2],
  main[4],
  { to: '/photos', label: 'Photos', icon: <ImageIcon className="h-[18px] w-[18px]" /> },
  { to: '/profile', label: 'You', icon: <UserIcon className="h-[18px] w-[18px]" /> }];


  const isChat = /^\/messages\/.+/.test(pathname);

  const navClass = (isActive: boolean) =>
  cn(
    'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-[background-color,color] duration-150 ease-soft',
    isActive ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:bg-white/60 hover:text-ink'
  );

  return (
    <div className="min-h-full w-full bg-transparent">
      {offline &&
      <div className="flex items-center justify-center gap-2 bg-plum-500 px-4 py-2 text-[13px] text-cream">
          <WifiOffIcon className="h-3.5 w-3.5" />
          You are offline — showing your last loaded profiles and messages.
        </div>
      }
      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col overflow-y-auto border-r border-sand/70 bg-cream-deep/40 px-5 py-6 lg:flex">
          <button onClick={() => router.push('/discover')} className="mb-8 px-1 text-left">
            <BrandMark />
          </button>

          <nav aria-label="Main" className="space-y-1">
            {main.map((item) => {
              const isActive = pathname.startsWith(item.to);
              return (
              <Link key={item.to} href={item.to} className={navClass(isActive)}>
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {!!item.badge &&
                <span className="rounded-full bg-berry-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {item.badge}
                    </span>
                }
                </Link>
              );
            })}
          </nav>

          <div className="my-5 h-px bg-sand/80" />

          <nav aria-label="Account" className="space-y-1">
            {account.map((item) => {
              const isActive = pathname.startsWith(item.to);
              return (
              <Link key={item.to} href={item.to} className={navClass(isActive)}>
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
            {currentUser.role === 'admin' &&
            <Link href="/admin" className={navClass(pathname.startsWith('/admin'))}>
                <ShieldCheckIcon className="h-[18px] w-[18px]" />
                <span className="flex-1">Admin</span>
              </Link>
            }
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-3xl bg-plum-500 p-4 text-cream">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/70">
                  {entitlements.packageName} package
                </span>
              </div>
              <div className="space-y-3">
                <UsageMeter
                  label="Messages left"
                  used={entitlements.chatUsed}
                  limit={entitlements.chatLimit}
                  tone="plum" />
                
                <UsageMeter
                  label="Requests left"
                  used={entitlements.requestsUsed}
                  limit={entitlements.requestLimit}
                  tone="plum" />
                
              </div>
              {entitlements.subscriptionStatus === 'free' &&
              <Button
                variant="inverse"
                size="sm"
                block
                className="mt-4"
                onClick={() => router.push('/packages')}>
                
                  Upgrade
                </Button>
              }
            </div>

            <div className="flex items-center gap-3 px-1">
              <Avatar src={primaryPhoto?.url} name={currentUser.name} size={38} online />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{currentUser.name}</p>
                <p className="truncate text-[12px] text-ink-muted">{currentUser.location}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                aria-label="Sign out"
                className="rounded-full p-2 text-ink-muted transition-colors duration-150 ease-soft hover:bg-white hover:text-ink">
                
                <LogOutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {!isChat &&
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-sand/70 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
              <BrandMark />
              <div className="flex items-center gap-1">
                <span className="mr-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-ink-soft shadow-sm">
                  {entitlements.chatRemaining === null ? '∞' : entitlements.chatRemaining} msgs
                </span>
                <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative rounded-full p-2 text-ink-soft transition-colors duration-150 ease-soft hover:bg-white">
                
                  <BellIcon className="h-5 w-5" />
                  {!!unreadNotifications &&
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-berry-500" />
                }
                </Link>
              </div>
            </header>
          }

          <main className={cn('min-h-[60vh]', !isChat && 'pb-24 lg:pb-10')}>
            {children}
          </main>
        </div>
      </div>

      <ChatPopup />

      {/* Mobile bottom navigation */}
      {!isChat &&
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-sand/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        
          <ul className="flex items-stretch">
            {mobileNav.map((item) => {
              const isActive = pathname.startsWith(item.to);
              return (
                <li key={item.to} className="flex-1">
                  <Link
                    href={item.to}
                    className={cn(
                      'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150 ease-soft',
                      isActive ? 'text-berry-500' : 'text-ink-muted'
                    )}>
                    
                    {item.icon}
                    {item.label}
                    {!!item.badge &&
                      <span className="absolute right-[22%] top-1.5 h-2 w-2 rounded-full bg-berry-500" />
                    }
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      }
    </div>);

}

export function PageHeader({
  title,
  body,
  action
}: {title: string;body?: string;action?: React.ReactNode;}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[28px] leading-tight text-ink sm:text-[34px]">{title}</h1>
        {body && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">{body}</p>}
      </div>
      {action}
    </div>);
}

export function Page({ children, className }: {children: React.ReactNode;className?: string;}) {
  return <div className={cn('px-4 py-6 sm:px-6 lg:px-10 lg:py-10', className)}>{children}</div>;
}

export { Badge };