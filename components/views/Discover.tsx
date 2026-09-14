'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CompassIcon, SparklesIcon, FlameIcon, HeartIcon, Trash2Icon, ShoppingBagIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Page, PageHeader } from '@/components/AppShell';
import { ProfileCard } from '@/components/ProfileCard';
import { WingleDialog } from '@/components/WingleDialog';
import { UpgradeDialog, type UpgradeReason } from '@/components/UpgradeDialog';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { calculateVibeMatch } from '@/lib/utils/matching';
import type { User } from '@/lib/types';

type DropZone = 'heart' | 'recycle' | null;

export function Discover() {
  const router = useRouter();
  const {
    discoverFeed, entitlements, likeUser, passUser,
    hasLiked, photosOf, wingleStatusWith, currentUser,
    addToHeartBucket, heartBucketOf,
  } = useStore();

  const [tab, setTab] = useState<'nearby' | 'daily5'>('nearby');
  const [index, setIndex] = useState(0);
  const [wingleTarget, setWingleTarget] = useState<User | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeReason | null>(null);

  const [draggingUser, setDraggingUser] = useState<User | null>(null);
  const [activeZone, setActiveZone] = useState<DropZone>(null);
  const heartZoneRef = useRef<HTMLDivElement>(null);
  const recycleZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIndex(0); }, [tab]);

  const rawFeed = discoverFeed();
  const daily5Feed = useMemo(() => {
    if (!currentUser) return [];
    const scored = rawFeed.map(u => ({ user: u, score: calculateVibeMatch(currentUser, u).score }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map(s => s.user);
  }, [rawFeed, currentUser]);

  const feed = tab === 'nearby' ? rawFeed : daily5Feed;
  const current = feed[Math.min(index, Math.max(0, feed.length - 1))];
  const upNext = useMemo(() => feed.slice(index + 1, index + 5), [feed, index]);
  const advance = () => setIndex((i) => Math.min(i + 1, feed.length));
  const bucketCount = heartBucketOf().length;

  const handleDragStart = (e: React.DragEvent, user: User) => {
    setDraggingUser(user);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => { setDraggingUser(null); setActiveZone(null); };
  const handleHeartDragOver = (e: React.DragEvent) => { e.preventDefault(); setActiveZone('heart'); };
  const handleRecycleDragOver = (e: React.DragEvent) => { e.preventDefault(); setActiveZone('recycle'); };
  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (!target.contains(e.relatedTarget as Node)) setActiveZone(null);
  };
  const handleDropHeart = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingUser) { addToHeartBucket(draggingUser.id); toast.success(`💜 ${draggingUser.name} added to In Your Heart!`); }
    setDraggingUser(null); setActiveZone(null);
  };
  const handleDropRecycle = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingUser) { passUser(draggingUser.id); toast(`🗑️ ${draggingUser.name} skipped`); }
    setDraggingUser(null); setActiveZone(null);
  };

  if (!entitlements) return null;

  return (
    <Page>
      <PageHeader
        title="Discover"
        body={tab === 'nearby' ? "Real profiles from people near you, most recently active first." : "Your top 5 highly compatible matches for today, based on your Vibe Score."}
        action={entitlements.subscriptionStatus === 'free' ? (
          <Button variant="outline" onClick={() => router.push('/packages')}>
            <SparklesIcon className="h-4 w-4" /> Upgrade package
          </Button>
        ) : undefined}
      />

      {/* Tabs */}
      <div className="mb-6 flex justify-center lg:justify-start">
        <div role="tablist" className="inline-flex rounded-full bg-cream-deep p-1 shadow-inner">
          <button role="tab" aria-selected={tab === 'nearby'} onClick={() => setTab('nearby')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-150 ease-soft ${tab === 'nearby' ? 'bg-cream-deep text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}>
            <CompassIcon className="h-4 w-4" /> Nearby
          </button>
          <button role="tab" aria-selected={tab === 'daily5'} onClick={() => setTab('daily5')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-150 ease-soft ${tab === 'daily5' ? 'bg-berry-500 text-white shadow-sm' : 'text-ink-soft hover:text-ink'}`}>
            <FlameIcon className="h-4 w-4" /> Daily 5
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">

        {/* Main — profile card */}
        <div className="mx-auto w-full max-w-xl sm:max-w-2xl lg:max-w-none lg:mx-0">
          {feed.length === 0 ? (
            <EmptyState icon={<CompassIcon className="h-5 w-5" />}
              title={tab === 'nearby' ? "That is everyone for now" : "No Daily 5 available"}
              body={tab === 'nearby' ? "You have been through every profile in your area." : "We couldn't find enough matches for your Daily 5 right now."}
              action={<Button onClick={() => router.push('/likes')}>See who liked you</Button>} />
          ) : index >= feed.length ? (
            <EmptyState icon={<CompassIcon className="h-5 w-5" />} title="You are all caught up"
              body="You have reviewed every profile currently available."
              action={<Button onClick={() => setIndex(0)}>Start again</Button>} />
          ) : (
            <AnimatePresence mode="wait">
              <ProfileCard
                key={current.id}
                user={current}
                liked={hasLiked(current.id)}
                wingleed={!!wingleStatusWith(current.id)}
                onLike={() => { likeUser(current.id); toast.success(`You liked ${current.name}`); advance(); }}
                onPass={() => { passUser(current.id); advance(); }}
                onHeartBucket={() => { addToHeartBucket(current.id); toast.success(`♥️ ${current.name} added to In Your Heart!`); advance(); }}
                onRecycleBin={() => { passUser(current.id); advance(); }}
                onWingle={() => {
                  if (entitlements.winglesRemaining !== null && entitlements.winglesRemaining <= 0) { setUpgrade('wingle_limit'); return; }
                  setWingleTarget(current);
                }}
                // Drag-and-drop handlers passed into the card
                heartZoneRef={heartZoneRef}
                recycleZoneRef={recycleZoneRef}
                activeZone={activeZone}
                onHeartDragOver={handleHeartDragOver}
                onRecycleDragOver={handleRecycleDragOver}
                onHeartDrop={handleDropHeart}
                onRecycleDrop={handleDropRecycle}
                onDragLeave={handleDragLeave}
                draggingUserName={draggingUser?.name ?? null}
              />
            </AnimatePresence>
          )}
        </div>

        {/* Right sidebar — desktop only */}
        <aside className="hidden lg:block space-y-4">

          {/* Up next — compact draggable thumbnails */}
          <div className="rounded-3xl bg-white/15 backdrop-blur-md ring-1 ring-white/10 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
              <h2 className="font-display text-[15px] font-semibold text-ink">Up next</h2>
              {upNext.length > 0 && (
                <span className="text-[10px] bg-white/10 rounded-full px-2 py-0.5 text-ink-muted font-medium">
                  drag to sort
                </span>
              )}
            </div>

            {upNext.length === 0 ? (
              <p className="px-4 py-4 text-[13px] text-ink-soft">No more profiles queued.</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {upNext.map((user, i) => {
                  const photo = photosOf(user.id)[0];
                  const isDraggingThis = draggingUser?.id === user.id;
                  return (
                    <li key={user.id}>
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, user)}
                        onDragEnd={handleDragEnd}
                        className={`group flex items-center gap-2.5 px-3 py-2 transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                          isDraggingThis ? 'opacity-25 bg-white/15 scale-[0.97]' : 'hover:bg-white/15'
                        }`}
                      >
                        {/* Rank */}
                        <span className="text-[10px] font-bold text-ink-muted w-3.5 shrink-0 text-center tabular-nums">
                          {index + i + 2}
                        </span>

                        {/* Tiny photo */}
                        <div className="relative shrink-0">
                          {photo ? (
                            <img src={photo.url} alt={user.name}
                              className={`h-8 w-8 rounded-xl object-cover shadow-sm pointer-events-none transition-all duration-150 ${!isDraggingThis && 'group-hover:ring-2 group-hover:ring-berry-300 group-hover:ring-offset-1'}`}
                            />
                          ) : (
                            <Skeleton className="h-8 w-8 rounded-xl" />
                          )}
                          {/* Grip dots */}
                          <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-[#050505]/80 border border-white/20 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="h-1.5 w-1.5 text-ink-muted" viewBox="0 0 6 10" fill="currentColor">
                              <circle cx="1.5" cy="1.5" r="1" /><circle cx="4.5" cy="1.5" r="1" />
                              <circle cx="1.5" cy="5" r="1" /><circle cx="4.5" cy="5" r="1" />
                              <circle cx="1.5" cy="8.5" r="1" /><circle cx="4.5" cy="8.5" r="1" />
                            </svg>
                          </div>
                        </div>

                        {/* Name / info */}
                        <button onClick={() => router.push(`/profile/${user.id}`)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[12px] font-semibold text-ink leading-none mb-0.5">{user.name}</span>
                          <span className="block truncate text-[10px] text-ink-muted">{user.age} · {user.location}</span>
                        </button>

                        {/* Quick actions — hover */}
                        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); addToHeartBucket(user.id); toast.success(`💜 ${user.name} saved!`); }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-berry-400 hover:bg-berry-50 hover:text-berry-600 transition-colors" title="In Your Heart">
                            <HeartIcon className="h-3 w-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); passUser(user.id); toast(`🗑️ ${user.name} skipped`); }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors" title="Skip">
                            <Trash2Icon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Drag hint */}
            {upNext.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/10 text-center">
                {draggingUser ? (
                  <p className="text-[11px] font-semibold text-berry-500 animate-pulse">
                    ↙ Drop {draggingUser.name} into a bucket on the card ↙
                  </p>
                ) : (
                  <p className="text-[11px] text-ink-muted">
                    Drag photos above → drop into card buckets
                  </p>
                )}
              </div>
            )}

            {/* View Heart Bucket CTA */}
            {bucketCount > 0 && (
              <div className="px-3 pb-3">
                <button onClick={() => router.push('/heart-bucket')}
                  className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-berry-500 to-plum-600 px-4 py-2.5 text-white transition-opacity hover:opacity-90">
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon className="h-4 w-4" />
                    <span className="text-[13px] font-semibold">In Your Heart</span>
                  </div>
                  <span className="rounded-full bg-cream-deep/25 px-2 py-0.5 text-[11px] font-bold">{bucketCount}</span>
                </button>
              </div>
            )}
          </div>

        </aside>
      </div>

      <WingleDialog open={!!wingleTarget} target={wingleTarget} onClose={() => setWingleTarget(null)} onLimitReached={() => setUpgrade('wingle_limit')} />
      <UpgradeDialog open={!!upgrade} reason={upgrade ?? 'wingle_limit'} onClose={() => setUpgrade(null)} />
    </Page>
  );
}
