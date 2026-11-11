// Run with: node --test scripts/wingits-sharing.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { Temporal } = require('temporal-polyfill');

function evaluate(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const output = { exports: {} };
  vm.runInNewContext(code, {
    exports: output.exports, module: output,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console: { error() {}, warn() {} },
  });
  return output.exports;
}
const policy = evaluate('lib/wingits-sharing.ts');
const entry = (type, amount) => ({ type, amount });
const operation = number => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;

function fixture(options = {}) {
  const history = options.history ?? [entry('bonus', 20), entry('purchase', 20)];
  const state = {
    viewer: 'sender', verified: true, locks: [], events: [], sequence: 0,
    tables: {
      User: [
        { id: 'sender', name: 'Sender', wingitsBalance: options.balance ?? 40, suspended: false },
        { id: 'friend', name: 'Friend', wingitsBalance: 20, suspended: false },
      ],
      Conversation: [{ id: 'chat', userId1: 'sender', userId2: 'friend' }],
      Wingle: [{ id: 'wingle', fromUserId: 'sender', toUserId: 'friend', status: 'accepted' }],
      Block: [], Notification: [],
      WingitsTransaction: history.map((item, index) => ({
        id: `history-${index}`, userId: 'sender', createdAt: `2026-11-01T00:00:${String(index).padStart(2, '0')}Z`, ...item,
      })),
    },
  };
  const fields = new Proxy({}, { get(_target, name) { return {
    eq: value => row => row[name] === value,
    in: values => row => values.includes(row[name]),
    gt: value => row => row[name].toString() > value.toString(),
    asc: () => ({ name }),
  }; } });
  function model(name, filters = [], selected, sort = []) {
    const matches = () => state.tables[name].filter(row => filters.every(filter => filter(row)));
    return {
      select(...names) { return model(name, filters, names, sort); },
      where(value) {
        const filter = typeof value === 'function' ? value(fields)
          : row => Object.entries(value).every(([key, expected]) => row[key] === expected);
        return model(name, [...filters, filter], selected, sort);
      },
      orderBy(callbacks) { return model(name, filters, selected, callbacks.map(callback => callback(fields))); },
      async all() {
        const rows = matches().sort((a, b) => {
          for (const { name: field } of sort) {
            const comparison = String(a[field]).localeCompare(String(b[field]));
            if (comparison) return comparison;
          }
          return 0;
        });
        return rows.map(row => selected ? Object.fromEntries(selected.map(key => [key, row[key]])) : { ...row });
      },
      async first(key) {
        const query = key ? this.where(key) : this;
        return (await query.all())[0] ?? null;
      },
      async update(data) { matches().forEach(row => Object.assign(row, data)); },
      async create(data) {
        const row = { id: `created-${state.sequence++}`, createdAt: Temporal.Now.instant(), ...data };
        if (state.tables[name].some(existing => existing.id === row.id)) throw new Error('Duplicate ledger ID');
        if (options.failCredit && data.type === policy.PAID_WINGITS_RECEIVED_TYPE) throw new Error('Synthetic credit failure');
        state.tables[name].push(row);
        return { ...row };
      },
    };
  }
  const orm = { public: Object.fromEntries(Object.keys(state.tables).map(name => [name, model(name)])) };
  let queue = Promise.resolve();
  const db = { async transaction(callback) {
    const before = queue;
    let release;
    queue = new Promise(resolve => { release = resolve; });
    await before;
    const snapshot = Object.fromEntries(Object.entries(state.tables).map(([name, rows]) => [name, rows.map(row => ({ ...row }))]));
    try { return await callback({ orm }); }
    catch (error) { state.tables = snapshot; throw error; }
    finally { release(); }
  } };
  const actions = evaluate('app/actions/wingits-chat.ts', {
    '@/lib/db': { db },
    '@/lib/session': { async getSession() { return state.viewer ? { userId: state.viewer, verified: state.verified } : null; } },
    '@/lib/wingits-wallet': { MAX_WINGITS: 2_147_483_647, async lockWingitsWallet(_tx, id) {
      state.locks.push(id);
      return state.tables.User.some(user => user.id === id);
    } },
    '@/lib/wingits-sharing': policy,
    'temporal-polyfill': { Temporal },
    '@prisma/orm-postgres/orm-client': {
      and: (...filters) => row => filters.every(filter => filter(row)),
      or: (...filters) => row => filters.some(filter => filter(row)),
    },
    '@/lib/pusher': { pusherServer: { async trigger(...args) { state.events.push(args); } } },
  });
  return {
    state,
    send: (amount, id = 1) => actions.sendWingitsToChatMemberAction('chat', amount, operation(id)),
    request: (amount, id = 1) => actions.requestWingitsFromChatMemberAction('chat', amount, operation(id)),
    status: () => actions.getWingitsSharingStatusAction(),
    balance: id => state.tables.User.find(user => user.id === id).wingitsBalance,
  };
}

test('balances below or exactly fifteen cannot send, even with purchased funds', async () => {
  for (const balance of [0, 1, 14, 15]) {
    const { send, balance: saved, state } = fixture({ balance, history: [entry('purchase', balance)] });
    assert.equal((await send(1)).ok, false);
    assert.equal(saved('sender'), balance);
    assert.equal(saved('friend'), 20);
    assert.equal(state.tables.Notification.length, 0);
  }
});

