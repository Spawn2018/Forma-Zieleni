import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANON, SessionStore, audit, git, guard, loadCanon, policyHash, readBounded, repository, safePath, validateState } from './repo.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureParent = path.join(workspace, 'tmp');
const sources = ['policy.ts', 'engine.ts', 'repo.mjs', 'decision.mjs', 'cli.mjs', 'package.json'].map(name => `scripts/autonomous-session/${name}`);
function fixtureGit(root, args) {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.autocrlf=false',
    '-c', 'user.name=Local Test', '-c', 'user.email=local-test@example.invalid', ...args],
  { cwd: root, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null' } }).trim();
}
function fixture(t, branch = 'main') {
  mkdirSync(fixtureParent, { recursive: true });
  const root = realpathSync(mkdtempSync(path.join(fixtureParent, 'autonomous-test-')));
  t.after(() => {
    const relative = path.relative(realpathSync(fixtureParent), realpathSync(root));
    assert.ok(!relative.startsWith('..') && !path.isAbsolute(relative) && /^autonomous-test-[^/\\]+$/.test(relative));
    rmSync(root, { recursive: true, force: true });
  });
  fixtureGit(root, ['init', '-b', branch]);
  for (const file of [...CANON, ...sources]) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    copyFileSync(path.join(workspace, file), path.join(root, file));
  }
  writeFileSync(path.join(root, '.gitignore'), '.autonomous-sessions/\n');
  fixtureGit(root, ['add', '.']);
  fixtureGit(root, ['commit', '-m', 'Local deterministic fixture']);
  return root;
}
function state(root) {
  const head = git(root, 'head');
  return { version: 1, id: randomUUID(), objective: 'Local audit fixture', repo: root,
    createdAt: '2026-09-20T12:00:00Z', updatedAt: '2026-09-20T12:00:00Z', deadline: null,
    maxIterations: 5, retryBudget: 1, iterationCount: 0, currentSlice: null, status: 'READY',
    slices: [{ id: 'audit', capability: 'repo-audit', classification: 'AUTO', dependsOn: [] }],
    completedWork: [], pendingWork: ['audit'], blockers: [], decisions: [], evidence: [], attempts: {},
    gitHeadBefore: head, gitHeadAfter: head, modifiedFiles: [], baselineFiles: [], policyHash: policyHash(root), apiCalls: 0 };
}

test('store replaces complete checkpoints atomically and prevents concurrent ownership', t => {
  const root = fixture(t), current = state(root), store = new SessionStore(root, current.id);
  try {
    store.write(current);
    assert.deepEqual(store.read(), current);
    assert.throws(() => new SessionStore(root, current.id), /EEXIST/);
    current.status = 'STOPPED';
    store.write(current);
    assert.deepEqual(store.read(), current);
    assert.deepEqual(readdirSync(store.dir).sort(), ['lock', 'state.json']);
  } finally { store.close(); }
  const reopened = new SessionStore(root, current.id);
  try { assert.deepEqual(reopened.read(), current); } finally { reopened.close(); }
});

test('checkpoint validation rejects forged completion, missing state and tampered accounting', t => {
  const root = fixture(t), original = state(root);
  validateState(original);
  for (const alter of [
    s => { s.status = 'COMPLETE'; },
    s => { delete s.createdAt; },
    s => { s.policyHash = 'tampered'; },
    s => { s.attempts = { audit: 1 }; },
    s => { s.apiCalls = 5; },
    s => { s.pendingWork = []; },
    s => { s.status = 'COMPLETE'; s.pendingWork = []; s.completedWork = ['audit']; },
    s => { s.decisions = [{ slice: 'audit', record: { choice: 'shell', rationale: 'forged', review: 'forged' } }]; },
  ]) {
    const changed = structuredClone(original); alter(changed);
    assert.throws(() => validateState(changed), /INVALID_CHECKPOINT/);
  }
  const store = new SessionStore(root, original.id);
  try {
    store.write({ ...original, id: randomUUID() });
    assert.throws(() => store.read(), /INVALID_CHECKPOINT/);
    store.write({ ...original, repo: path.join(root, 'other') });
    assert.throws(() => store.read(), /INVALID_CHECKPOINT/);
  } finally { store.close(); }
});

test('main guard and baseline hash detect branch mismatch and policy tampering', t => {
  const root = fixture(t), original = state(root);
  assert.equal(repository(root), root);
  guard(root, original);
  writeFileSync(path.join(root, CANON[0]), `${readFileSync(path.join(root, CANON[0]), 'utf8')}\nChanged fixture\n`);
  assert.throws(() => guard(root, original), /SESSION_BASELINE_CHANGED/);
  assert.throws(() => repository(fixture(t, 'fixture-other')), /MAIN_ONLY_REPO_GUARD/);
});

test('paths reject traversal and directory links before reading', t => {
  const root = fixture(t);
  for (const value of ['../escape', '/absolute', 'C:/escape', 'nested\\file', './file', 'a//b', '.. /escape', 'a./file', 'NUL', 'CON.txt', 'a\0b']) {
    assert.throws(() => safePath(root, value), /UNSAFE_PATH/);
  }
  assert.throws(() => readBounded(root, CANON[0], 1), /UNSAFE_FILE/);
  const link = path.join(root, 'linked-docs');
  try { symlinkSync(path.join(root, 'docs'), link, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) { t.diagnostic('Directory link creation unavailable; traversal assertions passed.'); return; }
    throw error;
  }
  assert.throws(() => safePath(root, 'linked-docs/vision/MASTER-PLAN.md'), /UNSAFE_LINK/);
});

