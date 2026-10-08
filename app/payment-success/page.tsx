import React from 'react';
import { verifyPaymentAction } from '@/app/actions/payments';
import { CheckCircle2Icon, XCircleIcon} from 'lucide-react';
import Link from 'next/link';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const ledgerId = searchParams.ledgerId as string | undefined;
  const transactionId = searchParams.transactionId as string | undefined;

  // Dialog redirects with transactionId
  if (!ledgerId || !transactionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="text-center p-8 bg-white rounded-3xl shadow-card max-w-md w-full">
          <XCircleIcon className="w-16 h-16 text-berry-500 mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-ink mb-4">Invalid Request</h1>
          <p className="text-ink-soft mb-8">Missing transaction details.</p>
          <Link href="/packages" className="inline-block bg-primary text-white font-medium py-3 px-8 rounded-full">
            Return to Packages
          </Link>
        </div>
      </div>
    );
  }

  // Verify the payment
  const result = await verifyPaymentAction(ledgerId, transactionId);

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="text-center p-8 bg-white rounded-3xl shadow-card max-w-md w-full">
          <XCircleIcon className="w-16 h-16 text-berry-500 mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-ink mb-4">Payment Failed</h1>
          <p className="text-ink-soft mb-8">{result.error || 'Your payment could not be verified.'}</p>
          <Link href="/packages" className="inline-block bg-primary text-white font-medium py-3 px-8 rounded-full">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="text-center p-8 bg-white rounded-3xl shadow-card max-w-md w-full">
        <CheckCircle2Icon className="w-20 h-20 text-moss mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-ink mb-4">Payment Successful!</h1>
        <p className="text-ink-soft mb-6">
          Your account has been credited. A receipt has been sent to your email.
        </p>
        <div className="bg-sand/30 rounded-2xl p-4 mb-8 text-left text-sm text-ink-muted">
          <p><strong>Transaction ID:</strong> {transactionId}</p>
        </div>
        <Link href="/packages" className="inline-block bg-moss text-white font-medium py-3 px-8 rounded-full hover:bg-moss-light transition-colors">
          Continue to App
        </Link>
      </div>
    </div>
  );
}
