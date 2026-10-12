'use server';

import crypto from 'crypto';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { sendInvoiceEmail } from '@/app/actions/email';
import { headers } from 'next/headers';

const DEFAULT_GENIE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjM2YmFmY2U3LWEyMDEtNDI5Yi1hOWUyLWM1Yjc4NTQ2Njc3YyIsImNvbXBhbnlJZCI6IjYzOTdmMzlkZjA3ZmJhMDAwODQyYTkwYiIsImlhdCI6MTY3MDkwMjY4NSwiZXhwIjo0ODI2NTc2Mjg1fQ.fy12dgFhA3iB_RCjD7y8j5HClNRZUiBZgAg-QzFpxaE";

export async function buyWingitsAction(packageAmountLKR: number, wingitsAmount: number) {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };
  const userId = session.userId as string;

  const GENIE_API_URL = (process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk").trim();
  const GENIE_APP_KEY = (process.env.GENIE_APP_KEY || "").trim() || DEFAULT_GENIE_KEY;

  const headersList = await headers();
  const host = headersList.get('host') || "www.winglemingle.com";
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

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

    // 2. Prisma $transaction (Atomic Updates)
    const ledger = await db.orm.public.TransactionLedger.where({ id: ledgerId }).first();
    if (!ledger) return { ok: false, error: 'Ledger not found' };
    if (ledger.status === 'SUCCESS') return { ok: true }; // Already fulfilled

    // Update status and wingitsBalance atomically
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
      }
    });

    // 3. Trigger Email (Fire and forget or await)
    await sendInvoiceEmail(
      ledgerId,
      data.amountAsDecimal ? parseFloat(data.amountAsDecimal) : (data.amount / 100),
      ledger.wingitsCredited,
      data.date || data.createdAt || new Date().toISOString(),
      data.customerEmail || 'user@example.com'
    );

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
