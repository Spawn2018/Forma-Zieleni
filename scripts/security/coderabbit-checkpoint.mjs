import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  coderabbitDisposition,
  coderabbitPrivacyBlocked,
  coderabbitDiffContentBlocked,
} from '../fz-noc/policy.mjs';
import { ingestToolingEvent } from '../fz-cis/ingest.mjs';
import { loadStore, markLocallyVerified, changeStatus } from '../fz-cis/store.mjs';
import {
  diffFingerprint,
  fingerprintFinding,
  parseAgentReview,
} from './coderabbit-parse.mjs';
import {
  applyCleanReReviewPure,
  assertReviewDebtClear,
  deriveReviewState,
  loadReviewState,
  noteRepair,
  occurrenceEvidence,
  recordReviewResult,
  saveReviewState,
  setDisposition,
} from './coderabbit-state.mjs';

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

function revParse(ref) {
  const result = git(['rev-parse', ref]);
  if (result.status !== 0) return null;
  return (result.stdout || '').trim();
}

function changedPaths({ base = 'origin/main', baseCommit = null, committed = true } = {}) {
  const range = baseCommit
    ? `${baseCommit}...HEAD`
    : committed
      ? `${base}...HEAD`
      : 'HEAD';
  const args = committed || baseCommit
    ? ['diff', '--name-only', range]
    : ['diff', '--name-only', 'HEAD'];
  const result = git(args);
  if (result.status !== 0) return { ok: false, paths: [], error: result.stderr || result.stdout };
  const paths = (result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return { ok: true, paths };
}

function changedDiff({ base = 'origin/main', baseCommit = null, committed = true } = {}) {
  const range = baseCommit
    ? `${baseCommit}...HEAD`
    : committed
      ? `${base}...HEAD`
      : 'HEAD';
  const args = committed || baseCommit
    ? ['diff', range]
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

export { parseAgentReview, fingerprintFinding, assertReviewDebtClear, deriveReviewState };

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

function storeHasOccurrence(store, key) {
  return (store?.records || []).some((record) => (record.evidence || []).includes(key));
}

export function ingestCodeRabbitFindings(reviewState, options = {}) {
  const ingest = options.ingestToolingEvent || ingestToolingEvent;
  const load = options.loadStore || loadStore;
  const results = [];
  for (const finding of reviewState.findings || []) {
    const key = occurrenceEvidence(reviewState, finding.fingerprint);
    try {
      if (storeHasOccurrence(load(options.file), key)) {
        results.push({ fingerprint: finding.fingerprint, ingested: false, reason: 'idempotent_skip' });
        continue;
      }
    } catch {
      // temp stores may not exist yet
    }
    const outcome = ingest({
      state: 'CODERABBIT_FINDINGS',
      patternKey: finding.fingerprint,
      observation: finding.summary || `CodeRabbit finding ${finding.fingerprint}`,
      evidence: [
        key,
        finding.fileName || 'path-unknown',
        `severity:${finding.severity}`,
        finding.category ? `category:${finding.category}` : null,
      ].filter(Boolean),
      commit: reviewState.headSha,
      findings: 1,
    }, { file: options.file, dryRun: options.dryRun, addRecord: options.addRecord });
    results.push({ fingerprint: finding.fingerprint, ...outcome });
  }
  return results;
}

export function runCheckpointReview(options = {}) {
  const base = options.base || 'origin/main';
  const baseCommit = options.baseCommit || null;
  const committed = options.committed !== false;
  const headSha = options.headSha || revParse('HEAD');
  const baseSha = baseCommit || revParse(base) || base;
  const changed = options.paths
    ? { ok: true, paths: options.paths }
    : changedPaths({ base, baseCommit, committed });
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
      : changedDiff({ base, baseCommit, committed });
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
    if (plan.state === 'CODERABBIT_DEFERRED_RATE_LIMIT' || plan.state === 'CODERABBIT_DEFERRED_UNAVAILABLE') {
      const prior = loadReviewState(options.stateFile);
      if ((prior.findings || []).length || prior.repairOccurred) {
        const deferred = saveReviewState({ ...prior, state: plan.state }, options.stateFile);
        return { ...plan, ok: true, paths: changed.paths, findings: prior.findings?.length || 0, reviewState: deferred };
      }
    }
    return { ...plan, ok: true, paths: changed.paths, findings: 0, structuredFindings: [] };
  }
  if (options.dryRun === true) {
    return { ...plan, ok: true, paths: changed.paths, findings: 0, dryRun: true };
  }

  const args = ['review'];
  if (committed) args.push('--committed');
  else args.push('--uncommitted');
  if (baseCommit) args.push('--base-commit', baseCommit);
  else args.push('--base', base);
  args.push('--agent');
  if (options.light === true) args.push('--light');

  const started = new Date().toISOString();
  const spawnReview = options.spawnReview || ((bin, argv) => spawnSync(bin, argv, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  }));
  const review = spawnReview(plan.bin, args);
  const output = `${review.stdout || ''}${review.stderr || ''}`;
  const parsed = options.parsed || parseAgentReview(output);
  const completeStatus = String(parsed.complete?.status || parsed.complete?.outcome || '');
  const skipped = /skip/i.test(completeStatus);
  const completed = Boolean(parsed.complete) && !skipped;
  const success = review.status === 0 && (completed || parsed.findingCount > 0) && !skipped;
  if (options.recordQuota !== false) {
    recordQuota(review.status === 0 && !skipped ? 'success' : 'fail');
  }

  const fingerprint = diffFingerprint(changed.paths, headSha, baseSha);
  if (!success) {
    const failedState = saveReviewState({
      ...loadReviewState(options.stateFile),
      baseSha,
      headSha,
      paths: changed.paths,
      diffFingerprint: fingerprint,
      state: skipped ? 'CODERABBIT_DEFERRED_UNAVAILABLE' : 'CODERABBIT_FAILED',
    }, options.stateFile);
    return {
      state: skipped ? 'CODERABBIT_DEFERRED_UNAVAILABLE' : 'CODERABBIT_FAILED',
      ok: false,
      paths: changed.paths,
      findings: parsed.findingCount,
      structuredFindings: parsed.findings,
      started,
      exitCode: review.status,
      complete: parsed.complete,
      reviewState: failedState,
    };
  }

  const prior = loadReviewState(options.stateFile);
  let reviewState;
  if (prior.reReviewRequired || prior.repairOccurred) {
    reviewState = saveReviewState(applyCleanReReviewPure(prior, {
      headSha,
      findings: parsed.findings,
      paths: changed.paths,
      diffFingerprint: fingerprint,
    }), options.stateFile);
  } else {
    reviewState = recordReviewResult({
      baseSha,
      headSha,
      paths: changed.paths,
      diffFingerprint: fingerprint,
      findings: parsed.findings,
    }, options.stateFile);
  }

  const ingest = parsed.findings.length
    ? ingestCodeRabbitFindings(reviewState, options.ingestOptions || {})
    : [];

  return {
    state: reviewState.state,
    ok: true,
    paths: changed.paths,
    findings: parsed.findingCount,
    structuredFindings: parsed.findings,
    started,
    exitCode: 0,
    complete: parsed.complete,
    advisoryOnly: true,
    baseSha,
    headSha,
    reviewState,
    ingest,
  };
}

