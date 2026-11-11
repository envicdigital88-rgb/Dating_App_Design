// Run with: node --test scripts/chat-image-views.test.cjs
// Execute production actions/components without the application DB or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function evaluate(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const output = { exports: {} };
  vm.runInNewContext(code, {
    exports: output.exports, module: output,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console: { error() {} },
  });
  return output.exports;
}
const imagePolicy = evaluate('lib/chat-images.ts');
const IMAGE_URL = 'https://example.test/private-chat-image.jpg';

function fixture(options = {}) {
  const state = {
    user: { id: options.viewer || 'recipient', wingitsBalance: 12, isUnlimited: false, ...options.user },
    mingle: {
      id: 'photo', conversationId: 'chat', senderId: 'sender', imageUrl: IMAGE_URL,
      body: '', viewOnce: false, imageViewCount: 0, deleted: false, deletedFor: [], ...options.mingle,
    },
    records: [], events: [], sent: [], transactions: 0, locked: false,
  };
  const orm = { public: {
    User: {
      select() { return { async first() { assert.ok(state.locked); return { ...state.user }; } }; },
      where({ id }) { return { async first() {
        assert.ok(state.locked);
        return id === state.user.id ? { ...state.user } : null;
      }, async update(value) {
        assert.ok(state.locked);
        assert.equal(id, state.user.id);
        Object.assign(state.user, value);
      } }; },
    },
    Mingle: { async create(data) {
      if (options.failSend) throw new Error('Synthetic image send failure');
      const message = { id: 'sent-' + state.sent.length, createdAt: new Date(), readAt: null, deliveredAt: null, ...data };
      state.sent.push(message);
      return message;
    }, where({ id }) { return {
      async first() {
        assert.ok(state.locked, 'view count must be read after acquiring the wallet lock');
        return id === state.mingle.id ? { ...state.mingle } : null;
      },
      async update(value) {
        assert.ok(state.locked);
        if (options.failCountUpdate) throw new Error('Synthetic database error');
        Object.assign(state.mingle, value);
        return { ...state.mingle };
      },
    }; } },
    Conversation: { where() { return { async first() {
      return options.noConversation ? null : { id: 'chat', userId1: 'sender', userId2: 'recipient' };
    }, async update() {} }; } },
    Wingle: { where() { return { where() { return this; }, async first() { return { status: 'accepted' }; } }; } },
    Block: { where() { return { async first() { return null; } }; } },
    WingitsTransaction: { async create(record) { state.records.push(JSON.parse(JSON.stringify(record))); } },
  } };
  let queue = Promise.resolve();
  const db = { orm, async transaction(callback) {
    const preceding = queue;
    let release;
    queue = new Promise(resolve => { release = resolve; });
    await preceding;
    state.transactions++;
    const before = { user: { ...state.user }, mingle: { ...state.mingle }, recordCount: state.records.length, sentCount: state.sent.length };
    try {
      return await callback({ orm });
    } catch (error) {
      state.user = before.user;
      state.mingle = before.mingle;
      state.records.length = before.recordCount;
      state.sent.length = before.sentCount;
      throw error;
    } finally {
      state.locked = false;
      release();
    }
  } };
  const actions = evaluate('app/actions/chat.ts', {
    '@/lib/db': { db },
    '@/lib/session': { async getSession() { return options.signedOut ? null : { userId: state.user.id }; } },
    'temporal-polyfill': { Temporal: { Now: { instant() { return new Date(); } } } },
    '@prisma/orm-postgres/orm-client': {},
    '@/lib/chat-images': imagePolicy,
    '@/lib/wingits-wallet': { async lockWingitsWallet(_tx, id) {
      assert.equal(id, state.user.id);
      state.locked = true;
      return !options.noAccount;
    } },
    '@/lib/pusher': { pusherServer: { async trigger(channel) {
      if (options.failNotification) throw new Error('Synthetic notification error');
      state.events.push(channel);
    } } },
    '@/app/actions/push': { async sendPushNotificationAction() {} },
  });
  return {
    state,
    open: (expectedCost = 0) => actions.viewImageAction('photo', expectedCost),
    send: (imageUrl, viewOnce = false) => actions.sendMingleAction('chat', 'Fixture message', imageUrl, null, false, viewOnce),
  };
}

