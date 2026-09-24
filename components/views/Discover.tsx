'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CompassIcon, SparklesIcon, FlameIcon, HeartIcon, Trash2Icon, ShoppingBagIcon, SlidersHorizontalIcon, XIcon, ChevronDownIcon } from 'lucide-react';
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

interface DiscoverFilters {
  ageMin: number;
  ageMax: number;
  gender: 'any' | 'woman' | 'man' | 'non-binary';
  intention: string;
  onlineOnly: boolean;
}

const DEFAULT_FILTERS: DiscoverFilters = {
  ageMin: 18,
  ageMax: 60,
  gender: 'any',
  intention: 'any',
  onlineOnly: false,
};

const INTENTIONS = [
  'Long-term relationship',
  'Long-term, open to short',
  'Something casual',
  'New friends first',
];

function FilterPanel({ filters, onChange, onClose, activeCount }: {
  filters: DiscoverFilters;
  onChange: (f: DiscoverFilters) => void;
  onClose: () => void;
  activeCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18 }}
      className="rounded-3xl bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-2xl p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontalIcon className="h-4 w-4 text-berry-400" />
          <span className="font-display text-sm font-semibold text-ink">Filters</span>
          {activeCount > 0 && <span className="rounded-full bg-berry-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{activeCount}</span>}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && <button onClick={() => onChange(DEFAULT_FILTERS)} className="text-[11px] text-berry-400 hover:text-berry-300 font-medium">Reset all</button>}
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <XIcon className="h-3 w-3 text-ink-soft" />
          </button>
        </div>
      </div>

      {/* Age */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-semibold text-ink-soft uppercase tracking-wide">Age Range</label>
          <span className="text-[12px] font-bold text-ink">{filters.ageMin} – {filters.ageMax}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-ink-muted w-7">Min</span>
            <input type="range" min={18} max={filters.ageMax - 1} value={filters.ageMin}
              onChange={e => onChange({ ...filters, ageMin: +e.target.value })}
              className="flex-1 h-1.5 rounded-full accent-berry-500 cursor-pointer" />
            <span className="text-[11px] text-ink w-6 text-right">{filters.ageMin}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-ink-muted w-7">Max</span>
            <input type="range" min={filters.ageMin + 1} max={80} value={filters.ageMax}
              onChange={e => onChange({ ...filters, ageMax: +e.target.value })}
              className="flex-1 h-1.5 rounded-full accent-berry-500 cursor-pointer" />
            <span className="text-[11px] text-ink w-6 text-right">{filters.ageMax}</span>
          </div>
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-ink-soft uppercase tracking-wide">Show me</label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['any', 'woman', 'man', 'non-binary'] as const).map(g => (
            <button key={g} onClick={() => onChange({ ...filters, gender: g })}
              className={`rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-all capitalize ${filters.gender === g ? 'bg-berry-500 text-white shadow-sm' : 'bg-white/10 text-ink-soft hover:bg-white/20 hover:text-ink'}`}>
              {g === 'any' ? 'All' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Intention */}
      <div className="space-y-2">
        <label className="text-[12px] font-semibold text-ink-soft uppercase tracking-wide">Looking for</label>
        <div className="space-y-1">
          {['any', ...INTENTIONS].map(intent => (
            <button key={intent} onClick={() => onChange({ ...filters, intention: intent })}
              className={`w-full rounded-xl px-3 py-2 text-left text-[12px] font-medium transition-all ${filters.intention === intent ? 'bg-berry-500/20 text-berry-300 ring-1 ring-berry-500/40' : 'bg-white/8 text-ink-soft hover:bg-white/15 hover:text-ink'}`}>
              {intent === 'any' ? 'Anything' : intent}
            </button>
          ))}
        </div>
      </div>

      {/* Online now */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-ink">Online now only</p>
          <p className="text-[11px] text-ink-muted">Active within last 10 minutes</p>
        </div>
        <button onClick={() => onChange({ ...filters, onlineOnly: !filters.onlineOnly })}
          className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${filters.onlineOnly ? 'bg-berry-500' : 'bg-white/20'}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${filters.onlineOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </motion.div>
  );
}

export function Discover() {
  const router = useRouter();
  const { discoverFeed, entitlements, likeUser, passUser, hasLiked, photosOf, wingleStatusWith, currentUser, addToHeartBucket, heartBucketOf } = useStore();

  const [tab, setTab] = useState<'nearby' | 'daily5'>('nearby');
  const [index, setIndex] = useState(0);
  const [wingleTarget, setWingleTarget] = useState<User | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeReason | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [draggingUser, setDraggingUser] = useState<User | null>(null);
  const [activeZone, setActiveZone] = useState<DropZone>(null);
  const heartZoneRef = useRef<HTMLDivElement>(null);
  const recycleZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIndex(0); }, [tab, filters]);

  const rawFeed = discoverFeed();

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.ageMin !== 18 || filters.ageMax !== 60) c++;
    if (filters.gender !== 'any') c++;
    if (filters.intention !== 'any') c++;
    if (filters.onlineOnly) c++;
    return c;
  }, [filters]);

  const filteredFeed = useMemo(() => rawFeed.filter(u => {
    if (u.age < filters.ageMin || u.age > filters.ageMax) return false;
    if (filters.gender !== 'any' && u.gender !== filters.gender) return false;
    if (filters.intention !== 'any' && u.intention !== filters.intention) return false;
    if (filters.onlineOnly) {
      const tenMinsAgo = Date.now() - 10 * 60 * 1000;
      if (new Date(u.lastActiveAt).getTime() < tenMinsAgo) return false;
    }
    return true;
  }), [rawFeed, filters]);

  const daily5Feed = useMemo(() => {
    if (!currentUser) return [];
    return [...filteredFeed]
      .map(u => ({ user: u, score: calculateVibeMatch(currentUser, u).score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.user);
  }, [filteredFeed, currentUser]);

  const feed = tab === 'nearby' ? filteredFeed : daily5Feed;
  const current = feed[Math.min(index, Math.max(0, feed.length - 1))];
  const upNext = useMemo(() => feed.slice(index + 1, index + 5), [feed, index]);
  const advance = () => setIndex(i => Math.min(i + 1, feed.length));
  const bucketCount = heartBucketOf().length;

  const handleDragStart = (e: React.DragEvent, user: User) => { setDraggingUser(user); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragEnd = () => { setDraggingUser(null); setActiveZone(null); };
  const handleHeartDragOver = (e: React.DragEvent) => { e.preventDefault(); setActiveZone('heart'); };
  const handleRecycleDragOver = (e: React.DragEvent) => { e.preventDefault(); setActiveZone('recycle'); };
  const handleDragLeave = (e: React.DragEvent) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setActiveZone(null); };
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
          <Button variant="outline" onClick={() => router.push('/packages')}><SparklesIcon className="h-4 w-4" /> Upgrade package</Button>
        ) : undefined}
      />

      {/* Tabs + Filter toggle */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div role="tablist" className="inline-flex rounded-full bg-cream-deep p-1 shadow-inner">
          <button role="tab" aria-selected={tab === 'nearby'} onClick={() => setTab('nearby')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all ${tab === 'nearby' ? 'bg-cream-deep text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}>
            <CompassIcon className="h-4 w-4" /> Nearby
          </button>
          <button role="tab" aria-selected={tab === 'daily5'} onClick={() => setTab('daily5')}
            className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all ${tab === 'daily5' ? 'bg-berry-500 text-white shadow-sm' : 'text-ink-soft hover:text-ink'}`}>
            <FlameIcon className="h-4 w-4" /> Daily 5
          </button>
        </div>

        <button id="discover-filter-btn" onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${showFilters || activeFilterCount > 0 ? 'bg-berry-500 text-white shadow-md' : 'bg-white/10 text-ink-soft hover:bg-white/20 hover:text-ink ring-1 ring-white/10'}`}>
          <SlidersHorizontalIcon className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && <span className="rounded-full bg-white/25 px-1.5 text-[10px] font-bold">{activeFilterCount}</span>}
          <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <FilterPanel filters={filters} onChange={f => { setFilters(f); setIndex(0); }} onClose={() => setShowFilters(false)} activeCount={activeFilterCount} />
            )}
          </AnimatePresence>

          {/* Active filter chips */}
          {!showFilters && activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.gender !== 'any' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-berry-500/15 px-2.5 py-1 text-[11px] font-semibold text-berry-300 ring-1 ring-berry-500/30 capitalize">
                  {filters.gender} <button onClick={() => setFilters(f => ({ ...f, gender: 'any' }))}><XIcon className="h-2.5 w-2.5" /></button>
                </span>
              )}
              {(filters.ageMin !== 18 || filters.ageMax !== 60) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-berry-500/15 px-2.5 py-1 text-[11px] font-semibold text-berry-300 ring-1 ring-berry-500/30">
                  {filters.ageMin}–{filters.ageMax} yrs <button onClick={() => setFilters(f => ({ ...f, ageMin: 18, ageMax: 60 }))}><XIcon className="h-2.5 w-2.5" /></button>
                </span>
              )}
              {filters.intention !== 'any' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-berry-500/15 px-2.5 py-1 text-[11px] font-semibold text-berry-300 ring-1 ring-berry-500/30">
                  {filters.intention.split(',')[0]} <button onClick={() => setFilters(f => ({ ...f, intention: 'any' }))}><XIcon className="h-2.5 w-2.5" /></button>
                </span>
              )}
              {filters.onlineOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-semibold text-green-300 ring-1 ring-green-500/30">
                  Online now <button onClick={() => setFilters(f => ({ ...f, onlineOnly: false }))}><XIcon className="h-2.5 w-2.5" /></button>
                </span>
              )}
              <span className="text-[11px] text-ink-muted">{feed.length} profile{feed.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Card */}
          <div className="mx-auto w-full max-w-xl sm:max-w-2xl lg:max-w-none lg:mx-0">
            {feed.length === 0 ? (
              <EmptyState icon={<SlidersHorizontalIcon className="h-5 w-5" />}
                title={activeFilterCount > 0 ? "No profiles match your filters" : (tab === 'nearby' ? "That is everyone for now" : "No Daily 5 available")}
                body={activeFilterCount > 0 ? "Try adjusting your filters to see more people." : "You have been through every profile in your area."}
                action={activeFilterCount > 0
                  ? <Button onClick={() => setFilters(DEFAULT_FILTERS)}>Clear all filters</Button>
                  : <Button onClick={() => router.push('/likes')}>See who liked you</Button>} />
            ) : index >= feed.length ? (
              <EmptyState icon={<CompassIcon className="h-5 w-5" />} title="You are all caught up"
                body="You have reviewed every profile currently available."
                action={<Button onClick={() => setIndex(0)}>Start again</Button>} />
            ) : (
              <AnimatePresence mode="wait">
                <ProfileCard key={current.id} user={current} liked={hasLiked(current.id)} wingleed={!!wingleStatusWith(current.id)}
                  onLike={() => { likeUser(current.id); toast.success(`You liked ${current.name}`); advance(); }}
                  onPass={() => { passUser(current.id); advance(); }}
                  onHeartBucket={() => { addToHeartBucket(current.id); toast.success(`♥️ ${current.name} added to In Your Heart!`); advance(); }}
                  onRecycleBin={() => { passUser(current.id); advance(); }}
                  onWingle={() => {
                    if (entitlements.winglesRemaining !== null && entitlements.winglesRemaining <= 0) { setUpgrade('wingle_limit'); return; }
                    setWingleTarget(current);
                  }}
                  heartZoneRef={heartZoneRef} recycleZoneRef={recycleZoneRef} activeZone={activeZone}
                  onHeartDragOver={handleHeartDragOver} onRecycleDragOver={handleRecycleDragOver}
                  onHeartDrop={handleDropHeart} onRecycleDrop={handleDropRecycle}
                  onDragLeave={handleDragLeave} draggingUserName={draggingUser?.name ?? null}
                />
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="hidden lg:block space-y-4">
          <div className="rounded-3xl bg-white/15 backdrop-blur-md ring-1 ring-white/10 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
              <h2 className="font-display text-[15px] font-semibold text-ink">Up next</h2>
              {upNext.length > 0 && <span className="text-[10px] bg-white/10 rounded-full px-2 py-0.5 text-ink-muted font-medium">drag to sort</span>}
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
                      <div draggable onDragStart={e => handleDragStart(e, user)} onDragEnd={handleDragEnd}
                        className={`group flex items-center gap-2.5 px-3 py-2 transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${isDraggingThis ? 'opacity-25 bg-white/15 scale-[0.97]' : 'hover:bg-white/15'}`}>
                        <span className="text-[10px] font-bold text-ink-muted w-3.5 shrink-0 text-center tabular-nums">{index + i + 2}</span>
                        <div className="relative shrink-0">
                          {photo
                            ? <img src={photo.url} alt={user.name} className={`h-8 w-8 rounded-xl object-cover shadow-sm pointer-events-none transition-all duration-150 ${!isDraggingThis && 'group-hover:ring-2 group-hover:ring-berry-300 group-hover:ring-offset-1'}`} />
                            : <Skeleton className="h-8 w-8 rounded-xl" />}
                          <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-[#050505]/80 border border-white/20 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="h-1.5 w-1.5 text-ink-muted" viewBox="0 0 6 10" fill="currentColor">
                              <circle cx="1.5" cy="1.5" r="1" /><circle cx="4.5" cy="1.5" r="1" />
                              <circle cx="1.5" cy="5" r="1" /><circle cx="4.5" cy="5" r="1" />
                              <circle cx="1.5" cy="8.5" r="1" /><circle cx="4.5" cy="8.5" r="1" />
                            </svg>
                          </div>
                        </div>
                        <button onClick={() => router.push(`/profile/${user.id}`)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-[12px] font-semibold text-ink leading-none mb-0.5">{user.name}</span>
                          <span className="block truncate text-[10px] text-ink-muted">{user.age} · {user.location}</span>
                        </button>
                        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); addToHeartBucket(user.id); toast.success(`💜 ${user.name} saved!`); }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-berry-400 hover:bg-berry-50 hover:text-berry-600 transition-colors" title="In Your Heart">
                            <HeartIcon className="h-3 w-3" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); passUser(user.id); toast(`🗑️ ${user.name} skipped`); }}
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

            {upNext.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/10 text-center">
                {draggingUser
                  ? <p className="text-[11px] font-semibold text-berry-500 animate-pulse">↙ Drop {draggingUser.name} into a bucket ↙</p>
                  : <p className="text-[11px] text-ink-muted">Drag photos above → drop into card buckets</p>}
              </div>
            )}

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

