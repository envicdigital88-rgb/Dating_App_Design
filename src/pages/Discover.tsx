import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CompassIcon, SparklesIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Page, PageHeader } from '../components/AppShell';
import { ProfileCard } from '../components/ProfileCard';
import { RequestDialog } from '../components/RequestDialog';
import { UpgradeDialog, type UpgradeReason } from '../components/UpgradeDialog';
import { Button } from '../components/ui/Button';
import { EmptyState, Skeleton } from '../components/ui/Bits';
import { UsageMeter } from '../components/UsageMeter';
import { useStore } from '../contexts/StoreContext';
import type { User } from '../types';

export function Discover() {
  const navigate = useNavigate();
  const {
    discoverFeed,
    entitlements,
    likeUser,
    passUser,
    hasLiked,
    photosOf,
    requestStatusWith
  } = useStore();

  const feed = discoverFeed();
  const [index, setIndex] = useState(0);
  const [requestTarget, setRequestTarget] = useState<User | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeReason | null>(null);

  const current = feed[Math.min(index, Math.max(0, feed.length - 1))];
  const upNext = useMemo(() => feed.slice(index + 1, index + 5), [feed, index]);

  const advance = () => setIndex((i) => Math.min(i + 1, feed.length));

  if (!entitlements) return null;

  return (
    <Page>
      <PageHeader
        title="Discover"
        body="Real profiles from people near you, most recently active first."
        action={
        entitlements.subscriptionStatus === 'free' ?
        <Button variant="outline" onClick={() => navigate('/app/packages')}>
              <SparklesIcon className="h-4 w-4" />
              Upgrade package
            </Button> :
        undefined
        } />
      

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          {feed.length === 0 ?
          <EmptyState
            icon={<CompassIcon className="h-5 w-5" />}
            title="That is everyone for now"
            body="You have been through every profile in your area. New members join daily — check back later, or look over the people who already liked you."
            action={<Button onClick={() => navigate('/app/likes')}>See who liked you</Button>} /> :

          index >= feed.length ?
          <EmptyState
            icon={<CompassIcon className="h-5 w-5" />}
            title="You are all caught up"
            body="You have reviewed every profile currently available. Your likes and requests are waiting in your dashboard."
            action={<Button onClick={() => setIndex(0)}>Start again</Button>} /> :


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
                entitlements.requestsRemaining <= 0)
                {
                  setUpgrade('request_limit');
                  return;
                }
                setRequestTarget(current);
              }} />
            
            </AnimatePresence>
          }
        </div>

        <aside className="space-y-5">
          <div className="rounded-4xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-lg text-ink">Your allowance</h2>
            <div className="space-y-4">
              <UsageMeter
                label="Chat messages remaining"
                used={entitlements.chatUsed}
                limit={entitlements.chatLimit} />
              
              <UsageMeter
                label="Requests remaining"
                used={entitlements.requestsUsed}
                limit={entitlements.requestLimit} />
              
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
              On the <span className="font-medium text-ink">{entitlements.packageName}</span>{' '}
              package.{' '}
              {entitlements.incomingRequestsUnlocked ?
              'Incoming requests are unlocked.' :
              'Incoming requests are locked.'}
            </p>
            {entitlements.subscriptionStatus === 'free' &&
            <Button size="sm" block className="mt-4" onClick={() => navigate('/app/packages')}>
                See packages
              </Button>
            }
          </div>

          <div className="rounded-4xl bg-white p-5 shadow-card">
            <h2 className="mb-4 font-display text-lg text-ink">Up next</h2>
            {upNext.length === 0 ?
            <p className="text-[13px] text-ink-soft">No more profiles queued right now.</p> :

            <ul className="space-y-3">
                {upNext.map((user) => {
                const photo = photosOf(user.id)[0];
                return (
                  <li key={user.id}>
                      <button
                      onClick={() => navigate(`/app/profile/${user.id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl p-1 text-left transition-colors duration-150 ease-soft hover:bg-cream">
                      
                        {photo ?
                      <img
                        src={photo.url}
                        alt=""
                        className="h-12 w-12 rounded-2xl object-cover" /> :


                      <Skeleton className="h-12 w-12" />
                      }
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {user.name}, {user.age}
                          </span>
                          <span className="block truncate text-[12px] text-ink-muted">
                            {user.location}
                          </span>
                        </span>
                      </button>
                    </li>);

              })}
              </ul>
            }
          </div>
        </aside>
      </div>

      <RequestDialog
        open={!!requestTarget}
        target={requestTarget}
        onClose={() => setRequestTarget(null)}
        onLimitReached={() => setUpgrade('request_limit')} />
      
      <UpgradeDialog
        open={!!upgrade}
        reason={upgrade ?? 'request_limit'}
        onClose={() => setUpgrade(null)} />
      
    </Page>);

}