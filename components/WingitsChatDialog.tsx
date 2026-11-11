'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { getWingitsSharingStatusAction, requestWingitsFromChatMemberAction, sendWingitsToChatMemberAction } from '@/app/actions/wingits-chat';
import { useStore } from '@/lib/contexts/StoreContext';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { announceWingitsChatChange } from '@/lib/wingits-chat-events';
import { WINGITS_SHARING_BALANCE_THRESHOLD, type WingitsSharingStatus } from '@/lib/wingits-sharing';

export function WingitsChatDialog({
  conversationId,
  friendName,
  initialMode = 'send',
  initialAmount,
  onClose,
}: {
  conversationId: string;
  friendName: string;
  initialMode?: 'send' | 'request';
  initialAmount?: number;
  onClose: () => void;
}) {
  const { currentUser, refreshAccountState } = useStore();
  const [mode, setMode] = useState(initialMode);
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState<WingitsSharingStatus | null>(null);
  const submitting = useRef(false);
  const attempts = useRef(new Map<string, string>());
  const inputId = useId();
  const requesting = mode === 'request';

  useEffect(() => {
    let active = true;
    setSharing(null);
    if (!currentUser || requesting) return;
    getWingitsSharingStatusAction().then(result => {
      if (!active) return;
      if (result.ok) setSharing(result.data);
      else setError(result.error);
    }).catch(() => {
      if (active) setError('Could not check your available Wingits. Please reopen this dialog.');
    });
    return () => { active = false; };
  }, [currentUser?.id, currentUser?.wingitsBalance, requesting]);

  if (!currentUser) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !currentUser) return;
    const value = Number(amount);
    if (!/^\d+$/.test(amount.trim()) || !Number.isSafeInteger(value) || value < 1) {
      setError('Enter a positive whole number of Wingits.');
      return;
    }
    if (!requesting) {
      if (!sharing) { setError('Please wait while we check your available Wingits.'); return; }
      if (sharing.balance <= WINGITS_SHARING_BALANCE_THRESHOLD) {
        setError(`Your balance must be greater than ${WINGITS_SHARING_BALANCE_THRESHOLD} Wingits to send Wingits.`);
        return;
      }
      if (value > sharing.transferable) {
        setError(`You can send up to ${sharing.transferable} purchased Wingits. Free and bonus Wingits cannot be shared.`);
        return;
      }
    }

    const key = `wm-wingits:${currentUser.id}:${conversationId}:${mode}:${value}`;
    let operationId = attempts.current.get(key);
    try { operationId ??= sessionStorage.getItem(key) ?? undefined; } catch {}
    operationId ??= crypto.randomUUID();
    attempts.current.set(key, operationId);
    try { sessionStorage.setItem(key, operationId); } catch {}

    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const action = requesting ? requestWingitsFromChatMemberAction : sendWingitsToChatMemberAction;
      const result = await action(conversationId, value, operationId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      attempts.current.delete(key);
      try { sessionStorage.removeItem(key); } catch {}
      announceWingitsChatChange(conversationId);
      refreshAccountState();
      toast.success(requesting ? `Wingits request sent to ${friendName}.` : `Sent ${value} Wingits to ${friendName}.`);
      onClose();
    } catch {
      setError('Could not confirm this action. Please try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[110]" onClick={event => event.stopPropagation()}>
      <Modal open onClose={() => { if (!submitting.current) onClose(); }} title={`Wingits with ${friendName}`}>
        <form className="space-y-4" onSubmit={submit}>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={requesting ? 'outline' : 'primary'} aria-pressed={!requesting} disabled={busy}
              onClick={() => { setMode('send'); setError(''); }}>
              Send
            </Button>
            <Button type="button" size="sm" variant={requesting ? 'primary' : 'outline'} aria-pressed={requesting} disabled={busy}
              onClick={() => { setMode('request'); setError(''); }}>
              Request
            </Button>
          </div>
          <div>
            <Label htmlFor={inputId}>Amount in Wingits</Label>
            <Input id={inputId} inputMode="numeric" autoComplete="off" value={amount} disabled={busy}
              aria-invalid={Boolean(error)} onChange={event => { setAmount(event.target.value); setError(''); }} />
          </div>
          <p className="text-sm text-ink-muted">
            {requesting
              ? `${friendName} will get a notification and can choose how many Wingits to send.`
              : sharing ? `Your balance is ${sharing.balance} Wingits. ${sharing.transferable} Wingits are available to send.`
              : 'Checking your available Wingits…'}
          </p>
          {!requesting && <p className="text-xs text-ink-muted">
            Your balance must be greater than {WINGITS_SHARING_BALANCE_THRESHOLD} Wingits. Free and bonus Wingits are for your own use and cannot be shared.
          </p>}
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <Button type="submit" block loading={busy} disabled={!amount.trim() || (!requesting && (!sharing || sharing.balance <= WINGITS_SHARING_BALANCE_THRESHOLD || sharing.transferable < 1))}>
            {requesting ? 'Request Wingits' : 'Send Wingits'}
          </Button>
        </form>
      </Modal>
    </div>,
    document.body
  );
}
