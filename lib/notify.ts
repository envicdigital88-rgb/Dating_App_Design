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
 * Validates a mobile phone number for registration & OTP verification.
 * Supports Sri Lankan mobile numbers (070, 071, 072, 074, 075, 076, 077, 078)
 * and international mobile numbers with country codes.
 * Rejects landlines and invalid/fake repetitive numbers.
 */
export function validatePhoneNumber(rawPhone: string): {
  valid: boolean;
  formatted: string;
  error?: string;
} {
  if (!rawPhone || !rawPhone.trim()) {
    return { valid: false, formatted: '', error: 'Mobile number is required.' };
  }

  const trimmed = rawPhone.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length < 9) {
    return { valid: false, formatted: '', error: 'Mobile number is too short.' };
  }

  if (digits.length > 15) {
    return { valid: false, formatted: '', error: 'Mobile number is too long.' };
  }

  // Detect Sri Lankan number patterns
  const isSriLankan =
    trimmed.startsWith('+94') ||
    trimmed.startsWith('94') ||
    trimmed.startsWith('0') ||
    (trimmed.startsWith('7') && digits.length === 9);

  if (isSriLankan) {
    let standardLkDigits = '';
    if (digits.startsWith('94')) {
      standardLkDigits = digits.slice(2);
    } else if (digits.startsWith('0')) {
      standardLkDigits = digits.slice(1);
    } else if (digits.startsWith('7') && digits.length === 9) {
      standardLkDigits = digits;
    }

    if (!standardLkDigits || standardLkDigits.length !== 9) {
      return {
        valid: false,
        formatted: '',
        error: 'Please enter a valid 10-digit Sri Lankan mobile number (e.g. 077 123 4567).'
      };
    }

    // Sri Lankan mobile operator codes: 70, 71, 72, 74, 75, 76, 77, 78
    const mobilePrefix = standardLkDigits.slice(0, 2);
    const validPrefixes = ['70', '71', '72', '74', '75', '76', '77', '78'];

    if (!validPrefixes.includes(mobilePrefix)) {
      if (
        digits.startsWith('011') ||
        digits.startsWith('02') ||
        digits.startsWith('03') ||
        digits.startsWith('08') ||
        digits.startsWith('05') ||
        digits.startsWith('06')
      ) {
        return {
          valid: false,
          formatted: '',
          error: 'Landline numbers cannot receive SMS verification codes. Please provide a mobile number (07X XXX XXXX).'
        };
      }
      return {
        valid: false,
        formatted: '',
        error: 'Please enter a valid mobile number starting with 070, 071, 072, 074, 075, 076, 077, or 078.'
      };
    }

    // Reject obvious fake/dummy numbers (e.g., all identical digits or sequence 1234567)
    const subscriberNumber = standardLkDigits.slice(2);
    if (/^(\d)\1{6}$/.test(subscriberNumber) || subscriberNumber === '1234567') {
      return {
        valid: false,
        formatted: '',
        error: 'Please enter a valid, active mobile number.'
      };
    }

    return { valid: true, formatted: '94' + standardLkDigits };
  }

  // Non-LK international numbers:
  if (digits.length >= 10 && digits.length <= 15) {
    return { valid: true, formatted: digits };
  }

  return {
    valid: false,
    formatted: '',
    error: 'Please enter a valid mobile number.'
  };
}

/**
 * Masks a phone number for user privacy on verification screen (e.g. "+94 77 ••• ••67" or "077 ••• ••67").
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('94') && digits.length === 11) {
    const operator = digits.slice(2, 4);
    const last2 = digits.slice(9);
    return `+94 ${operator} ••• ••${last2}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    const operator = digits.slice(1, 3);
    const last2 = digits.slice(8);
    return `0${operator} ••• ••${last2}`;
  }
  if (digits.length >= 7) {
    const prefix = digits.slice(0, 3);
    const last2 = digits.slice(-2);
    return `+${prefix} ••• ••${last2}`;
  }
  return phone;
}

/**
 * Sends a 6-digit verification code OTP via SMS using Notify.lk.
 */
export async function sendVerificationOtpSms(
  phone: string,
  otp: string
): Promise<SendSmsResult> {
  const formattedPhone = formatNotifyPhoneNumber(phone);
  const message = `Wingle Mingle code: ${otp}. Valid for 10 minutes.`;
  return sendNotifySms({
    to: formattedPhone,
    message
  });
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

  // If credentials are not configured in environment
  if (!userId || !apiKey) {
    console.warn(
      `[Notify.lk] NOTIFY_USER_ID or NOTIFY_API_KEY not configured in environment.`
    );
    return {
      ok: false,
      simulated: true,
      error: 'SMS Gateway credentials (NOTIFY_USER_ID / NOTIFY_API_KEY) are not configured in your hosting environment variables.'
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
