'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HeartIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { relativeTime } from '@/lib/utils/format';

export function Likes() {
  const router = useRouter();
  const { likesReceived, db, currentUser, userById, photosOf } = useStore();

  if (!currentUser) return null;
  const received = likesReceived();
  const given = db.likes.filter((l) => l.fromUserId === currentUser.id);

  const grid = (
  likes: typeof received,
  key: 'fromUserId' | 'toUserId',
  empty: React.ReactNode) =>
  {
    if (likes.length === 0) return empty;
    return (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {likes.map((like) => {
          const user = userById(like[key]);
          const photo = user ? photosOf(user.id)[0] : undefined;
          if (!user) return null;
          return (
            <li key={like.id}>
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className="group block w-full overflow-hidden rounded-4xl bg-cream-deep text-left shadow-card">
                
                <div className="relative aspect-[3/4] overflow-hidden bg-cream-deep">
                  {photo &&
                  <img
                    src={photo.url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 ease-soft group-hover:scale-[1.03]" />

                  }
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-plum-700/75 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <p className="font-display text-[17px] leading-none">
                      {user.name}, {user.age}
                    </p>
                    <p className="mt-1 text-[11px] text-white/80">{relativeTime(like.createdAt)}</p>
                  </div>
                </div>
              </button>
            </li>);

        })}
      </ul>);

  };

  return (
    <Page>
      <PageHeader title="Likes" body="A like is a quiet nudge. A wingle is the actual ask." />

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-ink">Liked you · {received.length}</h2>
        {grid(
          received,
          'fromUserId',
          <EmptyState
            icon={<HeartIcon className="h-5 w-5" />}
            title="No likes yet"
            body="Likes arrive as more people see your profile. Adding a second and third photo is the fastest fix."
            action={<Button onClick={() => router.push('/photos')}>Add photos</Button>} />

        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-ink">You liked · {given.length}</h2>
        {grid(
          given,
          'toUserId',
          <EmptyState
            icon={<HeartIcon className="h-5 w-5" />}
            title="You have not liked anyone"
            body="Head to Discover and start with the people whose profiles you actually read."
            action={<Button onClick={() => router.push('/discover')}>Discover people</Button>} />

        )}
      </section>
    </Page>);

}
