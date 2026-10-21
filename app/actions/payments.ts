'use server';

import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { GenieError, createGenieSignature, genieRequest, getGenieConfig, getGeniePaymentUrl } from '@/lib/genie';
import { checkPendingGeniePayment, verifyGeniePayment } from '@/lib/payment-verification';

async function getAppUrl(): Promise<string> {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === 'https:' && !url.username && !url.password &&
          !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
        return url.origin;
      }
    } catch {}
    throw new GenieError('NEXT_PUBLIC_APP_URL must be the public HTTPS website registered with Dialog Genie.');
  }
  return 'https://www.winglemingle.com';
}

export type PaymentInitResult =
  | { ok: true; redirectUrl: string; ledgerId: string }
  | { ok: false; error: string };

async function initializePayment(input: {
  userId: string;
  amountLKR: number;
  wingitsCredited: number;
  transactionReference?: string;
  secretWingle?: boolean;
}): Promise<PaymentInitResult> {
  try {
    // Validate configuration before creating a ledger or sending a credential.
    const { appKey } = getGenieConfig();
    const appUrl = await getAppUrl();
    const ledger = await db.orm.public.TransactionLedger.create({
      userId: input.userId,
      amountLKR: input.amountLKR,
      wingitsCredited: input.wingitsCredited,
      status: 'PENDING',
      ...(input.transactionReference ? { transactionReference: input.transactionReference } : {}),
    });
    const amount = Math.round(input.amountLKR * 100);
    const data = await genieRequest('/public/transactions', {
      method: 'POST',
      body: {
        amount,
        currency: 'LKR',
        localId: ledger.id,
        redirectUrl: appUrl + '/payment-success?ledgerId=' + encodeURIComponent(ledger.id) +
          (input.secretWingle ? '&type=secret_wingle' : ''),
        webhook: appUrl + '/api/webhooks/dialog',
        signature: createGenieSignature(amount, appKey),
        apiVersion: '2.0',
        appVersion: 'geniebiz-connect-php',
        signMethod: 'sha1',
      },
    });
    const redirectUrl = getGeniePaymentUrl(data);
    // Poll the exact provider transaction; list APIs may ignore a localId filter.
    if (typeof data.id === 'string' && data.id) {
      const transactionReference = input.secretWingle && input.transactionReference
        ? JSON.stringify({ ...JSON.parse(input.transactionReference), gatewayTransactionId: data.id })
        : data.id;
      await db.orm.public.TransactionLedger.where({ id: ledger.id }).update({ transactionReference });
    }
    return { ok: true, redirectUrl, ledgerId: ledger.id };
  } catch (error) {
    if (error instanceof GenieError) return { ok: false, error: error.message };
    console.error('Payment initialization could not complete.');
    return { ok: false, error: 'Could not initialize the payment. Please try again shortly.' };
  }
}

export async function buyWingitsAction(packageAmountLKR: number, wingitsAmount: number): Promise<PaymentInitResult> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };
  // One Wingit costs LKR 1. Never accept a separate client-controlled credit value.
  if (!Number.isSafeInteger(packageAmountLKR) || packageAmountLKR < 100 ||
      !Number.isSafeInteger(packageAmountLKR * 100) || wingitsAmount !== packageAmountLKR) {
    return { ok: false, error: 'Enter a whole Wingits amount of at least 100 (1 Wingit = LKR 1).' };
  }
  return initializePayment({
    userId: session.userId as string,
    amountLKR: packageAmountLKR,
    wingitsCredited: packageAmountLKR,
  });
}

export async function initiateSecretWinglePaymentAction(
  targetPhone: string,
  message: string,
  options?: {
    recipientName?: string;
    senderName?: string;
    isAnonymous?: boolean;
    language?: 'en' | 'si' | 'ta';
  }
): Promise<PaymentInitResult> {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };
  const userId = session.userId as string;

  if (!targetPhone?.trim() || !message?.trim()) {
    return { ok: false, error: 'Phone number and message are required' };
  }

  const { formatNotifyPhoneNumber } = await import('@/lib/notify');
  const formattedPhone = formatNotifyPhoneNumber(targetPhone);
  if (!formattedPhone || formattedPhone.length < 9) {
    return { ok: false, error: 'Please enter a valid mobile number' };
  }

  const currentUser = await db.orm.public.User.where({ id: userId }).first();
  if (!currentUser) return { ok: false, error: 'User not found' };

  if (currentUser.phone && formatNotifyPhoneNumber(currentUser.phone) === formattedPhone) {
    return { ok: false, error: 'You cannot send a Secret Wingle to your own phone number!' };
  }



  const AMOUNT_LKR = 50;
  const WINGITS_REWARD = 20;

  const resolvedRecipientName = options?.recipientName?.trim() || options?.senderName?.trim() || null;

  // Metadata saved in transactionReference during PENDING state
  const metadata = JSON.stringify({
    type: 'secret_wingle',
    targetPhone: formattedPhone,
    message: message.trim(),
    recipientName: resolvedRecipientName
  });

  return initializePayment({
    userId,
    amountLKR: AMOUNT_LKR,
    wingitsCredited: WINGITS_REWARD,
    transactionReference: metadata,
    secretWingle: true,
  });
}

export async function checkAndVerifyPendingPaymentAction(ledgerId: string) {
  return checkPendingGeniePayment(ledgerId);
}

export async function verifyPaymentAction(ledgerId: string, transactionId: string) {
  return verifyGeniePayment(ledgerId, transactionId);
}
