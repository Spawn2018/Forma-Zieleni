import test from 'node:test';
import assert from 'node:assert/strict';
import { runSession } from './engine.ts';

const now = Date.parse('2026-09-20T12:00:00Z');
const slice = (id, capability = 'repo-audit', classification = 'AUTO', dependsOn = []) => ({ id, capability, classification, dependsOn });
const outcome = (status = 'COMPLETE') => ({ status, evidence: [{ stage: 'verification', result: 'PASS', detail: 'mock evidence' }] });
function session(slices = [slice('audit')], overrides = {}) {
  return {
    version: 1, id: 'test-session', objective: 'Test bounded execution', repo: 'mock-repo',
    createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
    deadline: null, maxIterations: 10, retryBudget: 1, iterationCount: 0,
    currentSlice: null, status: 'READY', slices, completedWork: [], pendingWork: slices.map(s => s.id),
    blockers: [], decisions: [], evidence: [], attempts: {}, gitHeadBefore: 'mock-head',
    gitHeadAfter: 'mock-head', modifiedFiles: [], baselineFiles: [], policyHash: 'mock-hash', apiCalls: 0,
    ...overrides,
  };
}
function harness(overrides = {}) {
  const snapshots = [], calls = [];
  const ports = {
    now: () => now, checkpoint: state => snapshots.push(structuredClone(state)),
    guard: () => {}, stopped: () => false, decide: async () => null,
    execute: async capability => { calls.push(capability); return outcome(); }, ...overrides,
  };
  return { ports, snapshots, calls };
}

test('blocked dependencies do not prevent independent work, and restricted work never executes', async () => {
  const state = session([slice('owner', 'unknown'), slice('dependent', 'repo-audit', 'AUTO', ['owner']),
    slice('danger', 'deploy'), slice('independent'), slice('review', 'canon-audit')]);
  const h = harness();
  await runSession(state, h.ports);
  assert.equal(state.status, 'BLOCKED');
  assert.deepEqual(h.calls, ['repo-audit', 'canon-audit']);
  assert.deepEqual(state.completedWork, ['independent', 'review']);
  assert.deepEqual(state.pendingWork, ['dependent']);
  assert.deepEqual(state.blockers.map(b => b.reason), ['OWNER-ONLY', 'DANGEROUS']);
});

test('retries stop at initial attempt plus retry budget and continue independent work', async () => {
  const state = session([slice('retry'), slice('next')], { retryBudget: 2 });
  const h = harness({ execute: async (_, s) => outcome(s.currentSlice === 'retry' ? 'RETRYABLE' : 'COMPLETE') });
  await runSession(state, h.ports);
  assert.equal(state.attempts.retry, 3);
  assert.equal(state.iterationCount, 4);
  assert.deepEqual(state.completedWork, ['next']);
  assert.equal(state.blockers[0].reason, 'RETRY_BUDGET');
});

test('iteration limit, elapsed deadline and explicit stop prevent further execution', async () => {
  for (const [overrides, ports, expected] of [
    [{ maxIterations: 1, iterationCount: 1 }, {}, 'MAX_ITERATIONS'],
    [{ deadline: new Date(now).toISOString() }, {}, 'DEADLINE'],
    [{}, { stopped: () => true }, 'STOPPED'],
  ]) {
    const state = session(undefined, overrides), h = harness(ports);
    await runSession(state, h.ports);
    assert.equal(state.status, expected);
    assert.deepEqual(h.calls, []);
    assert.deepEqual(state.pendingWork, ['audit']);
    assert.equal(h.snapshots.at(-1).status, expected);
  }
});

test('decision is durable before execution and cannot silently downgrade when unavailable', async () => {
  const decision = { choice: 'canon-audit', rationale: 'Needs canon', review: 'approved' };
  const state = session([slice('choose', 'choose-audit')]);
  const h = harness({ decide: async () => decision });
  h.ports.execute = async capability => {
    assert.equal(capability, 'canon-audit');
    assert.deepEqual(h.snapshots.at(-1).decisions, [{ slice: 'choose', record: decision }]);
    return outcome();
  };
  await runSession(state, h.ports);
  assert.equal(state.status, 'COMPLETE');
  for (const value of [null, { ...decision, choice: 'shell' }]) {
    const rejected = session([slice('choose', 'choose-audit')]);
    const failed = harness({ decide: async () => value });
    await runSession(rejected, failed.ports);
    assert.equal(rejected.status, 'BLOCKED');
    assert.deepEqual(failed.calls, []);
  }
});