export function dispositionFinding(options = {}) {
  const state = options.state || loadReviewState(options.stateFile);
  const result = setDisposition(state, options.fingerprint, {
    kind: options.kind,
    reason: options.reason,
    evidence: options.evidence,
  });
  if (!result.ok) return result;
  const saved = options.persist === false ? result.state : saveReviewState(result.state, options.stateFile);
  if (options.kind === 'ACCEPT' && options.cis !== false) {
    try {
      // Local verification of reality — not promotion.
      const store = (options.loadStore || loadStore)(options.file);
      const record = store.records.find((item) => item.patternKey === options.fingerprint);
      if (record) {
        (options.markLocallyVerified || markLocallyVerified)(record.id, {
          evidence: [`accepted:${options.fingerprint}`, ...(options.evidence || [])],
        }, options.file);
      }
    } catch {
      // CIS optional when dry
    }
  }
  if (options.kind === 'REJECT_WITH_REASON' && options.cis !== false) {
    try {
      const store = (options.loadStore || loadStore)(options.file);
      const record = store.records.find((item) => item.patternKey === options.fingerprint);
      if (record) {
        (options.changeStatus || changeStatus)(record.id, 'REJECTED', {
          rejectionReason: options.reason,
          locallyVerified: true,
        }, options.file);
      }
    } catch {
      // CIS optional
    }
  }
  return { ok: true, state: saved, reviewState: saved };
}

