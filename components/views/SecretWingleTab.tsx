'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SendIcon,
  Sparkles,
  Lock,
  Unlock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquare,
  History,
  Inbox,
  Coins
} from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useStore } from '@/lib/contexts/StoreContext';
import { useRouter } from 'next/navigation';
import { getSentSecretWinglesAction } from '@/app/actions/wingle';
import { initiateSecretWinglePaymentAction, checkAndVerifyPendingPaymentAction } from '@/app/actions/payments';
import { buildSecretWingleSms } from '@/lib/notify';

interface SentSecretWingle {
  id: string;
  targetPhone: string;
  message: string;
  createdAt: string;
  unlocked: boolean;
}

export function SecretWingleTab() {
  const { secretWinglesReceived, currentUser, ensureConversation } = useStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'compose' | 'received' | 'sent'>('compose');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Recipient / Crush name option
  const [recipientName, setRecipientName] = useState('');

  // Payment auto-detection states
  const [pendingLedgerId, setPendingLedgerId] = useState<string | null>(null);
  const [pendingPaymentUrl, setPendingPaymentUrl] = useState<string | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  const smsPreview = buildSecretWingleSms({
    recipientName,
    appUrl: 'https://www.winglemingle.com'
  });

  const [sentList, setSentList] = useState<SentSecretWingle[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);

  const SECRET_WINGLE_PRICE_LKR = 50;

  const receivedWingles = secretWinglesReceived();

  const paymentPopupRef = useRef<Window | null>(null);

  // Helper to verify and finalize pending payment
  const verifyAndCompletePending = async (ledgerId: string) => {
    try {
      setIsCheckingPayment(true);
      const check = await checkAndVerifyPendingPaymentAction(ledgerId);
      if (check.ok) {
        // Auto-close Dialog payment popup window so user never sees the blank/forbidden page
        if (paymentPopupRef.current && !paymentPopupRef.current.closed) {
          try {
            paymentPopupRef.current.close();
          } catch {}
          paymentPopupRef.current = null;
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('wm_pending_secret_wingle_ledger');
          localStorage.removeItem('wm_pending_secret_wingle_url');
        }
        setPendingLedgerId(null);
        setPendingPaymentUrl(null);
        toast.success('🎉 Payment Confirmed! Secret Wingle dispatched & 20 Wingits awarded!');
        setPhone('');
        setMessage('');
        setRecipientName('');
        const sentRes = await getSentSecretWinglesAction();
        if (sentRes.ok && sentRes.data) {
          setSentList(sentRes.data as SentSecretWingle[]);
        }
        setActiveTab('sent');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Check error:', err);
      return false;
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Restore pending ledger from localStorage if user reloaded/returned
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLedgerId = localStorage.getItem('wm_pending_secret_wingle_ledger');
      const savedUrl = localStorage.getItem('wm_pending_secret_wingle_url');
      if (savedLedgerId) {
        setPendingLedgerId(savedLedgerId);
        setPendingPaymentUrl(savedUrl);
        // Immediately try checking
        verifyAndCompletePending(savedLedgerId);
      }
    }
  }, []);

  // Window focus listener: when user switches back from Dialog tab, check automatically
  useEffect(() => {
    if (!pendingLedgerId) return;

    const onFocus = () => {
      verifyAndCompletePending(pendingLedgerId);
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pendingLedgerId]);

  // Load sent secret wingles
  useEffect(() => {
    async function loadSent() {
      setLoadingSent(true);
      try {
        const res = await getSentSecretWinglesAction();
        if (res.ok && res.data) {
          setSentList(res.data as SentSecretWingle[]);
        }
      } catch (e) {
        console.error('Failed to load sent secret wingles', e);
      } finally {
        setLoadingSent(false);
      }
    }
    loadSent();
  }, []);

  // Auto-polling for payment confirmation while pendingLedgerId is active
  useEffect(() => {
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
          localStorage.removeItem('wm_pending_secret_wingle_ledger');
          localStorage.removeItem('wm_pending_secret_wingle_url');
        }
        setPendingLedgerId(null);
        setPendingPaymentUrl(null);
        return;
      }

      await verifyAndCompletePending(pendingLedgerId);
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingLedgerId]);

  const handleSendClick = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error('Please enter a recipient phone number');
      return;
    }
    if (cleanPhone.replace(/[^0-9]/g, '').length < 9) {
      toast.error('Please enter a valid mobile number (e.g. 077 123 4567)');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a secret message');
      return;
    }

    setLoading(true);

    try {
      const res = await initiateSecretWinglePaymentAction(cleanPhone, message, {
        recipientName: recipientName.trim() || undefined
      });

      if (res.ok && res.redirectUrl) {
        toast.info('Connecting to Genie payment gateway...');
        if (res.ledgerId) {
          setPendingLedgerId(res.ledgerId);
          setPendingPaymentUrl(res.redirectUrl);
          if (typeof window !== 'undefined') {
            localStorage.setItem('wm_pending_secret_wingle_ledger', res.ledgerId);
            localStorage.setItem('wm_pending_secret_wingle_url', res.redirectUrl);
          }
        }
        const win = window.open(
          res.redirectUrl,
          'GeniePaymentWindow',
          'width=550,height=750,left=250,top=100'
        );
        paymentPopupRef.current = win;
        if (!win) {
          window.location.href = res.redirectUrl;
        }
      } else {
        toast.error(res.error || 'Failed to connect to Genie payment gateway');
      }
    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const promptSuggestions = [
    "Hey, I've had a crush on you for a while... ✨",
    "You've caught my eye every single time I see you! 🌹",
    "Guess who thinks about you constantly? 😉",
    "Coffee with a secret admirer sometime? ☕"
  ];

  const maskPhone = (raw: string) => {
    const clean = raw.replace(/[^0-9]/g, '');
    if (clean.length >= 7) {
      return `+${clean.slice(0, 4)} ••• •${clean.slice(-3)}`;
    }
    return raw;
  };

  return (
    <Page>
      <PageHeader title="Secret Wingles" />

      <div className="flex-1 overflow-y-auto px-4 py-6 flex justify-center">
        <div className="w-full max-w-xl flex flex-col space-y-6">

          {/* Navigation Tabs */}
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/60 dark:border-white/10">
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'compose'
                  ? 'bg-white dark:bg-[#1f1d36] text-[#ec4899] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <SendIcon className="w-3.5 h-3.5" />
              <span>Send Secretly</span>
            </button>

            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'received'
                  ? 'bg-white dark:bg-[#1f1d36] text-[#ec4899] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Received</span>
              {receivedWingles.length > 0 && (
                <span className="bg-[#ec4899] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {receivedWingles.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'sent'
                  ? 'bg-white dark:bg-[#1f1d36] text-[#ec4899] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Sent History</span>
              {sentList.length > 0 && (
                <span className="bg-gray-200 dark:bg-white/20 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {sentList.length}
                </span>
              )}
            </button>
          </div>

          {/* ────────── TAB 1: COMPOSE / SEND ────────── */}
          {activeTab === 'compose' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8b2fc9]/20 via-[#ec4899]/15 to-[#0ea5e9]/10 border border-white/10 p-6 sm:p-8">
                <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#ec4899] to-[#8b2fc9] flex items-center justify-center text-white shadow-lg shadow-[#ec4899]/25 mb-1">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white">
                    Have a secret crush? 🤫
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
                    Send them an anonymous SMS. When they open WingleMingle with their phone number, your identity will be revealed!
                  </p>
                </div>
              </div>

              {/* Compose Card */}
              <div className="bg-white dark:bg-[#0e0c22] border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">

                {/* Recipient Mobile Number */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#ec4899]" />
                      Their Mobile Number (යවන කෙනාගේ Number එක)
                    </label>
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Anonymous SMS
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="077 123 4567 or +94 77 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#ec4899]/50 focus:border-[#ec4899] transition-all outline-none text-sm font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Works with any Sri Lankan Dialog, Mobitel, Airtel, or Hutch number.
                  </p>
                </div>

                {/* Recipient / Crush's Name (Optional) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#ec4899]" />
                      Their Name / Crush&apos;s Name (Optional)
                    </label>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {recipientName.trim() ? `Greeting: "Hey ${recipientName.trim()}"` : 'Anonymous Greeting'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Smriti, Hiruni, Kasun... (leave empty for generic greeting)"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      maxLength={30}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#ec4899]/50 focus:border-[#ec4899] transition-all outline-none text-xs font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                    💡 මැසේජ් එක යන කෙනාගේ නම (Crush&apos;s Name) දැම්මොත් SMS එකේ <b>&quot;Hey {recipientName.trim() || 'Smriti'}&quot;</b> කියලා එයාටම කතා කරලා මැසේජ් එක යනවා. <b>ඔයාගේ නම 100% Anonymous</b> රහසක් විදියටම තියෙනවා!
                  </p>
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#0ea5e9]" />
                      Your Secret Message
                    </label>
                    <span className={`text-[11px] font-medium ${message.length > 250 ? 'text-red-500' : 'text-gray-400'}`}>
                      {message.length} / 250
                    </span>
                  </div>

                  <textarea
                    placeholder="Write something sweet, playful, or intriguing..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 250))}
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#ec4899]/50 focus:border-[#ec4899] transition-all outline-none resize-none text-sm leading-relaxed"
                  />

                  {/* Suggestion Chips */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Need inspiration? Tap to use:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {promptSuggestions.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMessage(prompt)}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-[#ec4899]/10 hover:text-[#ec4899] text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-white/5 transition-colors text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ────────── LIVE SMS PREVIEW CARD ────────── */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <span>📱 Real SMS Preview (English • සිංහල • தமிழ்)</span>
                    </span>
                  </div>

                  <div className="relative rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 p-3.5 border border-gray-200/80 dark:border-white/10 shadow-inner space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 pb-1 border-b border-gray-200/50 dark:border-white/5">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">From: WingleMingle</span>
                      <span>•</span>
                      <span>To: {phone || 'Recipient Number'}</span>
                    </div>

                    <div className="bg-white dark:bg-[#15122e] rounded-2xl p-3 border border-pink-500/20 shadow-sm">
                      <p className="text-xs text-gray-900 dark:text-white leading-relaxed whitespace-pre-line font-medium">
                        {smsPreview}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 space-y-3">
                  {pendingLedgerId && (
                    <div className="bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-blue-500/15 border-2 border-pink-500/30 rounded-3xl p-5 text-xs space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-4 h-4 text-pink-500 animate-spin" />
                          <span>Dialog Genie Payment in Progress...</span>
                        </span>
                        <span className="text-[10px] bg-pink-500/20 text-pink-600 dark:text-pink-300 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Auto-Verifying
                        </span>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <span>💡 Dialog Test Mode Notice:</span>
                        </p>
                        <p className="leading-relaxed">
                          Dialog test window එකේ OTP දැමීමෙන් පසු <code>{`{"message": "Forbidden"}`}</code> ලෙස දිස්වුවද ගෙවීම සාර්ථකව සම්පූර්ණ වී ඇත! පහත <b>&quot;Verify &amp; Send Secret Wingle&quot;</b> button එක click කරන්න.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!pendingLedgerId) return;
                            const ok = await verifyAndCompletePending(pendingLedgerId);
                            if (!ok) {
                              toast.info('Payment is still pending on Dialog. Please finish the payment window or try again in a few seconds.');
                            }
                          }}
                          loading={isCheckingPayment}
                          className="w-full py-3 bg-gradient-to-r from-[#ec4899] to-[#8b2fc9] text-white font-semibold text-xs shadow-md hover:opacity-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Verify &amp; Send Secret Wingle Now
                        </Button>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {pendingPaymentUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const win = window.open(pendingPaymentUrl, 'GeniePaymentWindow', 'width=550,height=750,left=250,top=100');
                                paymentPopupRef.current = win;
                              }}
                              className="w-full sm:w-auto text-xs py-2 whitespace-nowrap"
                            >
                              Open Dialog Tab
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (paymentPopupRef.current && !paymentPopupRef.current.closed) {
                                try {
                                  paymentPopupRef.current.close();
                                } catch {}
                                paymentPopupRef.current = null;
                              }
                              if (typeof window !== 'undefined') {
                                localStorage.removeItem('wm_pending_secret_wingle_ledger');
                                localStorage.removeItem('wm_pending_secret_wingle_url');
                              }
                              setPendingLedgerId(null);
                              setPendingPaymentUrl(null);
                            }}
                            className="text-xs py-2 text-gray-400 hover:text-red-400"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full py-4 text-base font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#ec4899]/25 bg-gradient-to-r from-[#ec4899] to-[#8b2fc9] text-white hover:opacity-95"
                    onClick={handleSendClick}
                    loading={loading}
                    disabled={loading || !phone.trim() || !message.trim()}
                  >
                    <SendIcon className="w-4 h-4" />
                    <span>Send Secret Wingle</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold ml-1">
                      Rs. {SECRET_WINGLE_PRICE_LKR}
                    </span>
                  </Button>

                  <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5 rounded-2xl p-3.5 text-[11px] space-y-2 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-between text-gray-700 dark:text-gray-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#ec4899]" />
                        <span>Genie Payment Gateway</span>
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">Rs. {SECRET_WINGLE_PRICE_LKR} LKR</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>Wingits Rewards</span>
                      </span>
                      <span>+20 for you & +20 for them</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-0.5 leading-normal">
                      🔒 An anonymous SMS is sent immediately after successful Genie payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────── TAB 2: RECEIVED WINGLES ────────── */}
          {activeTab === 'received' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {!currentUser?.phone && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
                  <span>💡 Link your mobile number to ensure all Secret Wingles sent to your phone are revealed!</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push('/settings')}
                    className="shrink-0 text-xs py-1 px-3 border-amber-500/30"
                  >
                    Settings
                  </Button>
                </div>
              )}

              {receivedWingles.length === 0 ? (
                <div className="bg-white dark:bg-[#0e0c22] border border-gray-200/80 dark:border-white/10 rounded-3xl p-10 text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-full bg-[#ec4899]/10 text-[#ec4899] flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    No Secret Wingles yet
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    When someone sends a Secret Wingle to your phone number, it will show up right here unlocked!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>Someone likes you!</span>
                      <span className="bg-[#ec4899]/15 text-[#ec4899] text-xs font-bold px-2 py-0.5 rounded-full">
                        {receivedWingles.length}
                      </span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {receivedWingles.map((sw) => (
                      <div
                        key={sw.id}
                        className="bg-white dark:bg-[#0e0c22] border border-[#ec4899]/30 rounded-3xl p-5 shadow-sm relative overflow-hidden space-y-4"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#ec4899]/20 to-transparent rounded-bl-full pointer-events-none" />

                        {/* Message Quote */}
                        <div className="relative z-10">
                          <p className="text-gray-900 dark:text-white font-medium text-base sm:text-lg leading-snug">
                            "{sw.message}"
                          </p>
                        </div>

                        {/* Sender Details */}
                        <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#ec4899] to-[#8b2fc9] flex items-center justify-center text-white overflow-hidden flex-shrink-0">
                              {sw.sender?.photo ? (
                                <img
                                  src={sw.sender.photo}
                                  alt={sw.sender.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Heart className="w-5 h-5 fill-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                {sw.sender?.name || 'A secret admirer'}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {sw.sender ? `${sw.sender.age} yrs • ${sw.sender.location}` : 'Identity revealed upon sign in'}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons for Recipient */}
                          <div className="flex items-center gap-2">
                            {sw.sender?.id && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/profile/${sw.sender!.id}`)}
                                  className="text-xs py-1.5 px-3 rounded-xl border-gray-200 dark:border-white/10"
                                >
                                  View Profile
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const conv = ensureConversation(sw.sender!.id);
                                    router.push(`/mingles/${conv.id}`);
                                  }}
                                  className="text-xs py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#8b2fc9] text-white flex items-center gap-1.5 shadow-sm shadow-[#ec4899]/20"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Chat with Admirer</span>
                                </Button>
                              </>
                            )}

                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full shrink-0">
                              <Unlock className="w-3 h-3" /> Unlocked
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────── TAB 3: SENT HISTORY ────────── */}
          {activeTab === 'sent' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {loadingSent ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading sent Secret Wingles...</div>
              ) : sentList.length === 0 ? (
                <div className="bg-white dark:bg-[#0e0c22] border border-gray-200/80 dark:border-white/10 rounded-3xl p-10 text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-full bg-blue-500/10 text-[#0ea5e9] flex items-center justify-center">
                    <History className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    No sent Secret Wingles yet
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    When you send a Secret Wingle, you can track whether it was delivered via SMS and unlocked right here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('compose')}
                    className="mt-2"
                  >
                    Send your first Secret Wingle
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentList.map((sw) => (
                    <div
                      key={sw.id}
                      className="bg-white dark:bg-[#0e0c22] border border-gray-200/80 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {maskPhone(sw.targetPhone)}
                        </span>

                        {sw.unlocked ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Opened by recipient
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Delivered via SMS
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                        "{sw.message}"
                      </p>

                      <p className="text-[10px] text-gray-400">
                        Sent on {new Date(sw.createdAt).toLocaleDateString()} at{' '}
                        {new Date(sw.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Page>
  );
}
