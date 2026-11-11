// Run with: node --test scripts/activity-read-state.test.cjs
// Exercise the real persistence action and store callback without a live database.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function compile(source) {
  return ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText;
}
function source(file) { return fs.readFileSync(path.join(__dirname, '..', file), 'utf8'); }
function evaluate(file, dependencies = {}) {
  const output = { exports: {} };
  vm.runInNewContext(compile(source(file)), {
    exports: output.exports, module: output,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console: { error() {} },
  });
  return output.exports;
}
const helpers = evaluate('lib/activity-read-state.ts');
const storeFile = ts.createSourceFile('StoreContext.tsx', source('lib/contexts/StoreContext.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let readInitializer;
function findReadCallback(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(storeFile) === 'markActivityRead') readInitializer = node.initializer;
  ts.forEachChild(node, findReadCallback);
}
findReadCallback(storeFile);
assert.ok(readInitializer);
const readCode = compile(`exports.mark = ${readInitializer.getText(storeFile)};`);
const sections = ['likes', 'heartBucket', 'passes', 'wingles', 'notifications'];
const tables = { likes: 'like', heartBucket: 'heartBucket', passes: 'pass', wingles: 'wingle', notifications: 'notification' };
const flush = () => new Promise(resolve => setImmediate(resolve));

function row(section, id, owner = 'member') {
  const common = { id, viewed: false };
  switch (section) {
    case 'likes': return { ...common, fromUserId: id, toUserId: owner };
    case 'heartBucket':
    case 'passes': return { ...common, userId: owner, targetUserId: id };
    case 'wingles': return { ...common, fromUserId: 'peer', toUserId: owner, status: 'pending' };
    case 'notifications': return { id, userId: owner, read: false };
  }
}
function fixture(options = {}) {
  const state = {
    sessionId: 'member', writes: 0, requests: 0, errors: [], fail: false,
    rows: Object.fromEntries(sections.map(section => [section, [
      row(section, 'first'), row(section, 'second'), row(section, 'first', 'someone-else'),
    ]])),
  };
  const fields = new Proxy({}, { get(_target, name) { return name; } });
  const operators = {
    eq: (field, value) => record => record[field] === value,
    in: (field, values) => record => values.includes(record[field]),
  };
  const sql = Object.fromEntries(sections.map(section => [tables[section], {
    update(data) {
      const filters = [];
      const builder = {
        where(callback) { filters.push(callback(fields, operators)); return builder; },
        build() { return { section, data, filters }; },
      };
      return builder;
    },
  }]));
  const db = { sql: { public: sql }, runtime() { return { async execute(plan) {
    if (state.fail) throw new Error('Synthetic persistence failure');
    options.beforeExecute?.(state, plan);
    const records = state.rows[plan.section].filter(record => plan.filters.every(filter => filter(record)));
    records.forEach(record => Object.assign(record, plan.data));
    state.writes++;
    return { affectedRows: records.length };
  } }; } };
  const actions = evaluate('app/actions/activity.ts', {
    '@/lib/db': { db },
    '@/lib/session': { async getSession() { return state.sessionId ? { userId: state.sessionId } : null; } },
  });
  state.local = structuredClone(state.rows);
  const pendingActivityReads = { current: new Set() };
  const sessionIdRef = { current: state.sessionId };
  let previousCallback;
  let previousDependencies;
  function render() {
    sessionIdRef.current = state.sessionId;
    const exports = {};
    vm.runInNewContext(readCode, {
      exports, sessionId: state.sessionId, db: state.local,
      pendingActivityReads, sessionIdRef, activityItemId: helpers.activityItemId,
      useCallback(callback, dependencies) {
        if (previousDependencies && dependencies.every((value, index) => value === previousDependencies[index])) return previousCallback;
        previousCallback = callback;
        previousDependencies = dependencies;
        return callback;
      },
      setDb(update) { state.local = update(state.local); },
      async markActivityReadAction(section, ids) {
        state.requests++;
        return actions.markActivityReadAction(section, ids);
      },
      console: { error() {} },
      toast: { error(message) { state.errors.push(message); } },
    });
    return exports.mark;
  }
  return { state, render, action: actions.markActivityReadAction };
}

test('viewed sidebar items remain read after a full state reload in every section', async () => {
  for (const section of sections) {
    const { state, render } = fixture();
    const flag = section === 'notifications' ? 'read' : 'viewed';
    render()(section);
    await flush();
    assert.equal(state.rows[section][0][flag], true);
    assert.equal(state.rows[section][1][flag], true);
    assert.equal(state.rows[section][2][flag], false, 'another account must remain untouched');
    state.local = structuredClone(state.rows); // A browser refresh loads only persisted state.
    render()(section);
    await flush();
    assert.equal(state.requests, 1, 'previously viewed entries should not be acknowledged again');
    const unread = state.local[section].filter(item => helpers.activityItemId(section, item, 'member') && !item[flag]);
    assert.equal(unread.length, 0);
  }
});

test('read callbacks run again when session and activity arrive after the page mounts', async () => {
  const { state, render } = fixture();
  const loaded = state.local;
  state.sessionId = null;
  state.local = Object.fromEntries(sections.map(section => [section, []]));
  const onMount = render();
  onMount('notifications');
  assert.equal(state.requests, 0);
  state.sessionId = 'member';
  const onSession = render();
  assert.notEqual(onMount, onSession);
  onSession('notifications');
  assert.equal(state.requests, 0);
  state.local = loaded;
  const onLoaded = render();
  assert.notEqual(onLoaded, onSession);
  onLoaded('notifications');
  await flush();
  assert.equal(state.rows.notifications[0].read, true);
  assert.equal(state.rows.notifications[1].read, true);
});

test('new arrivals during persistence remain unread until they are displayed', async () => {
  for (const section of sections) {
    const { state, render } = fixture({ beforeExecute(current, plan) {
      current.rows[plan.section].push(row(plan.section, 'new-arrival'));
    } });
    render()(section);
    await flush();
    const newest = state.rows[section].find(item => item.id === 'new-arrival');
    assert.equal(section === 'notifications' ? newest.read : newest.viewed, false);
  }
});

test('individual notification reads leave other notifications unread', async () => {
  const { state, render } = fixture();
  render()('notifications', 'first');
  await flush();
  assert.equal(state.rows.notifications[0].read, true);
  assert.equal(state.rows.notifications[1].read, false);
  assert.equal(state.rows.notifications[2].read, false);
});

test('duplicate effects share pending acknowledgements', async () => {
  const { state, render } = fixture();
  const markRead = render();
  markRead('notifications');
  markRead('notifications');
  await flush();
  assert.equal(state.requests, 1);
  assert.equal(state.errors.length, 0);
});

test('failed writes keep items unread and allow a later retry', async () => {
  const { state, render } = fixture();
  state.fail = true;
  render()('likes');
  await flush();
  assert.equal(state.local.likes[0].viewed, false);
  assert.equal(state.rows.likes[0].viewed, false);
  assert.equal(state.errors.length, 1);
  state.fail = false;
  render()('likes');
  await flush();
  assert.equal(state.local.likes[0].viewed, true);
  assert.equal(state.rows.likes[0].viewed, true);
});

test('stale refresh responses preserve confirmed read states without hiding new activity', () => {
  for (const flag of ['read', 'viewed']) {
    const seen = helpers.preserveActivityReadState({ id: 'first', [flag]: false }, { id: 'first', [flag]: true });
    assert.equal(seen[flag], true);
    assert.equal(helpers.preserveActivityReadState({ id: 'new', [flag]: false })[flag], false);
  }
});

test('read actions reject unauthenticated and invalid requests without writing', async () => {
  const { state, action } = fixture();
  state.sessionId = null;
  assert.equal((await action('notifications', ['first'])).ok, false);
  state.sessionId = 'member';
  for (const [section, ids] of [['unknown', ['first']], ['likes', ['']], ['notifications', null]]) {
    assert.equal((await action(section, ids)).ok, false);
  }
  assert.equal(state.writes, 0);
});
