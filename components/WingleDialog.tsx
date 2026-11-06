'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Label, Textarea } from './ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import { type User, type WingleGift, isSelfieVerified } from '@/lib/types';
import { InsufficientWingitsModal } from './InsufficientWingitsModal';
import { SelfieVerificationModal } from './SelfieVerificationModal';

import { WINGLE_GIFTS, WINGLE_SEND_COST, getWingleGift } from '@/lib/wingle-pricing';

const AVAILABLE_GIFTS = [
  { id: 'none', label: 'No Gift', icon: '💌', cost: 0 },
  ...Object.entries(WINGLE_GIFTS).map(([id, gift]) => ({ id: id as WingleGift, ...gift })),
] as const;

export function WingleDialog({
  open,
  onClose,
  target
}: {
  open: boolean;
  onClose: () => void;
  target: User | null;
}) {
  const { sendWingle, currentUser } = useStore();
  const [note, setNote] = useState('');
  const [selectedGift, setSelectedGift] = useState<WingleGift | 'none'>('none');
  const [sending, setSending] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [showSelfieModal, setShowSelfieModal] = useState(false);

  if (!target || !currentUser) return null;

  const baseCost = currentUser.isUnlimited ? 0 : WINGLE_SEND_COST;
  const giftCost = getWingleGift(selectedGift)?.cost ?? 0;
  const totalCost = baseCost + giftCost;

  const submit = async () => {
    if (!isSelfieVerified(currentUser)) {
      onClose();
      setShowSelfieModal(true);
      return;
    }

    if ((currentUser.wingitsBalance ?? 0) < totalCost) {
      setShowTopup(true);
      return;
    }

    setSending(true);
    const result = await sendWingle(
      target.id,
      note,
      selectedGift !== 'none' ? selectedGift : undefined
    );
    setSending(false);

    if (!result.ok) {
      if (result.reason === 'verification_required') {
        onClose();
        setShowSelfieModal(true);
      } else if (result.reason === 'insufficient_wingits') {
        setShowTopup(true);
      } else {
        toast.error(result.error);
      }
      return;
    }

    const giftItem = AVAILABLE_GIFTS.find(g => g.id === selectedGift);
    setNote('');
    setSelectedGift('none');
    onClose();

    if (giftItem && giftItem.id !== 'none') {
      toast.success(`Wingle & ${giftItem.icon} ${giftItem.label} sent to ${target.name}!`);
    } else {
      toast.success(`Wingle sent to ${target.name}`);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Send ${target.name} a wingling wingle`}
        description="A short, specific note gets a reply far more often than “hey”."
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} loading={sending}>
              Send wingle {totalCost > 0 ? `(${totalCost} Wingits)` : ''}
            </Button>
          </>
        }
      >
        <Label htmlFor="wingle-note">Your note</Label>
        <Textarea
          id="wingle-note"
          value={note}
          maxLength={280}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`Something about ${target.name}'s profile that caught your eye…`}
        />

        <div className="mt-2 flex items-center justify-between text-[13px] text-ink-muted">
          <span>{note.length}/280</span>
          <span>
            {baseCost ? `Wingle: ${baseCost} Wingits` : 'Unlimited access'}
            {giftCost > 0 && ` + ${giftCost} Wingits for gift`}
          </span>
        </div>

        {/* ── Virtual Gift Selector ── */}
        <div className="mt-4 pt-3.5 border-t border-sand/70">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
              <span>🎁</span>
              <span>Attach a Virtual Gift</span>
            </label>
            <span className="text-[11px] font-semibold text-berry-600 bg-berry-50 dark:bg-berry-950/40 px-2 py-0.5 rounded-full border border-berry-200 dark:border-berry-800">
              3x More Replies
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {AVAILABLE_GIFTS.map((g) => {
              const isSelected = selectedGift === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGift(g.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'border-berry-500 bg-berry-500/10 ring-2 ring-berry-500/20 shadow-sm'
                      : 'border-sand bg-cream-deep/50 hover:bg-cream-deep hover:border-sand/90'
                  }`}
                >
                  <span className={`text-2xl transition-transform ${isSelected ? 'scale-115' : 'hover:scale-105'}`}>
                    {g.icon}
                  </span>
                  <span className="mt-1 text-[11px] font-medium text-ink truncate w-full">
                    {g.label}
                  </span>
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-berry-600' : 'text-ink-muted'}`}>
                    {g.cost === 0 ? '+0' : `+${g.cost}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      <InsufficientWingitsModal 
        open={showTopup} 
        onClose={() => setShowTopup(false)} 
        requiredAmount={totalCost} 
        currentBalance={currentUser?.wingitsBalance ?? 0} 
        actionName="send this Wingle"
      />

      <SelfieVerificationModal
        open={showSelfieModal}
        onClose={() => setShowSelfieModal(false)}
        currentUser={currentUser}
      />
    </>
  );
}
