'use server';

import { Resend } from 'resend';
import { render } from '@react-email/components';
import { InvoiceEmail } from '@/components/emails/InvoiceEmail';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(transactionId: string, amount: number, wingitsCredited: number, date: string, customerEmail: string) {
  try {
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
