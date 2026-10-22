import 'server-only';

import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { genieRequest } from '@/lib/genie';
import { sendInvoiceEmail } from '@/lib/invoice-email';

type Ledger = NonNullable<Awaited<ReturnType<typeof db.orm.public.TransactionLedger.first>>>;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type GenieTransaction = Record<string, any>;
type SecretMetadata = {
  type: 'secret_wingle';
  targetPhone: string;
  message: string;
  recipientName?: string | null;
  senderName?: string | null;
  gatewayTransactionId?: string;
};

export type PaymentVerificationResult = {
  ok: boolean;
  error?: string;
  pending?: boolean;
  message?: string;
  state?: string;
  retryable?: boolean;
  isSecretWingle?: boolean;
  targetPhone?: string;
  invoiceSent?: boolean;
};

class PaymentMismatch extends Error {}

function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(value);
}

function secretMetadata(ledger: Ledger): SecretMetadata | null {
  if (!ledger.transactionReference?.startsWith('{')) return null;
  try {
    const value: unknown = JSON.parse(ledger.transactionReference);
    if (!value || typeof value !== 'object') return null;
    const data = value as Record<string, unknown>;
    if (data.type !== 'secret_wingle' || typeof data.targetPhone !== 'string' || typeof data.message !== 'string') {
      return null;
    }
    return data as SecretMetadata;
  } catch {
    return null;
  }
}

function storedTransactionId(ledger: Ledger): string | null {
  return secretMetadata(ledger)?.gatewayTransactionId || ledger.transactionReference;
}

function success(ledger: Ledger): PaymentVerificationResult {
  const metadata = secretMetadata(ledger);
  return {
    ok: true,
    // Legacy Secret Wingle ledgers replaced their metadata with the gateway ID.
    isSecretWingle: !!metadata || ledger.amountLKR === 50,
    ...(metadata ? { targetPhone: metadata.targetPhone } : {}),
  };
}

function completedState(transaction: GenieTransaction): PaymentVerificationResult | null {
  const state = String(transaction.state || transaction.status || '').toUpperCase();
  // These are the completed states used by Dialog's official WooCommerce plugin.
  if (state === 'CONFIRMED' || state === 'AUTHORIZED') return null;
  if (state === 'CANCELLED' || state === 'FAILED' || state === 'EXPIRED') {
    return { ok: false, error: 'The payment was cancelled, failed, or expired.', state };
  }
  return { ok: false, pending: true, message: 'Waiting for Dialog Genie payment confirmation.', state };
}

function validateTransaction(ledger: Ledger, transaction: GenieTransaction, transactionId: string) {
  if (transaction.id !== transactionId || transaction.localId !== ledger.id) {
    throw new PaymentMismatch('The payment reference does not match this purchase.');
  }
  const expectedAmount = Math.round(ledger.amountLKR * 100);
  if (
    transaction.currency !== 'LKR' ||
    !Number.isSafeInteger(transaction.amount) ||
    transaction.amount !== expectedAmount ||
    !Number.isSafeInteger(expectedAmount) || expectedAmount <= 0
  ) {
    throw new PaymentMismatch('The payment amount or currency does not match this purchase.');
  }
  const metadata = secretMetadata(ledger);
  const validWingitPurchase =
    Number.isSafeInteger(ledger.amountLKR) &&
    Number.isSafeInteger(ledger.wingitsCredited) &&
    ((ledger.amountLKR >= 100 && ledger.wingitsCredited >= 20 && ledger.amountLKR === ledger.wingitsCredited * 5) ||
     (ledger.amountLKR >= 100 && ledger.wingitsCredited === ledger.amountLKR));
  const validTerms = metadata
    ? ledger.amountLKR === 50 && ledger.wingitsCredited === 20
    : validWingitPurchase;
  if (ledger.status !== 'SUCCESS' && !validTerms) throw new PaymentMismatch('This purchase has invalid payment details.');
}

async function creditWingits(tx: Transaction, userId: string, amount: number) {
  // An SQL expression increments the current balance even if another purchase settles concurrently.
  const plan = tx.sql.public.user
    .update((fields, fns) => ({
      wingitsBalance: fns.raw`${fields.wingitsBalance} + ${amount}`.returns('pg/int4@1'),
    }))
    .where((fields, fns) => fns.eq(fields.id, userId))
    .build();
  const { affectedRows } = await tx.execute(plan);
  if (affectedRows !== 1) throw new PaymentMismatch('The account for this purchase is unavailable.');
}