test('git rejects unknown operations and unsafe filter/include configuration', t => {
  const root = fixture(t);
  for (const operation of ['push', 'shell', 'constructor', 'status --porcelain']) assert.throws(() => git(root, operation), /COMMAND_DENIED/);
  for (const [key, value] of [['filter.test.clean', 'never-executed-command'], ['include.path', 'missing-config'],
    ['includeIf.gitdir:test.path', 'missing-config'], ['extensions.worktreeConfig', 'true']]) {
    fixtureGit(root, ['config', '--local', key, value]);
    try {
      assert.throws(() => git(root, 'status'), /UNSAFE_GIT_CONFIG/);
      assert.throws(() => git(root, 'diff'), /UNSAFE_GIT_CONFIG/);
    } finally { fixtureGit(root, ['config', '--local', '--unset', key]); }
  }
});

test('audits return all canonical stages with explicit applicable and inapplicable evidence', t => {
  const root = fixture(t), current = state(root), { stages } = loadCanon(root);
  for (const capability of ['repo-audit', 'canon-audit']) {
    const result = audit(root, capability, current);
    assert.equal(result.status, 'COMPLETE');
    assert.deepEqual(result.evidence.map(e => e.stage), stages);
    assert.equal(result.evidence.length, 13);
    assert.equal(result.evidence.find(e => e.stage === 'IMPLEMENT').result, 'NA');
    assert.equal(result.evidence.at(-1).result, 'PASS');
    assert.ok(result.evidence.every(e => typeof e.detail === 'string' && e.detail.length));
  }
  assert.deepEqual(audit(root, 'shell', current), { status: 'BLOCKED', evidence: [], reason: 'CAPABILITY_DENIED' });
});

function cli(root, args) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/autonomous-session/cli.mjs'), ...args],
    { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 60000 });
}

test('CLI checkpoints a finite plan, resumes without repeating work and guards completed sessions', t => {
  const root = fixture(t);
  const started = cli(root, ['start', '--objective', 'Fixture audit', '--max-iterations', '1']);
  assert.equal(started.status, 2, started.stderr);
  const summary = JSON.parse(started.stdout);
  assert.equal(summary.status, 'MAX_ITERATIONS');
  assert.equal(summary.completed, 1);
  const resumed = cli(root, ['resume', '--id', summary.id]);
  assert.equal(resumed.status, 2, resumed.stderr);
  assert.equal(JSON.parse(resumed.stdout).iterations, 1);
  const completed = cli(root, ['start', '--objective', 'Complete fixture audit']);
  assert.equal(completed.status, 0, completed.stderr);
  const done = JSON.parse(completed.stdout);
  assert.equal(done.status, 'COMPLETE');
  writeFileSync(path.join(root, CANON[0]), 'Changed policy');
  const rejected = cli(root, ['resume', '--id', done.id]);
  assert.equal(rejected.status, 2, rejected.stderr);
  assert.equal(JSON.parse(rejected.stdout).status, 'BLOCKED');
});

test('CLI keeps restricted/offline blockers readable and never logs secret input', t => {
  const root = fixture(t);
  writeFileSync(path.join(root, 'plan.json'), JSON.stringify([
    { id: 'owner', capability: 'vendor-selection', classification: 'OWNER-ONLY', dependsOn: [] },
    { id: 'danger', capability: 'dns', classification: 'AUTO', dependsOn: [] },
    { id: 'decision', capability: 'choose-audit', classification: 'OWNER-DECISION', dependsOn: [] },
    { id: 'safe', capability: 'repo-audit', classification: 'AUTO', dependsOn: [] },
  ]));
  const started = cli(root, ['start', '--objective', 'Guard fixture audit', '--plan', 'plan.json']);
  assert.equal(started.status, 2, started.stderr);
  const summary = JSON.parse(started.stdout);
  assert.equal(summary.completed, 1);
  assert.equal(summary.blockers, 3);
  assert.equal(summary.apiCalls, 0);
  const status = cli(root, ['status', '--id', summary.id]);
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).blockers, 3);
  const secret = 'sk-test-LOCAL_SENTINEL_12345678';
  const rejected = cli(root, ['start', '--objective', secret]);
  assert.equal(rejected.status, 1);
  assert.equal((rejected.stdout + rejected.stderr).includes(secret), false);
});

test('CLI applies an unambiguous Owner reply to choose-audit and leaves independent work unblocked', t => {
  const root = fixture(t);
  writeFileSync(path.join(root, 'plan.json'), JSON.stringify([
    { id: 'decision', capability: 'choose-audit', classification: 'OWNER-DECISION', dependsOn: [] },
    { id: 'safe', capability: 'repo-audit', classification: 'AUTO', dependsOn: [] },
  ]));
  const started = cli(root, ['start', '--objective', 'Owner decision fixture', '--plan', 'plan.json',
    '--decision', 'DECISION FZ-CTL-001: OPTION B']);
  assert.equal(started.status, 0, started.stderr);
  const summary = JSON.parse(started.stdout);
  assert.equal(summary.status, 'COMPLETE');
  assert.equal(summary.completed, 2);
  assert.equal(summary.blockers, 0);
  assert.equal(summary.apiCalls, 0);
});
