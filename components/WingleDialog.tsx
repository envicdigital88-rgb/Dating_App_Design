'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Label, Textarea } from './ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import type { User } from '@/lib/types';

export function WingleDialog({
  open,
  onClose,
  target,
  onLimitReached





}: {open: boolean;onClose: () => void;target: User | null;onLimitReached: () => void;}) {
  const { sendWingle, entitlements } = useStore();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  if (!target) return null;

  const submit = () => {
    setSending(true);
    const result = sendWingle(target.id, note);
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
            Send wingle
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
          {entitlements?.winglesRemaining === null ?
          'Unlimited wingles' :
          `${entitlements?.winglesRemaining ?? 0} wingles remaining`}
        </span>
      </div>
    </Modal>);

}