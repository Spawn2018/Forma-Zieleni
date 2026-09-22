import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestToolingEvent } from '../fz-cis/ingest.mjs';
import { loadStore } from '../fz-cis/store.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Binding workflow path for the mandatory main Verify path. */
export const WORKFLOW_FILE = '.github/workflows/ci.yml';
export const WORKFLOW_NAME = 'CI';
export const DEFAULT_WAIT_TIMEOUT_MS = 20 * 60 * 1000;
export const DEFAULT_POLL_MS = 15_000;
export const DEFAULT_FIND_TIMEOUT_MS = 3 * 60 * 1000;

export const CI_STATES = Object.freeze({
  CI_NOT_FOUND_YET: 'CI_NOT_FOUND_YET',
  CI_QUEUED: 'CI_QUEUED',
  CI_IN_PROGRESS: 'CI_IN_PROGRESS',
  CI_GREEN: 'CI_GREEN',
  CI_FAILED: 'CI_FAILED',
  CI_CANCELLED: 'CI_CANCELLED',
  CI_TIMED_OUT: 'CI_TIMED_OUT',
  CI_ACTION_REQUIRED: 'CI_ACTION_REQUIRED',
  CI_UNAVAILABLE: 'CI_UNAVAILABLE',
  CI_WAIT_TIMEOUT: 'CI_WAIT_TIMEOUT',
});

const TERMINAL_FAIL = new Set([
  CI_STATES.CI_FAILED,
  CI_STATES.CI_CANCELLED,
  CI_STATES.CI_TIMED_OUT,
  CI_STATES.CI_ACTION_REQUIRED,
]);

const PENDING = new Set([
  CI_STATES.CI_NOT_FOUND_YET,
  CI_STATES.CI_QUEUED,
  CI_STATES.CI_IN_PROGRESS,
]);

export function isTerminalFail(state) {
  return TERMINAL_FAIL.has(state);
}

export function isPending(state) {
  return PENDING.has(state);
}

export function isGreen(state) {
  return state === CI_STATES.CI_GREEN;
}

function defaultSleep(ms) {
  const waitMs = Math.max(0, Number(ms) || 0);
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
  } catch {
    spawnSync(process.execPath, ['-e', `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${waitMs})`], {
      windowsHide: true,
    });
  }
}

function defaultNow() {
  return Date.now();
}

function defaultGh(args, cwd = root) {
  return spawnSync('gh', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024,
  });
}

function normalizeSha(sha) {
  return String(sha || '').trim().toLowerCase();
}

function slugPart(value, fallback = 'unknown') {
  const text = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return text || fallback;
}

/**
 * Map a GitHub Actions run (exact SHA already filtered) to a controller state.
 * Only conclusion === success yields CI_GREEN.
 */
export function mapRunToState(run) {
  if (!run || typeof run !== 'object') return CI_STATES.CI_NOT_FOUND_YET;
  const status = String(run.status || '').toLowerCase();
  const conclusion = run.conclusion == null ? null : String(run.conclusion).toLowerCase();

  if (status === 'queued' || status === 'requested' || status === 'pending' || status === 'waiting') {
    return CI_STATES.CI_QUEUED;
  }
  if (status === 'in_progress') {
    return CI_STATES.CI_IN_PROGRESS;
  }
  if (status !== 'completed') {
    if (status) return CI_STATES.CI_IN_PROGRESS;
    return CI_STATES.CI_NOT_FOUND_YET;
  }

  if (conclusion === 'success') return CI_STATES.CI_GREEN;
  if (conclusion === 'cancelled') return CI_STATES.CI_CANCELLED;
  if (conclusion === 'timed_out') return CI_STATES.CI_TIMED_OUT;
  if (conclusion === 'action_required') return CI_STATES.CI_ACTION_REQUIRED;
  if (conclusion === 'failure' || conclusion === 'startup_failure') return CI_STATES.CI_FAILED;
  // neutral / skipped / stale / unknown are not green
  if (conclusion === 'neutral' || conclusion === 'skipped' || conclusion == null) {
    return CI_STATES.CI_FAILED;
  }
  return CI_STATES.CI_FAILED;
}

