'use client';

import React, { useState } from 'react';
import { ShieldCheckIcon, CoinsIcon, SparklesIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import { faqs } from '@/lib/data/seed';
import { money } from '@/lib/utils/format';
import { buyWingitsAction, checkAndVerifyPendingPaymentAction } from '@/app/actions/payments';
import { toast } from 'sonner';

export function Packages() {
  const { entitlements } = useStore();
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [pendingLedgerId, setPendingLedgerId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const paymentPopupRef = React.useRef<Window | null>(null);

  const verifyAndComplete = React.useCallback(async (ledgerId: string, amount?: number | null) => {
    try {
      setIsVerifying(true);
      const check = await checkAndVerifyPendingPaymentAction(ledgerId);
      if (check.ok) {
        if (paymentPopupRef.current && !paymentPopupRef.current.closed) {
          try {
            paymentPopupRef.current.close();
          } catch {}
          paymentPopupRef.current = null;
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wm_pending_wingits_ledger');
          localStorage.removeItem('wm_pending_wingits_amount');
        }
        setPendingLedgerId(null);
        setPendingAmount(null);
        setLoadingAmount(null);
        toast.success(`🎉 Payment Confirmed! ${amount ? `${amount} ` : ''}Wingits added to your account!`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Restore pending payment if user refreshed or navigated back
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLedgerId = localStorage.getItem('wm_pending_wingits_ledger');
      const savedAmount = localStorage.getItem('wm_pending_wingits_amount');
      if (savedLedgerId) {
        const amt = savedAmount ? parseInt(savedAmount, 10) : null;
        setPendingLedgerId(savedLedgerId);
        setPendingAmount(amt);
        verifyAndComplete(savedLedgerId, amt);
      }
    }
  }, [verifyAndComplete]);

  // Window focus listener: immediately verify when user tabs back
  React.useEffect(() => {
    if (!pendingLedgerId) return;

    const onFocus = () => {
      verifyAndComplete(pendingLedgerId, pendingAmount);
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pendingLedgerId, pendingAmount, verifyAndComplete]);

  // Auto-polling every 3 seconds while payment is pending
  React.useEffect(() => {
    if (!pendingLedgerId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 60; // Poll for 3 minutes

    const interval = setInterval(async () => {
      if (cancelled) return;
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wm_pending_wingits_ledger');
          localStorage.removeItem('wm_pending_wingits_amount');
        }
        setPendingLedgerId(null);
        setPendingAmount(null);
        setLoadingAmount(null);
        return;
      }

      await verifyAndComplete(pendingLedgerId, pendingAmount);
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingLedgerId, pendingAmount, verifyAndComplete]);

  if (!entitlements) return null;

  const handleBuy = async (amount: number) => {
    if (amount < 20) return;
    setLoadingAmount(amount);
    
    try {
      const priceLKR = amount * 5;
      const result = await buyWingitsAction(priceLKR, amount);
      
      if (!result.ok) {
        toast.error(result.error || 'Payment gateway rejected the request');
        setLoadingAmount(null);
        return;
      }

      if (!result.redirectUrl) {
        toast.error('Payment gateway rejected the request');
        setLoadingAmount(null);
        return;
      }

      if (result.ledgerId) {
        setPendingLedgerId(result.ledgerId);
        setPendingAmount(amount);
        if (typeof window !== 'undefined') {
          localStorage.setItem('wm_pending_wingits_ledger', result.ledgerId);
          localStorage.setItem('wm_pending_wingits_amount', String(amount));
        }
      }

      toast.info('Connecting to Dialog payment gateway...');
      window.location.href = result.redirectUrl;
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.includes('Server Action') ||
        msg.includes('deployment') ||
        msg.includes('Unexpected token') ||
        msg.includes('not valid JSON')
      ) {
        toast.info('New deployment detected! Refreshing page...');
        setTimeout(() => window.location.reload(), 500);
        return;
      }
      toast.error(msg || 'Failed to connect to payment gateway');
    } finally {
      setLoadingAmount(null);
    }
  };

  const presets = [
    { amount: 100, price: 500, featured: false, label: 'Starter' },
    { amount: 500, price: 2500, featured: true, label: 'Popular' },
    { amount: 1000, price: 5000, featured: false, label: 'Pro' },
  ];

  return (
    <Page>
      {pendingLedgerId && (
        <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-ink">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="text-sm font-medium">
              Payment in progress with Dialog Genie... {isVerifying ? 'Verifying status...' : 'Waiting for confirmation'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              loading={isVerifying}
              onClick={() => verifyAndComplete(pendingLedgerId, pendingAmount)}
            >
              Check Status
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (paymentPopupRef.current && !paymentPopupRef.current.closed) {
                  paymentPopupRef.current.focus();
                } else if (typeof window !== 'undefined') {
                  const saved = localStorage.getItem('wm_pending_wingits_ledger');
                  if (saved) verifyAndComplete(saved, pendingAmount);
                }
              }}
            >
              Reopen Gateway
            </Button>
          </div>
        </div>
      )}
      <PageHeader
        title="Buy Wingits"
        body="Wingits are the currency of WingleMingle. 20 Wingits = Rs. 100. Minimum purchase is 20 Wingits." />
      
      <div className="mb-12">
        <ul className="grid items-stretch gap-6 lg:grid-cols-3">
          {presets.map((pkg) => (
            <li
              key={pkg.amount}
              className={`relative flex flex-col rounded-[2rem] p-8 shadow-card transition-transform hover:-translate-y-1 ${
                pkg.featured ? 'bg-gradient-to-br from-plum-500/30 to-berry-500/30 border border-white/10 backdrop-blur-3xl text-ink' : 'bg-cream-deep text-ink border border-transparent'
              }`}>
              <div className="flex items-center justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${pkg.featured ? 'bg-berry-500/20 text-berry-400' : 'bg-sand/50 text-ink-soft'}`}>
                  <CoinsIcon className="h-6 w-6" />
                </div>
                {pkg.featured && (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-sm">
                    <SparklesIcon className="h-5 w-5" />
                  </span>
                )}
              </div>
              <div className="mt-5">
                <h3 className="font-display text-2xl font-semibold text-ink whitespace-nowrap">
                  {pkg.amount} Wingits
                </h3>
                <p className={`mt-1.5 text-[14px] leading-relaxed ${pkg.featured ? 'text-ink/90 font-medium' : 'text-ink-soft'}`}>
                  {pkg.label}
                </p>
              </div>
              <div className="mt-8 mb-4">
                <span className="font-display text-[48px] leading-[1.1] text-ink tracking-tight">
                  {money(pkg.price)}
                </span>
              </div>
              <div className="mt-auto pt-6">
                <Button loading={loadingAmount === pkg.amount} onClick={() => handleBuy(pkg.amount)} variant={pkg.featured ? 'primary' : 'secondary'} className="w-full py-4 text-base font-medium rounded-2xl">
                  Buy {pkg.amount} Wingits
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mx-auto max-w-4xl mt-10 rounded-4xl bg-gradient-to-br from-cream-deep to-sand/20 p-8 shadow-card border border-sand/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <CoinsIcon className="w-48 h-48 -mr-12 -mt-12 text-berry-500" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="text-center md:text-left max-w-md">
              <h3 className="font-display text-2xl font-semibold text-ink mb-2">Custom Amount</h3>
              <p className="text-[14px] text-ink-soft leading-relaxed">Enter any specific amount of Wingits you'd like to buy. (20 Wingits = Rs. 100, minimum 20 Wingits).</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-48">
                <CoinsIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-berry-400" />
                <Input
                  type="number"
                  min="20"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="e.g. 50"
                  className="pl-12 py-3 text-lg rounded-2xl w-full bg-white shadow-sm ring-1 ring-sand focus:ring-berry-500 font-semibold"
                />
              </div>
              <div className="w-full sm:w-auto">
                <Button 
                  disabled={!customAmount || customAmount < 20}
                  loading={loadingAmount === customAmount}
                  onClick={() => handleBuy(customAmount as number)} 
                  variant="primary" 
                  className="w-full sm:w-auto px-8 py-3 text-lg rounded-2xl whitespace-nowrap shadow-md">
                  {customAmount && customAmount >= 20 
                    ? `Pay ${money((customAmount as number) * 5)}` 
                    : 'Enter Amount'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 max-w-3xl">
        <h2 className="flex items-center gap-2 font-display text-xl text-ink">
          <ShieldCheckIcon className="h-4 w-4 text-moss" />
          Before you pay
        </h2>
        <dl className="mt-4 divide-y divide-sand rounded-4xl bg-cream-deep px-5 shadow-card">
          {faqs.slice(0, 3).map((faq) =>
          <div key={faq.q} className="py-4">
              <dt className="font-medium text-ink">{faq.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{faq.a}</dd>
            </div>
          )}
        </dl>
      </div>
    </Page>);

}
