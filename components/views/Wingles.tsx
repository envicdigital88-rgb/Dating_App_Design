'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckIcon, LockIcon, SendIcon, XIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge, EmptyState } from '@/components/ui/Bits';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useStore } from '@/lib/contexts/StoreContext';
import { relativeTime, shortDate } from '@/lib/utils/format';
import { type WinglingWingle, parseWingleNote } from '@/lib/types';
import { InsufficientWingitsModal } from '@/components/InsufficientWingitsModal';


const GIFT_BADGES: Record<string, { label: string; icon: string; bg: string }> = {
  rose: { label: 'Sent a Red Rose 🌹', icon: '🌹', bg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400' },
  chocolates: { label: 'Sent Chocolates 🍫', icon: '🍫', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300' },
  coffee: { label: 'Sent a Coffee ☕', icon: '☕', bg: 'bg-amber-600/15 border-amber-600/30 text-amber-800 dark:text-amber-300' },
  teddy: { label: 'Sent a Cute Teddy 🧸', icon: '🧸', bg: 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-300' },
};

export function Wingles() {
  const router = useRouter();
  const {
    sentWingles,
    incomingWingles,
    entitlements,
    userById,
    photosOf,
    respondToWingle,
    markWinglesViewed,
    currentUser
  } = useStore();
  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [showTopup, setShowTopup] = useState(false);

  React.useEffect(() => {
    markWinglesViewed();
  }, [markWinglesViewed]);

  if (!entitlements) return null;

  const sent = sentWingles();
  const incoming = incomingWingles();
  const pendingIncoming = incoming.filter((r) => r.status === 'pending');

  const statusTone = (status: WinglingWingle['status']) =>
  status === 'accepted' ? 'moss' : status === 'declined' ? 'red' : 'amber';

  return (
    <Page>
      <PageHeader
        title="Wingling wingles"
        body="Everything you have sent, and everyone who has asked to meet you."
        action={undefined} />
      

      <div className="mb-6 flex w-full justify-center">
        <div
          role="tablist"
          aria-label="Wingle direction"
          className="inline-flex rounded-full bg-cream-deep p-1">
          
          {(
          [
          ['incoming', `Incoming${pendingIncoming.length ? ` · ${pendingIncoming.length}` : ''}`],
          ['sent', `Sent · ${sent.length}`]] as
          const).
          map(([key, label]) =>
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-[background-color,color] duration-150 ease-soft ${
            tab === key ? 'bg-sand text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`
            }>
            
              {label}
            </button>
          )}
        </div>
      </div>

      {tab === 'incoming' &&
      <div className="min-w-0 w-full max-w-3xl overflow-hidden">
          {incoming.length === 0 ?
        <EmptyState
          icon={<SendIcon className="h-5 w-5" />}
          title="No wingles yet"
          body="When someone asks to meet you, it will appear here. A stronger main photo and a specific bio make a real difference."
          action={<Button onClick={() => router.push('/photos')}>Review my photos</Button>} /> :


        <ul className="space-y-3">
              {incoming.map((wingle) => {
            const sender = userById(wingle.fromUserId);
            const photo = sender ? photosOf(sender.id)[0] : undefined;
            if (!sender) return null;

            const isPending = wingle.status === 'pending';
            const { gift, text } = parseWingleNote(wingle.note);
            if (isPending) {
              return (
                <li
                  key={wingle.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-4xl bg-cream-deep p-4 shadow-card sm:p-5">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-cream-deep">
                      {photo && (
                        <img
                          src={photo.url}
                          alt=""
                          aria-hidden
                          className="h-full w-full scale-110 object-cover blur-[12px]"
                        />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-plum-500/25 text-white">
                        <LockIcon className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-[19px] leading-tight text-ink">
                          Someone wants to connect with you ❤
                        </p>
                        {gift && GIFT_BADGES[gift] && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${GIFT_BADGES[gift].bg}`}>
                            <span>{GIFT_BADGES[gift].icon}</span>
                            <span>{GIFT_BADGES[gift].label}</span>
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-ink-soft">
                        Sent {relativeTime(wingle.createdAt)}
                      </p>
                      {text && (
                        <p className="mt-2 rounded-2xl bg-cream px-3.5 py-2 text-[13px] text-ink-muted">
                          “{text.split(' ').slice(0, 4).join(' ')}
                          {text.split(' ').length > 4 ? '...' : ''}”
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        respondToWingle(wingle.id, 'declined');
                        toast.success('Wingle declined');
                      }}>
                      <XIcon className="h-3.5 w-3.5" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const acceptCost = currentUser?.isUnlimited ? 0 : ((currentUser?.freeWinglesAccepted ?? 0) < 2 ? 0 : 4);
                        if ((currentUser?.wingitsBalance ?? 0) < acceptCost) {
                          setShowTopup(true);
                          return;
                        }
                        await respondToWingle(wingle.id, 'accepted');
                        toast.success(`You are connected with the sender!`);
                      }}>
                      <CheckIcon className="h-3.5 w-3.5" />
                      Accept {currentUser?.isUnlimited ? '' : (((currentUser?.freeWinglesAccepted ?? 0) < 2) ? '(Free)' : '(4 Wingits)')}
                    </Button>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={wingle.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-4xl bg-cream-deep p-4 shadow-card sm:p-5">
                <div className="flex min-w-0 flex-1 items-start sm:items-center gap-4">
                  <button
                    onClick={() => router.push(`/profile/${sender.id}`)}
                    className="shrink-0"
                    aria-label={`View ${sender.name}'s profile`}>
                    {photo && (
                      <img src={photo.url} alt="" className="h-20 w-20 rounded-3xl object-cover" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-[19px] leading-tight text-ink truncate">
                        {sender.name}, {sender.age}
                      </p>
                      <Badge tone={statusTone(wingle.status)}>{wingle.status}</Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-ink-soft truncate">
                      {sender.location} · sent {relativeTime(wingle.createdAt)}
                    </p>
                    {gift && GIFT_BADGES[gift] && (
                      <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${GIFT_BADGES[gift].bg}`}>
                        <span className="text-sm">{GIFT_BADGES[gift].icon}</span>
                        <span>{GIFT_BADGES[gift].label}</span>
                      </div>
                    )}
                    {text && (
                      <p className="mt-2 rounded-2xl bg-cream px-3.5 py-2 text-[13px] leading-relaxed text-ink-soft">
                        “{text}”
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={(e) => { e.stopPropagation(); router.push(`/profile/${sender.id}`); }}>
                  View profile
                </Button>
              </li>
            );

          })}
            </ul>
        }


        </div>
      }

      {tab === 'sent' &&
      <div className="min-w-0 w-full max-w-3xl overflow-hidden">
          {sent.length === 0 ?
        <EmptyState
          icon={<SendIcon className="h-5 w-5" />}
          title="You have not sent any wingles"
          body="Wingles with a specific note get replies far more often. Head to Discover and pick someone worth writing to."
          action={<Button onClick={() => router.push('/discover')}>Discover people</Button>} /> :


        <ul className="space-y-3">
              {sent.map((wingle) => {
            const target = userById(wingle.toUserId);
            const photo = target ? photosOf(target.id)[0] : undefined;
            if (!target) return null;
            return (
              <li
                key={wingle.id}
                className="flex flex-col gap-3 rounded-4xl bg-cream-deep p-4 shadow-card sm:p-5">

                  <div className="flex items-center gap-4">
                    {photo &&
                    <img src={photo.url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                    }
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-[18px] leading-tight text-ink">
                          {target.name}, {target.age}
                        </p>
                        <Badge tone={statusTone(wingle.status)}>{wingle.status}</Badge>
                      </div>
                      <p className="mt-1 text-[13px] text-ink-soft">
                        Sent {shortDate(wingle.createdAt)} · {relativeTime(wingle.createdAt)}
                      </p>
                      {(() => {
                        const { gift: sentGift, text: sentText } = parseWingleNote(wingle.note);
                        return (
                          <div className="space-y-1.5 mt-2">
                            {sentGift && GIFT_BADGES[sentGift] && (
                              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${GIFT_BADGES[sentGift].bg}`}>
                                <span>{GIFT_BADGES[sentGift].icon}</span>
                                <span>Attached {GIFT_BADGES[sentGift].label}</span>
                              </div>
                            )}
                            {sentText && (
                              <p className="rounded-2xl bg-cream px-3.5 py-1.5 text-[13px] text-ink-soft">
                                “{sentText}”
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {wingle.status === 'accepted' &&
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => router.push('/mingles')}>
                      Open chat
                    </Button>
                  }
                </li>);

          })}
            </ul>
        }
        </div>
      }

      <UpgradeDialog
        open={upgradeOpen}
        reason="incoming_locked"
        onClose={() => setUpgradeOpen(false)} />
      <InsufficientWingitsModal
        open={showTopup}
        onClose={() => setShowTopup(false)}
        requiredAmount={4}
        currentBalance={currentUser?.wingitsBalance ?? 0}
        actionName="accept this Wingle"
      />
    </Page>);

}
