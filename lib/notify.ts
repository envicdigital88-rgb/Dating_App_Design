/**
 * Notify.lk SMS Gateway Integration
 * Official Documentation: https://app.notify.lk/api/v1/send
 */

export interface SendSmsParams {
  to: string;
  message: string;
  senderId?: string;
}

export interface SendSmsResult {
  ok: boolean;
  status?: string;
  data?: any;
  error?: string;
  simulated?: boolean;
}

/**
 * Normalizes a Sri Lankan or international phone number into standard Notify.lk format (e.g., 947XXXXXXXX).
 */
export function formatNotifyPhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';

  // Remove any non-numeric characters except leading plus if any
  const cleaned = rawPhone.trim().replace(/[^0-9]/g, '');

  // If phone starts with '0' (standard LK domestic format: 07XXXXXXXX -> 10 digits)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '94' + cleaned.slice(1);
  }

  // If phone starts with '7' (LK local 9 digits without 0: 7XXXXXXXX)
  if (cleaned.startsWith('7') && cleaned.length === 9) {
    return '94' + cleaned;
  }

  // If phone starts with '94' and has 11 digits (947XXXXXXXX)
  if (cleaned.startsWith('94') && cleaned.length === 11) {
    return cleaned;
  }

  // Non-LK or already formatted
  return cleaned;
}

/**
 * Generates various phone number formats to reliably match users across the database.
 */
export function getPhoneVariants(phone: string): string[] {
  const digits = phone.replace(/[^0-9]/g, '');
  const variants = new Set<string>();

  if (phone.trim()) variants.add(phone.trim());

  if (digits) {
    variants.add(digits);
    variants.add(`+${digits}`);

    // If it's a Sri Lankan 94XXXXXXXXX number
    if (digits.startsWith('94') && digits.length >= 11) {
      const local = '0' + digits.slice(2);
      const short = digits.slice(2);
      variants.add(local);
      variants.add(short);
      variants.add(`+94${short}`);
      variants.add(`+94 ${short.slice(0, 2)} ${short.slice(2, 5)} ${short.slice(5)}`);
      variants.add(`${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`);
    } else if (digits.startsWith('0') && digits.length === 10) {
      const short = digits.slice(1);
      const intl = '94' + short;
      variants.add(intl);
      variants.add(`+${intl}`);
      variants.add(short);
    }
  }

  return Array.from(variants);
}

/**
 * Sends an SMS message through the Notify.lk API.
 */
export async function sendNotifySms({
  to,
  message,
  senderId
}: SendSmsParams): Promise<SendSmsResult> {
  const userId = process.env.NOTIFY_USER_ID?.trim();
  const apiKey = process.env.NOTIFY_API_KEY?.trim();
  const activeSenderId = senderId?.trim() || process.env.NOTIFY_SENDER_ID?.trim() || 'NotifyDEMO';

  const formattedTo = formatNotifyPhoneNumber(to);

  if (!formattedTo || formattedTo.length < 9) {
    return { ok: false, error: 'Invalid recipient phone number format' };
  }

  // Detect whether message contains non-ASCII characters (Sinhala, Tamil, emoji, etc.)
  const isUnicode = /[^\u0000-\u007F]/.test(message);

  // If credentials are not configured, simulate sending cleanly so development works without crashing
  if (!userId || !apiKey) {
    console.warn(
      `[Notify.lk] NOTIFY_USER_ID or NOTIFY_API_KEY not configured in .env. SMS simulated for ${formattedTo}:\n"${message}"`
    );
    return {
      ok: true,
      simulated: true,
      status: 'simulated',
      data: 'SMS simulated (Notify.lk credentials not set in .env)'
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    params.append('api_key', apiKey);
    params.append('sender_id', activeSenderId);
    params.append('to', formattedTo);
    params.append('message', message);

    if (isUnicode) {
      params.append('type', 'unicode');
    }

    console.log(`[Notify.lk] Sending SMS to ${formattedTo} using sender_id "${activeSenderId}" (unicode: ${isUnicode})`);

    const response = await fetch('https://app.notify.lk/api/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const resJson = await response.json();
    console.log('[Notify.lk] Gateway response:', resJson);

    if (resJson?.status === 'success') {
      return { ok: true, status: 'success', data: resJson.data };
    } else {
      const errMsg = resJson?.message || resJson?.data || resJson?.error || 'Notify.lk API error';
      console.error('[Notify.lk] Failed to send SMS:', errMsg);
      return { ok: false, error: errMsg, data: resJson };
    }
  } catch (err: any) {
    console.error('[Notify.lk] Request exception:', err);
    return { ok: false, error: err?.message || 'Network error while calling Notify.lk API' };
  }
}

export type SecretWingleLanguage = 'all' | 'en' | 'si' | 'ta';

export interface BuildSmsOptions {
  recipientName?: string | null;
  senderName?: string | null;
  isAnonymous?: boolean;
  language?: SecretWingleLanguage;
  appUrl?: string;
}

/**
 * Generates the standardized Secret Wingle SMS notification text.
 * Contains English, Sinhala, and Tamil all together in one trilingual message.
 * Addresses the recipient by name if recipientName is provided, otherwise generic.
 */
export function buildSecretWingleSms({
  recipientName,
  senderName,
  appUrl = 'https://www.winglemingle.com'
}: BuildSmsOptions): string {
  const cleanUrl = `${(appUrl || 'https://www.winglemingle.com').replace(/\/+$/, '')}/secret-wingles`;
  const name = (recipientName || senderName)?.trim();

  const enHeader = name
    ? `💌 Hey ${name}, someone has a crush on you but is too shy to tell you directly. 🙈💜`
    : `💌 Someone has a crush on you but is too shy to tell you directly. 🙈💜`;

  const siHeader = name
    ? `💌 Hey ${name}, කෙනෙක් ඔයාට කැමතියි… ඒත් ඒක කෙළින්ම කියන්න ලැජ්ජයි. 🙈💜`
    : `💌 කෙනෙක් ඔයාට කැමතියි… ඒත් ඒක කෙළින්ම කියන්න ලැජ්ජයි. 🙈💜`;

  const taHeader = name
    ? `💌 Hey ${name}, ஒருவர் உங்கள் மீது காதல் கொண்டிருக்கிறார்… ஆனால் அதை நேரடியாகச் சொல்ல வெட்கப்படுகிறார். 🙈💜`
    : `💌 ஒருவர் உங்கள் மீது காதல் கொண்டிருக்கிறார்… ஆனால் அதை நேரடியாகச் சொல்ல வெட்கப்படுகிறார். 🙈💜`;

  return `${enHeader}\n\nThey sent you a Secret Wingle.\n\n👉 ${cleanUrl}\n\n${siHeader}\n\nඑයා ඔයාට Secret Wingle එකක් එවලා.\n\n👉 ${cleanUrl}\n\n${taHeader}\n\nஅவர் உங்களுக்கு ஒரு Secret Wingle அனுப்பியுள்ளார்.\n\n👉 ${cleanUrl}`;
}
