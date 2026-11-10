// Run with: node --test scripts/daily-login-bonus.test.cjs
// Exercise the real server action with an in-memory wallet and controlled clock.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { Temporal } = require('temporal-polyfill');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-10T12:00:00.000Z');
const instant = milliseconds => Temporal.Instant.from(new Date(milliseconds).toISOString());
const code = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../app/actions/user.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } },
).outputText;

function fixture(options = {}) {
  const state = {
    now: NOW,
    account: {
      id: 'member', password: 'fixture', pushSubscription: null,
      wingitsBalance: 20, createdAt: instant(NOW - 3 * DAY),
      lastDailyBonusAt: instant(NOW - DAY), lastActiveAt: instant(NOW),
      lifestyle: '{}', interests: '[]', traits: '[]', photos: [], prompts: [],
      ...options.account,
    },
    transactions: 0, records: [], errors: [], locked: false,
  };
  class ClockDate extends Date {
    constructor(value = state.now) { super(value); }
    static now() { return state.now; }
  }
  const User = {
    where({ id }) {
      return {
        include() { return this; },
        async first() { return id === state.account.id ? { ...state.account } : null; },
        async update(value) {
          assert.equal(state.locked, true);
          assert.equal(id, state.account.id);
          Object.assign(state.account, value);
        },
      };
    },
    select(...fields) {
      return { async first({ id }) {
        assert.equal(state.locked, true);
        return id === state.account.id
          ? Object.fromEntries(fields.map(field => [field, state.account[field]]))
          : null;
      } };
    },
  };
  const orm = { public: {
    User,
    WingitsTransaction: { async create(value) {
      assert.equal(state.locked, true);
      state.records.push(JSON.parse(JSON.stringify(value)));
    } },
  } };
  let transactionQueue = Promise.resolve();
  const db = {
    orm,
    async transaction(callback) {
      const previous = transactionQueue;
      let release;
      transactionQueue = new Promise(resolve => { release = resolve; });
      await previous;
      state.transactions++;
      try {
        return await callback({ orm });
      } finally {
        state.locked = false;
        release();
      }
    },
  };
  const dependencies = {
    'node:crypto': {},
    '@/lib/db': { db },
    '@/lib/session': { async getSession() { return options.signedOut ? null : { userId: 'member' }; } },
    '@prisma/orm-postgres/orm-client': {},
    '@/lib/notify': {},
    '@/lib/wingits-wallet': {
      MAX_WINGITS: 2_147_483_647,
      async lockWingitsWallet(_tx, userId) {
        assert.equal(userId, state.account.id);
        state.locked = true;
        options.onLock?.(state);
        return true;
      },
    },
    '@/lib/presence': { isOnlineAt() { return false; }, recordedLastSeen(user) { return user.lastActiveAt.toString(); } },
    'temporal-polyfill': { Temporal },
  };
  const output = { exports: {} };
  vm.runInNewContext(code, {
    exports: output.exports, module: output, Date: ClockDate,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console: { log() {}, error(...args) { state.errors.push(args); } },
  });
  return { state, async readUser() {
    const result = await output.exports.getCurrentUser();
    assert.deepEqual(state.errors, []);
    return result;
  } };
}

test('a first-week login credits exactly one Wingit and records the bonus', async () => {
  const { state, readUser } = fixture();
  const result = await readUser();
  assert.equal(result.wingitsBalance, 21);
  assert.equal(state.account.lastDailyBonusAt.toString(), instant(NOW).toString());
  assert.deepEqual(state.records, [{
    userId: 'member', amount: 1, type: 'bonus', description: 'Daily Login Bonus',
  }]);
});

test('the last millisecond before seven days is eligible', async () => {
  const { state, readUser } = fixture({ account: { createdAt: instant(NOW - 7 * DAY + 1) } });
  assert.equal((await readUser()).wingitsBalance, 21);
  assert.equal(state.records.length, 1);
});

test('exactly seven days and older accounts never receive a bonus, even without claim history', async () => {
  for (const age of [7 * DAY, 7 * DAY + 1, 30 * DAY, 365 * DAY]) {
    for (const lastDailyBonusAt of [null, instant(NOW - DAY)]) {
      const { state, readUser } = fixture({ account: { createdAt: instant(NOW - age), lastDailyBonusAt } });
      assert.equal((await readUser()).wingitsBalance, 20);
      assert.equal(state.transactions, 0);
      assert.equal(state.records.length, 0);
      assert.equal(state.account.lastDailyBonusAt, lastDailyBonusAt);
    }
  }
});

test('signup and repeat logins on the same day do not add another Wingit', async () => {
  const signup = fixture({ account: { createdAt: instant(NOW), lastDailyBonusAt: instant(NOW) } });
  assert.equal((await signup.readUser()).wingitsBalance, 20);
  assert.equal(signup.state.records.length, 0);

  const returning = fixture();
  await returning.readUser();
  assert.equal((await returning.readUser()).wingitsBalance, 21);
  assert.equal(returning.state.records.length, 1);
});

test('missed days do not accumulate rewards or extend the seven-day window', async () => {
  const { state, readUser } = fixture({ account: {
    createdAt: instant(NOW - 6 * DAY), lastDailyBonusAt: null,
  } });
  assert.equal((await readUser()).wingitsBalance, 21);
  state.now = NOW + DAY;
  assert.equal((await readUser()).wingitsBalance, 21);
  assert.equal(state.records.length, 1);
});

test('concurrent first-week requests recheck the locked wallet and only credit once', async () => {
  const { state, readUser } = fixture();
  await Promise.all([readUser(), readUser()]);
  assert.equal(state.account.wingitsBalance, 21);
  assert.equal(state.records.length, 1);
});

test('the expiry time is rechecked after waiting for the wallet lock', async () => {
  const { state, readUser } = fixture({
    account: { createdAt: instant(NOW - 7 * DAY + 1) },
    onLock(wallet) { wallet.now++; },
  });
  assert.equal((await readUser()).wingitsBalance, 20);
  assert.equal(state.transactions, 1);
  assert.equal(state.records.length, 0);
});

test('signup time is read again from the locked account', async () => {
  const { state, readUser } = fixture({ onLock(wallet) {
    wallet.account.createdAt = instant(NOW - 7 * DAY);
  } });
  assert.equal((await readUser()).wingitsBalance, 20);
  assert.equal(state.records.length, 0);
});

test('future signup timestamps, full wallets, and signed-out requests are not credited', async () => {
  for (const options of [
    { account: { createdAt: instant(NOW + 1) } },
    { account: { wingitsBalance: 2_147_483_647 } },
    { signedOut: true },
  ]) {
    const { state, readUser } = fixture(options);
    const balance = state.account.wingitsBalance;
    await readUser();
    assert.equal(state.account.wingitsBalance, balance);
    assert.equal(state.records.length, 0);
  }
});