async function settlePayment(ledgerId: string, transactionId: string, transaction: GenieTransaction) {
  const unfinished = completedState(transaction);
  if (unfinished) return unfinished;

  const outcome = await db.transaction(async (tx) => {
    const ledger = await tx.orm.public.TransactionLedger.where({ id: ledgerId }).first();
    if (!ledger) throw new PaymentMismatch('Purchase not found.');
    validateTransaction(ledger, transaction, transactionId);
    if (ledger.status === 'SUCCESS') {
      if (storedTransactionId(ledger) !== transactionId) {
        throw new PaymentMismatch('A different payment already completed this purchase.');
      }
      return { result: success(ledger), newlySettled: false };
    }

    const metadata = secretMetadata(ledger);
    // Keep Secret Wingle metadata so duplicate confirmations retain their original result.
    const reference = metadata ? JSON.stringify({ ...metadata, gatewayTransactionId: transactionId }) : transactionId;
    const claim = tx.sql.public.transactionLedger
      .update({ status: 'SUCCESS', transactionReference: reference })
      .where((fields, fns) => fns.eq(fields.id, ledgerId))
      .where((fields, fns) => fns.eq(fields.status, 'PENDING'))
      .build();
    const { affectedRows } = await tx.execute(claim);
    if (affectedRows !== 1) {
      // A concurrent browser return, poll, or webhook may have won the same claim.
      const current = await tx.orm.public.TransactionLedger.where({ id: ledgerId }).first();
      if (current?.status === 'SUCCESS' && storedTransactionId(current) === transactionId) {
        return { result: success(current), newlySettled: false };
      }
      throw new PaymentMismatch('This purchase can no longer be completed.');
    }

    const sender = await tx.orm.public.User.where({ id: ledger.userId }).first();
    if (!sender) throw new PaymentMismatch('The account for this purchase is unavailable.');
    await creditWingits(tx, sender.id, ledger.wingitsCredited);
    await tx.orm.public.WingitsTransaction.create({
      id: crypto.randomUUID(),
      userId: sender.id,
      amount: ledger.wingitsCredited,
      type: metadata ? 'bonus' : 'purchase',
      description: metadata
        ? 'Secret Wingle sender bonus (+20 Wingits)'
        : `Purchased ${ledger.wingitsCredited} Wingits (LKR ${ledger.amountLKR})`,
    });

    let existingRecipientId: string | null = null;
    if (metadata) {
      const { getPhoneVariants } = await import('@/lib/notify');
      const secretWingle = await tx.orm.public.SecretWingle.create({
        senderId: ledger.userId,
        targetPhone: metadata.targetPhone,
        message: metadata.message,
      });
      const recipient = await tx.orm.public.User
        .where(user => user.phone.in(getPhoneVariants(metadata.targetPhone)))
        .first();
      if (recipient && recipient.id !== sender.id) {
        existingRecipientId = recipient.id;
        await creditWingits(tx, recipient.id, 20);
        await tx.orm.public.WingitsTransaction.create({
          id: crypto.randomUUID(),
          userId: recipient.id,
          amount: 20,
          type: 'bonus',
          description: `Secret Wingle recipient bonus for ${secretWingle.id} (+20 Wingits)`,
        });
        await tx.orm.public.Notification.create({
          userId: recipient.id,
          type: 'secret_wingle',
          title: 'Secret Wingle Received! 🤫🎁',
          body: 'Someone sent you a Secret Wingle and gifted you 20 free Wingits! Check your Secret Wingles tab.',
          href: '/secret-wingles',
        });
      }
    }

    return {
      result: success({ ...ledger, transactionReference: reference }),
      newlySettled: true,
      ledger,
      metadata,
      existingRecipientId,
      customerEmail: sender.email,
      customerName: sender.name,
    };
  });

  // External notifications run once, after the atomic credit has committed.
  if (outcome.newlySettled && outcome.ledger) {
    outcome.result.invoiceSent = false;
    try {
      const invoice = await sendInvoiceEmail({
        receiptNumber: outcome.ledger.id,
        transactionId,
        customerEmail: outcome.customerEmail,
        customerName: outcome.customerName,
        amount: outcome.ledger.amountLKR,
        wingitsCredited: outcome.ledger.wingitsCredited,
        date: outcome.ledger.createdAt.toString(),
        purchaseType: outcome.metadata ? 'secret_wingle' : 'wingits',
      });
      outcome.result.invoiceSent = invoice.ok;
      if (!invoice.ok) console.error('Payment receipt could not be delivered.');
    } catch {
      console.error('Payment receipt could not be delivered.');
    }

    if (outcome.metadata) {
      const metadata = outcome.metadata;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.winglemingle.com';
      try {
        const { buildSecretWingleSms, sendNotifySms } = await import('@/lib/notify');
        await sendNotifySms({
          to: metadata.targetPhone,
          message: buildSecretWingleSms({
            recipientName: metadata.recipientName || metadata.senderName,
            appUrl,
          }),
        });
      } catch {
        console.error('Secret Wingle SMS could not be sent after payment.');
      }
      if (outcome.existingRecipientId) {
        try {
          const { sendPushNotificationAction } = await import('@/app/actions/push');
          await sendPushNotificationAction(outcome.existingRecipientId, {
            title: 'Secret Wingle Received! 🤫🎁',
            body: 'Someone sent you a Secret Wingle and gifted you 20 free Wingits!',
            url: '/secret-wingles',
          });
          const { pusherServer } = await import('@/lib/pusher');
          await pusherServer.trigger(`private-user-${outcome.existingRecipientId}`, 'state-changed', {});
        } catch {
          console.error('Secret Wingle recipient notification could not be delivered.');
        }
      }
    }
  }
  return outcome.result;
}

