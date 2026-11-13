// Run with: node --test scripts/password-reset.test.cjs
// All database, cookie, email, and background work is isolated from live accounts.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Temporal } = require('temporal-polyfill');
const { z } = require('zod');

const CHALLENGE = 'wm_password_reset_challenge';
const GRANT = 'wm_password_reset_grant';
const NEW_PASSWORD = 'Updated-password-293!';
const SECRET = 'synthetic-session-secret-for-isolated-reset-tests';

function evaluate(file, dependencies, extra = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = require('typescript').transpileModule(source, { compilerOptions: {
    module: require('typescript').ModuleKind.CommonJS, target: require('typescript').ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const output = { exports: {} };
  vm.runInNewContext(code, {
    exports: output.exports, module: output, Buffer, TextEncoder,
    process: { env: { SESSION_SECRET: SECRET, RESEND_API_KEY: 'synthetic-mail-key', NODE_ENV: 'production' } },
    console: { error() {} },
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    ...extra,
  });
  return output.exports;
}

function fixture(options = {}) {
  const state = {
    now: Date.parse('2026-11-13T10:00:00Z'),
    user: { id: 'member', email: 'member@example.test', password: bcrypt.hashSync('Original-password-12!', 4), sessionVersion: 0 },
    reset: null, mail: [], tasks: [], jar: new Map(), cookieOptions: new Map(), updates: 0, clearedSessions: 0,
  };
  class ClockDate extends Date {
    constructor(value = state.now) { super(value); }
    static now() { return state.now; }
  }
  const cookies = {
    get(name) { return state.jar.has(name) ? { value: state.jar.get(name) } : undefined; },
    set(name, value, settings) {
      state.cookieOptions.set(name, settings);
      if (settings.maxAge === 0) state.jar.delete(name);
      else state.jar.set(name, value);
    },
  };
  function collection(name, filter = {}, selected) {
    return {
      select(...fields) { return collection(name, filter, fields); },
      where(value) { return collection(name, { ...filter, ...value }, selected); },
      async first(value = {}) {
        const row = name === 'User' ? state.user : state.reset;
        if (!row || !Object.entries({ ...filter, ...value }).every(([key, expected]) => row[key] === expected)) return null;
        return selected ? Object.fromEntries(selected.map(key => [key, row[key]])) : { ...row };
      },
      async create(value) { state.reset = { ...value }; return { ...value }; },
      async update(value) {
        if (name === 'User') {
          if (options.failPasswordUpdate) throw new Error('Synthetic DB failure');
          state.updates++;
          Object.assign(state.user, value);
        } else Object.assign(state.reset, value);
      },
    };
  }
  const orm = { public: { User: collection('User'), PasswordReset: collection('PasswordReset') } };
  const table = { update() { return { where(callback) {
    const filter = callback({ id: { name: 'id' } }, { eq: (_field, value) => value });
    return { build() { return { userId: filter }; } };
  } }; } };
  let queue = Promise.resolve();
  const db = { orm, async transaction(callback) {
    const preceding = queue;
    let release;
    queue = new Promise(resolve => { release = resolve; });
    await preceding;
    const snapshot = { user: { ...state.user }, reset: state.reset && { ...state.reset }, updates: state.updates };
    try {
      return await callback({ orm, sql: { public: { user: table } }, async execute(plan) {
        return { affectedRows: state.user?.id === plan.userId ? 1 : 0 };
      } });
    } catch (error) {
      state.user = snapshot.user;
      state.reset = snapshot.reset;
      state.updates = snapshot.updates;
      throw error;
    } finally { release(); }
  } };
  const actions = evaluate('app/actions/password-reset.ts', {
    'node:crypto': crypto, bcryptjs: bcrypt, zod: { z }, 'temporal-polyfill': { Temporal },
    'next/headers': { async cookies() { return cookies; } },
    'next/server': { after(task) { state.tasks.push(task); } },
    '@/lib/db': { db },
    '@/lib/session': { async deleteSession() { state.jar.delete('session'); state.clearedSessions++; } },
    '@/lib/password-reset-email': { async sendPasswordResetEmail(email, code) { state.mail.push({ email, code }); return true; } },
  }, { Date: ClockDate });
  return {
    state, db, cookies, actions,
    async request(email = state.user.email) {
      const result = await actions.requestPasswordReset(email);
      while (state.tasks.length) await state.tasks.shift()();
      return result;
    },
    async verified() {
      assert.equal((await this.request()).ok, true);
      assert.equal((await actions.verifyPasswordResetCode(state.mail.at(-1).code)).ok, true);
    },
  };
}

test('email request, OTP verification, and password update complete with single-use credentials', async () => {
  const h = fixture();
  const oldPassword = h.state.user.password;
  assert.equal((await h.request(' MEMBER@EXAMPLE.TEST ')).ok, true);
  assert.equal(h.state.mail[0].email, 'member@example.test');
  assert.match(h.state.mail[0].code, /^\d{6}$/);
  assert.notEqual(h.state.reset.otpHash, h.state.mail[0].code);
  assert.equal(h.state.reset.otpHash.length, 64);
  assert.equal(h.state.cookieOptions.get(CHALLENGE).httpOnly, true);
  assert.equal(h.state.cookieOptions.get(CHALLENGE).secure, true);
  assert.equal((await h.actions.verifyPasswordResetCode(h.state.mail[0].code)).ok, true);
  const savedCookies = new Map(h.state.jar);
  assert.notEqual(h.state.reset.resetTokenHash, h.state.jar.get(GRANT));
  assert.equal((await h.actions.resetPassword(NEW_PASSWORD)).ok, true);
  assert.notEqual(h.state.user.password, oldPassword);
  assert.equal(await bcrypt.compare(NEW_PASSWORD, h.state.user.password), true);
  assert.equal(await bcrypt.compare('Original-password-12!', h.state.user.password), false);
  assert.equal(h.state.user.sessionVersion, 1);
  assert.equal(h.state.clearedSessions, 1);
  h.state.jar = savedCookies;
  assert.equal((await h.actions.resetPassword('Another-password-58!')).ok, false);
  assert.equal(h.state.user.sessionVersion, 1);
});

test('unknown emails and rate-limited requests get the same generic response', async () => {
  const h = fixture();
  const known = await h.request();
  const unknown = await h.request('nobody@example.test');
  const limited = await h.request();
  assert.equal(known.message, unknown.message);
  assert.equal(known.message, limited.message);
  assert.equal(unknown.ok, true);
  assert.equal(limited.ok, true);
  assert.equal(h.state.mail.length, 1);
  assert.equal((await h.actions.verifyPasswordResetCode('123456')).ok, false);
});

test('a same-email request during cooldown preserves the original code after a page reload', async () => {
  for (const email of ['member@example.test', 'unknown@example.test']) {
    const h = fixture();
    await h.request(email);
    const original = h.state.jar.get(CHALLENGE);
    await h.request(email);
    assert.equal(h.state.jar.get(CHALLENGE), original);
    if (h.state.mail.length) {
      assert.equal(h.state.mail.length, 1);
      assert.equal((await h.actions.verifyPasswordResetCode(h.state.mail[0].code)).ok, true);
    }
  }
});

test('five incorrect OTP attempts remain blocked even with the original cookie', async () => {
  const h = fixture();
  await h.request();
  const cookie = h.state.jar.get(CHALLENGE);
  const correct = h.state.mail[0].code;
  const wrong = correct === '123456' ? '654321' : '123456';
  for (let count = 0; count < 5; count++) {
    h.state.jar.set(CHALLENGE, cookie);
    assert.equal((await h.actions.verifyPasswordResetCode(wrong)).ok, false);
  }
  assert.equal(h.state.reset.attempts, 5);
  assert.equal((await h.actions.verifyPasswordResetCode(correct)).ok, false);
  assert.equal(h.state.jar.has(GRANT), false);
});

test('expired codes and expired verified reset sessions are rejected', async () => {
  const otp = fixture();
  await otp.request();
  otp.state.now += 10 * 60_000;
  assert.equal((await otp.actions.verifyPasswordResetCode(otp.state.mail[0].code)).ok, false);
  const grant = fixture();
  await grant.verified();
  grant.state.now += 5 * 60_000;
  assert.equal((await grant.actions.resetPassword(NEW_PASSWORD)).ok, false);
  assert.equal(grant.state.updates, 0);
});

test('resending replaces the old code and grants cannot be obtained by reusing a verified OTP', async () => {
  const h = fixture();
  await h.request();
  const first = { cookie: h.state.jar.get(CHALLENGE), code: h.state.mail[0].code };
  h.state.now += 60_001;
  await h.request();
  const second = h.state.jar.get(CHALLENGE);
  h.state.jar.set(CHALLENGE, first.cookie);
  assert.equal((await h.actions.verifyPasswordResetCode(first.code)).ok, false);
  h.state.jar.set(CHALLENGE, second);
  assert.equal((await h.actions.verifyPasswordResetCode(h.state.mail[1].code)).ok, true);
  assert.equal((await h.actions.verifyPasswordResetCode(h.state.mail[1].code)).ok, false);
});

test('request cooldown and five-per-hour limit survive new browser requests', async () => {
  const h = fixture();
  for (let count = 0; count < 6; count++) {
    await h.request();
    h.state.now += 60_001;
  }
  assert.equal(h.state.mail.length, 5);
  assert.equal(h.state.reset.requestCount, 5);
  h.state.now += 60 * 60_000;
  await h.request();
  assert.equal(h.state.mail.length, 6);
  assert.equal(h.state.reset.requestCount, 1);
});

test('a password cannot be changed without a verified grant or with a forged grant', async () => {
  const h = fixture();
  await h.request();
  assert.equal((await h.actions.resetPassword(NEW_PASSWORD)).ok, false);
  await h.actions.verifyPasswordResetCode(h.state.mail[0].code);
  h.state.jar.set(GRANT, crypto.randomBytes(32).toString('hex'));
  assert.equal((await h.actions.resetPassword(NEW_PASSWORD)).ok, false);
  assert.equal(h.state.updates, 0);
});

test('email or password changes invalidate a pending recovery session', async () => {
  for (const change of [state => { state.user.email = 'changed@example.test'; }, state => { state.user.password = 'another-hash'; }]) {
    const h = fixture();
    await h.verified();
    change(h.state);
    assert.equal((await h.actions.resetPassword(NEW_PASSWORD)).ok, false);
    assert.equal(h.state.updates, 0);
  }
});

test('concurrent code verifications and password resets only succeed once', async () => {
  const h = fixture();
  await h.request();
  const verified = await Promise.all([h.actions.verifyPasswordResetCode(h.state.mail[0].code), h.actions.verifyPasswordResetCode(h.state.mail[0].code)]);
  assert.equal(verified.filter(result => result.ok).length, 1);
  const resets = await Promise.all([h.actions.resetPassword(NEW_PASSWORD), h.actions.resetPassword('Another-password-22!')]);
  assert.equal(resets.filter(result => result.ok).length, 1);
  assert.equal(h.state.updates, 1);
  assert.equal(h.state.user.sessionVersion, 1);
});

test('invalid passwords preserve the grant and a failed DB update does not consume it', async () => {
  const h = fixture({ failPasswordUpdate: true });
  await h.verified();
  for (const password of ['short', 'a'.repeat(73), '💗'.repeat(25)]) {
    assert.equal((await h.actions.resetPassword(password)).ok, false);
  }
  assert.equal((await h.actions.resetPassword(NEW_PASSWORD)).ok, false);
  assert.equal(h.state.reset.usedAt, null);
  assert.equal(h.state.user.sessionVersion, 0);
});

test('reset emails always use noreply@winglemingle.com and never simulate delivery', async () => {
  const sent = [];
  let response = { data: { id: 'email-1' }, error: null };
  const helper = evaluate('lib/password-reset-email.ts', {
    'server-only': {}, resend: { Resend: class {
      emails = { async send(payload) { sent.push(payload); return response; } };
    } },
  }, { process: { env: { RESEND_API_KEY: 'synthetic-key', RESEND_FROM_EMAIL: 'wrong@example.test' } } });
  assert.equal(await helper.sendPasswordResetEmail('member@example.test', '123456'), true);
  assert.equal(sent[0].from, 'Wingle Mingle <noreply@winglemingle.com>');
  assert.match(sent[0].text, /123456/);
  response = { data: null, error: { message: 'Synthetic provider error' } };
  assert.equal(await helper.sendPasswordResetEmail('member@example.test', '123456'), false);
  const unavailable = evaluate('lib/password-reset-email.ts', { 'server-only': {}, resend: {} }, { process: { env: {} } });
  assert.equal(await unavailable.sendPasswordResetEmail('member@example.test', '123456'), false);
});

test('password resets revoke old and legacy sessions while new sign-ins get the current session version', async () => {
  const h = fixture();
  const versions = evaluate('lib/session-version.ts', { '@/lib/db': { db: h.db } });
  const sessions = evaluate('lib/session.ts', {
    jose: await import('jose'),
    'next/headers': { async cookies() { return h.cookies; } },
    '@/lib/session-version': versions,
  });
  await sessions.createSession('member');
  const oldSession = h.state.jar.get('session');
  const legacy = await sessions.encrypt({ userId: 'member', verified: true });
  assert.equal((await sessions.getSession()).userId, 'member');
  await h.verified();
  await h.actions.resetPassword(NEW_PASSWORD);
  for (const token of [oldSession, legacy]) {
    h.state.jar.set('session', token);
    assert.equal(await sessions.getSession(), null);
    assert.equal(await sessions.updateSession(), null);
  }
  await sessions.createSession('member');
  assert.equal((await sessions.getSession()).sessionVersion, 1);
  const auth = evaluate('app/actions/auth.ts', {
    '@/lib/db': { db: h.db }, '@/lib/session': sessions, zod: { z }, bcryptjs: bcrypt,
    'google-auth-library': { OAuth2Client: class {} }, crypto,
    'temporal-polyfill': { Temporal },
  });
  const signIn = async password => {
    const form = new FormData();
    form.set('email', h.state.user.email);
    form.set('password', password);
    return auth.loginUser(form);
  };
  assert.equal((await signIn('Original-password-12!')).ok, false);
  assert.equal((await signIn(NEW_PASSWORD)).ok, true);
  assert.equal((await sessions.getSession()).sessionVersion, 1);
});

test('middleware rejects revoked sessions without redirecting sign-in back into the app', async () => {
  const h = fixture();
  h.state.user.sessionVersion = 1;
  const jose = await import('jose');
  const versions = evaluate('lib/session-version.ts', { '@/lib/db': { db: h.db } });
  const sessions = evaluate('lib/session.ts', {
    jose, 'next/headers': { async cookies() { return h.cookies; } }, '@/lib/session-version': versions,
  });
  const middleware = evaluate('middleware.ts', {
    jose, '@/lib/session-version': versions,
    'next/server': { NextResponse: { next() { return { action: 'next' }; }, redirect(url) { return { action: 'redirect', path: url.pathname }; } } },
  });
  const old = await sessions.encrypt({ userId: 'member', sessionVersion: 0, verified: true });
  const current = await sessions.encrypt({ userId: 'member', sessionVersion: 1, verified: true });
  const visit = (pathname, token) => middleware.middleware({
    cookies: { get() { return { value: token }; } },
    nextUrl: { pathname, searchParams: new URLSearchParams(), clone() { return new URL('https://www.winglemingle.com' + pathname); } },
  });
  assert.equal((await visit('/sign-in', old)).action, 'next');
  assert.equal((await visit('/discover', old)).path, '/sign-in');
  assert.equal((await visit('/sign-in', current)).path, '/discover');
});
