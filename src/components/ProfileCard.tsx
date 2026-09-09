'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon, MapPinIcon, SendIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge, VerifiedMark } from './ui/Bits';
import { useStore } from '../contexts/StoreContext';
import { presence } from '../utils/format';
import type { User } from '../types';

export function ProfileCard({
  user,
  onLike,
  onPass,
  onRequest,
  liked,
  requested







}: {user: User;onLike: () => void;onPass: () => void;onRequest: () => void;liked: boolean;requested: boolean;}) {
  const { photosOf } = useStore();
  const router = useRouter();
  const photos = photosOf(user.id);
  const [index, setIndex] = useState(0);
  const photo = photos[index];

  const step = (delta: number) =>
  setIndex((i) => Math.min(photos.length - 1, Math.max(0, i + delta)));

  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-4xl bg-white shadow-card">
      
      <div className="relative aspect-[3/4] w-full bg-cream-deep sm:aspect-[4/5]">
        {photo &&
        <img
          key={photo.id}
          src={photo.url}
          alt={`${user.name}, photo ${index + 1} of ${photos.length}`}
          className="h-full w-full object-cover" />

        }
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-plum-700/80 to-transparent" />

        {photos.length > 1 &&
        <>
            <div className="absolute left-4 right-4 top-4 flex gap-1.5">
              {photos.map((p, i) =>
            <span
              key={p.id}
              className={`h-1 flex-1 rounded-full transition-colors duration-150 ease-soft ${
              i === index ? 'bg-white' : 'bg-white/35'}`
              } />

            )}
            </div>
            <button
            onClick={() => step(-1)}
            disabled={index === 0}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-ink shadow-sm transition-opacity duration-150 ease-soft disabled:opacity-0">
            
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
            onClick={() => step(1)}
            disabled={index === photos.length - 1}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-ink shadow-sm transition-opacity duration-150 ease-soft disabled:opacity-0">
            
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        }

        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-display text-[26px] leading-none">
              {user.name}, {user.age}
            </h2>
            {user.verified && <VerifiedMark className="text-white" />}
          </div>
          <p className="flex items-center gap-1.5 text-[13px] text-white/85">
            <MapPinIcon className="h-3.5 w-3.5" />
            {user.location} · {presence(user.online, user.lastActiveAt)}
          </p>
        </div>
      </div>

      <div className="p-5">
        <Badge tone="berry">{user.intention}</Badge>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{user.bio}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {user.interests.slice(0, 5).map((interest) =>
          <li
            key={interest}
            className="rounded-full border border-sand px-3 py-1 text-[13px] text-ink-soft">
            
              {interest}
            </li>
          )}
        </ul>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={onPass}
            aria-label={`Pass on ${user.name}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-sand bg-white text-ink-soft transition-[transform,border-color,color] duration-150 ease-soft hover:border-ink-muted hover:text-ink active:scale-95">
            
            <XIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onLike}
            aria-label={liked ? `You liked ${user.name}` : `Like ${user.name}`}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-[transform,background-color,color] duration-150 ease-soft active:scale-95 ${
            liked ?
            'border-berry-500 bg-berry-500 text-white' :
            'border-sand bg-white text-berry-500 hover:bg-berry-50'}`
            }>
            
            <HeartIcon className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={onRequest}
            disabled={requested}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-berry-500 px-4 text-sm font-medium text-white transition-[background-color,transform] duration-150 ease-soft hover:bg-berry-600 active:scale-[0.98] disabled:bg-cream-deep disabled:text-ink-muted">
            
            <SendIcon className="h-4 w-4" />
            {requested ? 'Request sent' : 'Send request'}
          </button>
          <button
            onClick={() => router.push(`/app/profile/${user.id}`)}
            className="h-12 shrink-0 rounded-full border border-sand bg-white px-4 text-sm font-medium text-ink transition-[border-color,color] duration-150 ease-soft hover:border-berry-300 hover:text-berry-600">
            
            View
          </button>
        </div>
      </div>
    </motion.article>);

}