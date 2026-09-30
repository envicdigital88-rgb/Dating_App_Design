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
import type { WinglingWingle } from '@/lib/types';
import { InsufficientWingitsModal } from '@/components/InsufficientWingitsModal';

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
                      <p className="font-display text-[19px] leading-tight text-ink">
                        Someone wants to connect with you ❤
                      </p>
                      <p className="mt-1 text-[13px] text-ink-soft">
                        Sent {relativeTime(wingle.createdAt)}
                      </p>
                      <p className="mt-2 rounded-2xl bg-cream px-3.5 py-2 text-[13px] text-ink-muted">
                        “{wingle.note.split(' ').slice(0, 2).join(' ')}
                        {wingle.note.split(' ').length > 2 ? '...' : ''}”
                      </p>
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
                    {wingle.note && (
                      <p className="mt-2 rounded-2xl bg-cream px-3.5 py-2 text-[13px] leading-relaxed text-ink-soft">
                        “{wingle.note}”
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
