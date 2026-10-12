'use server';

import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { sendInvoiceEmail } from '@/app/actions/email';
import { headers } from 'next/headers';

export async function buyWingitsAction(packageAmountLKR: number, wingitsAmount: number) {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };
  const userId = session.userId as string;

  // Environment variables function එක ඇතුළේදීම කියවන්න
  const GENIE_API_URL = process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk";
  const GENIE_APP_KEY = process.env.GENIE_APP_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjM2YmFmY2U3LWEyMDEtNDI5Yi1hOWUyLWM1Yjc4NTQ2Njc3YyIsImNvbXBhbnlJZCI6IjYzOTdmMzlkZjA3ZmJhMDAwODQyYTkwYiIsImlhdCI6MTY3MDkwMjY4NSwiZXhwIjo0ODI2NTc2Mjg1fQ.fy12dgFhA3iB_RCjD7y8j5HClNRZUiBZgAg-QzFpxaE";

  const headersList = await headers();
  const host = headersList.get('host') || "localhost:3000";
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  // 1. TransactionLedger එකේ record එක හදන්න
  const ledger = await db.orm.public.TransactionLedger.create({
    userId,
    amountLKR: packageAmountLKR,
    wingitsCredited: wingitsAmount,
    status: 'PENDING',
  });

  // User ගේ විස්තර DB එකෙන් ගන්න (billing details සඳහා)
  const user = await db.orm.public.User.where({ id: userId }).first();

  // 2. Dialog Stoplight Guideline (3rd Object) එකට අනුකූල Payload එක
  const payload = {
    amount: packageAmountLKR,
    currency: "LKR",
    redirectUrl: `${APP_URL}/payment-success?ledgerId=${ledger.id}`,
    webhook: `${APP_URL}/api/webhooks/dialog`,
    localId: String(ledger.id), // Dialog එක transaction UUID එක විදිහට ඉල්ලන්නේ මේකයි
    customerReference: String(userId),
    customerId: String(userId),
    billingDetails: {
      email: user?.email || "customer@winglemingle.com",
      name: user?.name || "Wingle User",
      address1: "Colombo, Sri Lanka",
      address2: "Western Province"
    }
  };

  try {
    // 3. Dialog API එකට POST request එක යැවීම
    const res = await fetch(`${GENIE_API_URL}/public/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GENIE_APP_KEY}`
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

    // 4. Dialog Payment URL එක ලැබුණු විට redirect කිරීම
    if (data && data.url) return { ok: true, redirectUrl: data.url };
    if (data && data.redirectUrl) return { ok: true, redirectUrl: data.redirectUrl };
    if (data && data.paymentUrl) return { ok: true, redirectUrl: data.paymentUrl };

    return { ok: false, error: 'Failed to initialize payment gateway' };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function verifyPaymentAction(ledgerId: string, transactionId: string) {
  const GENIE_API_URL = process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk";
  const GENIE_APP_KEY = process.env.GENIE_APP_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjM2YmFmY2U3LWEyMDEtNDI5Yi1hOWUyLWM1Yjc4NTQ2Njc3YyIsImNvbXBhbnlJZCI6IjYzOTdmMzlkZjA3ZmJhMDAwODQyYTkwYiIsImlhdCI6MTY3MDkwMjY4NSwiZXhwIjo0ODI2NTc2Mjg1fQ.fy12dgFhA3iB_RCjD7y8j5HClNRZUiBZgAg-QzFpxaE";

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

    // 2. Prisma Atomic Updates
    const ledger = await db.orm.public.TransactionLedger.where({ id: ledgerId }).first();
    if (!ledger) return { ok: false, error: 'Ledger not found' };
    if (ledger.status === 'SUCCESS') return { ok: true };

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

    // 3. Invoice Email යැවීම
    await sendInvoiceEmail(
      ledgerId,
      data.amount,
      ledger.wingitsCredited,
      data.date || new Date().toISOString(),
      data.customerEmail || 'user@example.com'
    );

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function createIpgTransaction(_packageId: string, amount: number) {
  return buyWingitsAction(amount, amount);
}