export function pickExactShaRun(runs, sha, { event = 'push', workflowName = WORKFLOW_NAME } = {}) {
  const want = normalizeSha(sha);
  const list = Array.isArray(runs) ? runs : [];
  const matched = list.filter((run) => {
    if (normalizeSha(run.headSha || run.head_sha) !== want) return false;
    const name = String(run.workflowName || run.name || '');
    const file = String(run.workflowPath || run.path || '');
    const workflowOk = name === workflowName
      || file.endsWith('ci.yml')
      || file.endsWith(WORKFLOW_FILE);
    if (!workflowOk && workflowName) {
      // Allow when workflow filter was already applied by the transport.
      if (name && name !== workflowName) return false;
    }
    if (event && run.event && String(run.event) !== event) return false;
    return true;
  });
  if (matched.length === 0) return null;
  // Prefer newest by databaseId / createdAt when present.
  return matched.sort((a, b) => {
    const ai = Number(a.databaseId || a.id || 0);
    const bi = Number(b.databaseId || b.id || 0);
    return bi - ai;
  })[0];
}

export function listRunsViaGh({ sha, gh = defaultGh, cwd = root, event = 'push' } = {}) {
  const result = gh([
    'run', 'list',
    '--commit', sha,
    '--workflow', 'ci.yml',
    '--json', 'databaseId,headSha,status,conclusion,event,url,workflowName,displayTitle,createdAt',
    '-L', '20',
  ], cwd);
  if ((result.status ?? 1) !== 0) {
    return {
      ok: false,
      state: CI_STATES.CI_UNAVAILABLE,
      detail: String(result.stderr || result.stdout || 'gh run list failed').slice(0, 400),
      runs: [],
    };
  }
  let runs = [];
  try {
    runs = JSON.parse(result.stdout || '[]');
  } catch {
    return {
      ok: false,
      state: CI_STATES.CI_UNAVAILABLE,
      detail: 'gh run list returned invalid JSON',
      runs: [],
    };
  }
  if (event) runs = runs.filter((run) => !run.event || run.event === event);
  return { ok: true, runs, state: null, detail: null };
}

export function fetchJobsViaGh({ runId, gh = defaultGh, cwd = root } = {}) {
  const result = gh([
    'run', 'view', String(runId),
    '--json', 'databaseId,headSha,status,conclusion,event,url,workflowName,displayTitle,jobs',
  ], cwd);
  if ((result.status ?? 1) !== 0) {
    return { ok: false, detail: String(result.stderr || '').slice(0, 400), run: null };
  }
  try {
    return { ok: true, run: JSON.parse(result.stdout || '{}'), detail: null };
  } catch {
    return { ok: false, detail: 'gh run view invalid JSON', run: null };
  }
}

/**
 * Build safe failure evidence. Never persists full raw logs.
 */
export function buildFailureEvidence(run) {
  const jobs = Array.isArray(run?.jobs) ? run.jobs : [];
  const jobSummaries = jobs.map((job) => ({
    name: String(job.name || 'job'),
    status: String(job.status || ''),
    conclusion: job.conclusion == null ? null : String(job.conclusion),
  }));
  const failedSteps = [];
  for (const job of jobs) {
    const steps = Array.isArray(job.steps) ? job.steps : [];
    for (const step of steps) {
      const conclusion = step.conclusion == null ? null : String(step.conclusion).toLowerCase();
      if (conclusion === 'failure' || conclusion === 'timed_out' || conclusion === 'cancelled') {
        failedSteps.push({
          job: String(job.name || 'job'),
          step: String(step.name || 'step'),
          conclusion,
        });
      }
    }
  }
  const failedJobs = jobSummaries.filter((job) => {
    const c = (job.conclusion || '').toLowerCase();
    return c === 'failure' || c === 'timed_out' || c === 'cancelled' || c === 'startup_failure';
  });
  return {
    runId: run?.databaseId ?? run?.id ?? null,
    url: run?.url || null,
    headSha: run?.headSha || run?.head_sha || null,
    event: run?.event || null,
    status: run?.status || null,
    conclusion: run?.conclusion ?? null,
    workflowName: run?.workflowName || WORKFLOW_NAME,
    jobs: jobSummaries,
    failedJobs,
    failedSteps,
  };
}

