import { Resend } from 'resend';

export interface AdminInviteEmailOptions {
  name: string;
  email: string;
  temporaryPassword?: string;
  loginUrl?: string;
}

export async function sendAdminInviteEmail(options: AdminInviteEmailOptions): Promise<{ ok: boolean; error?: string; simulated?: boolean }> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const appUrl = options.loginUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://www.winglemingle.com';
    const loginLink = `${appUrl.replace(/\/$/, '')}/sign-in`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Console Access - Wingle Mingle</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050505;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #FFFFFF;
    }
    .wrapper {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #111111;
      border: 1px solid #1E293B;
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 12px 32px -20px rgba(0, 0, 0, 0.5);
    }
    .brand {
      display: inline-block;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #EC4899;
      margin-bottom: 24px;
    }
    .brand-sub {
      color: #0EA5E9;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 16px 0;
      color: #FFFFFF;
      letter-spacing: -0.01em;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #E2E8F0;
      margin: 0 0 16px 0;
    }
    .credentials-box {
      background-color: #0A0A0A;
      border: 1px solid #1E293B;
      border-radius: 16px;
      padding: 20px;
      margin: 24px 0;
    }
    .cred-row {
      margin-bottom: 12px;
    }
    .cred-row:last-child {
      margin-bottom: 0;
    }
    .cred-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94A3B8;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .cred-val {
      font-size: 15px;
      font-family: monospace;
      color: #38BDF8;
      background: #111827;
      padding: 6px 12px;
      border-radius: 8px;
      display: inline-block;
      font-weight: 600;
    }
    .btn-container {
      margin: 32px 0 24px 0;
      text-align: center;
    }
    .btn {
      background: linear-gradient(135deg, #EC4899 0%, #0EA5E9 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 15px;
      display: inline-block;
      box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4);
    }
    .note {
      font-size: 13px;
      color: #94A3B8;
      line-height: 1.5;
      border-top: 1px solid #1E293B;
      padding-top: 20px;
      margin-top: 28px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #64748B;
      margin-top: 32px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">Wingle<span class="brand-sub">Mingle</span> <span style="color: #94A3B8; font-size: 14px; font-weight: 500;">· Admin Console</span></div>
      
      <h1>Admin Console Access Granted</h1>
      <p>Hello <strong>${options.name}</strong>,</p>
      <p>You have been added as an administrator with full privileges for the <strong>Wingle Mingle</strong> platform.</p>
      
      <div class="credentials-box">
        <div class="cred-row">
          <div class="cred-label">Admin Email Address</div>
          <div class="cred-val">${options.email}</div>
        </div>
        ${options.temporaryPassword ? `
        <div class="cred-row" style="margin-top: 14px;">
          <div class="cred-label">Temporary Password</div>
          <div class="cred-val">${options.temporaryPassword}</div>
        </div>
        ` : ''}
      </div>

      <p style="font-size: 14px; color: #94A3B8;">
        💡 <strong>Quick Access:</strong> You can log in using your password, or sign in directly with Google using this Gmail account (<strong>${options.email}</strong>) at any time.
      </p>

      <div class="btn-container">
        <a href="${loginLink}" class="btn" target="_blank">Access Admin Console</a>
      </div>

      <div class="note">
        <strong style="color: #E2E8F0;">Security Advisory:</strong> If you did not anticipate receiving this access, please contact the primary administrator at <a href="mailto:envicdigital88@gmail.com" style="color: #38BDF8; text-decoration: none;">envicdigital88@gmail.com</a> immediately.
      </div>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} Wingle Mingle. All rights reserved.<br>
      Automated dispatch from noreply@winglemingle.com
    </div>
  </div>
</body>
</html>
    `;

    if (!apiKey) {
      console.warn('[Resend] RESEND_API_KEY is not configured. Simulating admin invite email to:', options.email);
      return { ok: true, simulated: true };
    }

    const resend = new Resend(apiKey);
    const fromAddress = 'Wingle Mingle <noreply@winglemingle.com>';

    const sendRes = await resend.emails.send({
      from: fromAddress,
      to: options.email,
      subject: 'Admin Console Access Granted - Wingle Mingle',
      html,
    });

    if (sendRes.error) {
      console.error('[Resend] Failed to send admin invite email:', sendRes.error);
      return { ok: false, error: sendRes.error.message || 'Failed to dispatch email' };
    }

    return { ok: true };
  } catch (error: any) {
    console.error('sendAdminInviteEmail error:', error);
    return { ok: false, error: error?.message || 'Error sending invite email' };
  }
}
