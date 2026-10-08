'use server';

import { getSession } from '@/lib/session';

// Setup Dialog IPG API wrapper
export async function createIpgTransaction(packageId: string, amount: number) {
  const session = await getSession();
  if (!session?.userId) return { ok: false, error: 'Unauthorized' };

  // Use environment variables for production
  // const appId = process.env.GENIE_APP_ID || "36bafce7-a201-429b-a9e2-c5b78546677c";
  const appKey = process.env.GENIE_APP_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjM2YmFmY2U3LWEyMDEtNDI5Yi1hOWUyLWM1Yjc4NTQ2Njc3YyIsImNvbXBhbnlJZCI6IjYzOTdmMzlkZjA3ZmJhMDAwODQyYTkwYiIsImlhdCI6MTY3MDkwMjY4NSwiZXhwIjo0ODI2NTc2Mjg1fQ.fy12dgFhA3iB_RCjD7y8j5HClNRZUiBZgAg-QzFpxaE";
  const baseUrl = process.env.GENIE_API_URL || "https://api.uat.geniebiz.lk";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const payload = {
    amount: amount,
    currency: "LKR",
    redirectUrl: `${appUrl}/payment-success?pkg=${packageId}`,
    webhook: `${appUrl}/api/webhooks/dialog`,
    customerReference: session.userId as string,
    billingDetails: {
      email: "user@winglemingle.com", 
      name: "Wingle User",
      address1: "Sri Lanka",
      address2: ""
    }
  };

  try {
    const res = await fetch(`${baseUrl}/public/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if(!res.ok) {
       console.error("IPG Error", res.status, await res.text());
       return { ok: false, error: 'Payment gateway rejected the request' };
    }

    const data = await res.json();
    
    if (data && data.redirectUrl) {
       return { ok: true, redirectUrl: data.redirectUrl };
    }

    return { ok: false, error: 'Failed to initialize payment gateway' };
  } catch(e: any) {
    return { ok: false, error: e.message };
  }
}
