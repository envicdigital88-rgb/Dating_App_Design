'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ZapIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/contexts/StoreContext';
import { InsufficientWingitsModal } from '@/components/InsufficientWingitsModal';

interface SpotlightBoostModalProps {
  open: boolean;
  onClose: () => void;
}

export function SpotlightBoostModal({ open, onClose }: SpotlightBoostModalProps) {
  const { currentUser, boostProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [showTopup, setShowTopup] = useState(false);

  if (!currentUser) return null;

  const BOOST_COST = 20;
  const balance = currentUser.wingitsBalance ?? 0;
  const hasEnough = currentUser.isUnlimited || balance >= BOOST_COST;

  const handleActivate = async () => {
    if (!hasEnough) {
      onClose();
      setShowTopup(true);
      return;
    }

    setLoading(true);
    try {
      const res = await boostProfile();
      if (res.ok) {
        onClose();
        toast.success("🚀 Profile Spotlight Activated! You're now #1 on Discover for the next 24 hours!", {
          duration: 5000
        });
      } else {
        toast.error(res.error || 'Failed to activate profile boost');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title=""
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Maybe later
            </Button>
            <Button
              onClick={handleActivate}
              loading={loading}
              className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg shadow-rose-500/20 font-bold"
            >
              <ZapIcon className="h-4 w-4 fill-white mr-1.5" />
              {currentUser.isUnlimited
                ? 'Activate Spotlight (VIP Free)'
                : hasEnough
                ? `Activate for 24 Hours (${BOOST_COST} Wingits)`
                : `Get Wingits to Boost (${BOOST_COST} Wingits)`}
            </Button>
          </div>
        }
      >
        <div className="text-center py-2">
          {/* Glowing Animated Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xl shadow-rose-500/25 ring-4 ring-rose-500/20 animate-pulse">
            <ZapIcon className="h-8 w-8 fill-white" />
          </div>

          <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
            Profile Spotlight Boost
          </h3>
          <p className="mt-1.5 text-[14px] text-ink-soft max-w-sm mx-auto leading-relaxed">
            Put your profile at the <strong>#1 position on Discover</strong> for 24 hours and get up to <strong>3x more matches & Wingles</strong>!
          </p>

          {/* Benefits Grid */}
          <div className="mt-5 rounded-2xl border border-sand/70 bg-cream-deep/60 p-4 text-left space-y-3">
            <div className="flex items-start gap-3 text-[13px] text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold">
                1
              </span>
              <div>
                <strong className="font-semibold block">#1 Place on Discover</strong>
                <span className="text-ink-soft">Every nearby member sees your card first before anyone else.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-[13px] text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 font-bold">
                2
              </span>
              <div>
                <strong className="font-semibold block">Glowing Spotlight Badge</strong>
                <span className="text-ink-soft">Stand out with an exclusive radiant badge on your card.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-[13px] text-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 font-bold">
                3
              </span>
              <div>
                <strong className="font-semibold block">3x More Wingles & Replies</strong>
                <span className="text-ink-soft">Members in your area are notified and prioritize connecting with you.</span>
              </div>
            </div>
          </div>

          {/* Balance info */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-sand/40 px-3.5 py-2.5 text-[13px]">
            <span className="text-ink-muted">Your current balance:</span>
            <span className="font-bold text-ink">
              {currentUser.isUnlimited ? 'VIP Unlimited' : `${balance} Wingits`}
            </span>
          </div>
        </div>
      </Modal>

      <InsufficientWingitsModal
        open={showTopup}
        onClose={() => setShowTopup(false)}
        requiredAmount={BOOST_COST}
        currentBalance={balance}
        actionName="activate 24-hour Profile Spotlight"
      />
    </>
  );
}