test('sending either a normal or one-view image charges exactly two Wingits', async () => {
  for (const viewOnce of [false, true]) {
    const { state, send } = fixture({ viewer: 'sender', user: { wingitsBalance: 2 } });
    const result = await send(IMAGE_URL, viewOnce);
    assert.equal(result.ok, true);
    assert.equal(state.user.wingitsBalance, 0);
    assert.equal(state.sent.length, 1);
    assert.equal(state.sent[0].viewOnce, viewOnce);
    assert.deepEqual(state.records, [{ userId: 'sender', amount: -2, type: 'spend', description: 'Sent an image in chat' }]);
  }
});

test('sending with less than two Wingits fails without a message or charge', async () => {
  const { state, send } = fixture({ viewer: 'sender', user: { wingitsBalance: 1 } });
  assert.equal((await send(IMAGE_URL)).ok, false);
  assert.equal(state.user.wingitsBalance, 1);
  assert.equal(state.sent.length, 0);
  assert.equal(state.records.length, 0);
});

test('each image in a batch costs two Wingits', async () => {
  const { state, send } = fixture({ viewer: 'sender', user: { wingitsBalance: 6 } });
  const results = await Promise.all([send(IMAGE_URL), send(IMAGE_URL), send(IMAGE_URL)]);
  assert.ok(results.every(result => result.ok));
  assert.equal(state.user.wingitsBalance, 0);
  assert.equal(state.sent.length, 3);
  assert.deepEqual(state.records.map(record => record.amount), [-2, -2, -2]);
});

test('text messages are free and failed image sends roll back the charge', async () => {
  const text = fixture({ viewer: 'sender', user: { wingitsBalance: 0 } });
  assert.equal((await text.send(undefined)).ok, true);
  assert.equal(text.state.records.length, 0);
  const failed = fixture({ viewer: 'sender', failSend: true });
  assert.equal((await failed.send(IMAGE_URL)).ok, false);
  assert.equal(failed.state.user.wingitsBalance, 12);
  assert.equal(failed.state.records.length, 0);
});

test('normal photos are free once, then cost four Wingits on every reopen', async () => {
  const { state, open } = fixture();
  const free = await open(0);
  assert.equal(free.ok, true);
  assert.equal(free.data.charged, 0);
  assert.equal(free.data.imageUrl, IMAGE_URL);
  assert.equal(state.user.wingitsBalance, 12);
  assert.equal(state.records.length, 0);
  for (let count = 2; count <= 4; count++) {
    const paid = await open(4);
    assert.equal(paid.ok, true);
    assert.equal(paid.data.imageViewCount, count);
    assert.equal(paid.data.charged, 4);
    assert.equal(paid.data.remainingBalance, 12 - (count - 1) * 4);
  }
  assert.deepEqual(state.records.map(record => record.amount), [-4, -4, -4]);
  assert.equal((await open(4)).ok, false);
  assert.equal(state.mingle.imageViewCount, 4);
});

test('one-view photos cost four Wingits on the first open and cannot be reopened', async () => {
  const { state, open } = fixture({ mingle: { viewOnce: true } });
  const first = await open(4);
  assert.equal(first.ok, true);
  assert.equal(first.data.charged, 4);
  assert.equal(first.data.remainingBalance, 8);
  const second = await open(4);
  assert.equal(second.ok, false);
  assert.match(second.error, /expired/);
  assert.equal(state.user.wingitsBalance, 8);
  assert.equal(state.mingle.imageViewCount, 1);
  assert.equal(state.records.length, 1);
});

test('insufficient funds neither expose nor consume a one-view image', async () => {
  const { state, open } = fixture({ mingle: { viewOnce: true }, user: { wingitsBalance: 3 } });
  const result = await open(4);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'insufficient_wingits');
  assert.equal(result.data, undefined);
  assert.equal(state.mingle.imageViewCount, 0);
  assert.equal(state.user.wingitsBalance, 3);
  assert.equal(state.records.length, 0);
  state.user.wingitsBalance = 4;
  assert.equal((await open(4)).ok, true);
  assert.equal(state.user.wingitsBalance, 0);
});

test('a zero balance still allows the first normal view', async () => {
  const { open } = fixture({ user: { wingitsBalance: 0 } });
  assert.equal((await open(0)).ok, true);
  assert.equal((await open(4)).ok, false);
});

