'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  CameraIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  AlertCircleIcon, 
  CheckCircle2Icon,
  ArrowRightIcon,
  RotateCcwIcon,
  LockIcon
} from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { LiveSelfieCapture } from '@/components/LiveSelfieCapture';
import { useStore } from '@/lib/contexts/StoreContext';

export function VerifySelfie() {
  const router = useRouter();
  const { currentUser, submitVerificationSelfie } = useStore();
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);

  if (!currentUser) return null;

  const isApproved = currentUser.selfieStatus === 'approved' || currentUser.isUnlimited;
  const isPending = currentUser.selfieStatus === 'pending' && Boolean(currentUser.verificationSelfie) && !isRetaking;
  const isRejected = currentUser.selfieStatus === 'rejected' && !isRetaking;

  const handleSubmit = async () => {
    if (!capturedSelfie) {
      toast.error('Please capture a clear live selfie first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await submitVerificationSelfie(capturedSelfie);
      if (ok) {
        toast.success('Selfie submitted successfully! Our moderation team will review it shortly.');
        setIsRetaking(false);
        setCapturedSelfie(null);
      } else {
        toast.error('Failed to submit verification selfie. Please try again.');
      }
    } catch (err) {
      console.error('Submit verification selfie error:', err);
      toast.error('Something went wrong submitting your selfie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Live Selfie Verification"
        body="Verify your identity to activate your account, show up on Discover, and start sending Wingles."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        {/* ── Status: Approved ── */}
        {isApproved && (
          <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500">
                <ShieldCheckIcon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-ink">
                    You Are Photo Verified!
                  </h3>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Verified
                  </span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                  Your identity has been confirmed. Your profile is visible to other members on Discover, and you have full access to send Wingles!
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => router.push('/discover')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
              >
                Go to Discover
                <ArrowRightIcon className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Status: Under Review (Pending) ── */}
        {isPending && (
          <div className="overflow-hidden rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500">
                <ClockIcon className="h-8 w-8 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-ink">
                    Verification Under Review
                  </h3>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Pending
                  </span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                  Thank you! Your live selfie was received and is currently being reviewed by our moderation team. You will receive a notification as soon as it is approved.
                </p>
              </div>
            </div>

            {/* Submitted selfie thumbnail preview */}
            {currentUser.verificationSelfie && (
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                <img
                  src={currentUser.verificationSelfie}
                  alt="Submitted verification selfie"
                  className="h-16 w-16 rounded-xl object-cover ring-1 ring-amber-500/30 shadow-sm"
                />
                <div className="flex-1 text-[13px] text-ink-soft">
                  <p className="font-semibold text-ink">Submitted Photo</p>
                  <p className="text-[12px] text-ink-muted">Private & only visible to moderation admins</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRetaking(true)}
                  className="shrink-0"
                >
                  <RotateCcwIcon className="h-3.5 w-3.5" />
                  Retake
                </Button>
              </div>
            )}

            <div className="mt-5 flex justify-between items-center flex-wrap gap-2 pt-2 border-t border-amber-500/20">
              <span className="text-[12px] text-ink-muted">
                Profile remains private on Discover until approved
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/profile')}
              >
                Back to Profile
              </Button>
            </div>
          </div>
        )}

        {/* ── Status: Rejected ── */}
        {isRejected && (
          <div className="overflow-hidden rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500">
                <AlertCircleIcon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-rose-600 dark:text-rose-400">
                    Verification Not Approved
                  </h3>
                  <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Needs Retake
                  </span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                  Your previous selfie verification could not be verified. Please retake a clear live selfie facing the front camera in good lighting.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => setIsRetaking(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
              >
                <CameraIcon className="h-4 w-4 mr-1.5" />
                Retake Live Selfie Now
              </Button>
            </div>
          </div>
        )}

        {/* ── Live Capture Interface (when not approved, or retaking, or not yet submitted) ── */}
        {(!isApproved && (!isPending || isRetaking) && (!isRejected || isRetaking)) && (
          <div className="rounded-3xl bg-white/15 p-6 backdrop-blur-md ring-1 ring-white/10 shadow-card space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-berry-500/10 text-berry-500">
                  <CameraIcon className="h-4 w-4" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink">
                  Capture Front Selfie
                </h3>
              </div>
              <p className="mt-1 text-[13px] text-ink-soft">
                Position your face clearly in the frame with good lighting. Your selfie is strictly private and used only by our moderation team to verify your identity.
              </p>
            </div>

            {/* Live Selfie Camera component */}
            <div className="py-2">
              <LiveSelfieCapture
                value={capturedSelfie}
                onChange={setCapturedSelfie}
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-sand/40">
              {isRetaking ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsRetaking(false);
                    setCapturedSelfie(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel Retake
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => router.push('/discover')}
                  disabled={isSubmitting}
                >
                  Skip for Now
                </Button>
              )}

              <Button
                disabled={!capturedSelfie || isSubmitting}
                onClick={handleSubmit}
                loading={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-berry-500 to-berry-600 text-white shadow-md shadow-berry-500/20 hover:from-berry-600 hover:to-berry-700"
              >
                <ShieldCheckIcon className="h-4 w-4 mr-1.5" />
                Submit Verification
              </Button>
            </div>
          </div>
        )}

        {/* ── Informational Safeguards Card ── */}
        <div className="rounded-3xl border border-sand/60 bg-cream-deep/40 p-5 space-y-3">
          <div className="flex items-center gap-2 text-ink font-semibold text-sm">
            <LockIcon className="h-4 w-4 text-berry-500" />
            <span>Why is Selfie Verification required?</span>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            To build Sri Lanka's safest dating community, WingleMingle protects all members against scammers, bots, and impersonators. Once verified:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] text-ink-soft pt-1">
            <li className="flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Full ability to send <strong>Wingles</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Appears on the <strong>Discover page</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>3x more replies from matches</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Photo Verified badge on your profile</span>
            </li>
          </ul>
        </div>
      </div>
    </Page>
  );
}
