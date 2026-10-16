// Run with: node --experimental-strip-types scripts/payment-verification.test.ts
// The source is evaluated with explicit dependency mocks: no application DB, keys, or network are loaded.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const taskRequire = createRequire(import.meta.url);
const ledgerId = 'purchase-1';
const transactionId = 'gateway-1';

function evaluate(path: string, dependencies: Record<string, unknown>, errors: unknown[][] = []) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const output = { exports: {} as Record<string, any> };
  runInNewContext(code, {
    exports: output.exports,
    module: output,
    require(name: string) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unmocked dependency: ${name}`);
    },
    console: { error(...args: unknown[]) { errors.push(args); } },
    process: { env: {} },
    Response,
    URL,
  });
  return output.exports;
}

function fixture(options: {
  secret?: boolean;
  sessionUser?: string | null;
  savedId?: boolean;
  invoiceFailure?: boolean;
  invoiceThrow?: boolean;
  smsThrow?: boolean;
} = {}) {
  const ledger: any = {
    id: ledgerId,
    userId: 'buyer',
    amountLKR: options.secret ? 50 : 100,
    wingitsCredited: options.secret ? 20 : 100,
    status: 'PENDING',
    createdAt: new Date('2026-10-16T06:30:00.000Z'),
    transactionReference: options.secret
      ? JSON.stringify({ type: 'secret_wingle', targetPhone: '94700000000', message: 'Fixture message',
          ...(options.savedId === false ? {} : { gatewayTransactionId: transactionId }) })
      : options.savedId === false ? null : transactionId,
  };
  const users: any[] = [
    { id: 'buyer', name: 'Fixture Buyer', email: 'buyer@example.test', phone: '94711111111', wingitsBalance: 20 },
    { id: 'recipient', email: 'recipient@example.test', phone: '94700000000', wingitsBalance: 5 },
  ];
  const gateway: Record<string, any> = {
    id: transactionId, localId: ledgerId, amount: options.secret ? 5000 : 10000, currency: 'LKR', state: 'CONFIRMED',
  };
  const state = {
    ledger, users, gateway,
    list: [] as unknown[], calls: [] as string[], writes: [] as string[], records: [] as any[],
    claims: 0, invoices: 0, sms: 0, pushes: 0, pusher: 0,
    invoiceInputs: [] as Record<string, unknown>[], events: [] as string[], errors: [] as unknown[][],
  };
  const fields = Object.fromEntries(['id', 'status', 'wingitsBalance'].map(name => [name, { name }]));
  const functions = {
    eq(field: any, value: unknown) { return { name: field.name, value }; },
    raw(_parts: TemplateStringsArray, _column: unknown, amount: number) {
      return { returns() { return { increment: amount }; } };
    },
  };
  function table(name: string) {
    return {
      update(value: any) {
        const plan = { name, value: typeof value === 'function' ? value(fields, functions) : value, filters: [] as any[] };
        const builder = {
          where(callback: any) { plan.filters.push(callback(fields, functions)); return builder; },
          build() { return plan; },
        };
        return builder;
      },
    };
  }
  function model(name: string) {
    return {
      where(filter: any) {
        return { async first() {
          if (name === 'TransactionLedger') {
            return Object.entries(filter).every(([key, value]) => ledger[key] === value) ? { ...ledger } : null;
          }
          if (name === 'User') {
            if (typeof filter === 'function') return { ...users[1] };
            const user = users.find(item => Object.entries(filter).every(([key, value]) => item[key] === value));
            return user ? { ...user } : null;
          }
          throw new Error('Unexpected model read');
        } };
      },
      async create(value: any) {
        state.writes.push(name);
        const record = { id: crypto.randomUUID(), ...value };
        state.records.push({ model: name, ...record });
        return record;
      },
    };
  }
  const orm = { public: Object.fromEntries(
    ['TransactionLedger', 'User', 'WingitsTransaction', 'SecretWingle', 'Notification'].map(name => [name, model(name)]),
  ) };
  const db = {
    orm,
    async transaction(callback: any) {
      return callback({
        orm,
        sql: { public: { transactionLedger: table('ledger'), user: table('user') } },
        async execute(plan: any) {
          const row = plan.name === 'ledger' ? ledger : users.find(user => plan.filters.every((filter: any) => user[filter.name] === filter.value));
          if (!row || !plan.filters.every((filter: any) => row[filter.name] === filter.value)) return { affectedRows: 0 };
          if (plan.name === 'ledger') {
            state.claims++;
            Object.assign(row, plan.value);
          } else {
            row.wingitsBalance += plan.value.wingitsBalance.increment;
          }
          return { affectedRows: 1 };
        },
      });
    },
  };
  const api = evaluate('../lib/payment-verification.ts', {
    'server-only': {},
    'node:crypto': taskRequire('node:crypto'),
    '@/lib/db': { db },
    '@/lib/session': { async getSession() {
      return options.sessionUser === null ? null : { userId: options.sessionUser || 'buyer' };
    } },
    '@/lib/genie': { async genieRequest(path: string) {
      state.calls.push(path);
      return path.includes('?') ? { items: state.list } : { ...gateway };
    } },
    '@/lib/invoice-email': { async sendInvoiceEmail(input: Record<string, unknown>) {
      state.invoices++;
      state.invoiceInputs.push(input);
      state.events.push('invoice');
      if (options.invoiceThrow) throw new Error('synthetic-private-email-provider-marker');
      return options.invoiceFailure ? { ok: false, error: 'synthetic-private-email-provider-marker' } : { ok: true };
    } },
    '@/lib/notify': {
      getPhoneVariants(phone: string) { return [phone]; },
      buildSecretWingleSms() { return 'Fixture SMS'; },
      async sendNotifySms() {
        state.sms++;
        state.events.push('sms');
        if (options.smsThrow) throw new Error('synthetic-private-sms-provider-marker');
      },
    },
    '@/app/actions/push': { async sendPushNotificationAction() { state.pushes++; } },
    '@/lib/pusher': { pusherServer: { async trigger() { state.pusher++; } } },
  }, state.errors);
  return { api, state };
}

let passed = 0;
async function check(name: string, run: () => Promise<void>) {
  await run();
  passed++;
  console.log(`PASS ${name}`);
}

await check('unauthenticated and foreign-ledger calls do not reach gateway or write', async () => {
  for (const sessionUser of [null, 'someone-else']) {
    const { api, state } = fixture({ sessionUser });
    assert.equal((await api.verifyGeniePayment(ledgerId, transactionId)).ok, false);
    assert.equal((await api.checkPendingGeniePayment(ledgerId)).ok, false);
    assert.equal(state.calls.length, 0);
    assert.equal(state.claims, 0);
    assert.equal(state.invoices, 0);
  }
});

await check('saved standard transaction ID verifies exact transaction before credit', async () => {
  const { api, state } = fixture();
  const result = await api.checkPendingGeniePayment(ledgerId);
  assert.equal(result.ok, true);
  assert.equal(result.invoiceSent, true);
  assert.deepEqual(state.calls, [`/public/transactions/${transactionId}`]);
  assert.equal(state.users[0].wingitsBalance, 120);
  assert.equal(state.invoices, 1);
});

await check('localId, ID, amount, currency, and ledger terms must match', async () => {
  for (const mutation of [
    { localId: 'different-purchase' }, { id: 'different-payment' }, { amount: 1 }, { currency: 'USD' }, { amount: '10000' },
  ]) {
    const { api, state } = fixture();
    Object.assign(state.gateway, mutation);
    assert.equal((await api.verifyGeniePayment(ledgerId, transactionId)).ok, false);
    assert.equal(state.claims, 0);
    assert.equal(state.users[0].wingitsBalance, 20);
    assert.equal(state.invoices, 0);
  }
  const { api, state } = fixture();
  state.ledger.wingitsCredited = 100000;
  assert.equal((await api.verifyGeniePayment(ledgerId, transactionId)).ok, false);
  assert.equal(state.claims, 0);
  assert.equal(state.invoices, 0);
});

await check('pending, cancelled and unsupported success states cannot credit', async () => {
  for (const gatewayState of ['PENDING', 'QR_CODE_GENERATED', 'CANCELLED', 'FAILED', 'SUCCESS', 'COMPLETED']) {
    const { api, state } = fixture();
    state.gateway.state = gatewayState;
    assert.equal((await api.verifyGeniePayment(ledgerId, transactionId)).ok, false);
    assert.equal(state.claims, 0);
    assert.equal(state.invoices, 0);
  }
});

await check('official AUTHORIZED state can complete bound payment', async () => {
  const { api, state } = fixture();
  state.gateway.state = 'AUTHORIZED';
  assert.equal((await api.verifyGeniePayment(ledgerId, transactionId)).ok, true);
  assert.equal(state.users[0].wingitsBalance, 120);
});

await check('concurrent poll, return and webhook credit exactly once', async () => {
  const { api, state } = fixture();
  const results = await Promise.all([
    api.verifyGeniePayment(ledgerId, transactionId),
    api.checkPendingGeniePayment(ledgerId),
    api.settleGenieWebhook(transactionId),
  ]);
  assert.equal(results.every(result => result.ok), true);
  assert.equal(state.claims, 1);
  assert.equal(state.users[0].wingitsBalance, 120);
  assert.equal(state.records.filter(record => record.model === 'WingitsTransaction').length, 1);
  assert.equal(state.invoices, 1);
});

await check('legacy list ignores unrelated transaction and verifies matching candidate by ID', async () => {
  const { api, state } = fixture({ savedId: false });
  state.list = [
    { id: 'unrelated', localId: 'other-purchase', state: 'CONFIRMED' },
    { id: transactionId, localId: ledgerId, state: 'CONFIRMED' },
  ];
  assert.equal((await api.checkPendingGeniePayment(ledgerId)).ok, true);
  assert.deepEqual(state.calls, [`/public/transactions?localId=${ledgerId}`, `/public/transactions/${transactionId}`]);
});

await check('legacy list without matching purchase stays pending', async () => {
  const { api, state } = fixture({ savedId: false });
  state.list = [{ id: 'unrelated', localId: 'other-purchase', state: 'CONFIRMED' }];
  const result = await api.checkPendingGeniePayment(ledgerId);
  assert.equal(result.pending, true);
  assert.equal(state.claims, 0);
  assert.equal(state.invoices, 0);
});

await check('Secret Wingle metadata, both rewards, SMS and notifications settle once', async () => {
  const { api, state } = fixture({ secret: true });
  const first = await api.checkPendingGeniePayment(ledgerId);
  const duplicate = await api.settleGenieWebhook(transactionId);
  assert.equal(first.ok && first.isSecretWingle && duplicate.ok && duplicate.isSecretWingle, true);
  assert.equal(first.invoiceSent, true);
  assert.equal(duplicate.invoiceSent, undefined);
  assert.equal(state.users[0].wingitsBalance, 40);
  assert.equal(state.users[1].wingitsBalance, 25);
  assert.equal(state.records.filter(record => record.model === 'SecretWingle').length, 1);
  assert.equal(state.records.filter(record => record.model === 'Notification').length, 1);
  assert.equal(state.sms, 1);
  assert.equal(state.pushes, 1);
  assert.equal(state.pusher, 1);
  assert.equal(state.invoices, 1);
  assert.deepEqual(state.events, ['invoice', 'sms']);
  assert.equal(JSON.parse(state.ledger.transactionReference).gatewayTransactionId, transactionId);
  assert.deepEqual(state.calls, [`/public/transactions/${transactionId}`, `/public/transactions/${transactionId}`]);
});

await check('both purchase types invoice the stored account using stable ledger and gateway references', async () => {
  for (const secret of [false, true]) {
    const { api, state } = fixture({ secret });
    state.gateway.customerEmail = 'untrusted-recipient@example.test';
    state.gateway.customerName = 'Untrusted provider name';
    state.gateway.date = '2030-01-01T00:00:00Z';
    const result = await api.settleGenieWebhook(transactionId);
    assert.equal(result.ok, true);
    assert.equal(result.invoiceSent, true);
    assert.equal(state.invoices, 1);
    const input = state.invoiceInputs[0];
    assert.equal(input.customerEmail, state.users[0].email);
    assert.equal(input.customerName, state.users[0].name);
    assert.equal(input.receiptNumber, ledgerId);
    assert.equal(input.transactionId, transactionId);
    assert.equal(input.date, state.ledger.createdAt.toString());
    assert.equal(input.purchaseType, secret ? 'secret_wingle' : 'wingits');
    assert.equal(input.amount, secret ? 50 : 100);
    assert.equal(input.wingitsCredited, secret ? 20 : 100);
    assert.ok(!Object.values(input).includes(state.gateway.customerEmail));
  }
});

await check('invoice failures preserve confirmed payment, credits, and duplicate suppression', async () => {
  for (const secret of [false, true]) {
    for (const failure of ['invoiceFailure', 'invoiceThrow'] as const) {
      const { api, state } = fixture({ secret, [failure]: true });
      const first = await api.verifyGeniePayment(ledgerId, transactionId);
      const duplicate = await api.settleGenieWebhook(transactionId);
      assert.equal(first.ok, true);
      assert.equal(first.invoiceSent, false);
      assert.equal(duplicate.ok, true);
      assert.equal(duplicate.invoiceSent, undefined);
      assert.equal(state.ledger.status, 'SUCCESS');
      assert.equal(state.users[0].wingitsBalance, secret ? 40 : 120);
      assert.equal(state.claims, 1);
      assert.equal(state.invoices, 1);
      assert.ok(!JSON.stringify({ first, duplicate, errors: state.errors }).includes('synthetic-private-email-provider-marker'));
    }
  }
});

await check('Secret Wingle SMS failures happen after invoice and cannot change payment success', async () => {
  const { api, state } = fixture({ secret: true, smsThrow: true });
  const result = await api.checkPendingGeniePayment(ledgerId);
  assert.equal(result.ok, true);
  assert.equal(result.invoiceSent, true);
  assert.equal(state.users[0].wingitsBalance, 40);
  assert.deepEqual(state.events, ['invoice', 'sms']);
  assert.equal(state.invoices, 1);
  assert.ok(!JSON.stringify({ result, errors: state.errors }).includes('synthetic-private-sms-provider-marker'));
});

await check('webhook ignores supplied localId, state, amount and recipient data', async () => {
  const { api, state } = fixture();
  const route = evaluate('../app/api/webhooks/dialog/route.ts', { '@/lib/payment-verification': api });
  const response = await route.POST(new Request('https://example.test/api/webhooks/dialog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId, localId: 'attacker-purchase', state: 'FAILED', amount: 1, targetPhone: 'fixture' }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(state.users[0].wingitsBalance, 120);
});

await check('malformed webhook never invokes settlement', async () => {
  let called = false;
  const route = evaluate('../app/api/webhooks/dialog/route.ts', {
    '@/lib/payment-verification': { async settleGenieWebhook() { called = true; return { ok: true }; } },
  });
  const response = await route.POST(new Request('https://example.test/api/webhooks/dialog', { method: 'POST', body: '{' }));
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

console.log(`${passed} payment verification checks passed; all dependencies were mocked.`);
