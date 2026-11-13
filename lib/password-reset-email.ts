import 'server-only';
import { Resend } from 'resend';

export async function sendPasswordResetEmail(email: string, code: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  try {
    const { data, error } = await new Resend(key).emails.send({
      from: 'Wingle Mingle <noreply@winglemingle.com>',
      to: email,
      subject: 'Reset your Wingle Mingle password',
      text: `Your Wingle Mingle password reset code is ${code}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email. Never share this code.`,
      html: `<!doctype html><html><body style="margin:0;background:#07061a;color:#fff;font-family:Arial,sans-serif;padding:40px 20px">
        <div style="max-width:480px;margin:auto;background:#12102e;border:1px solid #35314b;border-radius:24px;padding:36px;text-align:center">
          <p style="color:#38bdf8;font-weight:700;font-size:20px">Wingle Mingle</p>
          <h1 style="font-size:24px">Reset your password</h1>
          <p style="color:#cbd5e1;line-height:1.6">Enter this code to verify your email and choose a new password.</p>
          <p style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:8px;padding:20px;background:#241b3b;border-radius:16px">${code}</p>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.6">This code expires in <strong>10 minutes</strong>. Never share it.</p>
          <p style="color:#94a3b8;font-size:12px;line-height:1.6">If you did not request a password reset, you can safely ignore this email.</p>
        </div></body></html>`,
    });
    if (error || !data?.id) {
      console.error('Password reset email was not accepted by the email provider.');
      return false;
    }
    return true;
  } catch {
    console.error('Password reset email delivery failed.');
    return false;
  }
}
