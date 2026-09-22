import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  captureRepoState,
  needsWindowsShell,
  runPrePushGate,
  statesMatch,
} from './pre-push-gate.mjs';
import {
  CI_STATES,
  ingestCiFailure,
  isGreen,
  isTerminalFail,
  statusForSha,
  waitForSha,
} from './post-push-ci.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Narrow argv only. No caller-supplied git push flags. */
export const SAFE_PUSH_ARGV = Object.freeze(['git', 'push', 'origin', 'main']);

function defaultGit(args, cwd = root) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
}

function defaultRun(argv, cwd = root) {
  const [command, ...args] = argv;
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: needsWindowsShell(command),
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function assertSafeMainContext(state) {
  if (!state?.ok) {
    return { ok: false, reason: state?.reason || 'invalid_state', detail: state?.disallowedDirty || state?.detail };
  }
  if (state.branch !== 'main') {
    return { ok: false, reason: 'wrong_branch', detail: state.branch };
  }
  return { ok: true, reason: 'ready' };
}

export function assertFastForwardIntent({ git = defaultGit, cwd = root, head, originMain } = {}) {
  if (!head || !originMain) return { ok: false, reason: 'missing_sha' };
  if (head === originMain) return { ok: false, reason: 'nothing_to_push' };
  const mergeBase = git(['merge-base', originMain, head], cwd);
  if ((mergeBase.status ?? 1) !== 0) {
    return { ok: false, reason: 'merge_base_failed', detail: (mergeBase.stderr || '').trim() };
  }
  const base = (mergeBase.stdout || '').trim();
  if (base !== originMain) {
    return { ok: false, reason: 'non_fast_forward', detail: `origin/main=${originMain} merge-base=${base}` };
  }
  return { ok: true, reason: 'fast_forward' };
}

/**
 * Canonical autonomous Cursor push path.
 * Gate → exact SHA push → mandatory exact-SHA CI wait.
 * Transport success (pushed=true) is separate from quality success (ok + CI_GREEN).
 */
export function runPushMain(options = {}) {
  const cwd = options.cwd || root;
  const git = options.git || defaultGit;
  const run = options.run || defaultRun;
  const runGate = options.runGate || ((opts) => runPrePushGate({ ...opts, git, run, cwd }));
  const push = options.push || ((argv) => run(argv, cwd));
  const waitCi = options.waitCi || ((sha, opts) => waitForSha(sha, opts));
  const statusCi = options.statusCi || ((sha, opts) => statusForSha(sha, opts));
  const ingestFailure = options.ingestCiFailure || ingestCiFailure;
  const skipCiWait = options.skipCiWait === true;

  if (Array.isArray(options.argv) && options.argv.length > 0) {
    return { ok: false, reason: 'argv_refused', detail: 'push-main accepts no git push arguments' };
  }

  const before = captureRepoState({ git, cwd });
  const context = assertSafeMainContext(before);
  if (!context.ok) {
    return { ok: false, reason: context.reason, state: before, detail: context.detail, pushed: false };
  }

  const baseSha = before.originMain;
  const candidateSha = before.head;

  const ff = assertFastForwardIntent({
    git,
    cwd,
    head: candidateSha,
    originMain: baseSha,
  });
  if (!ff.ok) {
    return { ok: false, reason: ff.reason, state: before, detail: ff.detail, pushed: false };
  }

  const gate = runGate({ git, run, cwd, state: before });
  if (!gate.ok) {
    return {
      ok: false,
      reason: 'gate_failed',
      state: before,
      gate,
      failedCheck: gate.failedCheck,
      pushed: false,
      baseSha,
      candidateSha,
    };
  }

  const mid = captureRepoState({ git, cwd });
  if (!mid.ok || !statesMatch(gate.state, mid)) {
    return {
      ok: false,
      reason: 'state_changed_before_push',
      state: gate.state,
      afterState: mid,
      pushed: false,
      baseSha,
      candidateSha,
    };
  }

  if (options.dryRun === true) {
    return {
      ok: true,
      reason: 'dry_run',
      state: mid,
      gate,
      pushArgv: [...SAFE_PUSH_ARGV],
      pushed: false,
      baseSha,
      candidateSha,
      pushedSha: null,
      ciState: null,
    };
  }

  const pushed = push([...SAFE_PUSH_ARGV]);
  const exitCode = pushed.status ?? 1;
  if (exitCode !== 0) {
    return {
      ok: false,
      reason: 'push_failed',
      state: mid,
      gate,
      exitCode,
      detail: String(pushed.stderr || pushed.stdout || '').slice(0, 800),
      pushed: false,
      baseSha,
      candidateSha,
      pushedSha: null,
      ciState: null,
    };
  }

  const pushedSha = candidateSha;

  if (skipCiWait) {
    return {
      ok: true,
      reason: 'pushed',
      state: mid,
      gate,
      pushArgv: [...SAFE_PUSH_ARGV],
      pushed: true,
      exitCode: 0,
      baseSha,
      candidateSha,
      pushedSha,
      ciState: null,
    };
  }

  let baseShaWasGreen = false;
  if (baseSha) {
    const baseStatus = statusCi(baseSha, { includeJobs: false, ...(options.ciOptions || {}) });
    baseShaWasGreen = isGreen(baseStatus.state);
  }

  const ci = waitCi(pushedSha, options.ciOptions || {});
  const ciState = ci.state || CI_STATES.CI_UNAVAILABLE;

  if (isGreen(ciState)) {
    return {
      ok: true,
      reason: 'pushed_ci_green',
      state: mid,
      gate,
      pushArgv: [...SAFE_PUSH_ARGV],
      pushed: true,
      exitCode: 0,
      baseSha,
      candidateSha,
      pushedSha,
      ciState,
      ci,
      baseShaWasGreen,
    };
  }

  let ingest = null;
  if (isTerminalFail(ciState)) {
    ingest = ingestFailure(ci, {
      baseShaWasGreen,
      ...(options.ingestOptions || {}),
    });
  }

  return {
    ok: false,
    reason: ciState === CI_STATES.CI_WAIT_TIMEOUT
      ? 'ci_wait_timeout'
      : ciState === CI_STATES.CI_UNAVAILABLE
        ? 'ci_unavailable'
        : 'ci_failed',
    state: mid,
    gate,
    pushArgv: [...SAFE_PUSH_ARGV],
    pushed: true,
    exitCode: 0,
    baseSha,
    candidateSha,
    pushedSha,
    ciState,
    ci,
    baseShaWasGreen,
    ingest,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv.slice(2).some((arg) => arg !== '--dry-run')) {
    console.error('usage: node scripts/ci/push-main.mjs [--dry-run]');
    process.exitCode = 2;
  } else {
    const result = runPushMain({ dryRun: process.argv.includes('--dry-run') });
    console.log(JSON.stringify({
      ok: result.ok,
      reason: result.reason,
      head: result.state?.head,
      baseSha: result.baseSha || null,
      pushedSha: result.pushedSha || null,
      failedCheck: result.failedCheck
        ? { id: result.failedCheck.id, label: result.failedCheck.label, exitCode: result.failedCheck.exitCode }
        : null,
      pushArgv: result.pushArgv,
      pushed: result.pushed === true,
      ciState: result.ciState || null,
      ciRunId: result.ci?.run?.databaseId || null,
      ciUrl: result.ci?.run?.url || null,
      failureSignature: result.ci?.failureSignature || null,
    }, null, 2));
    if (result.detail) console.error(result.detail);
    if (result.gate?.failedCheck?.detail) console.error(result.gate.failedCheck.detail);
    if (!result.ok) process.exitCode = 1;
  }
}