async function ownedLedger(ledgerId: string): Promise<Ledger | null> {
  const session = await getSession();
  if (!session?.userId || !validId(ledgerId)) return null;
  return db.orm.public.TransactionLedger.where({ id: ledgerId, userId: session.userId as string }).first();
}

function verificationError(error: unknown): PaymentVerificationResult {
  if (error instanceof PaymentMismatch) return { ok: false, error: error.message };
  // Database and external-service errors may include credentials or customer data.
  console.error('Payment verification could not complete.');
  return { ok: false, retryable: true, error: 'Could not verify the payment. Please try again shortly.' };
}

export async function verifyGeniePayment(ledgerId: string, transactionId: string): Promise<PaymentVerificationResult> {
  try {
    if (!validId(transactionId)) return { ok: false, error: 'Invalid payment reference.' };
    const ledger = await ownedLedger(ledgerId);
    if (!ledger) return { ok: false, error: 'Purchase not found or access denied.' };
    const transaction = await genieRequest(`/public/transactions/${encodeURIComponent(transactionId)}`);
    return await settlePayment(ledger.id, transactionId, transaction);
  } catch (error) {
    return verificationError(error);
  }
}

export async function checkPendingGeniePayment(ledgerId: string): Promise<PaymentVerificationResult> {
  try {
    const ledger = await ownedLedger(ledgerId);
    if (!ledger) return { ok: false, error: 'Purchase not found or access denied.' };
    if (ledger.status === 'SUCCESS') return success(ledger);
    const providerId = storedTransactionId(ledger);
    if (validId(providerId)) {
      const verified = await genieRequest(`/public/transactions/${encodeURIComponent(providerId)}`);
      return await settlePayment(ledger.id, providerId, verified);
    }
    const data = await genieRequest(`/public/transactions?localId=${encodeURIComponent(ledgerId)}`);
    const items: unknown[] = Array.isArray(data.items) ? data.items : [];
    // Do not assume the API applied its optional localId filter.
    const transaction = items.find(item => item && typeof item === 'object' &&
      (item as GenieTransaction).localId === ledgerId && validId((item as GenieTransaction).id)) as GenieTransaction | undefined;
    if (!transaction) return { ok: false, pending: true, message: 'Waiting for Dialog Genie payment confirmation.' };
    const unfinished = completedState(transaction);
    if (unfinished) return unfinished;
    // A list item alone cannot authorize a credit; always verify the transaction by ID.
    const verified = await genieRequest(`/public/transactions/${encodeURIComponent(transaction.id)}`);
    return await settlePayment(ledger.id, transaction.id, verified);
  } catch (error) {
    return verificationError(error);
  }
}

export async function settleGenieWebhook(transactionId: string): Promise<PaymentVerificationResult> {
  try {
    if (!validId(transactionId)) return { ok: false, error: 'Invalid payment reference.' };
    const transaction = await genieRequest(`/public/transactions/${encodeURIComponent(transactionId)}`);
    if (!validId(transaction.localId)) return { ok: false, error: 'Invalid purchase reference.' };
    // localId, amount, currency, and state come only from the authenticated Genie API.
    return await settlePayment(transaction.localId, transactionId, transaction);
  } catch (error) {
    return verificationError(error);
  }
}
