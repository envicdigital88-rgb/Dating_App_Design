import { settleGenieWebhook } from '@/lib/payment-verification';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length')) > 16384) {
    return Response.json({ ok: false, error: 'Webhook payload is too large.' }, { status: 413 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid webhook payload.' }, { status: 400 });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return Response.json({ ok: false, error: 'Invalid webhook payload.' }, { status: 400 });
  }
  const transactionId = (payload as Record<string, unknown>).transactionId;
  if (typeof transactionId !== 'string') {
    return Response.json({ ok: false, error: 'Missing payment reference.' }, { status: 400 });
  }
  const result = await settleGenieWebhook(transactionId);
  // Never echo ledger metadata, recipient details, or incoming payment claims.
  if (result.ok) return Response.json({ ok: true });
  if (result.pending) return Response.json({ ok: true, pending: true }, { status: 202 });
  return Response.json(
    { ok: false, error: result.retryable ? 'Payment verification is temporarily unavailable.' : 'Payment could not be verified.' },
    { status: result.retryable ? 503 : 400 },
  );
}
