'use server';

import { Resend } from 'resend';
import { render } from '@react-email/components';
import { InvoiceEmail } from '@/components/emails/InvoiceEmail';
import React from 'react';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

export async function sendInvoiceEmail(transactionId: string, amount: number, wingitsCredited: number, date: string, customerEmail: string) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.warn('[Resend] RESEND_API_KEY not configured. Skipping invoice email.');
      return { ok: false, error: 'Email service not configured' };
    }
    const htmlBody = await render(
      React.createElement(InvoiceEmail, {
        transactionId,
        amount,
        wingitsCredited,
        date,
      })
    );

    const data = await resend.emails.send({
      from: 'Wingle Mingle <no-reply@winglemingle.com>', // Assuming verified domain or testing domain
      to: [customerEmail],
      subject: `Your Wingle Mingle Receipt - ${wingitsCredited} Wingits`,
      html: htmlBody,
    });

    return { ok: true, data };
  } catch (error: any) {
    console.error("Email sending error:", error);
    return { ok: false, error: error.message };
  }
}