test('senders can view their own photos without charges or consuming the recipient view', async () => {
  for (const viewOnce of [false, true]) {
    const { state, open } = fixture({ viewer: 'sender', mingle: { viewOnce } });
    assert.equal((await open()).data.charged, 0);
    assert.equal((await open()).data.charged, 0);
    assert.equal(state.mingle.imageViewCount, 0);
    assert.equal(state.records.length, 0);
  }
});

test('unauthorized, missing, deleted, and hidden images never produce a charge or image URL', async () => {
  for (const options of [
    { signedOut: true }, { viewer: 'outsider' }, { noConversation: true }, { noAccount: true },
    { mingle: { imageUrl: null } }, { mingle: { deleted: true } },
    { mingle: { deletedFor: ['recipient'] } },
  ]) {
    const { state, open } = fixture(options);
    const result = await open();
    assert.equal(result.ok, false);
    assert.equal(result.data, undefined);
    assert.equal(state.records.length, 0);
    assert.equal(state.mingle.imageViewCount, 0);
  }
});

test('concurrent free opens only grant one free view without an unconfirmed charge', async () => {
  const { state, open } = fixture();
  const results = await Promise.all([open(0), open(0)]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.find(result => !result.ok).reason, 'price_changed');
  assert.equal(state.user.wingitsBalance, 12);
  assert.equal(state.mingle.imageViewCount, 1);
});

test('concurrent one-view opens only consume the image and charge once', async () => {
  const { state, open } = fixture({ mingle: { viewOnce: true } });
  const results = await Promise.all([open(4), open(4)]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(state.user.wingitsBalance, 8);
  assert.equal(state.mingle.imageViewCount, 1);
  assert.equal(state.records.length, 1);
});

test('paid opens serialize the balance and view count without lost updates', async () => {
  const { state, open } = fixture({ mingle: { imageViewCount: 1 } });
  const results = await Promise.all([open(4), open(4)]);
  assert.ok(results.every(result => result.ok));
  assert.equal(state.user.wingitsBalance, 4);
  assert.equal(state.mingle.imageViewCount, 3);
  assert.equal(state.records.length, 2);
});

test('a failed view transaction rolls back both the charge and ledger record', async () => {
  const { state, open } = fixture({ mingle: { viewOnce: true }, failCountUpdate: true });
  assert.equal((await open(4)).ok, false);
  assert.equal(state.user.wingitsBalance, 12);
  assert.equal(state.records.length, 0);
  assert.equal(state.mingle.imageViewCount, 0);
});

test('notification failures do not report a completed paid view as failed', async () => {
  const { state, open } = fixture({ mingle: { viewOnce: true }, failNotification: true });
  assert.equal((await open(4)).ok, true);
  assert.equal(state.user.wingitsBalance, 8);
  assert.equal(state.records.length, 1);
});

test('paid recipient views cost four Wingits for every account', async () => {
  const { open } = fixture({ mingle: { viewOnce: true }, user: { isUnlimited: true } });
  assert.equal((await open(4)).data.charged, 4);
});

test('both chat surfaces use a photo gate that shows the right price without loading received images', () => {
  const { state } = fixture();
  const { ChatImage } = evaluate('components/ChatImage.tsx', {
    react: React, 'react/jsx-runtime': require('react/jsx-runtime'),
    'react-dom': require('react-dom'), 'lucide-react': require('lucide-react'), sonner: { toast: {} },
    '@/lib/chat-images': imagePolicy,
    '@/lib/contexts/StoreContext': { useStore() { return { currentUser: state.user }; } },
  });
  for (const [photo, label] of [
    [{ ...state.mingle }, 'Tap to View (Free)'],
    [{ ...state.mingle, imageViewCount: 1 }, 'Tap to View (4 Wingits)'],
    [{ ...state.mingle, viewOnce: true }, 'Open once (4 Wingits)'],
    [{ ...state.mingle, viewOnce: true, imageViewCount: 1 }, 'Opened'],
  ]) {
    const html = renderToStaticMarkup(React.createElement(ChatImage, { mingle: photo }));
    assert.ok(html.includes(label));
    assert.ok(!html.includes('<img'));
    assert.ok(!html.includes(IMAGE_URL));
    if (label === 'Opened') assert.match(html, /disabled=""/);
  }
  for (const file of ['components/views/Chat.tsx', 'components/ui/ChatPopup.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(source, /<ChatImage mingle=\{mingle\}/);
    assert.doesNotMatch(source, /<img\s+src=\{mingle\.imageUrl\}/);
  }
});
