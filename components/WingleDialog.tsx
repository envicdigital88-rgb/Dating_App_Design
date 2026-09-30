'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Label, Textarea } from './ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import type { User } from '@/lib/types';
import { InsufficientWingitsModal } from './InsufficientWingitsModal';

export function WingleDialog({
  open,
  onClose,
  target,
  onLimitReached





}: {open: boolean;onClose: () => void;target: User | null;onLimitReached: () => void;}) {
  const { sendWingle, currentUser } = useStore();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [showTopup, setShowTopup] = useState(false);

  if (!target || !currentUser) return null;

  const cost = currentUser.isUnlimited ? 0 : (currentUser.freeWinglesSent < 5 ? 0 : 8);

  const submit = async () => {
    if ((currentUser.wingitsBalance ?? 0) < cost) {
      setShowTopup(true);
      return;
    }

    setSending(true);
    const result = await sendWingle(target.id, note);
    setSending(false);
    if (!result.ok) {
      onClose();
      if (result.reason === 'wingle_limit') onLimitReached();else
      toast.error(result.error);
      return;
    }
    setNote('');
    onClose();
    toast.success(`Wingle sent to ${target.name}`);
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
            Send wingle {cost > 0 ? `(${cost} Wingits)` : '(Free)'}
          </Button>
        </>
      }>
      
      <Label htmlFor="wingle-note">Your note</Label>
      <Textarea
        id="wingle-note"
        value={note}
        maxLength={280}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Something about ${target.name}'s profile that caught your eye…`} />
      
      <div className="mt-2 flex items-center justify-between text-[13px] text-ink-muted">
        <span>{note.length}/280</span>
        <span>
          {currentUser?.isUnlimited ?
          'Unlimited wingles' :
          `Cost: ${cost > 0 ? '8 Wingits' : 'Free (' + (5 - (currentUser?.freeWinglesSent ?? 0)) + ' free left)'}`}
        </span>
      </div>
    </Modal>
    <InsufficientWingitsModal 
      open={showTopup} 
      onClose={() => setShowTopup(false)} 
      requiredAmount={cost} 
      currentBalance={currentUser?.wingitsBalance ?? 0} 
      actionName="send this Wingle"
    />
    </>
  );
}