import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  coderabbitDisposition,
  coderabbitPrivacyBlocked,
  coderabbitDiffContentBlocked,
} from '../fz-noc/policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const quotaScript = path.join(root, 'scripts', 'security', 'coderabbit-quota.mjs');

function runNode(args, env = process.env) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    env,
  });
}

function git(args) {
  return spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
}

function changedPaths({ base = 'origin/main', committed = true } = {}) {
  const args = committed
    ? ['diff', '--name-only', `${base}...HEAD`]
    : ['diff', '--name-only', 'HEAD'];
  const result = git(args);
  if (result.status !== 0) return { ok: false, paths: [], error: result.stderr || result.stdout };
  const paths = (result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return { ok: true, paths };
}

function changedDiff({ base = 'origin/main', committed = true } = {}) {
  const args = committed
    ? ['diff', `${base}...HEAD`]
    : ['diff', 'HEAD'];
  const result = git(args);
  if (result.status !== 0) return { ok: false, text: '', error: result.stderr || result.stdout };
  return { ok: true, text: result.stdout || '' };
}

function quotaReport() {
  const result = runNode([quotaScript]);
  if (result.status !== 0 && result.status !== 2) {
    return { status: 'UNAVAILABLE', remaining: 0, raw: result.stderr || result.stdout };
  }
  try {
    return JSON.parse((result.stdout || '').trim());
  } catch {
    return { status: 'UNAVAILABLE', remaining: 0, raw: result.stdout };
  }
}

function recordQuota(outcome) {
  return runNode([quotaScript, 'record', outcome]);
}

function resolveCoderabbit() {
  const fromEnv = process.env.CODERABBIT_BIN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const which = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['coderabbit'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (which.status === 0) {
    const first = (which.stdout || '').split(/\r?\n/).map((l) => l.trim()).find(Boolean);
    if (first) return first;
  }
  return null;
}

function parseAgentReview(output) {
  let findings = 0;
  let complete = null;
  for (const line of String(output || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const event = JSON.parse(trimmed);
      if (event.type === 'finding' || event.finding || event.severity) findings += 1;
      if (
        event.type === 'complete'
        || event.complete === true
        || event.outcome
        || event.status === 'completed'
        || event.status === 'review_skipped'
      ) {
        complete = event;
        if (typeof event.findings === 'number') findings = event.findings;
        if (Array.isArray(event.findings)) findings = event.findings.length;
      }
    } catch {
      // ignore non-JSON agent noise
    }
  }
  return { findings, complete };
}

/**
 * Decide and optionally run a CodeRabbit checkpoint review.
 * External review is never Canon; findings require local verification.
 */
export function planCheckpointReview(input = {}) {
  const paths = input.paths || [];
  const blocked = coderabbitPrivacyBlocked(paths);
  if (blocked.length) {
    return {
      state: coderabbitDisposition({ privacyBlocked: true }),
      blocked,
      action: 'skip',
      reason: 'privacy_scope',
    };
  }
  const contentHits = coderabbitDiffContentBlocked(input.diffText || '');
  if (contentHits.length) {
    return {
      state: coderabbitDisposition({ privacyBlocked: true }),
      blocked: contentHits,
      action: 'skip',
      reason: 'privacy_content',
    };
  }
  if (input.trivial === true || paths.length === 0) {
    return {
      state: coderabbitDisposition({ trivial: true }),
      blocked: [],
      action: 'skip',
      reason: 'not_needed',
    };
  }
  const quota = input.quota || quotaReport();
  if (quota.status === 'DEFERRED' || quota.remaining === 0) {
    return {
      state: coderabbitDisposition({ rateLimited: true }),
      blocked: [],
      action: 'skip',
      reason: 'rate_limit',
      quota,
    };
  }
  const bin = input.bin !== undefined ? input.bin : resolveCoderabbit();
  if (!bin) {
    return {
      state: coderabbitDisposition({ unavailable: true }),
      blocked: [],
      action: 'skip',
      reason: 'cli_missing',
      quota,
    };
  }
  return {
    state: coderabbitDisposition({ checkpoint: true }),
    blocked: [],
    action: 'review',
    reason: 'checkpoint',
    quota,
    bin,
  };
}

export function runCheckpointReview(options = {}) {
  const base = options.base || 'origin/main';
  const committed = options.committed !== false;
  const changed = options.paths ? { ok: true, paths: options.paths } : changedPaths({ base, committed });
  if (!changed.ok) {
    return {
      state: 'CODERABBIT_FAILED',
      ok: false,
      error: changed.error || 'diff_failed',
    };
  }
  const diff = options.diffText != null
    ? { ok: true, text: options.diffText }
    : options.paths
      ? { ok: true, text: '' }
      : changedDiff({ base, committed });
  if (!diff.ok) {
    return {
      state: 'CODERABBIT_FAILED',
      ok: false,
      error: diff.error || 'diff_text_failed',
    };
  }
  const plan = planCheckpointReview({
    paths: changed.paths,
    diffText: diff.text,
    trivial: options.trivial === true,
    quota: options.quota,
    bin: options.bin,
  });
  if (plan.action !== 'review') {
    return { ...plan, ok: true, paths: changed.paths, findings: 0 };
  }
  if (options.dryRun === true) {
    return { ...plan, ok: true, paths: changed.paths, findings: 0, dryRun: true };
  }
  const args = ['review'];
  if (committed) args.push('--committed');
  else args.push('--uncommitted');
  args.push('--base', base, '--agent');
  if (options.light === true) args.push('--light');
  const started = new Date().toISOString();
  const review = spawnSync(plan.bin, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  const output = `${review.stdout || ''}${review.stderr || ''}`;
  const parsed = parseAgentReview(output);
  const completeStatus = String(parsed.complete?.status || parsed.complete?.outcome || '');
  const skipped = /skip/i.test(completeStatus);
  const completed = Boolean(parsed.complete) && !skipped;
  // A clean PASS requires an explicit completed event. Findings alone prove a real review ran.
  const success = review.status === 0 && (completed || parsed.findings > 0) && !skipped;
  recordQuota(review.status === 0 && !skipped ? 'success' : 'fail');
  if (!success) {
    return {
      state: skipped ? 'CODERABBIT_DEFERRED_UNAVAILABLE' : 'CODERABBIT_FAILED',
      ok: false,
      paths: changed.paths,
      findings: parsed.findings,
      started,
      exitCode: review.status,
      complete: parsed.complete,
      output: output.slice(0, 4000),
    };
  }
  return {
    state: parsed.findings > 0 ? 'CODERABBIT_FINDINGS' : 'CODERABBIT_PASS',
    ok: true,
    paths: changed.paths,
    findings: parsed.findings,
    started,
    exitCode: 0,
    complete: parsed.complete,
    advisoryOnly: true,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const command = process.argv[2];
  if (command === 'plan' || command === 'run' || command === undefined) {
    const result = command === 'plan'
      ? (() => {
          const changed = changedPaths({});
          const diff = changedDiff({});
          return {
            ...planCheckpointReview({ paths: changed.paths, diffText: diff.text }),
            paths: changed.paths,
          };
        })()
      : runCheckpointReview({ dryRun: process.argv.includes('--dry-run') });
    console.log(JSON.stringify(result, null, 2));
    if (result.ok === false) process.exitCode = 1;
  } else {
    console.error('usage: node scripts/security/coderabbit-checkpoint.mjs [plan|run] [--dry-run]');
    process.exitCode = 2;
  }
}
