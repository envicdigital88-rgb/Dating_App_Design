'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CameraIcon, ShieldCheckIcon, ClockIcon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';
import type { User } from '@/lib/types';

interface SelfieVerificationModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export function SelfieVerificationModal({ open, onClose, currentUser }: SelfieVerificationModalProps) {
  const router = useRouter();

  if (!currentUser) return null;

  const isPending = currentUser.selfieStatus === 'pending' && Boolean(currentUser.verificationSelfie);
  const isRejected = currentUser.selfieStatus === 'rejected';

  const handleAction = () => {
    onClose();
    router.push('/verify-selfie');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
    >
      <div className="text-center py-2">
        {/* Glowing badge icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-berry-500/20 via-pink-500/20 to-purple-500/20 ring-1 ring-berry-500/30 text-berry-500 shadow-lg shadow-berry-500/10">
          {isPending ? (
            <ClockIcon className="h-8 w-8 text-amber-500 animate-pulse" />
          ) : isRejected ? (
            <AlertCircleIcon className="h-8 w-8 text-rose-500" />
          ) : (
            <CameraIcon className="h-8 w-8 text-berry-500" />
          )}
        </div>

        <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
          {isPending
            ? 'Verification Under Review'
            : isRejected
              ? 'Selfie Verification Required'
              : 'Selfie Verification Required'}
        </h3>

        <div className="mt-3 text-[14px] leading-relaxed text-ink-soft max-w-sm mx-auto">
          {isPending ? (
            <p>
              Your live selfie has been submitted and is currently being reviewed by our moderation team. Once approved, your account will be activated, your profile will be shown on the <strong>Discover page</strong>, and you can send <strong>Wingles</strong>!
            </p>
          ) : isRejected ? (
            <p>
              Your previous selfie verification could not be approved. Please retake a clear live selfie with your front camera to set up your account. Only verified profiles can send Wingles and appear on the <strong>Discover page</strong>.
            </p>
          ) : (
            <p>
              You must first complete your <strong>live selfie verification</strong> to activate your account. Only after verification can you send <strong>Wingles</strong> to other members, and your profile will be shown on the <strong>Discover page</strong>.
            </p>
          )}
        </div>

        {/* Benefits list */}
        <div className="mt-5 rounded-2xl border border-sand/60 bg-cream-deep/60 p-3.5 text-left text-[13px] text-ink-soft space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Unlocks sending <strong>Wingles</strong> to anyone</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Publishes your profile on the <strong>Discover page</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Earns an official <strong>Photo Verified</strong> badge</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {isPending ? 'Close' : 'Maybe Later'}
          </Button>
          <Button
            onClick={handleAction}
            className="w-full sm:w-auto bg-gradient-to-r from-berry-500 to-berry-600 text-white shadow-md shadow-berry-500/25 hover:from-berry-600 hover:to-berry-700"
          >
            {isPending ? (
              <>
                <ClockIcon className="h-4 w-4 mr-1.5" />
                View Status
              </>
            ) : isRejected ? (
              <>
                <CameraIcon className="h-4 w-4 mr-1.5" />
                Retake Live Selfie
              </>
            ) : (
              <>
                <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
                Verify Selfie Now
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
