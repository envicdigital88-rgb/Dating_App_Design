'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon, MapPinIcon, SendIcon, XIcon, ZapIcon, SparklesIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge, VerifiedMark } from './ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { presence } from '@/lib/utils/format';
import { calculateVibeMatch } from '@/lib/utils/matching';
import type { User } from '@/lib/types';

export function ProfileCard({
  user,
  onLike,
  onPass,
  onRequest,
  onHeartBucket,
  onRecycleBin,
  liked,
  requested,
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
  onRequest: () => void;
  onHeartBucket?: () => void;
  onRecycleBin?: () => void;
  liked: boolean;
  requested: boolean;
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
  const [index, setIndex] = useState(0);
  const photo = photos[index];

  const step = (delta: number) =>
    setIndex((i) => Math.min(photos.length - 1, Math.max(0, i + delta)));

  const matchResult = currentUser ? calculateVibeMatch(currentUser, user) : null;

  const isHeartActive = activeZone === 'heart';
  const isRecycleActive = activeZone === 'recycle';

  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-4xl bg-white shadow-card"
    >
      {/* Photo */}
      <div className="relative w-full bg-cream-deep" style={{ aspectRatio: '3/5', maxHeight: '420px' }}>
        {photo && (
          <img
            key={photo.id}
            src={photo.url}
            alt={`${user.name}, photo ${index + 1} of ${photos.length}`}
            className="h-full w-full object-cover pointer-events-none"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-plum-700/80 to-transparent" />

        {/* Vibe Match Badge */}
        {matchResult && matchResult.score > 0 && (
          <div className="absolute left-4 top-6 z-10 flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-berry-500/95 px-3 py-1.5 text-sm font-bold text-white shadow-md backdrop-blur-md">
              <ZapIcon className="h-4 w-4 fill-white" />
              {matchResult.score}% Vibe Match
            </div>
          </div>
        )}

        {photos.length > 1 && (
          <>
            <div className="absolute left-4 right-4 top-4 flex gap-1.5">
              {photos.map((p, i) => (
                <span
                  key={p.id}
                  className={`h-1 flex-1 rounded-full transition-colors duration-150 ease-soft ${i === index ? 'bg-white' : 'bg-white/35'}`}
                />
              ))}
            </div>
            <button onClick={() => step(-1)} disabled={index === 0} aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-ink shadow-sm transition-opacity duration-150 ease-soft disabled:opacity-0">
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button onClick={() => step(1)} disabled={index === photos.length - 1} aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-ink shadow-sm transition-opacity duration-150 ease-soft disabled:opacity-0">
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5 text-white pointer-events-none">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-display text-[26px] leading-none">{user.name}, {user.age}</h2>
            {user.verified && <VerifiedMark className="text-white" />}
          </div>
          <p className="flex items-center gap-1.5 text-[13px] text-white/85">
            <MapPinIcon className="h-3.5 w-3.5" />
            {user.location} · {presence(user.online, user.lastActiveAt)}
          </p>
        </div>
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
              isHeartActive ? 'text-berry-600' : 'text-ink-muted group-hover:text-berry-500'
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

          {/* Recycle Bin — RIGHT */}
          <div
            ref={recycleZoneRef}
            onDragOver={onRecycleDragOver}
            onDragLeave={onDragLeave}
            onDrop={onRecycleDrop}
            className="group relative flex flex-col items-center gap-1.5 cursor-default select-none"
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
              <Trash2Icon className={`h-7 w-7 transition-all duration-200 ${
                isRecycleActive ? 'text-white' : 'text-slate-400'
              }`} />
            </motion.div>
            <span className={`text-[11px] font-semibold transition-colors duration-200 ${
              isRecycleActive ? 'text-slate-600' : 'text-ink-muted group-hover:text-slate-500'
            }`}>
              {isRecycleActive && draggingUserName ? `Skip ${draggingUserName}` : 'Recycle Bin'}
            </span>
          </div>
        </div>

        {/* Match Reasons */}
        {matchResult && matchResult.reasons.length > 0 && (
          <div className="mb-4 rounded-2xl bg-berry-50 p-3">
            <div className="flex items-center gap-1.5 mb-2 text-sm font-semibold text-berry-600">
              <SparklesIcon className="h-4 w-4" /> Why you fit
            </div>
            <ul className="flex flex-col gap-1.5 text-[13px] text-berry-900/80">
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

        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{user.bio}</p>

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

        {/* Action row: Pass · Like · Request */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onPass}
            aria-label={`Pass on ${user.name}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-150 ease-soft hover:border-slate-400 hover:text-slate-600 active:scale-95"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onLike}
            aria-label={liked ? `You liked ${user.name}` : `Like ${user.name}`}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-150 ease-soft active:scale-95 ${
              liked
                ? 'border-berry-500 bg-berry-500 text-white'
                : 'border-berry-200 bg-gradient-to-br from-white to-berry-50 text-berry-500 hover:border-berry-400'
            }`}
          >
            <HeartIcon className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={onRequest}
            disabled={requested}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-berry-500 to-berry-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 ease-soft hover:opacity-90 active:scale-[0.98] disabled:from-cream-deep disabled:to-cream-deep disabled:text-ink-muted"
          >
            <SendIcon className="h-4 w-4" />
            {requested ? 'Request sent' : 'Send request'}
          </button>
          <button
            onClick={() => router.push(`/profile/${user.id}`)}
            className="h-12 shrink-0 rounded-2xl border border-sand bg-white px-4 text-sm font-semibold text-ink shadow-sm transition-all duration-150 ease-soft hover:border-berry-300 hover:text-berry-600"
          >
            View
          </button>
        </div>
      </div>
    </motion.article>
  );
}