test('sixteen purchased Wingits qualify; the threshold applies before the transfer', async () => {
  const { send, balance } = fixture({ balance: 16, history: [entry('purchase', 16)] });
  assert.equal((await send(16)).ok, true);
  assert.equal(balance('sender'), 0);
  assert.equal(balance('friend'), 36);
});

test('free, bonus, admin, historical gift, and unrecorded credits cannot be shared', async () => {
  for (const history of [[], [entry('bonus', 40)], [entry('admin_credit', 40)], [entry('transfer_received', 40)]]) {
    const { send, status, balance } = fixture({ balance: 40, history });
    assert.equal((await status()).data.transferable, 0);
    assert.equal((await send(1)).ok, false);
    assert.equal(balance('sender'), 40);
  }
});

test('mixed wallets can only send their purchased portion', async () => {
  const { send, status, balance } = fixture({ balance: 25, history: [entry('bonus', 20), entry('purchase', 5)] });
  assert.equal((await status()).data.transferable, 5);
  assert.equal((await send(6)).ok, false);
  assert.equal((await send(5)).ok, true);
  assert.equal(balance('sender'), 20);
  assert.equal((await send(1, 2)).ok, false);
});

test('personal use spends free credits first without blocking the remaining purchased funds', () => {
  assert.equal(policy.transferableWingits(60, [entry('bonus', 20), entry('purchase', 100), entry('spend', -60)]), 60);
  assert.equal(policy.transferableWingits(10, [entry('bonus', 20), entry('purchase', 100), entry('spend', -110)]), 10);
});

test('later free credits cannot regenerate purchased Wingits that were already spent', async () => {
  const history = [entry('purchase', 20), entry('spend', -20), entry('bonus', 40)];
  const { send, status } = fixture({ balance: 40, history });
  assert.equal((await status()).data.transferable, 0);
  assert.equal((await send(1)).ok, false);
});

test('previous transfers and unrecorded debits reduce transferable funds', () => {
  assert.equal(policy.transferableWingits(30, [entry('bonus', 20), entry('purchase', 20), entry('transfer_sent', -10)]), 10);
  assert.equal(policy.transferableWingits(10, [entry('purchase', 20)]), 10);
});

test('eligible received Wingits can be shared again without making the recipients free credits transferable', async () => {
  const { send, status, state, balance } = fixture();
  assert.equal((await send(10)).ok, true);
  assert.equal(balance('friend'), 30);
  const credit = state.tables.WingitsTransaction.find(record => record.type === policy.PAID_WINGITS_RECEIVED_TYPE);
  assert.equal(credit.amount, 10);
  state.viewer = 'friend';
  assert.equal((await status()).data.transferable, 10);
  assert.equal((await send(11, 2)).ok, false);
  assert.equal((await send(10, 2)).ok, true);
  assert.equal(balance('friend'), 20);
  assert.equal((await status()).data.transferable, 0);
});

test('a successful retry does not charge twice or fail after the balance falls to fifteen', async () => {
  const { send, balance, state } = fixture({ balance: 16, history: [entry('purchase', 16)] });
  assert.equal((await send(1)).ok, true);
  assert.equal(balance('sender'), 15);
  assert.equal((await send(1)).ok, true);
  assert.equal(balance('sender'), 15);
  assert.equal(state.tables.Notification.length, 1);
  assert.equal((await send(1, 2)).ok, false);
});

test('concurrent sends recheck the fifteen-Wingit threshold after acquiring the locks', async () => {
  const { send, balance, state } = fixture({ balance: 16, history: [entry('purchase', 16)] });
  const results = await Promise.all([send(1, 1), send(1, 2)]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(balance('sender'), 15);
  assert.deepEqual(state.locks, ['friend', 'sender', 'friend', 'sender']);
});

test('a credit failure rolls back both wallets and transfer records', async () => {
  const { send, balance, state } = fixture({ failCredit: true });
  assert.equal((await send(5)).ok, false);
  assert.equal(balance('sender'), 40);
  assert.equal(balance('friend'), 20);
  assert.equal(state.tables.WingitsTransaction.length, 2);
});

test('requesting Wingits still works with a zero balance and does not transfer funds', async () => {
  const { request, balance, state } = fixture({ balance: 0, history: [] });
  assert.equal((await request(10)).ok, true);
  assert.equal(balance('sender'), 0);
  assert.equal(balance('friend'), 20);
  assert.equal(state.tables.Notification[0].type, 'wingits_request');
});

test('invalid, unauthenticated, blocked, and inactive-chat transfers are rejected', async () => {
  for (const amount of [0, -1, 1.5, NaN, 2_147_483_648]) {
    assert.equal((await fixture().send(amount)).ok, false);
  }
  for (const mutate of [
    state => { state.viewer = null; },
    state => { state.viewer = 'outsider'; },
    state => { state.verified = false; },
    state => { state.tables.Block.push({ blockerId: 'sender', blockedUserId: 'friend' }); },
    state => { state.tables.Wingle = []; },
  ]) {
    const { send, state, balance } = fixture();
    mutate(state);
    assert.equal((await send(1)).ok, false);
    assert.equal(balance('sender'), 40);
  }
});
