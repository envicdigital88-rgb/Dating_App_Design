import React from 'react';
import { verifyPaymentAction, checkAndVerifyPendingPaymentAction } from '@/app/actions/payments';
import { CheckCircle2Icon, XCircleIcon, ArrowRightIcon, CoinsIcon } from 'lucide-react';
import Link from 'next/link';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const ledgerId = params.ledgerId as string | undefined;
  const transactionId = params.transactionId as string | undefined;

  // Ledger ID is required
  if (!ledgerId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-4xl bg-cream-deep border border-sand/80 p-8 sm:p-10 text-center shadow-card overflow-hidden">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-berry-500/15 text-berry-400 ring-1 ring-berry-500/30">
            <XCircleIcon className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink mb-3">Invalid Request</h1>
          <p className="text-[15px] leading-relaxed text-ink-soft mb-8">
            Missing transaction details. We could not verify this payment.
          </p>
          <Link
            href="/packages"
            className="inline-flex items-center justify-center w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-berry-500 to-plum-500 text-white font-semibold shadow-lg shadow-berry-500/20 hover:opacity-95 transition-all"
          >
            Return to Packages
          </Link>
        </div>
      </div>
    );
  }

  // Verify the payment (supports direct transactionId or localId lookup)
  const result = (transactionId
    ? await verifyPaymentAction(ledgerId, transactionId)
    : await checkAndVerifyPendingPaymentAction(ledgerId)) as {
    ok: boolean;
    isSecretWingle?: boolean;
    targetPhone?: string;
    error?: string;
    message?: string;
  };

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-4xl bg-cream-deep border border-sand/80 p-8 sm:p-10 text-center shadow-card overflow-hidden">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-berry-500/15 text-berry-400 ring-1 ring-berry-500/30">
            <XCircleIcon className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink mb-3">Payment Failed</h1>
          <p className="text-[15px] leading-relaxed text-ink-soft mb-8">
            {result.error || result.message || 'Your payment could not be verified by Dialog Pay.'}
          </p>
          <div className="space-y-3">
            <Link
              href="/packages"
              className="inline-flex items-center justify-center w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-berry-500 to-plum-500 text-white font-semibold shadow-lg shadow-berry-500/20 hover:opacity-95 transition-all"
            >
              Try Again
            </Link>
            <Link
              href="/discover"
              className="inline-block text-sm text-ink-muted hover:text-white transition-colors"
            >
              Back to Discover
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result.isSecretWingle) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-4xl bg-cream-deep border border-sand/80 p-8 sm:p-10 text-center shadow-card overflow-hidden">
          {/* Top decorative gradient bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#ec4899] via-[#8b2fc9] to-[#0ea5e9]" />

          {/* Glowing Hero Icon */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#ec4899] to-[#8b2fc9] text-white shadow-lg shadow-[#ec4899]/30 ring-4 ring-pink-500/20">
            <span className="text-3xl">🤫</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-3 tracking-tight">
            Secret Wingle Sent! 💌
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-soft mb-6 max-w-sm mx-auto">
            Your payment of <strong>Rs. 50</strong> was successful! Your anonymous SMS is on its way, and both of you have received bonus Wingits!
          </p>

          {/* Rewards Callout Card */}
          <div className="rounded-2xl bg-white/60 dark:bg-white/5 border border-sand/80 p-4 mb-6 text-left space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 text-ink font-medium">
                <CoinsIcon className="w-4 h-4 text-amber-500" />
                <span>Your Reward</span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                +20 Wingits Credited
              </span>
            </div>

            <div className="h-px bg-sand/40 w-full" />

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 text-ink font-medium">
                <span className="text-sm">🎁</span>
                <span>Crush's Gift</span>
              </span>
              <span className="font-bold text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full">
                +20 Wingits Gifted
              </span>
            </div>

            <div className="h-px bg-sand/40 w-full" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Transaction ID</span>
              <span className="font-mono text-ink-soft text-[11px] truncate max-w-[180px]">
                {transactionId}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/secret-wingles"
              className="inline-flex items-center justify-center gap-2 w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-[#ec4899] to-[#8b2fc9] text-white font-semibold shadow-lg shadow-[#ec4899]/25 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all text-base"
            >
              <span>View Secret Wingles History</span>
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/discover"
              className="inline-block text-sm text-ink-muted hover:text-white transition-colors"
            >
              Back to Discover
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-4xl bg-cream-deep border border-sand/80 p-8 sm:p-10 text-center shadow-card overflow-hidden">
        {/* Top decorative gradient bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-berry-500 via-plum-500 to-moss" />

        {/* Success Icon */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-moss/15 text-moss ring-1 ring-moss/30 shadow-lg shadow-moss/10">
          <CheckCircle2Icon className="h-10 w-10 text-moss" />
        </div>

        {/* Title & Description */}
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-3 tracking-tight">
          Payment Confirmed!
        </h1>
        <p className="text-[15px] leading-relaxed text-ink-soft mb-8 max-w-sm mx-auto">
          Your Wingits have been successfully credited to your account. A payment invoice has been sent to your email.
        </p>

        {/* Transaction Summary Card */}
        <div className="rounded-2xl bg-cream/80 border border-sand/80 p-5 mb-8 text-left space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Status</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-moss text-xs bg-moss/10 px-2.5 py-1 rounded-full border border-moss/20">
              <span className="w-1.5 h-1.5 rounded-full bg-moss animate-pulse" />
              Confirmed
            </span>
          </div>

          <div className="h-px bg-sand/60 w-full" />

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-ink-muted text-xs">Transaction ID</span>
            <span className="font-mono text-xs sm:text-sm text-ink bg-cream-deep px-3 py-2 rounded-xl border border-sand/50 break-all select-all">
              {transactionId}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/packages"
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-berry-500 via-plum-500 to-berry-500 text-white font-semibold shadow-lg shadow-berry-500/25 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all text-base"
          >
            <CoinsIcon className="w-5 h-5" />
            <span>Continue to Packages</span>
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/discover"
            className="inline-block text-sm text-ink-muted hover:text-white transition-colors"
          >
            Or start discovering profiles
          </Link>
        </div>
      </div>
    </div>
  );
}
