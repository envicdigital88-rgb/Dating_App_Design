'use server';

import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { sendInvoiceEmail } from '@/app/actions/email';
import { headers } from 'next/headers';

const GENIE_API_URL = process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk";
const GENIE_APP_KEY = process.env.GENIE_APP_KEY || "";

export async function buyWingitsAction(packageAmountLKR: number, wingitsAmount: number) {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };
  const userId = session.userId as string;

  const headersList = await headers();
  const host = headersList.get('host') || "www.winglemingle.com";
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  // Fallback to explicit env variable if needed, otherwise use dynamic
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  // 1. Insert PENDING record into TransactionLedger
  const ledger = await db.orm.public.TransactionLedger.create({
    userId,
    amountLKR: packageAmountLKR,
    wingitsCredited: wingitsAmount,
    status: 'PENDING',
  });

  const payload = {
    amount: packageAmountLKR,
    currency: "LKR",
    redirectUrl: `${APP_URL}/payment-success?ledgerId=${ledger.id}`,
    webhook: `${APP_URL}/api/webhooks/dialog`,
    customerReference: userId,
    reference: ledger.id
  };

  try {
    // 3. Make POST request to Dialog API
    const res = await fetch(`${GENIE_API_URL}/public/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GENIE_APP_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    if(!res.ok) {
       console.error("IPG Error", res.status, await res.text());
       return { ok: false, error: 'Payment gateway rejected the request' };
    }

    const data = await res.json();
    
    // 4. Redirect the user to the url
    if (data && data.url) return { ok: true, redirectUrl: data.url };
    if (data && data.redirectUrl) return { ok: true, redirectUrl: data.redirectUrl };
    if (data && data.paymentUrl) return { ok: true, redirectUrl: data.paymentUrl };

    return { ok: false, error: 'Failed to initialize payment gateway' };
  } catch(e: any) {
    return { ok: false, error: e.message };
  }
}

export async function verifyPaymentAction(ledgerId: string, transactionId: string) {
  try {
    // 1. Verify with Dialog API
    const res = await fetch(`${GENIE_API_URL}/public/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GENIE_APP_KEY}`
      }
    });

    if (!res.ok) {
      return { ok: false, error: 'Failed to verify transaction' };
    }

    const data = await res.json();
    if (data.status !== 'SUCCESS' && data.status !== 'COMPLETED') {
      return { ok: false, error: 'Transaction is not completed' };
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
      if(user) {
        await tx.orm.public.User.where({ id: ledger.userId }).update({
          wingitsBalance: user.wingitsBalance + ledger.wingitsCredited
        });
      }
    });

    // 3. Trigger Email (Fire and forget or await)
    await sendInvoiceEmail(ledgerId, data.amount, ledger.wingitsCredited, data.date || new Date().toISOString(), data.customerEmail || 'user@example.com');

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