export function noteRepairComplete(options = {}) {
  const state = options.state || loadReviewState(options.stateFile);
  const next = noteRepair(state, { fingerprints: options.fingerprints });
  const saved = options.persist === false ? next : saveReviewState(next, options.stateFile);
  return { ok: true, state: saved };
}

export function reviewDebtForPush(options = {}) {
  const state = options.state || loadReviewState(options.stateFile);
  const headSha = options.headSha || revParse('HEAD');
  const paths = options.paths || changedPaths({ base: options.base || 'origin/main' }).paths || [];
  return assertReviewDebtClear({ headSha, paths }, state);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const command = process.argv[2] || 'run';
  const flag = (name) => {
    const index = process.argv.indexOf(name);
    return index === -1 ? null : process.argv[index + 1];
  };
  if (command === 'plan' || command === 'run') {
    const baseCommit = flag('--base-commit');
    const base = flag('--base') || 'origin/main';
    const result = command === 'plan'
      ? (() => {
          const changed = changedPaths({ base, baseCommit });
          const diff = changedDiff({ base, baseCommit });
          return {
            ...planCheckpointReview({ paths: changed.paths, diffText: diff.text }),
            paths: changed.paths,
          };
        })()
      : runCheckpointReview({
        dryRun: process.argv.includes('--dry-run'),
        base,
        baseCommit,
      });
    console.log(JSON.stringify({
      ok: result.ok !== false,
      state: result.state,
      findings: result.findings,
      structuredFindings: result.structuredFindings || [],
      headSha: result.headSha || null,
      baseSha: result.baseSha || null,
      reason: result.reason || null,
      reviewState: result.reviewState?.state || null,
    }, null, 2));
    if (result.ok === false) process.exitCode = 1;
  } else if (command === 'status') {
    const state = loadReviewState();
    console.log(JSON.stringify({
      state: deriveReviewState(state),
      headSha: state.headSha,
      baseSha: state.baseSha,
      findings: state.findings,
      dispositions: state.dispositions,
      repairOccurred: state.repairOccurred,
      reReviewRequired: state.reReviewRequired,
      debt: assertReviewDebtClear({ headSha: revParse('HEAD'), paths: state.paths }, state),
    }, null, 2));
  } else if (command === 'disposition') {
    const fingerprint = flag('--fingerprint');
    const kind = process.argv.includes('--accept')
      ? 'ACCEPT'
      : process.argv.includes('--reject')
        ? 'REJECT_WITH_REASON'
        : process.argv.includes('--owner-gate')
          ? 'OWNER_GATE'
          : process.argv.includes('--defer')
            ? 'DEFER'
            : null;
    const reason = flag('--reason') || '';
    if (!fingerprint || !kind) {
      console.error('usage: disposition --fingerprint <fp> --accept|--reject|--owner-gate [--reason "..."]');
      process.exitCode = 2;
    } else {
      const result = dispositionFinding({ fingerprint, kind, reason });
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
    }
  } else if (command === 'note-repair') {
    const result = noteRepairComplete({});
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error('usage: node scripts/security/coderabbit-checkpoint.mjs plan|run|status|disposition|note-repair [--base-commit SHA] [--base ref] [--dry-run]');
    process.exitCode = 2;
  }
}
