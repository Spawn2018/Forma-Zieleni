import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reportBlockers } from '../fz-cis/store.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Owner-local Cursor IDE state. Never staged by this gate. */
export const ALLOWED_DIRTY = Object.freeze(['.cursor/settings.json']);

export const MANDATORY_CHECKS = Object.freeze([
  { id: 'docs', label: 'pnpm docs:check', argv: ['pnpm', 'docs:check'] },
  { id: 'typecheck', label: 'pnpm typecheck', argv: ['pnpm', 'typecheck'] },
  { id: 'lint', label: 'pnpm lint', argv: ['pnpm', 'lint'] },
  { id: 'test', label: 'pnpm test', argv: ['pnpm', 'test'] },
  { id: 'repo', label: 'pnpm repo:check', argv: ['pnpm', 'repo:check'] },
  { id: 'readme', label: 'pnpm readme:check', argv: ['pnpm', 'readme:check'] },
  { id: 'audit', label: 'pnpm audit --audit-level=moderate', argv: ['pnpm', 'audit', '--audit-level=moderate'] },
  { id: 'diff-check', label: 'git diff --check', argv: ['git', 'diff', '--check'] },
]);

function needsWindowsShell(command) {
  return process.platform === 'win32'
    && (command === 'pnpm' || command === 'npm' || command === 'npx');
}

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
  // Fixed allowlisted argv only. Windows .cmd shims require shell for spawnSync.
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    shell: needsWindowsShell(command),
    maxBuffer: 16 * 1024 * 1024,
  });
}

export { needsWindowsShell };

function trimOutput(text, limit = 800) {
  const value = String(text || '').replace(/\u0000/g, '').trim();
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
}

export function dirtyPaths(statusShort = '') {
  return String(statusShort || '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => line.replace(/^[ MADRCU?]{1,2}\s+/, '').replace(/^"|"$/g, '').replace(/\\/g, '/'));
}

export function assertAllowedDirty(paths, allowed = ALLOWED_DIRTY) {
  const allow = new Set(allowed);
  const blocked = [...new Set(paths)].filter((file) => !allow.has(file));
  return {
    ok: blocked.length === 0,
    blocked,
    allowedPresent: paths.filter((file) => allow.has(file)),
  };
}

export function captureRepoState({ git = defaultGit, cwd = root } = {}) {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
  const head = git(['rev-parse', 'HEAD'], cwd);
  const origin = git(['rev-parse', 'origin/main'], cwd);
  const status = git(['status', '--short'], cwd);
  if ((branch.status ?? 1) !== 0 || (head.status ?? 1) !== 0 || (origin.status ?? 1) !== 0 || (status.status ?? 1) !== 0) {
    return {
      ok: false,
      reason: 'git_state_unavailable',
      detail: trimOutput(`${branch.stderr || ''}${head.stderr || ''}${origin.stderr || ''}${status.stderr || ''}`),
    };
  }
  const paths = dirtyPaths(status.stdout || '');
  const dirty = assertAllowedDirty(paths);
  return {
    ok: dirty.ok,
    reason: dirty.ok ? 'captured' : 'disallowed_dirty',
    branch: (branch.stdout || '').trim(),
    head: (head.stdout || '').trim(),
    originMain: (origin.stdout || '').trim(),
    dirtyPaths: paths,
    disallowedDirty: dirty.blocked,
    allowedDirtyPresent: dirty.allowedPresent,
  };
}

export function statesMatch(before, after) {
  if (!before?.ok || !after?.ok) return false;
  return before.branch === after.branch
    && before.head === after.head
    && before.originMain === after.originMain
    && JSON.stringify(before.dirtyPaths) === JSON.stringify(after.dirtyPaths);
}

function runLearningBlockers({ report = reportBlockers } = {}) {
  try {
    const blockers = report();
    if (!Array.isArray(blockers)) {
      return { id: 'learning-blockers', label: 'FZ-CIS push blockers', ok: false, exitCode: 1, detail: 'invalid_blockers' };
    }
    if (blockers.length > 0) {
      return {
        id: 'learning-blockers',
        label: 'FZ-CIS push blockers',
        ok: false,
        exitCode: 1,
        detail: blockers.map((item) => item.id || item.patternKey || 'blocker').join(','),
      };
    }
    return { id: 'learning-blockers', label: 'FZ-CIS push blockers', ok: true, exitCode: 0, detail: '' };
  } catch (err) {
    return {
      id: 'learning-blockers',
      label: 'FZ-CIS push blockers',
      ok: false,
      exitCode: 1,
      detail: err.code || err.message || 'blocker_error',
    };
  }
}

/**
 * Deterministic local gate matching GitHub Verify + git diff --check.
 * PASS only when every mandatory check exits 0 and repo state is stable.
 */
export function runPrePushGate(options = {}) {
  const cwd = options.cwd || root;
  const git = options.git || defaultGit;
  const run = options.run || defaultRun;
  const checks = options.checks || MANDATORY_CHECKS;
  const before = options.state || captureRepoState({ git, cwd });
  if (!before.ok) {
    return {
      ok: false,
      reason: before.reason || 'invalid_state',
      state: before,
      failedCheck: null,
      results: [],
    };
  }
  if (before.branch !== 'main') {
    return {
      ok: false,
      reason: 'wrong_branch',
      state: before,
      failedCheck: { id: 'branch', label: 'branch must be main', exitCode: 1, detail: before.branch },
      results: [],
    };
  }

  const results = [];
  for (const check of checks) {
    const spawned = run(check.argv, cwd);
    const exitCode = spawned.status == null ? 1 : spawned.status;
    const entry = {
      id: check.id,
      label: check.label,
      exitCode,
      ok: exitCode === 0,
      detail: exitCode === 0
        ? ''
        : trimOutput(`${spawned.error?.message || ''}\n${spawned.stderr || ''}\n${spawned.stdout || ''}`),
    };
    results.push(entry);
    if (!entry.ok) {
      return {
        ok: false,
        reason: 'check_failed',
        state: before,
        failedCheck: entry,
        results,
      };
    }
  }

  const learning = runLearningBlockers({ report: options.reportBlockers || reportBlockers });
  results.push(learning);
  if (!learning.ok) {
    return {
      ok: false,
      reason: 'learning_blocker',
      state: before,
      failedCheck: learning,
      results,
    };
  }

  const after = captureRepoState({ git, cwd });
  if (!after.ok || !statesMatch(before, after)) {
    const detail = after.ok
      ? [
        `head ${before.head}→${after.head}`,
        `origin ${before.originMain}→${after.originMain}`,
        `dirty ${JSON.stringify(before.dirtyPaths)}→${JSON.stringify(after.dirtyPaths)}`,
      ].join('; ')
      : after.reason;
    return {
      ok: false,
      reason: 'state_changed',
      state: before,
      afterState: after,
      failedCheck: {
        id: 'state',
        label: 'repository state unchanged through gate',
        exitCode: 1,
        detail,
      },
      results,
    };
  }

  return {
    ok: true,
    reason: 'pass',
    state: after,
    failedCheck: null,
    results,
    verifiedAt: new Date().toISOString(),
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = runPrePushGate();
  console.log(JSON.stringify({
    ok: result.ok,
    reason: result.reason,
    head: result.state?.head,
    branch: result.state?.branch,
    failedCheck: result.failedCheck
      ? { id: result.failedCheck.id, label: result.failedCheck.label, exitCode: result.failedCheck.exitCode }
      : null,
  }, null, 2));
  if (!result.ok) {
    if (result.failedCheck?.detail) console.error(result.failedCheck.detail);
    process.exitCode = 1;
  }
}
