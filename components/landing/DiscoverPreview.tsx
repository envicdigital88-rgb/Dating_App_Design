'use client';

import React from 'react';
import Link from 'next/link';

import { HeartIcon, MapPinIcon, SendIcon } from 'lucide-react';
import { SectionHeading } from '../ui/Bits';
import { Button } from '../ui/Button';
import { seedPhotos, seedUsers } from '@/lib/data/seed';

const showcase = seedUsers
  .filter((u) => u.role === 'member' && u.id.startsWith('u-') && u.id !== 'u-me')
  .slice(0, 8)
  .map((user) => ({
    user,
    photo: seedPhotos.find((p) => p.userId === user.id && p.isPrimary)?.url,
  }));

// Duplicate cards for seamless infinite loop
const cards = [...showcase, ...showcase];

function ProfileCard({ user, photo }: { user: (typeof showcase)[0]['user']; photo?: string }) {
  return (
    <div className="group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-4xl bg-cream-deep shadow-card sm:w-[260px]">
      <div className="relative aspect-[3/4] overflow-hidden bg-cream-deep">
        {photo && (
          <img
            src={photo}
            alt={user.name}
            className="h-full w-full object-cover transition-transform duration-300 ease-soft group-hover:scale-[1.03]"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-plum-700/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="font-display text-lg leading-none">
            {user.name}, {user.age}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-[12px] text-white/85">
            <MapPinIcon className="h-3 w-3" />
            {user.location.split(',')[0]}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-3 text-[13px] leading-relaxed text-ink-soft">{user.bio}</p>
        <div className="mt-auto flex gap-2 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sand text-berry-500">
            <HeartIcon className="h-4 w-4" />
          </span>
          <span className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-cream-deep text-[13px] font-medium text-ink-soft">
            <SendIcon className="h-3.5 w-3.5" />
            Wingle
          </span>
        </div>
      </div>
    </div>
  );
}

export function DiscoverPreview() {
  return (
    <section className="border-b border-sand/60 bg-cream-deep/50 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            align="left"
            overline="Discover people"
            title="Real profiles, properly photographed"
            body="Large galleries, a bio in their own words, and what they are looking for — visible before you spend anything."
          />
          <Link href="/sign-up" className="hidden sm:block">
            <Button variant="outline">Browse members</Button>
          </Link>
        </div>
      </div>

      {/* Full-width infinite scroll train */}
      <div className="relative mt-10 overflow-hidden">
        {/* Left fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#050505] to-transparent sm:w-32" />
        {/* Right fade */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#050505] to-transparent sm:w-32" />

        <div
          className="flex gap-4 sm:gap-6"
          style={{
            animation: 'train-scroll 30s linear infinite',
            width: 'max-content',
          }}
        >
          {cards.map(({ user, photo }, i) => (
            <ProfileCard key={`${user.id}-${i}`} user={user} photo={photo} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes train-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
