const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const TEST_APP_KEY = 'synthetic-test-app-key';
const UPSTREAM_SECRET = 'private-upstream-response-marker';

function response(body, status = 200, contentType = 'application/json') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: name => name.toLowerCase() === 'content-type' ? contentType : null },
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
  };
}

// Only these two source modules are evaluated. Database, sessions, notification
// helpers and verification are mocked; no .env or database module is loaded.
function harness(options = {}) {
  const requests = [];
  const ledgers = [];
  const updates = [];
  const errors = [];
  const env = { GENIE_APP_KEY: TEST_APP_KEY, ...options.env };
  let session = options.session === undefined ? { userId: 'user-test' } : options.session;
  const context = vm.createContext({
    URL,
    AbortSignal,
    Error,
    process: { env },
    console: {
      // Capture only the application's sanitized diagnostics in this test VM.
      error: (...args) => errors.push(args),
    },
    fetch: async (url, init) => {
      requests.push({ url: String(url), init });
      if (options.fetchError) throw options.fetchError;
      return options.response || response({ url: 'https://checkout.geniebiz.lk/test-payment' });
    },
  });
  const mocks = {
    'node:crypto': crypto,
    '@/lib/session': { getSession: async () => session },
    '@/lib/db': {
      db: { orm: { public: {
        TransactionLedger: {
          create: async input => {
            if (options.createError) throw options.createError;
            const ledger = { ...input, id: `ledger-${ledgers.length + 1}` };
            ledgers.push(ledger);
            return ledger;
          },
          where: query => ({ update: async input => {
            if (options.updateError) throw options.updateError;
            updates.push({ query, input });
            const ledger = ledgers.find(value => value.id === query.id);
            if (!ledger) throw new Error('Test ledger does not exist.');
            Object.assign(ledger, input);
            return ledger;
          } }),
        },
        User: { where: () => ({ first: async () => ({ id: 'user-test', phone: '0771111111' }) }) },
      } } },
    },
    '@/lib/notify': { formatNotifyPhoneNumber: value => String(value).replace(/\D/g, '').replace(/^0/, '94') },
    '@/lib/payment-verification': {
      checkPendingGeniePayment: async () => { throw new Error('Verification is outside this creation test.'); },
      verifyGeniePayment: async () => { throw new Error('Verification is outside this creation test.'); },
    },
  };
  const cache = new Map();
  function load(relativePath) {
    if (cache.has(relativePath)) return cache.get(relativePath).exports;
    const filename = path.join(projectRoot, relativePath);
    const source = fs.readFileSync(filename, 'utf8');
    const result = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    });
    const module = { exports: {} };
    cache.set(relativePath, module);
    const mockedRequire = specifier => {
      if (specifier === '@/lib/genie') return load('lib/genie.ts');
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      throw new Error(`Unexpected dependency in isolated payment test: ${specifier}`);
    };
    const execute = vm.runInContext(`(function (require, module, exports) {\n${result.outputText}\n})`, context, { filename });
    execute(mockedRequire, module, module.exports);
    return module.exports;
  }
  return {
    genie: load('lib/genie.ts'),
    actions: load('app/actions/payments.ts'),
    requests, ledgers, updates, errors,
    setSession: value => { session = value; },
  };
}

function assertNoSensitiveOutput(result, errors) {
  const output = JSON.stringify({ result, errors });
  assert.ok(!output.includes(TEST_APP_KEY), 'The App Key must not appear in errors or logs.');
  assert.ok(!output.includes(UPSTREAM_SECRET), 'The upstream body must not appear in errors or logs.');
  assert.ok(!output.includes('<html'), 'Raw HTML must not appear in errors or logs.');
}

test('Genie config chooses official live and UAT hosts and normalizes /public', () => {
  const { genie } = harness();
  for (const mode of [undefined, 'production', 'live', ' LIVE ']) {
    const config = genie.getGenieConfig({ GENIE_APP_KEY: ` ${TEST_APP_KEY} `, GENIE_ENV: mode });
    assert.equal(config.apiUrl, 'https://api.geniebiz.lk');
    assert.equal(config.appKey, TEST_APP_KEY);
    assert.equal(config.isSandbox, false);
  }
  for (const mode of ['sandbox', 'uat']) {
    const config = genie.getGenieConfig({ GENIE_APP_KEY: TEST_APP_KEY, GENIE_ENV: mode });
    assert.equal(config.apiUrl, 'https://api.uat.geniebiz.lk');
    assert.equal(config.isSandbox, true);
  }
  for (const origin of ['https://api.geniebiz.lk', 'https://api.uat.geniebiz.lk']) {
    for (const suffix of ['', '/', '/public', '/public/']) {
      const config = genie.getGenieConfig({ GENIE_APP_KEY: TEST_APP_KEY, GENIE_API_URL: origin + suffix });
      assert.equal(config.apiUrl, origin);
      assert.equal(config.isSandbox, origin.includes('.uat.'));
    }
  }
});

