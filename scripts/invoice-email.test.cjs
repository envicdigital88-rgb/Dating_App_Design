const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const TEST_KEY = 're_synthetic_invoice_test_key';
const PRIVATE_MARKER = 'PRIVATE_PROVIDER_MESSAGE_DO_NOT_EXPOSE';
const FIXED_NOW = Date.parse('2026-10-16T09:00:00.000Z');

const invoice = {
  receiptNumber: 'ledger-invoice-1',
  transactionId: 'gateway-payment-123',
  customerEmail: 'paying-account@example.test',
  customerName: 'Synthetic Customer',
  amount: 500,
  wingitsCredited: 500,
  date: '2026-10-16T09:00:00.000Z',
  purchaseType: 'wingits',
};

function accepted(id = 'synthetic-resend-email-1') {
  return { data: { id }, error: null, headers: {} };
}

function rejected(statusCode, name, headers = {}) {
  return {
    data: null,
    error: { statusCode, name, message: `${PRIVATE_MARKER} ${TEST_KEY}` },
    headers,
  };
}

// Evaluate only the actual invoice helper. No application DB, session, .env,
// React renderer, Resend client, network, or live timer is loaded or invoked.
function harness(options = {}) {
  const requests = [];
  const rendered = [];
  const constructors = [];
  const errors = [];
  const delays = [];
  const timeouts = [];
  const responses = options.responses || [accepted()];
  const env = { RESEND_API_KEY: TEST_KEY, ...options.env };

  class MockResend {
    constructor(key) {
      constructors.push(key);
      this.emails = {
        send: async (payload, requestOptions) => {
          const index = requests.length;
          requests.push({ payload, serialized: JSON.stringify(payload), options: requestOptions });
          const result = responses[Math.min(index, responses.length - 1)];
          if (result instanceof Error) throw result;
          return result;
        },
      };
    }
  }
  class FixedDate extends Date {
    static now() { return FIXED_NOW; }
  }
  const InvoiceEmail = function SyntheticInvoiceTemplate() {};
  const mocks = {
    'server-only': {},
    resend: { Resend: MockResend },
    react: { createElement: (component, props) => ({ component, props }) },
    '@react-email/components': {
      render: async element => {
        rendered.push(element);
        if (options.renderError) throw options.renderError;
        return '<html><body>Synthetic rendered invoice</body></html>';
      },
    },
    '@/components/emails/InvoiceEmail': { InvoiceEmail },
  };
  const context = vm.createContext({
    process: { env },
    console: { error: (...args) => errors.push(args) },
    Date: FixedDate,
    Intl,
    Error,
    AbortSignal: { timeout: milliseconds => {
      timeouts.push(milliseconds);
      return { syntheticTimeout: milliseconds };
    } },
    setTimeout: (callback, milliseconds) => {
      delays.push(milliseconds);
      callback();
      return delays.length;
    },
  });
  const filename = path.join(projectRoot, 'lib/invoice-email.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const module = { exports: {} };
  const mockedRequire = specifier => {
    if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
    throw new Error(`Unexpected dependency in isolated invoice test: ${specifier}`);
  };
  const execute = vm.runInContext(`(function (require, module, exports) {\n${transpiled.outputText}\n})`, context, { filename });
  execute(mockedRequire, module, module.exports);
  return { send: module.exports.sendInvoiceEmail, requests, rendered, constructors, errors, delays, timeouts, InvoiceEmail };
}

function assertSafe(result, errors) {
  const output = JSON.stringify({ result, errors });
  assert.ok(!output.includes(TEST_KEY), 'Synthetic API key must not be exposed in results or logs.');
  assert.ok(!output.includes(PRIVATE_MARKER), 'Raw provider/exception messages must not be exposed.');
}

function assertStableRetry(h, expectedAttempts) {
  assert.equal(h.requests.length, expectedAttempts);
  assert.equal(h.rendered.length, 1, 'Render once before retrying.');
  assert.equal(h.constructors.length, 1);
  for (const request of h.requests) {
    assert.equal(request.payload, h.requests[0].payload, 'Retry must reuse the same frozen payload.');
    assert.equal(request.serialized, h.requests[0].serialized, 'Retry must preserve exact serialized payload.');
    assert.equal(request.options.idempotencyKey, 'payment-invoice/ledger-invoice-1');
    assert.equal(request.options.signal.syntheticTimeout, 8000);
  }
  assert.deepEqual(h.timeouts, Array(expectedAttempts).fill(8000));
}

test('missing or whitespace API keys never render or send an invoice', async () => {
  for (const key of [undefined, '', '   ']) {
    const h = harness({ env: { RESEND_API_KEY: key } });
    const result = await h.send(invoice);
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Invoice email is not configured.');
    assert.equal(h.requests.length, 0);
    assert.equal(h.rendered.length, 0);
    assert.equal(h.constructors.length, 0);
    assertSafe(result, h.errors);
  }
});

test('invalid account recipients and invoice details cannot reach the provider', async () => {
  const invalid = [
    { customerEmail: '' }, { customerEmail: 'not-an-email' },
    { customerEmail: 'Customer <customer@example.test>' },
    { customerEmail: 'first@example.test\r\nBcc: second@example.test' },
    { customerEmail: 'a'.repeat(250) + '@example.test' },
    { receiptNumber: '../ledger-1' }, { amount: 0 }, { amount: NaN },
    { amount: Infinity }, { wingitsCredited: -1 }, { wingitsCredited: 1.5 },
    { date: 'invalid-date' },
  ];
  for (const fields of invalid) {
    const h = harness();
    const result = await h.send({ ...invoice, ...fields });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Invoice details are invalid.');
    assert.equal(h.requests.length, 0);
    assert.equal(h.rendered.length, 0);
    assertSafe(result, h.errors);
  }
});

test('invalid sender headers and reply addresses fail without rendering or sending', async () => {
  for (const env of [
    { RESEND_FROM_EMAIL: 'sender@example.test\r\nBcc: attacker@example.test' },
    { RESEND_REPLY_TO: 'invalid-address' },
    { RESEND_REPLY_TO: 'support@example.test\nBcc: attacker@example.test' },
  ]) {
    const h = harness({ env });
    const result = await h.send(invoice);
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Invoice sender is not configured correctly.');
    assert.equal(h.requests.length, 0);
    assert.equal(h.rendered.length, 0);
    assertSafe(result, h.errors);
  }
});

test('successful standard invoice targets the paying account and sends HTML plus accurate plain text', async () => {
  const h = harness();
  const result = await h.send(invoice);
  assert.equal(result.ok, true);
  assert.equal(result.emailId, 'synthetic-resend-email-1');
  assertStableRetry(h, 1);
  assert.equal(h.constructors[0], TEST_KEY);
  const payload = h.requests[0].payload;
  assert.equal(payload.from, 'Wingle Mingle <no-reply@winglemingle.com>');
  assert.equal(payload.to.length, 1);
  assert.equal(payload.to[0], invoice.customerEmail);
  assert.equal(Object.hasOwn(payload, 'replyTo'), false);
  assert.equal(payload.subject, 'Wingle Mingle payment invoice - ledger-invoice-1');
  assert.equal(payload.html, '<html><body>Synthetic rendered invoice</body></html>');
  assert.match(payload.text, /Status: PAID/);
  assert.match(payload.text, /Customer: Synthetic Customer/);
  assert.match(payload.text, /Receipt number: ledger-invoice-1/);
  assert.match(payload.text, /Payment transaction: gateway-payment-123/);
  assert.match(payload.text, /Date: 16 Oct 2026, 14:30 \(Sri Lanka time\)/);
  assert.match(payload.text, /Purchase: 500 Wingits purchase/);
  assert.match(payload.text, /Amount paid: LKR 500\.00/);
  assert.match(payload.text, /Wingits credited: 500/);
  assert.equal(h.rendered[0].component, h.InvoiceEmail);
  assert.equal(h.rendered[0].props.receiptNumber, invoice.receiptNumber);
  assert.equal(h.rendered[0].props.transactionId, invoice.transactionId);
  assert.equal(h.rendered[0].props.purchaseType, 'wingits');
  assertSafe(result, h.errors);
});

test('configured sender, reply address and API key are trimmed and respected', async () => {
  const h = harness({ env: {
    RESEND_API_KEY: ` ${TEST_KEY} `,
    RESEND_FROM_EMAIL: ' Wingle Mingle Billing <billing@example.test> ',
    RESEND_REPLY_TO: ' support@example.test ',
  } });
  const result = await h.send(invoice);
  assert.equal(result.ok, true);
  assert.equal(h.constructors[0], TEST_KEY);
  assert.equal(h.requests[0].payload.from, 'Wingle Mingle Billing <billing@example.test>');
  assert.equal(h.requests[0].payload.replyTo, 'support@example.test');
  assert.equal(h.requests[0].payload.to[0], invoice.customerEmail);
});

test('Secret Wingle invoices show the paid service, separate receipt/payment IDs and bonus', async () => {
  const h = harness();
  const result = await h.send({ ...invoice, amount: 50, wingitsCredited: 20, purchaseType: 'secret_wingle' });
  assert.equal(result.ok, true);
  const payload = h.requests[0].payload;
  assert.match(payload.text, /Purchase: Secret Wingle payment/);
  assert.match(payload.text, /Amount paid: LKR 50\.00/);
  assert.match(payload.text, /Wingits bonus: 20/);
  assert.match(payload.text, /Receipt number: ledger-invoice-1/);
  assert.match(payload.text, /Payment transaction: gateway-payment-123/);
  assert.equal(h.rendered[0].props.purchaseType, 'secret_wingle');
  assert.equal(h.rendered[0].props.amount, 50);
  assert.equal(h.rendered[0].props.wingitsCredited, 20);
});

test('provider validation errors return false after one attempt without leaking provider messages', async () => {
  const h = harness({ responses: [rejected(403, 'validation_error')] });
  const result = await h.send(invoice);
  assert.equal(result.ok, false);
  assert.match(result.error, /payment is still confirmed/);
  assert.equal(h.requests.length, 1);
  assert.equal(h.delays.length, 0);
  assert.equal(h.errors[0][1].status, 403);
  assert.equal(h.errors[0][1].code, 'validation_error');
  assertSafe(result, h.errors);
});

test('provider success requires an email ID rather than an empty successful response', async () => {
  for (const data of [null, {}, { id: '' }]) {
    const h = harness({ responses: [{ data, error: null, headers: {} }] });
    const result = await h.send(invoice);
    assert.equal(result.ok, false);
    assert.equal(result.emailId, undefined);
    assert.equal(h.requests.length, 1);
    assert.equal(h.delays.length, 0);
    assertSafe(result, h.errors);
  }
});

for (const [name, failure] of [
  ['network exception', new Error(`${PRIVATE_MARKER} ${TEST_KEY}`)],
  ['SDK network error', rejected(null, 'application_error')],
  ['HTTP 503', rejected(503, 'service_unavailable')],
  ['HTTP 429 rate limit', rejected(429, 'rate_limit_exceeded')],
  ['concurrent idempotent request', rejected(409, 'concurrent_idempotent_requests')],
]) {
  test(`${name} retries the exact payload and idempotency key before succeeding`, async () => {
    const h = harness({ responses: [failure, accepted('retried-email')] });
    const result = await h.send(invoice);
    assert.equal(result.ok, true);
    assert.equal(result.emailId, 'retried-email');
    assertStableRetry(h, 2);
    assert.deepEqual(h.delays, [500]);
    assertSafe(result, h.errors);
  });

  test(`${name} stops after three attempts with bounded backoff and a safe failure`, async () => {
    const h = harness({ responses: [failure] });
    const result = await h.send(invoice);
    assert.equal(result.ok, false);
    assertStableRetry(h, 3);
    assert.deepEqual(h.delays, [500, 1000]);
    assertSafe(result, h.errors);
  });
}

test('invalid credentials, invalid idempotent payload and quota errors never retry', async () => {
  for (const response of [
    rejected(401, 'validation_error'), rejected(401, 'missing_api_key'),
    rejected(403, 'restricted_api_key'), rejected(403, 'suspended_api_key'),
    rejected(409, 'invalid_idempotent_request'),
    rejected(429, 'daily_quota_exceeded'), rejected(429, 'monthly_quota_exceeded'),
  ]) {
    const h = harness({ responses: [response] });
    const result = await h.send(invoice);
    assert.equal(result.ok, false);
    assert.equal(h.requests.length, 1);
    assert.deepEqual(h.delays, []);
    assertSafe(result, h.errors);
  }
});

test('retry-after seconds and HTTP dates are respected up to the 2500ms retry bound', async () => {
  for (const [header, milliseconds] of [
    ['2', 2000], ['2.5', 2500], ['0', 0],
    [new Date(FIXED_NOW + 2000).toUTCString(), 2000],
    [new Date(FIXED_NOW - 1000).toUTCString(), 0],
    ['not-a-date', 500],
  ]) {
    const h = harness({ responses: [rejected(429, 'rate_limit_exceeded', { 'retry-after': header }), accepted()] });
    const result = await h.send(invoice);
    assert.equal(result.ok, true);
    assertStableRetry(h, 2);
    assert.deepEqual(h.delays, [milliseconds]);
    assertSafe(result, h.errors);
  }
});

test('retry-after exceeding the retry bound stops without sleeping or prematurely retrying', async () => {
  for (const header of ['2.501', '10', new Date(FIXED_NOW + 10000).toUTCString()]) {
    const h = harness({ responses: [rejected(503, 'service_unavailable', { 'retry-after': header }), accepted()] });
    const result = await h.send(invoice);
    assert.equal(result.ok, false);
    assert.equal(h.requests.length, 1);
    assert.deepEqual(h.delays, []);
    assertSafe(result, h.errors);
  }
});

test('untrusted provider code text is sanitized together with raw provider messages', async () => {
  const h = harness({ responses: [rejected(403, `${PRIVATE_MARKER} ${TEST_KEY}`)] });
  const result = await h.send(invoice);
  assert.equal(result.ok, false);
  assert.equal(h.errors[0][1].code, 'unknown_error');
  assertSafe(result, h.errors);
});

test('render failure cannot send mail and never exposes the renderer exception', async () => {
  const h = harness({ renderError: new Error(`${PRIVATE_MARKER} ${TEST_KEY}`) });
  const result = await h.send(invoice);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Invoice could not be prepared.');
  assert.equal(h.rendered.length, 1);
  assert.equal(h.requests.length, 0);
  assert.equal(h.constructors.length, 0);
  assert.deepEqual(h.delays, []);
  assertSafe(result, h.errors);
});
