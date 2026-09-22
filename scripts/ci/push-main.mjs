import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  captureRepoState,
  platformCommand,
  runPrePushGate,
  statesMatch,
} from './pre-push-gate.mjs';

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
  return spawnSync(platformCommand(command), args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: false,
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
  if (state.head !== state.originMain) {
    // Local commits ahead of origin are expected before push.
    // Refuse only if origin is ahead or histories diverged (non-ff intent).
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
 * Runs the pre-push gate, re-checks state, then `git push origin main` only.
 */
export function runPushMain(options = {}) {
  const cwd = options.cwd || root;
  const git = options.git || defaultGit;
  const run = options.run || defaultRun;
  const runGate = options.runGate || ((opts) => runPrePushGate({ ...opts, git, run, cwd }));
  const push = options.push || ((argv) => run(argv, cwd));

  if (Array.isArray(options.argv) && options.argv.length > 0) {
    return { ok: false, reason: 'argv_refused', detail: 'push-main accepts no git push arguments' };
  }

  const before = captureRepoState({ git, cwd });
  const context = assertSafeMainContext(before);
  if (!context.ok) {
    return { ok: false, reason: context.reason, state: before, detail: context.detail };
  }

  const ff = assertFastForwardIntent({
    git,
    cwd,
    head: before.head,
    originMain: before.originMain,
  });
  if (!ff.ok) {
    return { ok: false, reason: ff.reason, state: before, detail: ff.detail };
  }

  const gate = runGate({ git, run, cwd, state: before });
  if (!gate.ok) {
    return {
      ok: false,
      reason: 'gate_failed',
      state: before,
      gate,
      failedCheck: gate.failedCheck,
    };
  }

  const mid = captureRepoState({ git, cwd });
  if (!mid.ok || !statesMatch(gate.state, mid)) {
    return {
      ok: false,
      reason: 'state_changed_before_push',
      state: gate.state,
      afterState: mid,
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
    };
  }

  return {
    ok: true,
    reason: 'pushed',
    state: mid,
    gate,
    pushArgv: [...SAFE_PUSH_ARGV],
    pushed: true,
    exitCode: 0,
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
      failedCheck: result.failedCheck
        ? { id: result.failedCheck.id, label: result.failedCheck.label, exitCode: result.failedCheck.exitCode }
        : null,
      pushArgv: result.pushArgv,
      pushed: result.pushed === true,
    }, null, 2));
    if (result.detail) console.error(result.detail);
    if (result.gate?.failedCheck?.detail) console.error(result.gate.failedCheck.detail);
    if (!result.ok) process.exitCode = 1;
  }
}
