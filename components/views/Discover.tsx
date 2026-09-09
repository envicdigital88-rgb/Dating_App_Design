'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CompassIcon, SparklesIcon, FlameIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Page, PageHeader } from '@/components/AppShell';
import { ProfileCard } from '@/components/ProfileCard';
import { RequestDialog } from '@/components/RequestDialog';
import { UpgradeDialog, type UpgradeReason } from '@/components/UpgradeDialog';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Bits';
import { UsageMeter } from '@/components/UsageMeter';
import { useStore } from '@/lib/contexts/StoreContext';
import { calculateVibeMatch } from '@/lib/utils/matching';
import type { User } from '@/lib/types';

export function Discover() {
  const router = useRouter();
  const {
    discoverFeed,
    entitlements,
    likeUser,
    passUser,
    hasLiked,
    photosOf,
    requestStatusWith,
    currentUser
  } = useStore();

  const [tab, setTab] = useState<'nearby' | 'daily5'>('nearby');
  const [index, setIndex] = useState(0);
  const [requestTarget, setRequestTarget] = useState<User | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeReason | null>(null);

  // Reset index when switching tabs
  useEffect(() => {
    setIndex(0);
  }, [tab]);

  const rawFeed = discoverFeed();

  // Calculate Daily 5 based on top vibe match scores
  const daily5Feed = useMemo(() => {
    if (!currentUser) return [];
    const scored = rawFeed.map(u => ({
      user: u,
      score: calculateVibeMatch(currentUser, u).score
    }));
    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    // Take top 5
    return scored.slice(0, 5).map(s => s.user);
  }, [rawFeed, currentUser]);

  const feed = tab === 'nearby' ? rawFeed : daily5Feed;

  const current = feed[Math.min(index, Math.max(0, feed.length - 1))];
  const upNext = useMemo(() => feed.slice(index + 1, index + 5), [feed, index]);

  const advance = () => setIndex((i) => Math.min(i + 1, feed.length));

  if (!entitlements) return null;

  return (
    <Page>
      <PageHeader
        title="Discover"
        body={
          tab === 'nearby' 
            ? "Real profiles from people near you, most recently active first."
            : "Your top 5 highly compatible matches for today, based on your Vibe Score."
        }
        action={
          entitlements.subscriptionStatus === 'free' ? (
            <Button variant="outline" onClick={() => router.push('/packages')}>
              <SparklesIcon className="h-4 w-4" />
              Upgrade package
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex justify-center lg:justify-start">
        <div role="tablist" className="inline-flex rounded-full bg-cream-deep p-1 shadow-inner">
          <button
            role="tab"
            aria-selected={tab === 'nearby'}
            onClick={() => setTab('nearby')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-150 ease-soft ${
              tab === 'nearby' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <CompassIcon className="h-4 w-4" />
            Nearby
          </button>
          <button
            role="tab"
            aria-selected={tab === 'daily5'}
            onClick={() => setTab('daily5')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-150 ease-soft ${
              tab === 'daily5' ? 'bg-berry-500 text-white shadow-sm' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <FlameIcon className="h-4 w-4" />
            Daily 5
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          {feed.length === 0 ? (
            <EmptyState
              icon={<CompassIcon className="h-5 w-5" />}
              title={tab === 'nearby' ? "That is everyone for now" : "No Daily 5 available"}
              body={
                tab === 'nearby'
                  ? "You have been through every profile in your area. New members join daily — check back later, or look over the people who already liked you."
                  : "We couldn't find enough matches for your Daily 5 right now. Check back tomorrow!"
              }
              action={<Button onClick={() => router.push('/likes')}>See who liked you</Button>}
            />
          ) : index >= feed.length ? (
            <EmptyState
              icon={<CompassIcon className="h-5 w-5" />}
              title="You are all caught up"
              body={
                tab === 'nearby'
                  ? "You have reviewed every profile currently available. Your likes and requests are waiting in your dashboard."
                  : "You've gone through your Daily 5! Come back tomorrow for 5 new highly compatible matches."
              }
              action={<Button onClick={() => setIndex(0)}>Start again</Button>}
            />
          ) : (
            <AnimatePresence mode="wait">
              <ProfileCard
                key={current.id}
                user={current}
                liked={hasLiked(current.id)}
                requested={!!requestStatusWith(current.id)}
                onLike={() => {
                  likeUser(current.id);
                  toast.success(`You liked ${current.name}`);
                  advance();
                }}
                onPass={() => {
                  passUser(current.id);
                  advance();
                }}
                onRequest={() => {
                  if (
                    entitlements.requestsRemaining !== null &&
                    entitlements.requestsRemaining <= 0
                  ) {
                    setUpgrade('request_limit');
                    return;
                  }
                  setRequestTarget(current);
                }}
              />
            </AnimatePresence>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-4xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-lg text-ink">Your allowance</h2>
            <div className="space-y-4">
              <UsageMeter
                label="Chat messages remaining"
                used={entitlements.chatUsed}
                limit={entitlements.chatLimit}
              />
              <UsageMeter
                label="Requests remaining"
                used={entitlements.requestsUsed}
                limit={entitlements.requestLimit}
              />
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
              On the <span className="font-medium text-ink">{entitlements.packageName}</span>{' '}
              package.{' '}
              {entitlements.incomingRequestsUnlocked
                ? 'Incoming requests are unlocked.'
                : 'Incoming requests are locked.'}
            </p>
            {entitlements.subscriptionStatus === 'free' && (
              <Button size="sm" block className="mt-4" onClick={() => router.push('/packages')}>
                See packages
              </Button>
            )}
          </div>

          <div className="rounded-4xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-lg text-ink">Up next</h2>
            {upNext.length === 0 ? (
              <p className="text-[13px] text-ink-soft">No more profiles queued right now.</p>
            ) : (
              <ul className="space-y-3">
                {upNext.map((user) => {
                  const photo = photosOf(user.id)[0];
                  return (
                    <li key={user.id}>
                      <button
                        onClick={() => router.push(`/profile/${user.id}`)}
                        className="flex w-full items-center gap-3 rounded-2xl p-1 text-left transition-colors duration-150 ease-soft hover:bg-cream"
                      >
                        {photo ? (
                          <img
                            src={photo.url}
                            alt=""
                            className="h-12 w-12 rounded-2xl object-cover"
                          />
                        ) : (
                          <Skeleton className="h-12 w-12" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {user.name}, {user.age}
                          </span>
                          <span className="block truncate text-[12px] text-ink-muted">
                            {user.location}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <RequestDialog
        open={!!requestTarget}
        target={requestTarget}
        onClose={() => setRequestTarget(null)}
        onLimitReached={() => setUpgrade('request_limit')}
      />
      
      <UpgradeDialog
        open={!!upgrade}
        reason={upgrade ?? 'request_limit'}
        onClose={() => setUpgrade(null)}
      />
    </Page>
  );
}