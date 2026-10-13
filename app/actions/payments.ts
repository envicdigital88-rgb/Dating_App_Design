'use server';

import crypto from 'crypto';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { sendInvoiceEmail } from '@/app/actions/email';

const DEFAULT_GENIE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjM2YmFmY2U3LWEyMDEtNDI5Yi1hOWUyLWM1Yjc4NTQ2Njc3YyIsImNvbXBhbnlJZCI6IjYzOTdmMzlkZjA3ZmJhMDAwODQyYTkwYiIsImlhdCI6MTY3MDkwMjY4NSwiZXhwIjo0ODI2NTc2Mjg1fQ.fy12dgFhA3iB_RCjD7y8j5HClNRZUiBZgAg-QzFpxaE";

export async function buyWingitsAction(packageAmountLKR: number, wingitsAmount: number) {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };
  const userId = session.userId as string;

  const GENIE_API_URL = (process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk").trim();
  const GENIE_APP_KEY = (process.env.GENIE_APP_KEY || "").trim() || DEFAULT_GENIE_KEY;

  const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  const APP_URL = rawAppUrl ? rawAppUrl.replace(/^http:\/\//, 'https://') : 'https://winglemingle.com';

  // 1. Insert PENDING record into TransactionLedger
  const ledger = await db.orm.public.TransactionLedger.create({
    userId,
    amountLKR: packageAmountLKR,
    wingitsCredited: wingitsAmount,
    status: 'PENDING',
  });

  // Amount in cents (100 LKR = 10000 cents as required by Dialog IPG)
  const amountInCents = Math.round(packageAmountLKR * 100);

  // Generate official Dialog SHA1 Signature: amount={amount}&currency={currency}&apiKey={apiKey}
  const sigStr = `amount=${amountInCents}&currency=LKR&apiKey=${GENIE_APP_KEY}`;
  const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

  const payload = {
    amount: amountInCents,
    currency: "LKR",
    localId: String(ledger.id),
    redirectUrl: `${APP_URL}/payment-success?ledgerId=${ledger.id}`,
    webhook: `${APP_URL}/api/webhooks/dialog`,
    signature: signature,
    apiVersion: "2.0",
    appVersion: "geniebiz-connect-php",
    signMethod: "sha1"
  };

  try {
    // 3. Make POST request to Dialog API (Authorization header must be raw App Key without Bearer)
    const res = await fetch(`${GENIE_API_URL}/public/transactions`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': GENIE_APP_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("\n==========================================");
      console.log("IPG ERROR STATUS:", res.status);
      console.log("IPG ERROR BODY:", text);
      console.log("==========================================\n");
      return { ok: false, error: `IPG Rejected (Status ${res.status}): ${text.substring(0, 100)}` };
    }

    const data = await res.json();

    // 4. Redirect user to Dialog payment gateway URL
    const paymentUrl = data.url || data.redirectUrl || data.shortUrl || data.paymentUrl;
    if (paymentUrl) {
      return { ok: true, redirectUrl: paymentUrl };
    }

    return { ok: false, error: 'Failed to initialize payment gateway' };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
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
) {
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

  const GENIE_API_URL = (process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk").trim();
  const GENIE_APP_KEY = (process.env.GENIE_APP_KEY || "").trim() || DEFAULT_GENIE_KEY;

  const rawAppUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
  const APP_URL = rawAppUrl ? rawAppUrl.replace(/^http:\/\//, 'https://') : 'https://winglemingle.com';

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

  const ledger = await db.orm.public.TransactionLedger.create({
    userId,
    amountLKR: AMOUNT_LKR,
    wingitsCredited: WINGITS_REWARD,
    status: 'PENDING',
    transactionReference: metadata
  });

  const amountInCents = Math.round(AMOUNT_LKR * 100); // 5000 cents for LKR 50
  const sigStr = `amount=${amountInCents}&currency=LKR&apiKey=${GENIE_APP_KEY}`;
  const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

  const payload = {
    amount: amountInCents,
    currency: "LKR",
    localId: String(ledger.id),
    redirectUrl: `${APP_URL}/payment-success?ledgerId=${ledger.id}&type=secret_wingle`,
    webhook: `${APP_URL}/api/webhooks/dialog`,
    signature: signature,
    apiVersion: "2.0",
    appVersion: "geniebiz-connect-php",
    signMethod: "sha1"
  };

  try {
    const res = await fetch(`${GENIE_API_URL}/public/transactions`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': GENIE_APP_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("\n==========================================");
      console.log("GENIE IPG ERROR STATUS:", res.status);
      console.log("GENIE IPG ERROR BODY:", text);
      console.log("==========================================\n");
      return { ok: false, error: `Payment gateway error (Status ${res.status}): ${text.substring(0, 100)}` };
    }

    const data = await res.json();
    const paymentUrl = data.url || data.redirectUrl || data.shortUrl || data.paymentUrl;
    if (paymentUrl) {
      return { ok: true, redirectUrl: paymentUrl, ledgerId: ledger.id };
    }

    return { ok: false, error: 'Failed to initialize payment gateway' };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function checkAndVerifyPendingPaymentAction(ledgerId: string) {
  const GENIE_API_URL = (process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk").trim();
  const GENIE_APP_KEY = (process.env.GENIE_APP_KEY || "").trim() || DEFAULT_GENIE_KEY;

  try {
    const res = await fetch(`${GENIE_API_URL}/public/transactions?localId=${encodeURIComponent(ledgerId)}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Authorization': GENIE_APP_KEY,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return { ok: false, error: 'Failed to query Dialog API' };
    }

    const data = await res.json();
    const tx = data?.items?.[0];
    if (!tx) {
      return { ok: false, pending: true, message: 'Transaction pending on Dialog Pay' };
    }

    const state = (tx.state || tx.status || '').toUpperCase();
    if (state === 'CONFIRMED' || state === 'SUCCESS' || state === 'COMPLETED') {
      return await verifyPaymentAction(ledgerId, tx.id);
    }

    return { ok: false, pending: true, state };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

export async function verifyPaymentAction(ledgerId: string, transactionId: string) {
  const GENIE_API_URL = (process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk").trim();
  const GENIE_APP_KEY = (process.env.GENIE_APP_KEY || "").trim() || DEFAULT_GENIE_KEY;

  try {
    // 1. Verify with Dialog API
    const res = await fetch(`${GENIE_API_URL}/public/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': GENIE_APP_KEY,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return { ok: false, error: 'Failed to verify transaction' };
    }

    const data = await res.json();
    const status = (data.status || data.state || '').toUpperCase();

    if (status !== 'SUCCESS' && status !== 'COMPLETED' && status !== 'CONFIRMED') {
      return { ok: false, error: `Transaction is not completed (status: ${status})` };
    }

    // 2. Fetch Ledger
    const ledger = await db.orm.public.TransactionLedger.where({ id: ledgerId }).first();
    if (!ledger) return { ok: false, error: 'Ledger not found' };

    let isSecretWingle = false;
    let secretMetadata: {
      type: string;
      targetPhone: string;
      message: string;
      recipientName?: string | null;
      senderName?: string | null;
      isAnonymous?: boolean;
      language?: 'en' | 'si' | 'ta';
    } | null = null;

    if (ledger.transactionReference) {
      try {
        const parsed = JSON.parse(ledger.transactionReference);
        if (parsed?.type === 'secret_wingle') {
          isSecretWingle = true;
          secretMetadata = parsed;
        }
      } catch (e) {
        // Not JSON metadata, standard reference
      }
    }

    if (ledger.status === 'SUCCESS') {
      return {
        ok: true,
        isSecretWingle: isSecretWingle || ledger.amountLKR === 50,
        targetPhone: secretMetadata?.targetPhone
      };
    }

    const { getPhoneVariants, sendNotifySms } = await import('@/lib/notify');

    if (isSecretWingle && secretMetadata) {
      const { targetPhone, message } = secretMetadata;
      let existingRecipientId: string | null = null;

      // Atomic DB update
      await db.transaction(async (tx) => {
        // Mark ledger as SUCCESS
        await tx.orm.public.TransactionLedger.where({ id: ledgerId }).update({
          status: 'SUCCESS',
          transactionReference: transactionId
        });

        // 1. Credit sender 20 Wingits
        const sender = await tx.orm.public.User.where({ id: ledger.userId }).first();
        if (sender) {
          await tx.orm.public.User.where({ id: sender.id }).update({
            wingitsBalance: sender.wingitsBalance + 20
          });

          await tx.orm.public.WingitsTransaction.create({
            id: crypto.randomUUID(),
            userId: sender.id,
            amount: 20,
            type: 'bonus',
            description: 'Secret Wingle sender bonus (+20 Wingits)'
          });
        }

        // 2. Create SecretWingle
        const sw = await tx.orm.public.SecretWingle.create({
          senderId: ledger.userId,
          targetPhone,
          message
        });

        // 3. Credit recipient 20 Wingits if already registered
        const phoneVariants = getPhoneVariants(targetPhone);
        const recipient = await tx.orm.public.User.where(u => u.phone.in(phoneVariants)).first();

        if (recipient && recipient.id !== ledger.userId) {
          existingRecipientId = recipient.id;
          await tx.orm.public.User.where({ id: recipient.id }).update({
            wingitsBalance: recipient.wingitsBalance + 20
          });

          await tx.orm.public.WingitsTransaction.create({
            id: crypto.randomUUID(),
            userId: recipient.id,
            amount: 20,
            type: 'bonus',
            description: `Secret Wingle recipient bonus for ${sw.id} (+20 Wingits)`
          });

          await tx.orm.public.Notification.create({
            userId: recipient.id,
            type: 'secret_wingle',
            title: 'Secret Wingle Received! 🤫🎁',
            body: 'Someone sent you a Secret Wingle and gifted you 20 free Wingits! Check your Secret Wingles tab.',
            href: '/secret-wingles'
          });
        }
      });

      // 4. Send SMS via Notify.lk using structured multilingual template
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.winglemingle.com';
      const { buildSecretWingleSms } = await import('@/lib/notify');
      const smsText = buildSecretWingleSms({
        recipientName: secretMetadata.recipientName || secretMetadata.senderName,
        appUrl
      });

      try {
        await sendNotifySms({
          to: targetPhone,
          message: smsText
        });
      } catch (smsErr) {
        console.error('Notify.lk SMS error:', smsErr);
      }

      // 5. If recipient is already registered, push notification & pusher event
      if (existingRecipientId) {
        try {
          const { sendPushNotificationAction } = await import('@/app/actions/push');
          await sendPushNotificationAction(existingRecipientId, {
            title: 'Secret Wingle Received! 🤫🎁',
            body: 'Someone sent you a Secret Wingle and gifted you 20 free Wingits!',
            url: `${appUrl}/secret-wingles`
          });

          const { pusherServer } = await import('@/lib/pusher');
          await pusherServer.trigger(`private-user-${existingRecipientId}`, 'state-changed', {});
        } catch (pushErr) {
          console.error('Push error for recipient:', pushErr);
        }
      }

      return { ok: true, isSecretWingle: true, targetPhone };
    }

    // Standard Wingits purchase flow
    await db.transaction(async (tx) => {
      await tx.orm.public.TransactionLedger.where({ id: ledgerId }).update({
        status: 'SUCCESS',
        transactionReference: transactionId
      });

      const user = await tx.orm.public.User.where({ id: ledger.userId }).first();
      if (user) {
        await tx.orm.public.User.where({ id: ledger.userId }).update({
          wingitsBalance: user.wingitsBalance + ledger.wingitsCredited
        });

        await tx.orm.public.WingitsTransaction.create({
          id: crypto.randomUUID(),
          userId: user.id,
          amount: ledger.wingitsCredited,
          type: 'purchase',
          description: `Purchased ${ledger.wingitsCredited} Wingits (LKR ${ledger.amountLKR})`
        });
      }
    });

    // Trigger Email for standard purchase
    await sendInvoiceEmail(
      ledgerId,
      data.amountAsDecimal ? parseFloat(data.amountAsDecimal) : (data.amount / 100),
      ledger.wingitsCredited,
      data.date || data.createdAt || new Date().toISOString(),
      data.customerEmail || 'user@example.com'
    );

    return { ok: true, isSecretWingle: false };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
