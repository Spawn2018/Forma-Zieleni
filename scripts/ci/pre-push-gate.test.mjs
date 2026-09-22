import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALLOWED_DIRTY,
  MANDATORY_CHECKS,
  assertAllowedDirty,
  captureRepoState,
  dirtyPaths,
  runPrePushGate,
  statesMatch,
} from './pre-push-gate.mjs';
import {
  SAFE_PUSH_ARGV,
  assertFastForwardIntent,
  assertSafeMainContext,
  runPushMain,
} from './push-main.mjs';
import { classifyShell } from '../fz-noc/policy.mjs';
import { classifyObservedPrompt } from '../fz-noc/permissions.mjs';

function okGit({
  branch = 'main',
  head = 'aaa111',
  origin = 'bbb222',
  status = ' M .cursor/settings.json\n',
} = {}) {
  return (args) => {
    const key = args.join(' ');
    if (key === 'rev-parse --abbrev-ref HEAD') return { status: 0, stdout: `${branch}\n`, stderr: '' };
    if (key === 'rev-parse HEAD') return { status: 0, stdout: `${head}\n`, stderr: '' };
    if (key === 'rev-parse origin/main') return { status: 0, stdout: `${origin}\n`, stderr: '' };
    if (key === 'status --short') return { status: 0, stdout: status, stderr: '' };
    if (key.startsWith('merge-base ')) {
      return { status: 0, stdout: `${origin}\n`, stderr: '' };
    }
    return { status: 1, stdout: '', stderr: `unexpected git ${key}` };
  };
}

function runMap(map) {
  return (argv) => {
    const label = argv.join(' ');
    if (!Object.hasOwn(map, label)) return { status: 1, stdout: '', stderr: `unexpected ${label}` };
    const entry = map[label];
    return { status: entry, stdout: entry === 0 ? 'ok\n' : 'fail\n', stderr: '' };
  };
}

test('mandatory checks match the Verify path plus git diff --check', () => {
  assert.deepEqual(MANDATORY_CHECKS.map((item) => item.id), [
    'docs', 'typecheck', 'lint', 'test', 'repo', 'readme', 'audit', 'diff-check',
  ]);
  assert.deepEqual(ALLOWED_DIRTY, ['.cursor/settings.json']);
});

test('dirty path parsing keeps only the Owner-local settings exception', () => {
  assert.deepEqual(dirtyPaths(' M .cursor/settings.json\n'), ['.cursor/settings.json']);
  assert.equal(assertAllowedDirty(['.cursor/settings.json']).ok, true);
  assert.equal(assertAllowedDirty(['.cursor/settings.json', 'README.md']).ok, false);
});

test('gate PASS when every mandatory command succeeds and state is stable', () => {
  const git = okGit({ head: 'ccc333', origin: 'bbb222' });
  const run = runMap(Object.fromEntries(MANDATORY_CHECKS.map((item) => [item.argv.join(' '), 0])));
  const result = runPrePushGate({
    git,
    run,
    reportBlockers: () => [],
  });
  assert.equal(result.ok, true);
  assert.equal(result.reason, 'pass');
  assert.equal(result.failedCheck, null);
  assert.equal(result.results.length, MANDATORY_CHECKS.length + 1);
});

