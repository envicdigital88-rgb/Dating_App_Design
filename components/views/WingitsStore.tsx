'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Coins, Zap, Shield, ArrowRight, RefreshCw, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/contexts/StoreContext';
import { getWingitsTransactionsAction } from '@/app/actions/wingits';
import { buyWingitsAction, checkAndVerifyPendingPaymentAction } from '@/app/actions/payments';
import { cn } from '@/lib/utils/format';

const WINGIT_RATE = 5; // 20 Wingits = Rs. 100 (5 LKR per Wingit)
const MIN_CUSTOM_WINGITS = 20;

const WINGIT_PACKAGES = [
  { id: 'pkg_1', amount: 100, price: 500, popular: false },
  { id: 'pkg_2', amount: 500, price: 2500, popular: true },
  { id: 'pkg_3', amount: 1000, price: 5000, popular: false },
  { id: 'pkg_4', amount: 2000, price: 10000, popular: false },
];

export default function WingitsStore() {
  const { currentUser } = useStore();
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [customWingits, setCustomWingits] = useState<number | ''>(20);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingLedgerId, setPendingLedgerId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load transaction history
  useEffect(() => {
    getWingitsTransactionsAction().then((txs) => {
      setTransactions(txs || []);
    });
  }, []);

  // Verify and complete pending payment
  const verifyAndComplete = useCallback(async (ledgerId: string, amount?: number | null) => {
    try {
      setIsVerifying(true);
      const check = await checkAndVerifyPendingPaymentAction(ledgerId);
      if (check.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wm_pending_wingits_ledger');
          localStorage.removeItem('wm_pending_wingits_amount');
          localStorage.removeItem('wm_pending_wingits_url');
        }
        setPendingLedgerId(null);
        setPendingAmount(null);
        setLoadingPkg(null);
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

  // Check pending payment from localStorage on mount
  useEffect(() => {
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

  // Window focus listener: immediately re-verify when user returns to tab
  useEffect(() => {
    if (!pendingLedgerId) return;

    const onFocus = () => {
      verifyAndComplete(pendingLedgerId, pendingAmount);
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pendingLedgerId, pendingAmount, verifyAndComplete]);

  // Auto-polling verification while payment is pending
  useEffect(() => {
    if (!pendingLedgerId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes

    const interval = setInterval(async () => {
      if (cancelled) return;
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }
      await verifyAndComplete(pendingLedgerId, pendingAmount);
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingLedgerId, pendingAmount, verifyAndComplete]);

  // Cancel pending payment
  const handleCancelPending = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wm_pending_wingits_ledger');
      localStorage.removeItem('wm_pending_wingits_amount');
      localStorage.removeItem('wm_pending_wingits_url');
    }
    setPendingLedgerId(null);
    setPendingAmount(null);
    toast.info('Pending payment alert dismissed');
  };

  // Resume payment by redirecting to saved Genie IPG URL
  const handleResumePayment = () => {
    const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('wm_pending_wingits_url') : null;
    if (savedUrl) {
      window.location.href = savedUrl;
    } else if (pendingLedgerId) {
      toast.info('Re-checking payment status...');
      verifyAndComplete(pendingLedgerId, pendingAmount);
    }
  };

  // Purchase package via Dialog Genie IPG
  const handlePurchase = async (pkg: { id: string; amount: number; price: number }) => {
    if (pkg.amount < MIN_CUSTOM_WINGITS) {
      toast.error(`Minimum purchase is ${MIN_CUSTOM_WINGITS} Wingits (Rs. ${(MIN_CUSTOM_WINGITS * WINGIT_RATE).toLocaleString()})`);
      return;
    }
    setLoadingPkg(pkg.id);

    try {
      const result = await buyWingitsAction(pkg.price, pkg.amount);

      if (!result.ok) {
        toast.error(result.error || 'Payment gateway rejected the request');
        setLoadingPkg(null);
        return;
      }

      if (!result.redirectUrl) {
        toast.error('Payment gateway rejected the request');
        setLoadingPkg(null);
        return;
      }

      if (result.ledgerId) {
        setPendingLedgerId(result.ledgerId);
        setPendingAmount(pkg.amount);
        if (typeof window !== 'undefined') {
          localStorage.setItem('wm_pending_wingits_ledger', result.ledgerId);
          localStorage.setItem('wm_pending_wingits_amount', String(pkg.amount));
          localStorage.setItem('wm_pending_wingits_url', result.redirectUrl);
        }
      }

      toast.info('Connecting to Dialog Genie IPG...');
      // Direct redirection to Dialog Genie IPG
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
      setLoadingPkg(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-ink">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-berry-500/10 text-berry-400 mb-4 ring-1 ring-berry-500/20">
          <Coins className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2 text-ink">Get More Wingits</h1>
        <p className="text-ink-muted text-base sm:text-lg max-w-xl mx-auto mb-3">
          Wingits are your currency for premium features. Stand out with Secret Wingles, unlock more matches, and boost your profile.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Rate: 20 Wingits = Rs. 100</span>
        </div>
      </div>

      {/* Pending Payment Alert */}
      {pendingLedgerId && (
        <div className="mb-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-ink shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-300">
                Dialog Genie Payment in Progress ({pendingAmount} Wingits • Rs. {(pendingAmount ? pendingAmount * WINGIT_RATE : 0).toLocaleString()})
              </p>
              <p className="text-xs text-amber-200/70">
                {isVerifying ? 'Verifying payment with Dialog Genie...' : 'Complete payment in Dialog window or check status.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => verifyAndComplete(pendingLedgerId, pendingAmount)}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isVerifying && "animate-spin")} />
              <span>{isVerifying ? 'Checking...' : 'Check Status'}</span>
            </button>

            <button
              onClick={handleResumePayment}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium border border-white/15 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Resume Payment</span>
            </button>

            <button
              onClick={handleCancelPending}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-cream-deep border border-sand/60 rounded-3xl p-6 mb-10 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl ring-1 ring-amber-500/20">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-ink-muted font-medium">Your current balance</p>
            <p className="text-3xl font-display font-bold text-ink">
              {currentUser?.wingitsBalance || 0} <span className="text-lg text-ink-muted font-normal font-sans">Wingits</span>
            </p>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {WINGIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={cn(
              "relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:shadow-card hover:-translate-y-1",
              pkg.popular
                ? "border-berry-500/50 bg-gradient-to-b from-berry-500/10 via-cream-deep to-cream-deep shadow-lg shadow-berry-500/5"
                : "bg-cream-deep border-sand/60 hover:border-berry-500/40"
            )}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-berry-500 to-plum-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
                <Sparkles className="w-3 h-3" /> Most Popular
              </div>
            )}

            <div className="text-center mb-6 mt-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="text-3xl font-display font-bold text-ink">{pkg.amount}</span>
              </div>
              <p className="text-sm text-ink-muted">Wingits</p>
            </div>

            <div className="text-center mb-6">
              <p className="text-2xl font-display font-bold text-ink">Rs. {pkg.price.toLocaleString()}</p>
            </div>

            <button
              onClick={() => handlePurchase(pkg)}
              disabled={loadingPkg === pkg.id}
              className={cn(
                "w-full mt-auto py-3 px-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 text-sm",
                pkg.popular
                  ? "bg-gradient-to-r from-berry-500 to-berry-600 hover:from-berry-600 hover:to-berry-700 text-white shadow-md shadow-berry-500/20"
                  : "bg-sand/60 hover:bg-sand text-ink border border-white/5"
              )}
            >
              {loadingPkg === pkg.id ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Buy Now <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Custom Wingits Amount Section */}
      <div className="bg-cream-deep border border-sand/60 rounded-3xl p-6 sm:p-8 mb-12 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Coins className="w-56 h-56 -mr-12 -mt-12 text-amber-500" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Purchase</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-ink">Choose Your Own Amount</h2>
              <p className="text-sm text-ink-muted mt-1">
                Enter any amount of Wingits you need. Rate: 20 Wingits = Rs. 100 (Minimum 20 Wingits).
              </p>
            </div>

            {/* Live Price Tag */}
            {typeof customWingits === 'number' && customWingits >= MIN_CUSTOM_WINGITS && (
              <div className="bg-sand/30 border border-sand/60 rounded-2xl px-5 py-3 text-right shrink-0">
                <p className="text-xs text-ink-muted font-medium">Total Price</p>
                <p className="text-2xl font-display font-bold text-ink">
                  Rs. {(customWingits * WINGIT_RATE).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Quick Select Preset Chips */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2.5">
              Popular Quick Picks
            </p>
            <div className="flex flex-wrap gap-2">
              {[20, 50, 150, 250, 750].map((quickAmt) => (
                <button
                  key={quickAmt}
                  type="button"
                  onClick={() => setCustomWingits(quickAmt)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border",
                    customWingits === quickAmt
                      ? "bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20 font-bold"
                      : "bg-sand/40 hover:bg-sand/70 text-ink border-white/5"
                  )}
                >
                  {quickAmt} Wingits (Rs. {(quickAmt * WINGIT_RATE).toLocaleString()})
                </button>
              ))}
            </div>
          </div>

          {/* Input & Action */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-7 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-amber-500">
                <Coins className="w-5 h-5" />
              </div>
              <input
                type="number"
                min={MIN_CUSTOM_WINGITS}
                step={1}
                value={customWingits}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setCustomWingits('');
                  } else {
                    const parsed = parseInt(val, 10);
                    setCustomWingits(Number.isNaN(parsed) ? '' : Math.max(0, parsed));
                  }
                }}
                placeholder="Enter Wingits (min 20)"
                className={cn(
                  "w-full pl-12 pr-16 py-3.5 rounded-2xl bg-black/20 border text-ink font-semibold text-base transition-colors focus:outline-none focus:ring-2",
                  customWingits !== '' && customWingits < MIN_CUSTOM_WINGITS
                    ? "border-rose-500/50 focus:ring-rose-500/30 text-rose-300"
                    : "border-sand/70 focus:ring-amber-500/30 focus:border-amber-500"
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-muted pointer-events-none">
                Wingits
              </span>
            </div>

            <div className="sm:col-span-5">
              <button
                type="button"
                onClick={() => {
                  if (typeof customWingits === 'number' && customWingits >= MIN_CUSTOM_WINGITS) {
                    handlePurchase({
                      id: 'custom',
                      amount: customWingits,
                      price: customWingits * WINGIT_RATE,
                    });
                  }
                }}
                disabled={
                  typeof customWingits !== 'number' ||
                  customWingits < MIN_CUSTOM_WINGITS ||
                  loadingPkg === 'custom'
                }
                className={cn(
                  "w-full py-3.5 px-5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-md active:scale-95",
                  typeof customWingits === 'number' && customWingits >= MIN_CUSTOM_WINGITS
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-amber-500/20"
                    : "bg-sand/30 text-ink-muted cursor-not-allowed border border-white/5"
                )}
              >
                {loadingPkg === 'custom' ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {typeof customWingits === 'number' && customWingits >= MIN_CUSTOM_WINGITS
                        ? `Buy for Rs. ${(customWingits * WINGIT_RATE).toLocaleString()}`
                        : 'Enter at least 20 Wingits'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation note */}
          {customWingits !== '' && customWingits < MIN_CUSTOM_WINGITS && (
            <p className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1">
              ⚠️ Minimum purchase is 20 Wingits (Rs. 100).
            </p>
          )}
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-sand/60">
        <div className="flex gap-4">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-berry-500/10 flex items-center justify-center text-berry-400 ring-1 ring-berry-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-ink mb-1">Instant Unlock</h3>
            <p className="text-sm text-ink-muted">Wingits are added to your balance immediately after payment.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-berry-500/10 flex items-center justify-center text-berry-400 ring-1 ring-berry-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-ink mb-1">Secure Payments</h3>
            <p className="text-sm text-ink-muted">Powered safely by Dialog Genie. Your transactions are 100% secure.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-berry-500/10 flex items-center justify-center text-berry-400 ring-1 ring-berry-500/20">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-ink mb-1">Never Expire</h3>
            <p className="text-sm text-ink-muted">Your Wingits stay in your account forever until you decide to spend them.</p>
          </div>
        </div>
      </div>

      {/* Usage History */}
      {transactions.length > 0 && (
        <div className="mt-12 pt-8 border-t border-sand/60">
          <h2 className="text-2xl font-display font-bold text-ink mb-6">Usage History</h2>
          <div className="bg-cream-deep border border-sand/60 rounded-3xl overflow-hidden shadow-card">
            <div className="divide-y divide-sand/50">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2.5 rounded-2xl",
                      tx.amount > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base text-ink">{tx.description}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()} at{' '}
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold text-sm sm:text-base px-2.5 py-1 rounded-xl",
                    tx.amount > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                  )}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} Wingits
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
