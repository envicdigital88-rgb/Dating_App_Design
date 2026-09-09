'use client';

import React, { useState } from 'react';
import { useParams, useRouter, redirect } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2Icon, LockKeyholeIcon, ShieldCheckIcon } from 'lucide-react';
import { Page } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label } from '@/components/ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import { money, shortDate } from '@/lib/utils/format';

type Stage = 'form' | 'verifying' | 'done';

export function Checkout() {
  const { packageId } = useParams();
  const router = useRouter();
    const navigate = router.push;
  const { db, purchasePackage, entitlements } = useStore();

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [reference, setReference] = useState('');

  const pkg = db.packages.find((p) => p.id === packageId);
  if (!pkg || !entitlements) { redirect("/packages"); return null as any; }

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError('Enter the expiry as MM/YY.');
      return;
    }
    if (cvc.replace(/\D/g, '').length < 3) {
      setError('Enter the 3-digit security code.');
      return;
    }
    setStage('verifying');
    const result = await purchasePackage(pkg.id, { number, name });
    if (!result.ok) {
      setStage('form');
      setError(result.error);
      return;
    }
    setReference(result.data.reference);
    setStage('done');
    toast.success(`${pkg.name} package activated`);
  };

  if (stage === 'done') {
    return (
      <Page>
        <div className="mx-auto max-w-lg rounded-4xl bg-white p-8 text-center shadow-card">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-moss/10 text-moss">
            <CheckCircle2Icon className="h-7 w-7" />
          </span>
          <h1 className="font-display text-3xl leading-tight text-ink">Payment confirmed</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
            Your {pkg.name} package is active. Your allowances have been topped up and incoming
            requests are unlocked.
          </p>

          <dl className="mt-7 divide-y divide-sand border-y border-sand text-left text-[14px]">
            {[
            ['Package', pkg.name],
            ['Amount paid', money(pkg.price)],
            ['Chat messages', pkg.chatLimit === null ? 'Unlimited' : String(pkg.chatLimit)],
            ['Dating requests', pkg.requestLimit === null ? 'Unlimited' : String(pkg.requestLimit)],
            [
            'Renews / expires',
            shortDate(new Date(Date.now() + pkg.durationDays * 86_400_000).toISOString())],

            ['Reference', reference]].
            map(([label, value]) =>
            <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            )}
          </dl>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button block onClick={() => navigate('/requests')}>
              See who sent requests
            </Button>
            <Button block variant="outline" onClick={() => navigate('/messages')}>
              Go to messages
            </Button>
          </div>
        </div>
      </Page>);

  }

  return (
    <Page>
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-4xl bg-white p-6 shadow-card sm:p-8">
          <h1 className="font-display text-[28px] leading-tight text-ink">Secure checkout</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            Payments are verified on our servers before anything unlocks. We never store your card
            details.
          </p>

          <form onSubmit={pay} className="mt-7 space-y-4" noValidate>
            <div>
              <Label htmlFor="card-name">Name on card</Label>
              <Input
                id="card-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                autoComplete="cc-name"
                required />
              
            </div>
            <div>
              <Label htmlFor="card-number">Card number</Label>
              <Input
                id="card-number"
                value={number}
                onChange={(e) =>
                setNumber(
                  e.target.value.
                  replace(/\D/g, '').
                  slice(0, 16).
                  replace(/(.{4})/g, '$1 ').
                  trim()
                )
                }
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
                required />
              
              <p className="mt-1.5 text-[12px] text-ink-muted">
                Test mode  any card works. A number ending 0000 simulates a decline.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-expiry">Expiry</Label>
                <Input
                  id="card-expiry"
                  value={expiry}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                  }}
                  placeholder="04/28"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  required />
                
              </div>
              <div>
                <Label htmlFor="card-cvc">Security code</Label>
                <Input
                  id="card-cvc"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  required />
                
              </div>
            </div>

            <FieldError>{error}</FieldError>

            <Button type="submit" block size="lg" loading={stage === 'verifying'}>
              <LockKeyholeIcon className="h-4 w-4" />
              {stage === 'verifying' ? 'Verifying payment' : `Pay ${money(pkg.price)}`}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-muted">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Verified server-side ,%V% features unlock only after your bank confirms
            </p>
          </form>
        </div>

        <aside className="h-fit rounded-4xl bg-plum-500 p-6 text-cream sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cream/60">
            You are buying
          </p>
          <h2 className="mt-2 font-display text-3xl">{pkg.name}</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-cream/75">{pkg.tagline}</p>

          <p className="mt-6 flex items-baseline gap-2">
            <span className="font-display text-[38px] leading-none">{money(pkg.price)}</span>
            <span className="text-[13px] text-cream/70">for {pkg.durationDays} days</span>
          </p>

          <dl className="mt-6 space-y-2 border-t border-cream/15 pt-5 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="text-cream/70">Chat messages</dt>
              <dd className="font-medium">{pkg.chatLimit === null ? 'Unlimited' : pkg.chatLimit}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cream/70">Dating requests</dt>
              <dd className="font-medium">
                {pkg.requestLimit === null ? 'Unlimited' : pkg.requestLimit}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cream/70">Incoming requests</dt>
              <dd className="font-medium">{pkg.incomingRequestsUnlocked ? 'Revealed' : 'Locked'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-cream/70">Current package</dt>
              <dd className="font-medium">{entitlements.packageName}</dd>
            </div>
          </dl>

          <ul className="mt-6 space-y-2 text-[13px] text-cream/85">
            {pkg.features.map((feature) =>
            <li key={feature} className="flex gap-2">
                <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cream/70" />
                {feature}
              </li>
            )}
          </ul>
        </aside>
      </div>
    </Page>);

}
