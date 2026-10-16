import crypto from 'node:crypto';

export class GenieError extends Error {}

const GENIE_ORIGINS = {
  production: 'https://api.geniebiz.lk',
  sandbox: 'https://api.uat.geniebiz.lk',
} as const;

export function getGenieConfig(env: NodeJS.ProcessEnv = process.env) {
  const appKey = (env.GENIE_APP_KEY || '').trim();
  if (!appKey) {
    throw new GenieError('Payment gateway is not configured. Set GENIE_APP_KEY on the server.');
  }
  if (/^Bearer\s/i.test(appKey)) {
    throw new GenieError('GENIE_APP_KEY must contain the raw Genie App Key, without a Bearer prefix.');
  }

  const mode = (env.GENIE_ENV || '').trim().toLowerCase();
  if (mode && !['production', 'live', 'sandbox', 'uat'].includes(mode)) {
    throw new GenieError('GENIE_ENV must be production or sandbox.');
  }
  const rawUrl = (env.GENIE_API_URL || '').trim();
  let configuredOrigin: string | undefined;
  if (rawUrl) {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new GenieError('GENIE_API_URL must be an official Genie API base URL.');
    }
    // Accept the documented /public base too, without appending it twice.
    if (
      !Object.values(GENIE_ORIGINS).some(origin => origin === url.origin) ||
      !['', '/', '/public', '/public/'].includes(url.pathname) ||
      url.username || url.password || url.search || url.hash
    ) {
      throw new GenieError('GENIE_API_URL must be https://api.geniebiz.lk (live) or https://api.uat.geniebiz.lk (sandbox).');
    }
    configuredOrigin = url.origin;
  }

  const explicitSandbox = mode === 'sandbox' || mode === 'uat';
  const isSandbox = mode ? explicitSandbox : configuredOrigin === GENIE_ORIGINS.sandbox;
  const apiUrl = GENIE_ORIGINS[isSandbox ? 'sandbox' : 'production'];
  if (configuredOrigin && configuredOrigin !== apiUrl) {
    throw new GenieError('GENIE_ENV and GENIE_API_URL select different environments. Use matching Genie credentials and API URL.');
  }
  return { apiUrl, appKey, isSandbox };
}

export function createGenieSignature(amount: number, appKey: string) {
  return crypto.createHash('sha1')
    .update(`amount=${amount}&currency=LKR&apiKey=${appKey}`)
    .digest('hex');
}

export async function genieRequest(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<Record<string, any>> {
  const { apiUrl, appKey } = getGenieConfig();
  if (!path.startsWith('/public/transactions') || path.includes('\\')) {
    throw new GenieError('Invalid Genie API path.');
  }
  const endpoint = new URL(path, apiUrl);
  if (endpoint.origin !== apiUrl) throw new GenieError('Invalid Genie API origin.');

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: options.method || 'GET',
      headers: {
        Authorization: appKey,
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new GenieError('Could not reach Dialog Genie. Please try again shortly.');
  }

  const contentType = response.headers.get('content-type') || '';
  const diagnostics = { endpoint: endpoint.origin + endpoint.pathname, status: response.status, contentType };
  if (response.status >= 300 && response.status < 400) {
    console.error('Genie API unexpectedly redirected', diagnostics);
    throw new GenieError('Payment gateway redirected the API request. Check GENIE_API_URL; use the official API host.');
  }

  let data: Record<string, any>;
  try {
    const parsed: unknown = JSON.parse(await response.text());
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new GenieError();
    data = parsed as Record<string, any>;
  } catch {
    console.error('Genie API returned a non-JSON response', diagnostics);
    throw new GenieError('Payment gateway returned a web page instead of JSON. Check the Genie API URL and gateway access in the server logs.');
  }

  if (!response.ok) {
    // Never return/log the upstream body: it can contain payment or customer data.
    console.error('Genie API rejected a request', diagnostics);
    if (response.status === 401 || response.status === 403) {
      throw new GenieError(`Dialog Genie authorization failed (HTTP ${response.status}). Check the App Key, live/sandbox environment and merchant access.`);
    }
    throw new GenieError(`Dialog Genie could not process the request (HTTP ${response.status}). Please try again or contact support.`);
  }
  return data;
}

export function getGeniePaymentUrl(data: Record<string, unknown>) {
  const value = data.url || data.redirectUrl || data.shortUrl || data.paymentUrl;
  if (typeof value !== 'string') throw new GenieError('Dialog Genie did not return a payment URL.');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new GenieError('Dialog Genie returned an invalid payment URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new GenieError('Dialog Genie returned an invalid payment URL.');
  }
  return url.toString();
}
