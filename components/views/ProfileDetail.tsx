"use client";
import React, { useState } from 'react';
import { useParams, useRouter, redirect } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  BanIcon,
  FlagIcon,
  HeartIcon,
  MapPinIcon,
  MessageCircleIcon,
  SendIcon } from
'lucide-react';
import { Page } from '@/components/AppShell';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Button } from '@/components/ui/Button';
import { Badge, VerifiedMark } from '@/components/ui/Bits';
import { Modal } from '@/components/ui/Modal';
import { ReportDialog } from '@/components/ReportDialog';
import { RequestDialog } from '@/components/RequestDialog';
import { UpgradeDialog, type UpgradeReason } from '@/components/UpgradeDialog';
import { useStore } from '@/lib/contexts/StoreContext';
import { presence } from '@/lib/utils/format';
import { lifestyleFields } from '@/lib/data/interests';
import type { Lifestyle } from '@/lib/types';

export function ProfileDetail() {
  const { userId } = useParams();
  const router = useRouter();
    const navigate = router.push;
  const {
    userById,
    photosOf,
    hasLiked,
    likeUser,
    requestStatusWith,
    conversationWith,
    ensureConversation,
    blockUser,
    entitlements,
    currentUser
  } = useStore();

  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [upgrade, setUpgrade] = useState<UpgradeReason | null>(null);

  const user = userId ? userById(userId) : undefined;
  if (!user || !currentUser || !entitlements) { redirect("/discover"); return null as any; }
  if (user.id === currentUser.id) { redirect("/profile"); return null as any; }

  const photos = photosOf(user.id);
  const request = requestStatusWith(user.id);
  const connected = !!conversationWith(user.id) && request?.status === 'accepted';

  const openChat = () => {
    if (!connected) {
      toast.error('You can chat once your request has been accepted.');
      return;
    }
    const conversation = ensureConversation(user.id);
    navigate(`/messages/${conversation.id}`);
  };

  return (
    <Page>
      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors duration-150 ease-soft hover:text-berry-600">
        
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <PhotoGallery photos={photos} name={user.name} />
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[34px] leading-none text-ink">
                  {user.name}, {user.age}
                </h1>
                {user.verified && <VerifiedMark className="mt-1" />}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[14px] text-ink-soft">
                <MapPinIcon className="h-4 w-4" />
                {user.location} ,%V% {presence(user.online, user.lastActiveAt)}
              </p>
            </div>
            {request &&
            <Badge
              tone={
              request.status === 'accepted' ?
              'moss' :
              request.status === 'declined' ?
              'red' :
              'amber'
              }>
              
                Request {request.status}
              </Badge>
            }
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (request) {
                  toast.info('You already have a request with this person.');
                  return;
                }
                if (entitlements.requestsRemaining !== null && entitlements.requestsRemaining <= 0) {
                  setUpgrade('request_limit');
                  return;
                }
                setRequesting(true);
              }}>
              
              <SendIcon className="h-4 w-4" />
              {request ? 'Request sent' : 'Send dating request'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                likeUser(user.id);
                toast.success(`You liked ${user.name}`);
              }}>
              
              <HeartIcon className="h-4 w-4" fill={hasLiked(user.id) ? 'currentColor' : 'none'} />
              {hasLiked(user.id) ? 'Liked' : 'Like'}
            </Button>
            <Button variant="outline" onClick={openChat}>
              <MessageCircleIcon className="h-4 w-4" />
              Start chat
            </Button>
          </div>

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">About {user.name}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{user.bio}</p>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Looking for</h2>
            <p className="mt-2">
              <Badge tone="berry">{user.intention}</Badge>
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Interests</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {user.interests.map((interest) =>
              <li
                key={interest}
                className="rounded-full border border-sand bg-white px-3.5 py-1.5 text-[14px] text-ink-soft">
                
                  {interest}
                </li>
              )}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Lifestyle</h2>
            <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div className="flex justify-between gap-4 border-b border-sand py-2 text-[14px] sm:border-b-0">
                <dt className="text-ink-muted">Work</dt>
                <dd className="text-right font-medium text-ink">{user.lifestyle.work}</dd>
              </div>
              {lifestyleFields.map((field) =>
              <div
                key={field.key}
                className="flex justify-between gap-4 border-b border-sand py-2 text-[14px] sm:border-b-0">
                
                  <dt className="text-ink-muted">{field.label}</dt>
                  <dd className="text-right font-medium text-ink">
                    {user.lifestyle[field.key as keyof Lifestyle]}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="mt-10 rounded-4xl border border-sand bg-white p-5">
            <h2 className="font-display text-lg text-ink">Not right for you?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Blocking removes {user.name} from your Discover, requests and inbox. Reports are
              anonymous and reviewed by our moderation team.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setReporting(true)}>
                <FlagIcon className="h-3.5 w-3.5" />
                Report
              </Button>
              <Button variant="danger" size="sm" onClick={() => setBlocking(true)}>
                <BanIcon className="h-3.5 w-3.5" />
                Block
              </Button>
            </div>
          </section>
        </div>
      </div>

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        userId={user.id}
        userName={user.name} />
      
      <RequestDialog
        open={requesting}
        target={user}
        onClose={() => setRequesting(false)}
        onLimitReached={() => setUpgrade('request_limit')} />
      
      <UpgradeDialog
        open={!!upgrade}
        reason={upgrade ?? 'request_limit'}
        onClose={() => setUpgrade(null)} />
      
      <Modal
        open={blocking}
        onClose={() => setBlocking(false)}
        title={`Block ${user.name}?`}
        description="They will no longer be able to see your profile or contact you, and you will not see them again."
        footer={
        <>
            <Button variant="ghost" onClick={() => setBlocking(false)}>
              Cancel
            </Button>
            <Button
            variant="danger"
            onClick={() => {
              blockUser(user.id);
              setBlocking(false);
              toast.success(`${user.name} blocked`);
              navigate('/discover');
            }}>
            
              Block {user.name}
            </Button>
          </>
        } />
      
    </Page>);

}