test('Genie config rejects conflicting environments, arbitrary URL components and invalid keys', () => {
  const { genie } = harness();
  for (const [mode, apiUrl] of [
    ['live', 'https://api.uat.geniebiz.lk'],
    ['sandbox', 'https://api.geniebiz.lk/public'],
  ]) {
    assert.throws(() => genie.getGenieConfig({ GENIE_APP_KEY: TEST_APP_KEY, GENIE_ENV: mode, GENIE_API_URL: apiUrl }), /different environments/);
  }
  for (const apiUrl of [
    'https://geniebiz.lk',
    'https://api.geniebiz.lk.attacker.example',
    'http://api.geniebiz.lk',
    'https://api.geniebiz.lk:8443',
    'https://api.geniebiz.lk/public/transactions',
    'https://api.geniebiz.lk/arbitrary',
    'https://api.geniebiz.lk?secret=1',
    'https://api.geniebiz.lk#fragment',
    'https://user:pass@api.geniebiz.lk',
    'not-a-url',
  ]) {
    assert.throws(() => genie.getGenieConfig({ GENIE_APP_KEY: TEST_APP_KEY, GENIE_API_URL: apiUrl }), /GENIE_API_URL/);
  }
  for (const appKey of [undefined, '', '   ']) {
    assert.throws(() => genie.getGenieConfig({ GENIE_APP_KEY: appKey }), /not configured/);
  }
  assert.throws(() => genie.getGenieConfig({ GENIE_APP_KEY: 'Bearer synthetic-key' }), /raw Genie App Key/);
  assert.throws(() => genie.getGenieConfig({ GENIE_APP_KEY: TEST_APP_KEY, GENIE_ENV: 'unknown' }), /GENIE_ENV/);
});

test('Wingits creation sends raw authorization, minor units and the documented SHA1 signature', async () => {
  const h = harness({ env: { GENIE_API_URL: 'https://api.geniebiz.lk/public/' } });
  const result = await h.actions.buyWingitsAction(100, 20);
  assert.equal(result.ok, true);
  assert.equal(result.ledgerId, 'ledger-1');
  assert.equal(h.ledgers.length, 1);
  assert.equal(h.ledgers[0].amountLKR, 100);
  assert.equal(h.ledgers[0].wingitsCredited, 20);
  assert.equal(h.ledgers[0].status, 'PENDING');
  assert.equal(h.requests.length, 1);
  const { url, init } = h.requests[0];
  assert.equal(url, 'https://api.geniebiz.lk/public/transactions');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, TEST_APP_KEY);
  assert.equal(init.headers.Accept, 'application/json');
  assert.equal(init.headers['Content-Type'], 'application/json');
  assert.equal(init.redirect, 'manual');
  assert.equal(init.cache, 'no-store');
  const body = JSON.parse(init.body);
  assert.equal(body.amount, 10000);
  assert.equal(body.currency, 'LKR');
  assert.equal(body.localId, 'ledger-1');
  const signature = crypto.createHash('sha1').update(`amount=10000&currency=LKR&apiKey=${TEST_APP_KEY}`).digest('hex');
  assert.equal(body.signature, signature);
  assert.equal(body.signMethod, 'sha1');
  assert.equal(body.apiVersion, '2.0');
  assert.equal(body.redirectUrl, 'https://www.winglemingle.com/payment-success?ledgerId=ledger-1');
  assert.equal(body.webhook, 'https://www.winglemingle.com/api/webhooks/dialog');
});

test('HTML creation failures return sanitized diagnostics without leaking upstream content or keys', async () => {
  const h = harness({ response: response(`<!doctype html><html>${UPSTREAM_SECRET} ${TEST_APP_KEY}</html>`, 200, 'text/html') });
  const result = await h.actions.buyWingitsAction(100, 20);
  assert.equal(result.ok, false);
  assert.match(result.error, /web page instead of JSON/);
  assert.equal(h.errors.length, 1);
  assert.equal(h.errors[0][1].status, 200);
  assert.equal(h.errors[0][1].contentType, 'text/html');
  assertNoSensitiveOutput(result, h.errors);
});