test('deadline or stop reached during decision prevents capability execution', async () => {
  for (const stop of [false, true]) {
    let decided = false;
    const state = session([slice('choose', 'choose-audit')], { deadline: new Date(now + 1000).toISOString() });
    const h = harness({ now: () => now + (decided && !stop ? 1000 : 0), stopped: () => stop && decided,
      decide: async () => { decided = true; return { choice: 'repo-audit', rationale: 'test', review: 'approved' }; } });
    await runSession(state, h.ports);
    assert.equal(state.status, stop ? 'STOPPED' : 'DEADLINE');
    assert.deepEqual(h.calls, []);
  }
});

test('crash checkpoint consumes budget on resume without repeating completed work or leaking exception', async () => {
  const state = session([slice('done'), slice('crash')], { retryBudget: 0 });
  const h = harness({ execute: async (_, s) => {
    if (s.currentSlice === 'crash') throw new Error('SECRET_SENTINEL');
    return outcome();
  } });
  await runSession(state, h.ports);
  assert.equal(state.status, 'BLOCKED');
  assert.equal(JSON.stringify(h.snapshots).includes('SECRET_SENTINEL'), false);
  const durableAttempt = h.snapshots.findLast(s => s.currentSlice === 'crash' && s.attempts.crash === 1);
  const resumed = structuredClone(durableAttempt), next = harness();
  await runSession(resumed, next.ports);
  assert.deepEqual(next.calls, []);
  assert.deepEqual(resumed.completedWork, ['done']);
  assert.ok(resumed.blockers.some(b => b.reason === 'RETRY_BUDGET'));
});

test('resumed decision must not route to a forged capability', async () => {
  const state = session([slice('choose', 'choose-audit')], {
    decisions: [{ slice: 'choose', record: { choice: 'shell', rationale: 'forged', review: 'forged' } }],
  });
  const h = harness();
  await runSession(state, h.ports);
  assert.deepEqual(h.calls, []);
  assert.equal(state.status, 'BLOCKED');
});

test('unavailable Owner decision stays pending and a later reply unblocks it', async () => {
  const state = session([slice('choose', 'choose-audit'), slice('independent')]);
  const first = harness({ decide: async () => null });
  await runSession(state, first.ports);
  assert.equal(state.status, 'BLOCKED');
  assert.deepEqual(first.calls, ['repo-audit']);
  assert.deepEqual(state.pendingWork, ['choose']);
  assert.deepEqual(state.completedWork, ['independent']);
  assert.ok(state.blockers.some(item => item.slice === 'choose' && item.reason === 'DECISION_UNAVAILABLE_OR_REJECTED'));

  const resumed = structuredClone(state);
  const reply = { choice: 'canon-audit', rationale: 'Owner selected OPTION B.', review: 'approved' };
  const second = harness({ decide: async () => reply });
  await runSession(resumed, second.ports);
  assert.equal(resumed.status, 'COMPLETE');
  assert.deepEqual(second.calls, ['canon-audit']);
  assert.equal(resumed.blockers.some(item => item.slice === 'choose' && item.reason === 'DECISION_UNAVAILABLE_OR_REJECTED'), false);
  assert.deepEqual(resumed.completedWork, ['independent', 'choose']);
});

test('valid persisted decision is reused on resume without another provider call', async () => {
  const state = session([slice('choose', 'choose-audit')], {
    decisions: [{ slice: 'choose', record: { choice: 'canon-audit', rationale: 'reviewed', review: 'approved' } }],
  });
  let decisions = 0;
  const h = harness({ decide: async () => { decisions++; return null; } });
  await runSession(state, h.ports);
  assert.equal(decisions, 0);
  assert.deepEqual(h.calls, ['canon-audit']);
  assert.equal(state.status, 'COMPLETE');
});

test('guard failure blocks execution and persists only a fixed error code', async () => {
  const state = session();
  const h = harness({ guard: () => { throw new Error('SECRET_SENTINEL'); } });
  await runSession(state, h.ports);
  assert.deepEqual(h.calls, []);
  assert.equal(state.status, 'BLOCKED');
  assert.deepEqual(state.blockers, [{ slice: 'session', reason: 'GUARD_OR_EXECUTION_FAILED' }]);
  assert.equal(JSON.stringify(h.snapshots).includes('SECRET_SENTINEL'), false);
});

test('prototype-like slice names keep numeric attempts and remain resumable', async () => {
  const state = session([slice('constructor')]);
  await runSession(state, harness().ports);
  assert.equal(state.status, 'COMPLETE');
  assert.equal(state.attempts.constructor, 1);
  const resumed = JSON.parse(JSON.stringify(state));
  const h = harness();
  await runSession(resumed, h.ports);
  assert.equal(resumed.status, 'COMPLETE');
  assert.deepEqual(h.calls, []);
});