/**
 * Stable class signature — never SHA or run id as identity.
 */
export function failureSignature(evidence = {}) {
  const workflow = slugPart(evidence.workflowName || WORKFLOW_NAME, 'ci');
  const failedStep = evidence.failedSteps?.[0];
  const failedJob = evidence.failedJobs?.[0];
  const job = slugPart(failedStep?.job || failedJob?.name || 'verify', 'verify');
  const step = slugPart(failedStep?.step || 'failed', 'failed');
  // Prefer a recognizable check label from the step name (Test, Lint, …).
  return `ci-${workflow}-${job}-${step}`.slice(0, 80);
}

export function runIdEvidenceKey(runId) {
  return `ci-run:${runId}`;
}

export function storeHasRunId(store, runId) {
  if (runId == null) return false;
  const key = runIdEvidenceKey(runId);
  const records = store?.records || [];
  return records.some((record) => (record.evidence || []).includes(key));
}

/**
 * Status for an exact SHA. Never treats another SHA's green as success.
 */
export function statusForSha(sha, options = {}) {
  const want = normalizeSha(sha);
  if (!/^[0-9a-f]{7,40}$/.test(want)) {
    return {
      ok: false,
      state: CI_STATES.CI_UNAVAILABLE,
      sha: want,
      reason: 'invalid_sha',
      run: null,
      evidence: null,
      failureSignature: null,
    };
  }

  const listed = options.listRuns
    ? options.listRuns({ sha: want })
    : listRunsViaGh({ sha: want, gh: options.gh || defaultGh, cwd: options.cwd || root });

  if (!listed.ok) {
    return {
      ok: false,
      state: CI_STATES.CI_UNAVAILABLE,
      sha: want,
      reason: 'transport_unavailable',
      detail: listed.detail,
      run: null,
      evidence: null,
      failureSignature: null,
    };
  }

  const run = pickExactShaRun(listed.runs, want, {
    event: options.event || 'push',
    workflowName: options.workflowName || WORKFLOW_NAME,
  });

  if (!run) {
    return {
      ok: true,
      state: CI_STATES.CI_NOT_FOUND_YET,
      sha: want,
      reason: 'not_found',
      run: null,
      evidence: null,
      failureSignature: null,
    };
  }

  const state = mapRunToState(run);
  let evidence = null;
  let signature = null;

  if (isTerminalFail(state) || state === CI_STATES.CI_GREEN) {
    let detailed = run;
    if (isTerminalFail(state) && options.includeJobs !== false) {
      const jobsResult = options.fetchJobs
        ? options.fetchJobs({ runId: run.databaseId || run.id })
        : fetchJobsViaGh({ runId: run.databaseId || run.id, gh: options.gh || defaultGh, cwd: options.cwd || root });
      if (jobsResult.ok && jobsResult.run) detailed = { ...run, ...jobsResult.run };
    }
    evidence = buildFailureEvidence(detailed);
    if (isTerminalFail(state)) signature = failureSignature(evidence);
  }

  return {
    ok: true,
    state,
    sha: want,
    reason: state,
    run: {
      databaseId: run.databaseId || run.id,
      headSha: run.headSha || run.head_sha,
      status: run.status,
      conclusion: run.conclusion,
      event: run.event,
      url: run.url,
      workflowName: run.workflowName || WORKFLOW_NAME,
    },
    evidence: isTerminalFail(state) ? evidence : (state === CI_STATES.CI_GREEN ? {
      runId: run.databaseId || run.id,
      url: run.url,
      headSha: run.headSha || run.head_sha,
      event: run.event,
      status: run.status,
      conclusion: run.conclusion,
      workflowName: run.workflowName || WORKFLOW_NAME,
    } : null),
    failureSignature: signature,
  };
}

