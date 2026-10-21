'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/contexts/StoreContext';
import {
  Sparkles,
  Coins,
  Zap,
  Shield,
  ArrowRight,
  Flame,
  Crown,
  Check,
  RefreshCw,
  Heart,
  Image as ImageIcon,
  Send,
  ExternalLink,
  Sliders,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { buyWingitsAction, checkAndVerifyPendingPaymentAction } from '@/app/actions/payments';
import { getWingitsTransactionsAction, getWingitsBalanceAction } from '@/app/actions/wingits';
import { cn } from '@/lib/utils/format';

interface WingitPackage {
  id: string;
  amount: number;
  price: number;
  title: string;
  subtitle: string;
  badge?: string;
  popular?: boolean;
  bestValue?: boolean;
  elite?: boolean;
  features: string[];
  accentColor: 'default' | 'pink' | 'cyan' | 'amber';
}

const WINGIT_PACKAGES: WingitPackage[] = [
  {
    id: 'pkg_100',
    amount: 100,
    price: 100,
    title: 'Starter Pack',
    subtitle: 'Casual Mingler',
    badge: 'Starter',
    features: [
      '100 Wingits instantly credited',
      'Send up to 5 Secret Wingles',
      'Unlock up to 10 private photos',
      'Never expires in your account',
    ],
    accentColor: 'default',
  },
  {
    id: 'pkg_500',
    amount: 500,
    price: 500,
    title: 'Romance Plus',
    subtitle: 'Most Popular',
    badge: '🔥 Most Popular',
    popular: true,
    features: [
      '500 Wingits instantly credited',
      'Send 25 Secret Wingles',
      'Unlock 50 private photos',
      'Boost profile visibility in Discover',
      'Priority delivery for matches',
    ],
    accentColor: 'pink',
  },
  {
    id: 'pkg_1000',
    amount: 1000,
    price: 1000,
    title: 'Romance Pro',
    subtitle: 'Best Value',
    badge: '✨ Best Value',
    bestValue: true,
    features: [
      '1,000 Wingits instantly credited',
      'Send 50 Secret Wingles + bonus rewards',
      'Unlock unlimited photo albums',
      'High priority Discover placement',
      'VIP chat & connection cues',
    ],
    accentColor: 'cyan',
  },
  {
    id: 'pkg_2000',
    amount: 2000,
    price: 2000,
    title: 'Elite Lover',
    subtitle: 'Ultimate VIP',
    badge: '👑 Ultimate VIP',
    elite: true,
    features: [
      '2,000 Wingits instantly credited',
      'Send 100 Secret Wingles for all your crushes',
      'Top-tier Discover deck placement',
      'Exclusive VIP badge on profile',
      'Dedicated 24/7 priority customer care',
    ],
    accentColor: 'amber',
  },
];

export default function WingitsStore() {
  const { currentUser } = useStore();
  
  // Balance state (falls back to currentUser, synchronizes with server)
  const [balance, setBalance] = useState<number>(currentUser?.wingitsBalance || 0);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Purchasing & Gateway states
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [pendingLedgerId, setPendingLedgerId] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const paymentPopupRef = useRef<Window | null>(null);

  // Custom amount state
  const [customAmount, setCustomAmount] = useState<number>(300);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Usage History state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txFilter, setTxFilter] = useState<'all' | 'purchases' | 'spends'>('all');

  // Synchronize balance from context
  useEffect(() => {
    if (currentUser?.wingitsBalance !== undefined) {
      setBalance(currentUser.wingitsBalance);
    }
  }, [currentUser?.wingitsBalance]);

  // Load transactions and balance on mount
  useEffect(() => {
    getWingitsTransactionsAction().then(txs => {
      setTransactions(txs || []);
    });
    getWingitsBalanceAction().then(bal => {
      if (typeof bal === 'number') setBalance(bal);
    });
  }, []);

  // Refresh balance on demand
  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      const latest = await getWingitsBalanceAction();
      setBalance(latest);
      toast.success('Wingits balance refreshed');
    } catch {
      toast.error('Could not refresh balance');
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  // Payment Verification Handler
  const verifyAndComplete = useCallback(async (ledgerId: string, amount?: number | null) => {
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
          localStorage.removeItem('wm_pending_wingits_url');
        }

        setPendingLedgerId(null);
        setPendingAmount(null);
        setLoadingPkg(null);
        setLoadingCustom(false);

        toast.success(`🎉 Payment Confirmed! ${amount ? `${amount} ` : ''}Wingits added to your account!`, {
          duration: 5000,
        });

        // Immediately update balance and transactions
        const [newBal, txs] = await Promise.all([
          getWingitsBalanceAction(),
          getWingitsTransactionsAction()
        ]);
        setBalance(newBal);
        setTransactions(txs || []);

        // Optional page reload after 1.5s to ensure global store caches sync
        setTimeout(() => {
          window.location.reload();
        }, 1500);

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

  // Window focus listener: immediately verify when user tabs back from Dialog Genie
  useEffect(() => {
    if (!pendingLedgerId) return;

    const onFocus = () => {
      verifyAndComplete(pendingLedgerId, pendingAmount);
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pendingLedgerId, pendingAmount, verifyAndComplete]);

  // Auto-polling every 3 seconds while payment is pending
  useEffect(() => {
    if (!pendingLedgerId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes total

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
        setLoadingPkg(null);
        setLoadingCustom(false);
        return;
      }

      await verifyAndComplete(pendingLedgerId, pendingAmount);
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingLedgerId, pendingAmount, verifyAndComplete]);

  // Purchase Package Action
  const handlePurchase = async (amount: number, pkgId?: string) => {
    if (amount < 100) {
      toast.error('Minimum purchase is 100 Wingits (Rs. 100)');
      return;
    }

    if (pkgId) {
      setLoadingPkg(pkgId);
    } else {
      setLoadingCustom(true);
    }

    try {
      // Connect to Dialog Genie IPG server action
      const result = await buyWingitsAction(amount, amount);

      if (!result.ok || !result.redirectUrl) {
        toast.error(result.error || 'Payment gateway rejected the request. Please try again.');
        setLoadingPkg(null);
        setLoadingCustom(false);
        return;
      }

      if (result.ledgerId) {
        setPendingLedgerId(result.ledgerId);
        setPendingAmount(amount);
        if (typeof window !== 'undefined') {
          localStorage.setItem('wm_pending_wingits_ledger', result.ledgerId);
          localStorage.setItem('wm_pending_wingits_amount', String(amount));
          localStorage.setItem('wm_pending_wingits_url', result.redirectUrl);
        }
      }

      toast.info('Connecting to Dialog Genie IPG...');

      // Direct redirection to Dialog Genie IPG (prevents popup blocker / cross-origin opener issues)
      window.location.href = result.redirectUrl;
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.includes('Server Action') ||
        msg.includes('deployment') ||
        msg.includes('Unexpected token') ||
        msg.includes('not valid JSON')
      ) {
        toast.info('Updating session... Refreshing page.');
        setTimeout(() => window.location.reload(), 500);
        return;
      }
      toast.error(msg || 'Failed to connect to Dialog payment gateway');
    } finally {
      setLoadingPkg(null);
      setLoadingCustom(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'purchases') return tx.amount > 0;
    if (txFilter === 'spends') return tx.amount < 0;
    return true;
  });

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white">
      {/* Background ambient gradient glow spheres */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-cyan-500/15 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute top-96 right-10 w-[400px] h-[400px] bg-pink-500/10 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute top-[700px] left-10 w-[400px] h-[400px] bg-cyan-500/10 blur-[140px] rounded-full" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Top Floating / Sticky Pending Payment Notification */}
        {pendingLedgerId && (
          <div className="mb-8 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-pink-500/15 border-2 border-amber-500/50 p-4 sm:p-5 backdrop-blur-xl shadow-2xl shadow-amber-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center md:text-left">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/40">
                  <span className="absolute h-3 w-3 rounded-full bg-amber-400 animate-ping opacity-75" />
                  <Coins className="h-5 w-5 relative z-10" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <p className="font-semibold text-sm sm:text-base text-amber-200">
                      Dialog Genie Payment in Progress (Rs. {pendingAmount})
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-200/70">
                    {isVerifying ? 'Verifying payment with Dialog Genie...' : 'Complete your purchase in the Dialog payment window.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto justify-center">
                <button
                  onClick={() => verifyAndComplete(pendingLedgerId, pendingAmount)}
                  disabled={isVerifying}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isVerifying && "animate-spin")} />
                  <span>{isVerifying ? 'Checking...' : 'Check Status'}</span>
                </button>

                <button
                  onClick={() => {
                    const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('wm_pending_wingits_url') : null;
                    if (savedUrl) {
                      window.location.href = savedUrl;
                    } else if (typeof window !== 'undefined') {
                      toast.info('Re-checking payment status...');
                      verifyAndComplete(pendingLedgerId, pendingAmount);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium border border-white/15 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Resume Payment</span>
                </button>

                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('wm_pending_wingits_ledger');
                      localStorage.removeItem('wm_pending_wingits_amount');
                      localStorage.removeItem('wm_pending_wingits_url');
                    }
                    setPendingLedgerId(null);
                    setPendingAmount(null);
                    setLoadingPkg(null);
                    setLoadingCustom(false);
                    toast.info('Pending payment dismissed.');
                  }}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-pink-500/10 to-cyan-500/15 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-medium mb-4 backdrop-blur-md shadow-lg shadow-amber-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Official Wingits Store • Dialog Genie IPG</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Power Up Your Romance with{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
              Wingits
            </span>
          </h1>
          <p className="text-neutral-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Wingits are your premium currency on WingleMingle. Send anonymous Secret Wingles,
            unlock private photos, reveal who has a crush on you, and boost your profile.
          </p>
        </div>

        {/* Live Balance Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-[#111111]/90 to-amber-950/25 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl mb-12">
          {/* Subtle decorative glow circle */}
          <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 blur-3xl rounded-full" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 bg-pink-500/15 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20">
                <Coins className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-400/90">
                    Your Available Balance
                  </p>
                  <button
                    onClick={handleRefreshBalance}
                    disabled={isRefreshingBalance}
                    title="Refresh Balance"
                    className="p-1 rounded-full text-neutral-400 hover:text-amber-300 hover:bg-white/5 transition-all"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRefreshingBalance && "animate-spin text-amber-400")} />
                  </button>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                    {balance.toLocaleString()}
                  </span>
                  <span className="text-lg sm:text-xl font-medium text-amber-400">Wingits</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Exchange rate: <span className="text-neutral-200 font-medium">1 Wingit = Rs. 1.00 LKR</span>
                </p>
              </div>
            </div>

            {/* Quick action: Custom amount shortcut */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowCustomModal(!showCustomModal)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>{showCustomModal ? 'Hide Custom Input' : 'Enter Custom Amount'}</span>
              </button>
            </div>
          </div>

          {/* Micro Perks Row */}
          <div className="mt-8 pt-6 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-neutral-300">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <span><strong>Instant Top-up</strong>: Credited immediately</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
              <span><strong>Dialog Genie IPG</strong>: 100% Secure & encrypted</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span><strong>Lifetime Balance</strong>: Never expires</span>
            </div>
          </div>
        </div>

        {/* Collapsible Custom Amount Builder */}
        {showCustomModal && (
          <div className="mb-12 rounded-3xl border border-amber-500/40 bg-[#111111]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Custom Wingits Top-up</h3>
                  <p className="text-xs text-neutral-400">Choose exact amount (Minimum 100 Wingits • 1 Wingit = Rs. 1)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400 font-semibold">
                    Rs.
                  </div>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-black/60 border border-neutral-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white font-bold text-xl transition-all"
                    placeholder="Enter amount (min 100)"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-amber-400 font-semibold text-sm">
                    {customAmount} Wingits
                  </div>
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-neutral-400 self-center mr-1">Quick Select:</span>
                  {[150, 250, 500, 750, 1500, 3000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomAmount(amt)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                        customAmount === amt
                          ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                          : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkout Action */}
              <div className="p-4 rounded-2xl bg-black/40 border border-neutral-800 flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Total Checkout</p>
                  <p className="text-2xl font-black text-amber-400 mt-1">Rs. {customAmount}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Credited: +{customAmount} Wingits</p>
                </div>

                <button
                  type="button"
                  disabled={loadingCustom || customAmount < 100}
                  onClick={() => handlePurchase(customAmount)}
                  className="mt-4 w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loadingCustom ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Pay with Dialog Genie</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4 Tiered Packages Grid */}
        <div className="mb-14">
          <div className="flex flex-col sm:flex-row items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Select a Wingit Package</h2>
              <p className="text-sm text-neutral-400">Choose the best package for your dating goals</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-2 sm:mt-0">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Bank & Dialog Genie Checkout</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WINGIT_PACKAGES.map((pkg) => {
              const isLoading = loadingPkg === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "relative flex flex-col rounded-3xl p-6 transition-all duration-300 backdrop-blur-xl border",
                    pkg.popular
                      ? "bg-gradient-to-b from-pink-500/15 via-[#120815]/90 to-[#0c050e] border-pink-500/60 shadow-2xl shadow-pink-500/20 ring-1 ring-pink-500/50 scale-[1.02] lg:-translate-y-1"
                      : pkg.bestValue
                      ? "bg-gradient-to-b from-cyan-500/15 via-[#081318]/90 to-[#050b0f] border-cyan-500/40 shadow-xl shadow-cyan-500/10 hover:border-cyan-400/70"
                      : pkg.elite
                      ? "bg-gradient-to-b from-amber-500/15 via-[#161208]/90 to-[#0e0a05] border-amber-500/40 shadow-xl shadow-amber-500/10 hover:border-amber-400/70"
                      : "bg-[#111111]/80 border-neutral-800 hover:border-neutral-700 hover:bg-[#161616]"
                  )}
                >
                  {/* Top Badge */}
                  {pkg.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1",
                          pkg.popular
                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30"
                            : pkg.bestValue
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-cyan-500/30"
                            : pkg.elite
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-amber-500/30"
                            : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                        )}
                      >
                        {pkg.popular && <Flame className="w-3.5 h-3.5 fill-current" />}
                        {pkg.bestValue && <Sparkles className="w-3.5 h-3.5" />}
                        {pkg.elite && <Crown className="w-3.5 h-3.5 fill-current" />}
                        <span>{pkg.badge}</span>
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="text-center pt-3 pb-5 border-b border-white/10">
                    <p className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                      {pkg.subtitle}
                    </p>
                    <h3 className="text-xl font-bold text-white mt-1">{pkg.title}</h3>

                    {/* Amount & Icon */}
                    <div className="flex items-center justify-center gap-2 mt-4 mb-2">
                      <div className={cn(
                        "p-2 rounded-2xl flex items-center justify-center",
                        pkg.popular ? "bg-pink-500/20 text-pink-400" :
                        pkg.bestValue ? "bg-cyan-500/20 text-cyan-400" :
                        pkg.elite ? "bg-amber-500/20 text-amber-400" : "bg-neutral-800 text-neutral-300"
                      )}>
                        <Coins className="w-6 h-6" />
                      </div>
                      <span className="text-4xl font-extrabold text-white tracking-tight">
                        {pkg.amount}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">Wingits</p>

                    {/* Price Tag */}
                    <div className="mt-4 inline-flex items-baseline gap-1 px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10">
                      <span className="text-2xl font-black text-white">Rs. {pkg.price}</span>
                      <span className="text-xs text-neutral-400">LKR</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="py-5 space-y-2.5 text-xs sm:text-[13px] text-neutral-300 flex-1">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className={cn(
                          "w-4 h-4 shrink-0 mt-0.5",
                          pkg.popular ? "text-pink-400" :
                          pkg.bestValue ? "text-cyan-400" :
                          pkg.elite ? "text-amber-400" : "text-emerald-400"
                        )} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Buy Button with Gateway Trigger */}
                  <button
                    onClick={() => handlePurchase(pkg.amount, pkg.id)}
                    disabled={isLoading || loadingPkg !== null || loadingCustom}
                    className={cn(
                      "w-full mt-4 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                      pkg.popular
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink-500/25"
                        : pkg.bestValue
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/25"
                        : pkg.elite
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-amber-500/25"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                    )}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Buy Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Matrix: What You Can Do with Wingits */}
        <div className="mb-14 rounded-3xl border border-neutral-800 bg-[#0c0c0c] p-6 sm:p-10 backdrop-blur-xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How Wingits Supercharge Your Experience</h2>
            <p className="text-sm text-neutral-400 mt-2">Spend Wingits anytime to break the ice and make meaningful connections</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-pink-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center mb-4">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-white text-base">Secret Wingles</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 font-semibold">20 Wingits</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Send an anonymous SMS confession to any Sri Lankan mobile number. They get your hint, you earn bonus rewards!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-white text-base">In Your Heart</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold">10 Wingits</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Unlock secret admirers who placed you in their private Heart Bucket. See who has their eye on you!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-white text-base">Photo Unlocks</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-semibold">5 Wingits</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Instantly view private and blurred photo galleries shared by members.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-white text-base">Profile Boost</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">15 Wingits</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Pin your card right to the top of Discover for maximum visibility and 3x more mingles.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Partner Verification Guarantee */}
        <div className="mb-14 rounded-3xl border border-neutral-800 bg-gradient-to-r from-neutral-900/60 to-black p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Bank-Grade 256-Bit Encrypted Payments</h3>
              <p className="text-xs text-neutral-400 max-w-xl mt-0.5">
                Powered by official Dialog Genie IPG (Dialog Axiata PLC). We support Genie, Visa, MasterCard,
                FriMi, and Dialog Mobile Pay. Your financial credentials are never saved on our servers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 font-medium">
              Dialog Genie
            </span>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 font-medium">
              Visa / MC
            </span>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 font-medium">
              FriMi
            </span>
          </div>
        </div>

        {/* Usage & Purchase History */}
        <div className="pt-8 border-t border-neutral-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Transaction History</h2>
              <p className="text-xs sm:text-sm text-neutral-400">Track all purchases and feature spends on your account</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs">
              <button
                onClick={() => setTxFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-medium transition-all",
                  txFilter === 'all' ? "bg-white/15 text-white shadow-sm" : "text-neutral-400 hover:text-white"
                )}
              >
                All ({transactions.length})
              </button>
              <button
                onClick={() => setTxFilter('purchases')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-medium transition-all",
                  txFilter === 'purchases' ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-neutral-400 hover:text-white"
                )}
              >
                Purchases ({transactions.filter(t => t.amount > 0).length})
              </button>
              <button
                onClick={() => setTxFilter('spends')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-medium transition-all",
                  txFilter === 'spends' ? "bg-rose-500/20 text-rose-400 shadow-sm" : "text-neutral-400 hover:text-white"
                )}
              >
                Usage ({transactions.filter(t => t.amount < 0).length})
              </button>
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="rounded-3xl border border-neutral-800 bg-[#111111]/80 overflow-hidden shadow-xl">
              <div className="divide-y divide-neutral-800/80">
                {filteredTransactions.map((tx) => {
                  const isPositive = tx.amount > 0;

                  return (
                    <div
                      key={tx.id}
                      className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "p-2.5 rounded-2xl shrink-0 flex items-center justify-center",
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20"
                          )}
                        >
                          <Coins className="w-5 h-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-sm sm:text-base text-white">
                            {tx.description || (isPositive ? 'Wingits Purchase' : 'Feature Usage')}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {new Date(tx.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {new Date(tx.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {tx.type && (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[10px] uppercase font-bold text-neutral-300">
                                {tx.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "font-black text-base sm:text-lg px-3 py-1 rounded-xl",
                          isPositive
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-rose-400 bg-rose-500/10"
                        )}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} Wingits
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl border border-dashed border-neutral-800 bg-[#0e0e0e]">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">No transactions found</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {txFilter === 'all'
                  ? 'You have not made any Wingits purchases or spends yet.'
                  : txFilter === 'purchases'
                  ? 'No purchases recorded yet.'
                  : 'No usage recorded yet.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