test('redirect creation failures are rejected without following or reading gateway HTML', async () => {
  let bodyReads = 0;
  const redirected = response('', 302, 'text/html');
  redirected.text = async () => { bodyReads++; return `<html>${TEST_APP_KEY} ${UPSTREAM_SECRET}</html>`; };
  const h = harness({ response: redirected });
  const result = await h.actions.buyWingitsAction(100, 20);
  assert.equal(result.ok, false);
  assert.match(result.error, /redirected the API request/);
  assert.equal(h.requests[0].init.redirect, 'manual');
  assert.equal(bodyReads, 0);
  assertNoSensitiveOutput(result, h.errors);
});

test('authorization and network creation failures do not expose upstream errors', async () => {
  for (const status of [401, 403, 500]) {
    const h = harness({ response: response({ error: `${TEST_APP_KEY} ${UPSTREAM_SECRET}` }, status) });
    const result = await h.actions.buyWingitsAction(100, 20);
    assert.equal(result.ok, false);
    assert.match(result.error, new RegExp(`HTTP ${status}`));
    assertNoSensitiveOutput(result, h.errors);
  }
  const h = harness({ fetchError: new Error(`${TEST_APP_KEY} ${UPSTREAM_SECRET}`) });
  const result = await h.actions.buyWingitsAction(100, 20);
  assert.equal(result.ok, false);
  assert.match(result.error, /Could not reach Dialog Genie/);
  assertNoSensitiveOutput(result, h.errors);
});

test('the gateway must supply a valid HTTPS payment URL', async () => {
  const { genie } = harness();
  for (const field of ['url', 'redirectUrl', 'shortUrl', 'paymentUrl']) {
    assert.equal(genie.getGeniePaymentUrl({ [field]: 'https://checkout.geniebiz.lk/test' }), 'https://checkout.geniebiz.lk/test');
  }
  for (const data of [{}, { url: 1 }, { url: 'not-a-url' }, { url: 'http://checkout.geniebiz.lk/test' }, { url: 'javascript:alert(1)' }, { url: 'https://user:pass@checkout.geniebiz.lk/test' }]) {
    assert.throws(() => genie.getGeniePaymentUrl(data), /payment URL/);
  }
  const h = harness({ response: response({ url: 'http://checkout.geniebiz.lk/test' }) });
  const result = await h.actions.buyWingitsAction(100, 20);
  assert.equal(result.ok, false);
  assert.match(result.error, /invalid payment URL/);
});

