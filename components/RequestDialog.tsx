'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Label, Textarea } from './ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import type { User } from '@/lib/types';

export function RequestDialog({
  open,
  onClose,
  target,
  onLimitReached





}: {open: boolean;onClose: () => void;target: User | null;onLimitReached: () => void;}) {
  const { sendRequest, entitlements } = useStore();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  if (!target) return null;

  const submit = () => {
    setSending(true);
    const result = sendRequest(target.id, note);
    setSending(false);
    if (!result.ok) {
      onClose();
      if (result.reason === 'request_limit') onLimitReached();else
      toast.error(result.error);
      return;
    }
    setNote('');
    onClose();
    toast.success(`Request sent to ${target.name}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Send ${target.name} a dating request`}
      description="A short, specific note gets a reply far more often than “hey”."
      footer={
      <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={sending}>
            Send request
          </Button>
        </>
      }>
      
      <Label htmlFor="request-note">Your note</Label>
      <Textarea
        id="request-note"
        value={note}
        maxLength={280}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Something about ${target.name}'s profile that caught your eye…`} />
      
      <div className="mt-2 flex items-center justify-between text-[13px] text-ink-muted">
        <span>{note.length}/280</span>
        <span>
          {entitlements?.requestsRemaining === null ?
          'Unlimited requests' :
          `${entitlements?.requestsRemaining ?? 0} requests remaining`}
        </span>
      </div>
    </Modal>);

}