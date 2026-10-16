import 'server-only';

import { Resend } from 'resend';
import { render } from '@react-email/components';
import React from 'react';
import { InvoiceEmail } from '@/components/emails/InvoiceEmail';

export type PaymentInvoice = {
  receiptNumber: string;
  transactionId: string;
  customerEmail: string;
  customerName?: string;
  amount: number;
  wingitsCredited: number;
  date: string;
  purchaseType: 'wingits' | 'secret_wingle';
};

export type InvoiceEmailResult = { ok: boolean; emailId?: string; error?: string };

const emailAddress = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export async function sendInvoiceEmail(invoice: PaymentInvoice): Promise<InvoiceEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('Payment invoice email is not configured: RESEND_API_KEY is missing.');
    return { ok: false, error: 'Invoice email is not configured.' };
  }
  if (
    !emailAddress.test(invoice.customerEmail) || invoice.customerEmail.length > 254 ||
    !/^[A-Za-z0-9_-]{1,200}$/.test(invoice.receiptNumber) ||
    !Number.isFinite(invoice.amount) || invoice.amount <= 0 ||
    !Number.isSafeInteger(invoice.wingitsCredited) || invoice.wingitsCredited < 0 ||
    !Number.isFinite(new Date(invoice.date).getTime())
  ) {
    console.error('Payment invoice has invalid account or purchase details.');
    return { ok: false, error: 'Invoice details are invalid.' };
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || 'Wingle Mingle <no-reply@winglemingle.com>';
  const replyTo = process.env.RESEND_REPLY_TO?.trim();
  if (/[\r\n]/.test(from) || (replyTo && !emailAddress.test(replyTo))) {
    console.error('Payment invoice sender configuration is invalid.');
    return { ok: false, error: 'Invoice sender is not configured correctly.' };
  }

  let html: string;
  try {
    html = await render(React.createElement(InvoiceEmail, {
      transactionId: invoice.transactionId,
      receiptNumber: invoice.receiptNumber,
      customerName: invoice.customerName,
      amount: invoice.amount,
      wingitsCredited: invoice.wingitsCredited,
      date: invoice.date,
      purchaseType: invoice.purchaseType,
    }));
  } catch {
    console.error('Payment invoice template could not be rendered.');
    return { ok: false, error: 'Invoice could not be prepared.' };
  }

  const date = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo',
  }).format(new Date(invoice.date));
  const description = invoice.purchaseType === 'secret_wingle'
    ? 'Secret Wingle payment'
    : `${invoice.wingitsCredited} Wingits purchase`;
  // Freeze the complete payload before retrying so one idempotency key always
  // refers to exactly the same receipt, recipient, and timestamp.
  const payload = {
    from,
    to: [invoice.customerEmail],
    ...(replyTo ? { replyTo } : {}),
    subject: `Wingle Mingle payment invoice - ${invoice.receiptNumber}`,
    html,
    text: [
      'Wingle Mingle - Payment Invoice / Receipt',
      'Status: PAID',
      ...(invoice.customerName ? [`Customer: ${invoice.customerName}`] : []),
      `Receipt number: ${invoice.receiptNumber}`,
      `Payment transaction: ${invoice.transactionId}`,
      `Date: ${date} (Sri Lanka time)`,
      `Purchase: ${description}`,
      `Amount paid: LKR ${invoice.amount.toFixed(2)}`,
      `Wingits ${invoice.purchaseType === 'secret_wingle' ? 'bonus' : 'credited'}: ${invoice.wingitsCredited}`,
      'Thank you for your payment!',
      'https://www.winglemingle.com',
    ].join('\n'),
  };
  const resend = new Resend(apiKey);
  const idempotencyKey = `payment-invoice/${invoice.receiptNumber}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    let retryable = false;
    let retryAfterMs = 500 * 2 ** attempt;
    try {
      const { data, error, headers } = await resend.emails.send(payload, {
        idempotencyKey,
        signal: AbortSignal.timeout(8000),
      });
      if (!error && data?.id) return { ok: true, emailId: data.id };

      const status = error?.statusCode;
      const code = error?.name;
      // Provider messages can contain recipient addresses: log only safe codes.
      console.error('Payment invoice email was rejected', {
        status: typeof status === 'number' ? status : null,
        code: typeof code === 'string' && /^[a-z0-9_]{1,60}$/.test(code) ? code : 'unknown_error',
        attempt: attempt + 1,
      });
      retryable = (status == null && code === 'application_error') ||
        [500, 502, 503, 504].includes(status || 0) ||
        code === 'rate_limit_exceeded' || code === 'concurrent_idempotent_requests';
      const retryAfter = headers?.['retry-after'];
      if (retryAfter) {
        const seconds = Number(retryAfter);
        const wait = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
        if (Number.isFinite(wait)) retryAfterMs = Math.max(0, wait);
      }
    } catch {
      // Network/timeout exceptions are retried with the same provider key.
      console.error('Payment invoice email request could not complete', { attempt: attempt + 1 });
      retryable = true;
    }
    if (!retryable || attempt === 2 || retryAfterMs > 2500) break;
    await new Promise(resolve => setTimeout(resolve, retryAfterMs));
  }
  return { ok: false, error: 'Invoice email could not be sent. Your payment is still confirmed.' };
}