test('untrusted amounts and Wingits mismatches cannot create a ledger or call the gateway', async () => {
  for (const [amount, wingits] of [
    [100, 1000], [100, '20'], [95, 19], [100.5, 20.1], [NaN, NaN],
    [Infinity, Infinity], [-100, -20], [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  ]) {
    const h = harness();
    const result = await h.actions.buyWingitsAction(amount, wingits);
    assert.equal(result.ok, false);
    assert.ok(result.error.includes('Wingits amount') || result.error.includes('rate'));
    assert.equal(h.ledgers.length, 0);
    assert.equal(h.requests.length, 0);
  }
});

test('unauthorized callers cannot create standard or Secret Wingle payments', async () => {
  for (const session of [null, {}, { userId: '' }]) {
    const h = harness({ session });
    for (const result of [
      await h.actions.buyWingitsAction(100, 20),
      await h.actions.initiateSecretWinglePaymentAction('0772222222', 'Hello'),
    ]) {
      assert.equal(result.ok, false);
      assert.equal(result.error, 'Unauthorized');
    }
    assert.equal(h.ledgers.length, 0);
    assert.equal(h.requests.length, 0);
  }
});

test('invalid server configuration fails before creating a ledger or sending a credential', async () => {
  for (const env of [
    { GENIE_APP_KEY: '' },
    { GENIE_APP_KEY: 'Bearer synthetic-key' },
    { GENIE_API_URL: 'https://attacker.example' },
    { GENIE_ENV: 'sandbox', GENIE_API_URL: 'https://api.geniebiz.lk' },
    { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' },
  ]) {
    const h = harness({ env });
    const result = await h.actions.buyWingitsAction(100, 20);
    assert.equal(result.ok, false);
    assert.equal(h.ledgers.length, 0);
    assert.equal(h.requests.length, 0);
    assertNoSensitiveOutput(result, h.errors);
  }
});

test('standard Wingits and Secret Wingle share the same UAT gateway transport', async () => {
  const h = harness({ env: { GENIE_ENV: 'sandbox', GENIE_API_URL: 'https://api.uat.geniebiz.lk/public', NEXT_PUBLIC_APP_URL: 'https://winglemingle.com/profile' } });
  const standard = await h.actions.buyWingitsAction(100, 20);
  const secret = await h.actions.initiateSecretWinglePaymentAction('0772222222', ' Hello ', { recipientName: ' Recipient ' });
  assert.equal(standard.ok, true);
  assert.equal(secret.ok, true);
  assert.equal(h.requests.length, 2);
  for (const request of h.requests) {
    assert.equal(request.url, 'https://api.uat.geniebiz.lk/public/transactions');
    assert.equal(request.init.method, 'POST');
    assert.equal(request.init.headers.Authorization, TEST_APP_KEY);
    assert.equal(request.init.redirect, 'manual');
  }
  const body = JSON.parse(h.requests[1].init.body);
  assert.equal(body.amount, 5000);
  assert.equal(body.signature, crypto.createHash('sha1').update(`amount=5000&currency=LKR&apiKey=${TEST_APP_KEY}`).digest('hex'));
  assert.equal(body.redirectUrl, 'https://winglemingle.com/payment-success?ledgerId=ledger-2&type=secret_wingle');
  assert.equal(body.webhook, 'https://winglemingle.com/api/webhooks/dialog');
  assert.equal(h.ledgers[1].amountLKR, 50);
  assert.equal(h.ledgers[1].wingitsCredited, 20);
  const metadata = JSON.parse(h.ledgers[1].transactionReference);
  assert.equal(metadata.type, 'secret_wingle');
  assert.equal(metadata.message, 'Hello');
  assert.equal(metadata.recipientName, 'Recipient');
});

test('unexpected database create and update errors do not leak messages or credentials', async () => {
  const databaseUrl = 'postgresql://synthetic-user:synthetic-password@database.example/private';
  const privateMessage = `Database failure: ${databaseUrl} ${TEST_APP_KEY} ${UPSTREAM_SECRET}`;
  for (const operation of ['create', 'update']) {
    const h = harness({
      [`${operation}Error`]: new Error(privateMessage),
      response: response({ id: 'provider-transaction-for-update', url: 'https://checkout.geniebiz.lk/test-payment' }),
    });
    const result = await h.actions.buyWingitsAction(100, 20);
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Could not initialize the payment. Please try again shortly.');
    assert.equal(h.requests.length, operation === 'create' ? 0 : 1);
    assert.equal(h.updates.length, 0);
    assert.equal(h.errors.length, 1);
    assertNoSensitiveOutput(result, h.errors);
    assert.ok(!JSON.stringify({ result, errors: h.errors }).includes(databaseUrl), 'Database credentials must not appear in errors or logs.');
  }
});

test('the exact provider transaction ID is persisted for standard and Secret Wingle payments', async () => {
  const standardId = 'provider-standard-transaction-123';
  const standard = harness({ response: response({ id: standardId, url: 'https://checkout.geniebiz.lk/standard' }) });
  const standardResult = await standard.actions.buyWingitsAction(100, 20);
  assert.equal(standardResult.ok, true);
  assert.equal(standard.updates.length, 1);
  assert.equal(standard.updates[0].query.id, standardResult.ledgerId);
  assert.equal(standard.updates[0].input.transactionReference, standardId);
  assert.equal(standard.ledgers[0].transactionReference, standardId);

  const secretId = 'provider-secret-transaction-456';
  const secret = harness({ response: response({ id: secretId, url: 'https://checkout.geniebiz.lk/secret' }) });
  const secretResult = await secret.actions.initiateSecretWinglePaymentAction('0772222222', ' Hello ', { recipientName: ' Recipient ' });
  assert.equal(secretResult.ok, true);
  assert.equal(secret.updates.length, 1);
  assert.equal(secret.updates[0].query.id, secretResult.ledgerId);
  const metadata = JSON.parse(secret.ledgers[0].transactionReference);
  assert.equal(metadata.gatewayTransactionId, secretId);
  assert.equal(metadata.type, 'secret_wingle');
  assert.equal(metadata.targetPhone, '94772222222');
  assert.equal(metadata.message, 'Hello');
  assert.equal(metadata.recipientName, 'Recipient');
});