export function waitForSha(sha, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
  const findTimeoutMs = options.findTimeoutMs ?? DEFAULT_FIND_TIMEOUT_MS;
  const pollMs = options.pollMs ?? DEFAULT_POLL_MS;
  const sleep = options.sleep || defaultSleep;
  const now = options.now || defaultNow;
  const started = now();
  let last = null;

  while (now() - started <= timeoutMs) {
    last = statusForSha(sha, options);
    if (last.state === CI_STATES.CI_UNAVAILABLE) return { ...last, waitedMs: now() - started };
    if (isGreen(last.state) || isTerminalFail(last.state)) {
      return { ...last, waitedMs: now() - started };
    }
    if (last.state === CI_STATES.CI_NOT_FOUND_YET && now() - started > findTimeoutMs) {
      return {
        ...last,
        ok: false,
        state: CI_STATES.CI_WAIT_TIMEOUT,
        reason: 'run_not_found',
        lastState: CI_STATES.CI_NOT_FOUND_YET,
        waitedMs: now() - started,
      };
    }
    sleep(pollMs);
  }

  if (last && (isGreen(last.state) || isTerminalFail(last.state))) {
    return { ...last, waitedMs: now() - started };
  }
  return {
    ok: false,
    state: CI_STATES.CI_WAIT_TIMEOUT,
    sha: normalizeSha(sha),
    reason: 'wait_timeout',
    run: last?.run || null,
    evidence: last?.evidence || null,
    failureSignature: last?.failureSignature || null,
    waitedMs: now() - started,
    lastState: last?.state || CI_STATES.CI_NOT_FOUND_YET,
  };
}

/**
 * Runtime FZ-CIS wiring. Idempotent on ci-run:<id>.
 * patternKey is the failure signature class, never the commit SHA.
 */
export function ingestCiFailure(statusResult, options = {}) {
  if (!statusResult || !isTerminalFail(statusResult.state)) {
    return { ingested: false, reason: 'not_a_failure' };
  }
  if (statusResult.state !== CI_STATES.CI_FAILED
    && statusResult.state !== CI_STATES.CI_CANCELLED
    && statusResult.state !== CI_STATES.CI_TIMED_OUT
    && statusResult.state !== CI_STATES.CI_ACTION_REQUIRED) {
    return { ingested: false, reason: 'not_ingestible_state' };
  }

  const runId = statusResult.run?.databaseId ?? statusResult.evidence?.runId;
  const load = options.loadStore || loadStore;
  if (runId != null && options.skipIdempotency !== true) {
    try {
      if (storeHasRunId(load(options.file), runId)) {
        return { ingested: false, reason: 'idempotent_skip', runId };
      }
    } catch {
      // Missing/temp store: proceed; tests inject file.
    }
  }

  const baseGreen = options.baseShaWasGreen === true;
  const toolingState = baseGreen ? 'CI_REGRESSION' : 'CI_FAILED';
  const signature = statusResult.failureSignature
    || failureSignature(statusResult.evidence || {});
  const evidence = [
    runIdEvidenceKey(runId),
    statusResult.run?.url || statusResult.evidence?.url || 'ci-url-missing',
    `sha:${statusResult.sha}`,
    `signature:${signature}`,
    ...(statusResult.evidence?.failedSteps || []).slice(0, 3).map(
      (step) => `step:${step.job}/${step.step}:${step.conclusion}`,
    ),
  ].filter(Boolean);

  const ingest = options.ingestToolingEvent || ingestToolingEvent;
  return ingest({
    state: toolingState,
    patternKey: signature,
    observation: baseGreen
      ? `Mandatory CI regressed after a green baseline for signature ${signature}`
      : `Mandatory CI failed for signature ${signature}`,
    evidence,
    commit: statusResult.sha,
  }, { file: options.file, dryRun: options.dryRun, addRecord: options.addRecord });
}

/**
 * Quality interrupt evaluation for published HEAD.
 * Local unpublished commits are not CI failures and do not authorize new product work.
 */
