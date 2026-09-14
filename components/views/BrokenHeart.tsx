'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HeartCrackIcon, ShoppingCartIcon, XIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';

export function BrokenHeart() {
  const router = useRouter();
  const { brokenHeartOf, currentUser, photosOf, removeFromPasses, addToHeartBucket, entitlements, markBrokenHeartViewed } = useStore();
  
  React.useEffect(() => {
    markBrokenHeartViewed();
  }, [markBrokenHeartViewed]);

  if (!currentUser || !entitlements) return null;
  const brokenHeartList = brokenHeartOf();

  return (
    <Page>
      <PageHeader title="Broken Heart" body="Profiles you have passed on. You can always change your mind and move them to your heart bucket." />

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-ink">Passed Profiles · {brokenHeartList.length}</h2>
        {brokenHeartList.length === 0 ? (
          <EmptyState
            icon={<HeartCrackIcon className="h-5 w-5" />}
            title="No broken hearts"
            body="You haven't passed on any profiles yet. As you explore Discover and pass on profiles, they will appear here."
            action={<Button onClick={() => router.push('/discover')}>Discover people</Button>} 
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brokenHeartList.map((user) => {
              const photo = photosOf(user.id)[0];
              return (
                <li key={user.id} className="group relative block w-full overflow-hidden rounded-4xl bg-cream-deep text-left shadow-card">
                  <button
                    onClick={() => router.push(`/profile/${user.id}`)}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-cream-deep">
                      {photo && (
                        <img
                          src={photo.url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 ease-soft group-hover:scale-[1.03]" 
                        />
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-plum-700/80 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <p className="font-display text-[20px] leading-none mb-1">
                          {user.name}, {user.age}
                        </p>
                        <p className="text-[12px] text-white/80 line-clamp-2">{user.bio}</p>
                      </div>
                    </div>
                  </button>
                  <div className="flex p-3 gap-2 bg-cream-deep">
                    <button
                      onClick={() => removeFromPasses(user.id)}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
                      aria-label="Remove forever"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        removeFromPasses(user.id);
                        addToHeartBucket(user.id);
                      }}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-berry-500 text-sm font-semibold text-white transition-colors hover:bg-berry-600"
                    >
                      <ShoppingCartIcon className="h-4 w-4" />
                      Move to In Your Heart
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Page>
  );
}
