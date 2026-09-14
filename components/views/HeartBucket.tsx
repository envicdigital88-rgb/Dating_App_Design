'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCartIcon, SendIcon, XIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Bits';
import { useStore } from '@/lib/contexts/StoreContext';
import { WingleDialog } from '@/components/WingleDialog';
import { UpgradeDialog, type UpgradeReason } from '@/components/UpgradeDialog';
import type { User } from '@/lib/types';

export function HeartBucket() {
  const router = useRouter();
  const { heartBucketOf, currentUser, photosOf, removeFromHeartBucket, wingleStatusWith, entitlements, markHeartBucketViewed } = useStore();
  
  const [wingleTarget, setWingleTarget] = useState<User | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeReason | null>(null);

  React.useEffect(() => {
    markHeartBucketViewed();
  }, [markHeartBucketViewed]);

  if (!currentUser || !entitlements) return null;
  const bucket = heartBucketOf();

  return (
    <Page>
      <PageHeader title="In Your Heart" body="Profiles you have saved to review and send wingles to." />

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl text-ink">Saved Profiles · {bucket.length}</h2>
        {bucket.length === 0 ? (
          <EmptyState
            icon={<ShoppingCartIcon className="h-5 w-5" />}
            title="Your bucket is empty"
            body="You haven't added any profiles to In Your Heart yet. Head to Discover and drag profiles or tap the heart icon to save them here."
            action={<Button onClick={() => router.push('/discover')}>Discover people</Button>} 
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bucket.map((user) => {
              const photo = photosOf(user.id)[0];
              const wingleed = !!wingleStatusWith(user.id);
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
                      onClick={() => removeFromHeartBucket(user.id)}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
                      aria-label="Remove from bucket"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          entitlements.winglesRemaining !== null &&
                          entitlements.winglesRemaining <= 0
                        ) {
                          setUpgrade('wingle_limit');
                          return;
                        }
                        setWingleTarget(user);
                      }}
                      disabled={wingleed}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-berry-500 text-sm font-semibold text-white transition-colors hover:bg-berry-600 disabled:bg-cream-deep disabled:text-ink-muted"
                    >
                      <SendIcon className="h-4 w-4" />
                      {wingleed ? 'Wingle sent' : 'Send wingle'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <WingleDialog
        open={!!wingleTarget}
        target={wingleTarget}
        onClose={() => setWingleTarget(null)}
        onLimitReached={() => setUpgrade('wingle_limit')}
      />
      
      <UpgradeDialog
        open={!!upgrade}
        reason={upgrade ?? 'wingle_limit'}
        onClose={() => setUpgrade(null)}
      />
    </Page>
  );
}