export function evaluateQualityInterrupt({
  head,
  originMain,
  statusFor = statusForSha,
  repairAttempts = {},
  repairLimit = 3,
} = {}) {
  const local = normalizeSha(head);
  const published = normalizeSha(originMain);

  if (!local || !published) {
    return {
      selected: null,
      exhaustionAllowed: false,
      reason: 'quality_interrupt_unavailable',
      qualityInterrupt: {
        type: 'CI_UNAVAILABLE',
        sha: local || null,
        detail: 'missing_head_or_origin',
      },
    };
  }

  if (local !== published) {
    return {
      selected: null,
      exhaustionAllowed: false,
      reason: 'local_unpublished_head',
      qualityInterrupt: {
        type: 'LOCAL_UNPUBLISHED',
        sha: local,
        originMain: published,
      },
    };
  }

  const status = statusFor(published);
  if (status.state === CI_STATES.CI_UNAVAILABLE || status.state === CI_STATES.CI_WAIT_TIMEOUT) {
    return {
      selected: null,
      exhaustionAllowed: false,
      reason: 'quality_interrupt_unavailable',
      qualityInterrupt: {
        type: status.state,
        sha: published,
        detail: status.detail || status.reason,
      },
    };
  }

  if (isPending(status.state)) {
    return {
      selected: null,
      exhaustionAllowed: false,
      reason: 'quality_interrupt_pending',
      qualityInterrupt: {
        type: 'CI_PENDING',
        ciState: status.state,
        sha: published,
        runId: status.run?.databaseId || null,
        url: status.run?.url || null,
      },
    };
  }

  if (isTerminalFail(status.state)) {
    const signature = status.failureSignature || failureSignature(status.evidence || {});
    const attempts = Number(repairAttempts[`ci-repair|${signature}`] || 0);
    if (attempts >= repairLimit) {
      return {
        selected: null,
        exhaustionAllowed: false,
        reason: 'ci_repair_blocked',
        qualityInterrupt: {
          type: 'CI_REPAIR_BLOCKED',
          sha: published,
          runId: status.run?.databaseId || null,
          url: status.run?.url || null,
          failureSignature: signature,
          attempts,
        },
      };
    }
    return {
      selected: null,
      exhaustionAllowed: false,
      reason: 'ci_repair_required',
      qualityInterrupt: {
        type: 'CI_REPAIR_REQUIRED',
        sha: published,
        runId: status.run?.databaseId || null,
        url: status.run?.url || null,
        failureSignature: signature,
        ciState: status.state,
        evidence: status.evidence,
        attempts,
      },
    };
  }

  if (isGreen(status.state)) {
    return {
      selected: undefined,
      exhaustionAllowed: undefined,
      reason: 'ci_green',
      qualityInterrupt: null,
      ci: status,
    };
  }

  return {
    selected: null,
    exhaustionAllowed: false,
    reason: 'quality_interrupt_unknown',
    qualityInterrupt: {
      type: 'CI_UNAVAILABLE',
      sha: published,
      ciState: status.state,
    },
  };
}

export function noteCiRepairAttempt(session, { signature }) {
  const key = `ci-repair|${signature}`;
  const attempts = { ...(session.attempts || {}), [key]: ((session.attempts || {})[key] || 0) + 1 };
  return { ...session, attempts };
}

export function clearCiRepairAttempts(session) {
  const attempts = Object.fromEntries(
    Object.entries(session.attempts || {}).filter(([key]) => !key.startsWith('ci-repair|')),
  );
  return { ...session, attempts };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  const shaIdx = rest.indexOf('--sha');
  const sha = shaIdx >= 0 ? rest[shaIdx + 1] : null;
  if (!cmd || !sha || !['status', 'wait'].includes(cmd)) {
    console.error('usage: node scripts/ci/post-push-ci.mjs status|wait --sha <SHA>');
    process.exitCode = 2;
  } else {
    const result = cmd === 'wait' ? waitForSha(sha) : statusForSha(sha);
    console.log(JSON.stringify({
      ok: result.ok,
      state: result.state,
      sha: result.sha,
      runId: result.run?.databaseId || null,
      url: result.run?.url || null,
      conclusion: result.run?.conclusion ?? null,
      failureSignature: result.failureSignature,
      waitedMs: result.waitedMs,
    }, null, 2));
    if (!isGreen(result.state)) process.exitCode = 1;
  }
}
