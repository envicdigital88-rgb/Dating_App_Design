'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LockIcon, MessageCircleIcon, SendIcon, SparklesIcon } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useStore } from '@/lib/contexts/StoreContext';
import { money } from '@/lib/utils/format';

export type UpgradeReason = 'chat_limit' | 'wingle_limit' | 'incoming_locked';

const copy: Record<UpgradeReason, {title: string;body: string;icon: React.ReactNode;}> = {
  chat_limit: {
    title: 'Your chat limit has been reached',
    body: 'You have used every mingle in your current package. Your conversations are safe — upgrade to keep replying.',
    icon: <MessageCircleIcon className="h-5 w-5" />
  },
  wingle_limit: {
    title: 'You are out of wingling wingles',
    body: 'Wingles reset with a new package. Upgrade to reach more of the people you have been looking at.',
    icon: <SendIcon className="h-5 w-5" />
  },
  incoming_locked: {
    title: 'Someone wants to connect with you',
    body: 'Seeing who sent you a wingle is a paid feature. Upgrade your package to reveal their profile and reply.',
    icon: <LockIcon className="h-5 w-5" />
  }
};

export function UpgradeDialog({
  open,
  onClose,
  reason




}: {open: boolean;onClose: () => void;reason: UpgradeReason;}) {
  const router = useRouter();
  const { db } = useStore();
  const paid = db.packages.filter((p) => p.active && p.price > 0).sort((a, b) => a.price - b.price);
  const c = copy[reason];

  return (
    <Modal open={open} onClose={onClose} title={c.title} description={c.body} size="md">
      <div className="space-y-3">
        {paid.map((pkg) =>
        <button
          key={pkg.id}
          onClick={() => {
            onClose();
            router.push(`/checkout/${pkg.id}`);
          }}
          className="flex w-full items-center gap-4 rounded-3xl border border-sand bg-cream px-5 py-4 text-left transition-[border-color,background-color] duration-150 ease-soft hover:border-berry-300 hover:bg-cream-deep">
          
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-berry-100 text-berry-600">
              {pkg.priorityVisibility ? <SparklesIcon className="h-5 w-5" /> : c.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg text-ink">{pkg.name}</span>
              <span className="block truncate text-[13px] text-ink-soft">
                {pkg.chatLimit === null ? 'Unlimited mingles' : `${pkg.chatLimit} mingles`} ·{' '}
                {pkg.wingleLimit === null ? 'Unlimited wingles' : `${pkg.wingleLimit} wingles`}
                {pkg.incomingWinglesUnlocked ? ' · see who sent wingles' : ''}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-display text-lg text-ink">{money(pkg.price)}</span>
              <span className="block text-[11px] uppercase tracking-[0.06em] text-ink-muted">
                {pkg.durationDays} days
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          Not now
        </Button>
        <Button
          onClick={() => {
            onClose();
            router.push('/packages');
          }}>
          
          Compare all packages
        </Button>
      </div>
    </Modal>);

}
