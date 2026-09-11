'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HeartIcon, SendIcon, XIcon, ZapIcon, SparklesIcon, HeartCrackIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from './ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { presence } from '@/lib/utils/format';
import { calculateVibeMatch } from '@/lib/utils/matching';
import type { User } from '@/lib/types';
import { CircularTestimonials } from './ui/circular-testimonials';

export function ProfileCard({
  user,
  onLike,
  onPass,
  onWingle,
  onHeartBucket,
  onRecycleBin,
  liked,
  wingleed,
  // Drag-and-drop props from Discover
  heartZoneRef,
  recycleZoneRef,
  activeZone,
  onHeartDragOver,
  onRecycleDragOver,
  onHeartDrop,
  onRecycleDrop,
  onDragLeave,
  draggingUserName,
}: {
  user: User;
  onLike: () => void;
  onPass: () => void;
  onWingle: () => void;
  onHeartBucket?: () => void;
  onRecycleBin?: () => void;
  liked: boolean;
  wingleed: boolean;
  heartZoneRef?: React.RefObject<HTMLDivElement>;
  recycleZoneRef?: React.RefObject<HTMLDivElement>;
  activeZone?: 'heart' | 'recycle' | null;
  onHeartDragOver?: (e: React.DragEvent) => void;
  onRecycleDragOver?: (e: React.DragEvent) => void;
  onHeartDrop?: (e: React.DragEvent) => void;
  onRecycleDrop?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  draggingUserName?: string | null;
}) {
  const { photosOf, currentUser } = useStore();
  const router = useRouter();
  const photos = photosOf(user.id);

  const matchResult = currentUser ? calculateVibeMatch(currentUser, user) : null;

  const isHeartActive = activeZone === 'heart';
  const isRecycleActive = activeZone === 'recycle';

  const PassAndLikeButtons = (
    <>
      <button
        onClick={onPass}
        aria-label={`Pass on ${user.name}`}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sand bg-[#1a1a1a] text-white shadow-sm transition-all duration-150 ease-soft active:scale-95"
      >
        <XIcon className="h-5 w-5" />
      </button>
      <button
        onClick={onLike}
        aria-label={liked ? `You liked ${user.name}` : `Like ${user.name}`}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-150 ease-soft active:scale-95 ${
          liked
            ? 'border-berry-500 bg-berry-500 text-white'
            : 'border-berry-200 bg-white text-berry-500'
        }`}
      >
        <HeartIcon className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
      </button>
    </>
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-4xl bg-cream-deep shadow-card relative"
    >
      {/* Photo & Details Carousel */}
      <div className="relative w-full bg-[#0a0a0a] pt-4">
        
        {/* Mobile floating actions (Top of image) */}
        <div className="absolute right-4 top-4 z-20 flex gap-2 lg:hidden">
          {PassAndLikeButtons}
        </div>

        <CircularTestimonials
          testimonials={photos.map((photo) => ({
            src: photo.url,
            name: `${user.name}, ${user.age}`,
            designation: `${user.location} · ${presence(user.online, user.lastActiveAt)}`,
            quote: user.bio || '',
          }))}
          autoplay={false}
          colors={{
            name: "#f7f7ff",
            designation: "#e1e1e1",
            testimony: "#f1f1f7",
            arrowBackground: "rgba(255, 255, 255, 0.15)",
            arrowForeground: "#141414",
            arrowHoverBackground: "#f7f7ff",
          }}
          fontSizes={{
            name: "28px",
            designation: "15px",
            quote: "16px",
          }}
        />

        {/* Vibe Match Badge */}
        {matchResult && matchResult.score > 0 && (
          <div className="absolute left-4 top-6 z-10 flex flex-col gap-1.5 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-berry-500/95 px-3 py-1.5 text-sm font-bold text-white shadow-md backdrop-blur-md">
              <ZapIcon className="h-4 w-4 fill-white" />
              {matchResult.score}% Vibe Match
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">

        {/* ── Bucket Drop Zones — icon only, no card background ── */}
        <div className="mb-5 flex items-center justify-between px-2">

          {/* Heart Bucket — LEFT */}
          <div
            ref={heartZoneRef}
            onDragOver={onHeartDragOver}
            onDragLeave={onDragLeave}
            onDrop={onHeartDrop}
            onClick={onHeartBucket}
            className="group relative flex flex-col items-center gap-1.5 cursor-pointer select-none"
          >
            <motion.div
              animate={isHeartActive
                ? { scale: [1, 1.2, 1.1], rotate: [0, -10, 10, 0] }
                : { scale: 1, rotate: 0 }}
              transition={isHeartActive
                ? { duration: 0.6, repeat: Infinity, repeatType: 'mirror' }
                : { duration: 0.2 }}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                isHeartActive
                  ? 'bg-berry-500 shadow-xl shadow-berry-300/70'
                  : 'bg-berry-50 group-hover:bg-berry-100'
              }`}
            >
              <HeartIcon className={`h-7 w-7 transition-all duration-200 ${
                isHeartActive ? 'fill-white text-white' : 'text-berry-500'
              }`} />
            </motion.div>
            <span className={`text-[11px] font-semibold transition-colors duration-200 ${
              isHeartActive ? 'text-berry-400' : 'text-ink-muted group-hover:text-berry-400'
            }`}>
              {isHeartActive && draggingUserName ? `Save ${draggingUserName}` : 'In Your Heart'}
            </span>
          </div>

          {/* Centre hint */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-ink-muted/50">drag here</span>
            <div className="flex gap-1">
              <span className="h-1 w-1 rounded-full bg-sand" />
              <span className="h-1 w-1 rounded-full bg-sand" />
              <span className="h-1 w-1 rounded-full bg-sand" />
            </div>
          </div>

          {/* Broken Heart — RIGHT */}
          <div
            ref={recycleZoneRef}
            onDragOver={onRecycleDragOver}
            onDragLeave={onDragLeave}
            onDrop={onRecycleDrop}
            onClick={onRecycleBin}
            className="group relative flex flex-col items-center gap-1.5 cursor-pointer select-none"
          >
            <motion.div
              animate={isRecycleActive
                ? { scale: [1, 1.2, 1.1], rotate: [0, 10, -10, 0] }
                : { scale: 1, rotate: 0 }}
              transition={isRecycleActive
                ? { duration: 0.6, repeat: Infinity, repeatType: 'mirror' }
                : { duration: 0.2 }}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                isRecycleActive
                  ? 'bg-slate-600 shadow-xl shadow-slate-300/70'
                  : 'bg-slate-50 group-hover:bg-slate-100'
              }`}
            >
              <HeartCrackIcon className={`h-7 w-7 transition-all duration-200 ${
                isRecycleActive ? 'text-white' : 'text-slate-400'
              }`} />
            </motion.div>
            <span className={`text-[11px] font-semibold transition-colors duration-200 ${
              isRecycleActive ? 'text-slate-300' : 'text-ink-muted group-hover:text-slate-400'
            }`}>
              {isRecycleActive && draggingUserName ? `Skip ${draggingUserName}` : 'Broken Heart'}
            </span>
          </div>
        </div>

        {/* Match Reasons */}
        {matchResult && matchResult.reasons.length > 0 && (
          <div className="mb-4 rounded-2xl bg-berry-500/10 p-3 border border-berry-500/20">
            <div className="flex items-center gap-1.5 mb-2 text-sm font-semibold text-berry-400">
              <SparklesIcon className="h-4 w-4" /> Why you fit
            </div>
            <ul className="flex flex-col gap-1.5 text-[13px] text-ink-soft">
              {matchResult.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-berry-400" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge tone="berry">{user.intention}</Badge>
          {user.traits?.map((trait) => (
            <Badge key={trait} tone="neutral">{trait}</Badge>
          ))}
        </div>

        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft hidden">{user.bio}</p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {user.interests.slice(0, 5).map((interest) => (
            <li key={interest} className="rounded-full border border-sand px-3 py-1 text-[13px] text-ink-soft">
              {interest}
            </li>
          ))}
        </ul>

        {/* Vibe Prompts */}
        {user.prompts && user.prompts.length > 0 && (
          <div className="mt-5 space-y-3">
            {user.prompts.slice(0, 2).map((prompt) => (
              <div key={prompt.id} className="rounded-2xl border border-sand bg-cream px-4 py-3">
                <p className="mb-1 text-[12px] font-semibold tracking-wide text-ink-muted uppercase">{prompt.question}</p>
                <p className="text-[15px] text-ink">{prompt.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action row: Pass · Like · Wingle */}
        <div className="mt-3 flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2">
            {PassAndLikeButtons}
          </div>
          <button
            onClick={onWingle}
            disabled={wingleed}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-berry-500 to-berry-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-soft hover:opacity-90 active:scale-[0.98] disabled:from-cream-deep disabled:to-cream-deep disabled:text-ink-muted"
          >
            <SendIcon className="h-4 w-4" />
            {wingleed ? 'Wingle sent' : 'Send wingle'}
          </button>
          <button
            onClick={() => router.push(`/profile/${user.id}`)}
            className="h-12 shrink-0 rounded-2xl border border-sand bg-cream-deep px-4 text-sm font-semibold text-ink shadow-sm transition-all duration-150 ease-soft hover:border-berry-400 hover:text-berry-400"
          >
            View
          </button>
        </div>
      </div>
    </motion.article>
  );
}