test('gate FAIL stops on the first mandatory failure and does not claim PASS', () => {
  const map = Object.fromEntries(MANDATORY_CHECKS.map((item) => [item.argv.join(' '), 0]));
  map['pnpm test'] = 1;
  const result = runPrePushGate({
    git: okGit({ head: 'ccc333', origin: 'bbb222' }),
    run: runMap(map),
    reportBlockers: () => [],
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'check_failed');
  assert.equal(result.failedCheck.id, 'test');
  assert.equal(result.results.some((item) => item.id === 'repo'), false);
});

test('repo:check failure refuses the push wrapper', () => {
  const map = Object.fromEntries(MANDATORY_CHECKS.map((item) => [item.argv.join(' '), 0]));
  map['pnpm repo:check'] = 7;
  const pushes = [];
  const result = runPushMain({
    git: okGit({ head: 'ccc333', origin: 'bbb222' }),
    run: runMap(map),
    runGate: (opts) => runPrePushGate({ ...opts, reportBlockers: () => [] }),
    push: (argv) => {
      pushes.push(argv);
      return { status: 0, stdout: '', stderr: '' };
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'gate_failed');
  assert.equal(result.failedCheck.id, 'repo');
  assert.deepEqual(pushes, []);
});

test('HEAD change between verification and push refuses push', () => {
  let headReads = 0;
  const git = (args) => {
    const key = args.join(' ');
    if (key === 'rev-parse HEAD') {
      headReads += 1;
      return { status: 0, stdout: `${headReads === 1 ? 'ccc333' : 'ddd444'}\n`, stderr: '' };
    }
    return okGit({ head: 'ccc333', origin: 'bbb222' })(args);
  };
  const pushes = [];
  const result = runPushMain({
    git,
    runGate: () => ({
      ok: true,
      reason: 'pass',
      state: {
        ok: true,
        branch: 'main',
        head: 'ccc333',
        originMain: 'bbb222',
        dirtyPaths: ['.cursor/settings.json'],
      },
    }),
    push: (argv) => {
      pushes.push(argv);
      return { status: 0, stdout: '', stderr: '' };
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'state_changed_before_push');
  assert.deepEqual(pushes, []);
});

test('wrong branch refuses the safe-main wrapper', () => {
  const result = runPushMain({
    git: okGit({ branch: 'feature', head: 'ccc333', origin: 'bbb222' }),
    runGate: () => ({ ok: true }),
    push: () => ({ status: 0, stdout: '', stderr: '' }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'wrong_branch');
});

test('non-fast-forward intent is refused', () => {
  const git = (args) => {
    if (args[0] === 'merge-base') return { status: 0, stdout: 'zzz999\n', stderr: '' };
    return okGit({ head: 'ccc333', origin: 'bbb222' })(args);
  };
  const result = assertFastForwardIntent({ git, head: 'ccc333', originMain: 'bbb222' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'non_fast_forward');
  assert.equal(assertSafeMainContext({ ok: true, branch: 'main', head: 'a', originMain: 'b' }).ok, true);
});

test('push-main dry-run plans only git push origin main and accepts no argv', () => {
  const map = Object.fromEntries(MANDATORY_CHECKS.map((item) => [item.argv.join(' '), 0]));
  const pushes = [];
  const dry = runPushMain({
    git: okGit({ head: 'ccc333', origin: 'bbb222' }),
    run: runMap(map),
    runGate: (opts) => runPrePushGate({ ...opts, reportBlockers: () => [] }),
    push: (argv) => {
      pushes.push(argv);
      return { status: 0, stdout: '', stderr: '' };
    },
    dryRun: true,
  });
  assert.equal(dry.ok, true);
  assert.equal(dry.pushed, false);
  assert.deepEqual(dry.pushArgv, SAFE_PUSH_ARGV);
  assert.deepEqual(pushes, []);
  const refused = runPushMain({ argv: ['--force'] });
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, 'argv_refused');
});

test('capture and state matching detect mutation', () => {
  const a = captureRepoState({ git: okGit({ head: 'aaa', origin: 'bbb' }) });
  const b = captureRepoState({ git: okGit({ head: 'aaa', origin: 'bbb' }) });
  const c = captureRepoState({ git: okGit({ head: 'ccc', origin: 'bbb' }) });
  assert.equal(a.ok, true);
  assert.equal(statesMatch(a, b), true);
  assert.equal(statesMatch(a, c), false);
});

test('direct Cursor git push variants are denied and redirected to pnpm push:main', () => {
  for (const command of [
    'git push',
    'git push origin main',
    'git.exe push origin main',
    'git -C D:\\repo push origin main',
    'powershell -Command "git push"',
    'git status && git push origin main',
    'git push --no-verify',
    'git push origin main --no-verify',
  ]) {
    const decision = classifyShell(command);
    assert.equal(decision.permission, 'deny', command);
    assert.match(decision.agent_message, /pnpm push:main|DANGEROUS|no-verify|Force/i, command);
  }
  assert.equal(classifyShell('pnpm push:main').permission, 'allow');
  assert.equal(classifyShell('node scripts/ci/push-main.mjs').permission, 'allow');
  assert.equal(classifyObservedPrompt('git push origin main'), 'DANGEROUS');
  assert.equal(classifyObservedPrompt('pnpm push:main'), 'SAFE_CHECKPOINT_GIT');
});

test('force push remains DANGEROUS deny with the stronger reason', () => {
  for (const command of [
    'git push --force',
    'git push --force-with-lease',
    'git push --mirror',
    'git push origin --delete branch',
  ]) {
    const decision = classifyShell(command);
    assert.equal(decision.permission, 'deny', command);
    assert.match(decision.user_message, /git-push-force/);
  }
});
