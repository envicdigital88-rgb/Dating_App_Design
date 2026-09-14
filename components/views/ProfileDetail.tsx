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
  SendIcon,
  ZapIcon,
  SparklesIcon
} from 'lucide-react';
import { Page } from '@/components/AppShell';
import { PhotoGallery } from '@/components/PhotoGallery';
import { Button } from '@/components/ui/Button';
import { Badge, VerifiedMark } from '@/components/ui/Bits';
import { Modal } from '@/components/ui/Modal';
import { ReportDialog } from '@/components/ReportDialog';
import { WingleDialog } from '@/components/WingleDialog';
import { UpgradeDialog, type UpgradeReason } from '@/components/UpgradeDialog';
import { useStore } from '@/lib/contexts/StoreContext';
import { presence } from '@/lib/utils/format';
import { calculateVibeMatch } from '@/lib/utils/matching';
import { lifestyleFields } from '@/lib/data/interests';
import type { Lifestyle } from '@/lib/types';

export function ProfileDetail() {
  const params = useParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const router = useRouter();
  const navigate = router.push;
  const {
    userById,
    photosOf,
    hasLiked,
    likeUser,
    wingleStatusWith,
    conversationWith,
    ensureConversation,
    blockUser,
    openChatPopup,
    entitlements,
    currentUser
  } = useStore();

  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [wingleing, setWingleing] = useState(false);
  const [upgrade, setUpgrade] = useState<UpgradeReason | null>(null);

  const user = userId ? userById(userId) : undefined;
  if (!user || !currentUser || !entitlements) { redirect("/discover"); return null as any; }
  if (user.id === currentUser.id) { redirect("/profile"); return null as any; }

  const photos = photosOf(user.id);
  const wingle = wingleStatusWith(user.id);
  const connected = !!conversationWith(user.id) && wingle?.status === 'accepted';

  const openChat = () => {
    if (!connected) {
      toast.error('You can chat once your wingle has been accepted.');
      return;
    }
    const conversation = ensureConversation(user.id);
    if (window.innerWidth >= 1024) {
      openChatPopup(conversation.id);
    } else {
      navigate(`/mingles/${conversation.id}`);
    }
  };

  const matchResult = calculateVibeMatch(currentUser, user);

  return (
    <Page>
      <button
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-soft transition-colors duration-150 ease-soft hover:text-berry-600"
      >
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
                {user.location} · {presence(user.online, user.lastActiveAt)}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {wingle && (
                <Badge
                  tone={
                    wingle.status === 'accepted'
                      ? 'moss'
                      : wingle.status === 'declined'
                        ? 'red'
                        : 'amber'
                  }
                >
                  Wingle {wingle.status}
                </Badge>
              )}
              {matchResult && matchResult.score > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-berry-500/10 px-3 py-1.5 text-sm font-bold text-berry-600">
                  <ZapIcon className="h-4 w-4 fill-berry-600" />
                  {matchResult.score}% Vibe Match
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (wingle) {
                  toast.info('You already have a wingle with this person.');
                  return;
                }
                if (entitlements.winglesRemaining !== null && entitlements.winglesRemaining <= 0) {
                  setUpgrade('wingle_limit');
                  return;
                }
                setWingleing(true);
              }}
            >
              <SendIcon className="h-4 w-4" />
              {wingle ? 'Wingle sent' : 'Send wingling wingle'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                likeUser(user.id);
                toast.success(`You liked ${user.name}`);
              }}
            >
              <HeartIcon className="h-4 w-4" fill={hasLiked(user.id) ? 'currentColor' : 'none'} />
              {hasLiked(user.id) ? 'Liked' : 'Like'}
            </Button>
            <Button variant="outline" onClick={openChat}>
              <MessageCircleIcon className="h-4 w-4" />
              Start chat
            </Button>
          </div>

          {matchResult && matchResult.reasons.length > 0 && (
            <section className="mt-8 rounded-3xl bg-berry-500/10 p-5 border border-berry-500/20">
              <h2 className="flex items-center gap-2 font-display text-xl text-berry-400">
                <SparklesIcon className="h-5 w-5" />
                Why you fit
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {matchResult.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] text-ink-soft">
                    <span className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-berry-400" />
                    {reason}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">About {user.name}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{user.bio}</p>
          </section>

          {user.prompts && user.prompts.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl text-ink mb-4">Vibe Check</h2>
              <div className="space-y-4">
                {user.prompts.map((prompt) => (
                  <div key={prompt.id} className="rounded-2xl border border-sand bg-cream px-5 py-4">
                    <p className="mb-2 text-[13px] font-semibold tracking-wide text-ink-muted uppercase">
                      {prompt.question}
                    </p>
                    <p className="text-[16px] text-ink">{prompt.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Looking for</h2>
            <p className="mt-2">
              <Badge tone="berry">{user.intention}</Badge>
            </p>
          </section>

          {user.traits && user.traits.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl text-ink">Personality Traits</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {user.traits.map((trait) => (
                  <li
                    key={trait}
                    className="rounded-full border border-sand bg-cream-deep px-3.5 py-1.5 text-[14px] text-ink-soft"
                  >
                    {trait}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Interests</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <li
                  key={interest}
                  className="rounded-full border border-sand bg-cream-deep px-3.5 py-1.5 text-[14px] text-ink-soft"
                >
                  {interest}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl text-ink">Lifestyle</h2>
            <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div className="flex justify-between gap-4 border-b border-sand py-2 text-[14px] sm:border-b-0">
                <dt className="text-ink-muted">Work</dt>
                <dd className="text-right font-medium text-ink">{user.lifestyle.work}</dd>
              </div>
              {lifestyleFields.map((field) => (
                <div
                  key={field.key}
                  className="flex justify-between gap-4 border-b border-sand py-2 text-[14px] sm:border-b-0"
                >
                  <dt className="text-ink-muted">{field.label}</dt>
                  <dd className="text-right font-medium text-ink">
                    {user.lifestyle[field.key as keyof Lifestyle]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-10 rounded-4xl border border-sand bg-cream-deep p-5">
            <h2 className="font-display text-lg text-ink">Not right for you?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Blocking removes {user.name} from your Discover, wingles and inbox. Reports are
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
        userName={user.name}
      />
      
      <WingleDialog
        open={wingleing}
        target={user}
        onClose={() => setWingleing(false)}
        onLimitReached={() => setUpgrade('wingle_limit')}
      />
      
      <UpgradeDialog
        open={!!upgrade}
        reason={upgrade ?? 'wingle_limit'}
        onClose={() => setUpgrade(null)}
      />
      
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
                router.push('/discover');
              }}
            >
              Block {user.name}
            </Button>
          </>
        }
      />
    </Page>
  );
}
