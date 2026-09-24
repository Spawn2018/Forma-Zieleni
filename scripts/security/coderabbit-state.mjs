import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINDING_DISPOSITIONS, occurrenceKey } from './coderabbit-parse.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_STATE_DIR = path.join(root, '.fz-noc');
const DEFAULT_STATE_FILE = path.join(DEFAULT_STATE_DIR, 'coderabbit-review.json');

export const REVIEW_STATES = Object.freeze([
  'EMPTY',
  'CODERABBIT_PASS',
  'CODERABBIT_FINDINGS',
  'CODERABBIT_FINDINGS_FIXED',
  'CODERABBIT_RE_REVIEW_REQUIRED',
  'CODERABBIT_PASS_AFTER_REPAIR',
  'CODERABBIT_FINDINGS_REJECTED_WITH_REASON',
  'CODERABBIT_REVIEW_BLOCKED',
  'CODERABBIT_DEFERRED_RATE_LIMIT',
  'CODERABBIT_DEFERRED_UNAVAILABLE',
  'CODERABBIT_FAILED',
]);

const TERMINAL_CLOSED = new Set([
  'CODERABBIT_PASS',
  'CODERABBIT_PASS_AFTER_REPAIR',
  'CODERABBIT_FINDINGS_REJECTED_WITH_REASON',
  'EMPTY',
]);

export function reviewStatePath(file = process.env.FZ_CR_REVIEW_STATE || DEFAULT_STATE_FILE) {
  return path.resolve(file);
}

export function emptyReviewState() {
  return {
    version: 1,
    state: 'EMPTY',
    baseSha: null,
    headSha: null,
    diffFingerprint: null,
    paths: [],
    findings: [],
    dispositions: {},
    repairOccurred: false,
    reReviewRequired: false,
    repairAttempts: {},
    loadError: null,
    updatedAt: null,
  };
}

function isValidReceiptShape(parsed) {
  if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return false;
  if (typeof parsed.state !== 'string' || !parsed.state) return false;
  if (!Array.isArray(parsed.findings)) return false;
  if (parsed.dispositions != null && typeof parsed.dispositions !== 'object') return false;
  if (!Array.isArray(parsed.paths)) return false;
  const closed = parsed.state === 'CODERABBIT_PASS'
    || parsed.state === 'CODERABBIT_PASS_AFTER_REPAIR'
    || parsed.state === 'CODERABBIT_FINDINGS_REJECTED_WITH_REASON';
  if (closed && (!parsed.headSha || typeof parsed.headSha !== 'string')) return false;
  if ((parsed.findings || []).length > 0) {
    const bad = parsed.findings.some((item) => !item || typeof item.fingerprint !== 'string' || !item.fingerprint);
    if (bad) return false;
  }
  return true;
}

export function loadReviewState(file = reviewStatePath()) {
  const resolved = reviewStatePath(file);
  if (!existsSync(resolved)) return emptyReviewState();
  try {
    const parsed = JSON.parse(readFileSync(resolved, 'utf8'));
    if (!isValidReceiptShape(parsed)) {
      // Existing invalid receipt must not become EMPTY (push would clear debt).
      return {
        ...emptyReviewState(),
        state: 'CODERABBIT_FAILED',
        loadError: 'invalid_receipt',
      };
    }
    return { ...emptyReviewState(), ...parsed, loadError: null };
  } catch {
    return {
      ...emptyReviewState(),
      state: 'CODERABBIT_FAILED',
      loadError: 'invalid_receipt_json',
    };
  }
}

export function saveReviewState(state, file = reviewStatePath()) {
  const resolved = reviewStatePath(file);
  mkdirSync(path.dirname(resolved), { recursive: true });
  const next = {
    ...emptyReviewState(),
    ...state,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(resolved, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

export function clearReviewState(file = reviewStatePath()) {
  return saveReviewState(emptyReviewState(), file);
}

function allDispositioned(state) {
  const findings = state.findings || [];
  if (findings.length === 0) return true;
  return findings.every((finding) => {
    const disposition = state.dispositions?.[finding.fingerprint];
    return disposition && disposition.kind && disposition.kind !== 'UNRESOLVED';
  });
}

function anyAccepted(state) {
  return Object.values(state.dispositions || {}).some((item) => item.kind === 'ACCEPT');
}

export function allRejected(state) {
  const findings = state.findings || [];
  if (findings.length === 0) return false;
  return findings.every((finding) => state.dispositions?.[finding.fingerprint]?.kind === 'REJECT_WITH_REASON');
}

export function deriveReviewState(state) {
  if (!state || state.state === 'EMPTY' && !(state.findings || []).length) return 'EMPTY';
  if (state.state === 'CODERABBIT_DEFERRED_RATE_LIMIT'
    || state.state === 'CODERABBIT_DEFERRED_UNAVAILABLE'
    || state.state === 'CODERABBIT_FAILED'
    || state.state === 'CODERABBIT_REVIEW_BLOCKED') {
    return state.state;
  }
  if ((state.findings || []).length === 0) {
    return state.repairOccurred ? 'CODERABBIT_PASS_AFTER_REPAIR' : 'CODERABBIT_PASS';
  }
  if (!allDispositioned(state)) return 'CODERABBIT_FINDINGS';
  if (anyAccepted(state)) {
    if (state.reReviewRequired || !state.repairOccurred) {
      return state.repairOccurred ? 'CODERABBIT_RE_REVIEW_REQUIRED' : 'CODERABBIT_FINDINGS_FIXED';
    }
    return 'CODERABBIT_RE_REVIEW_REQUIRED';
  }
  if (allRejected(state)) return 'CODERABBIT_FINDINGS_REJECTED_WITH_REASON';
  return 'CODERABBIT_FINDINGS';
}

export function recordReviewResult({
  baseSha,
  headSha,
  paths = [],
  diffFingerprint,
  findings = [],
  stateLabel,
}, file = reviewStatePath()) {
  const current = loadReviewState(file);
  const next = {
    ...current,
    baseSha,
    headSha,
    paths: [...paths],
    diffFingerprint,
    findings: findings.map((finding) => ({ ...finding })),
    dispositions: {},
    repairOccurred: false,
    reReviewRequired: false,
    state: stateLabel || (findings.length ? 'CODERABBIT_FINDINGS' : 'CODERABBIT_PASS'),
  };
  for (const finding of next.findings) {
    next.dispositions[finding.fingerprint] = {
      kind: 'UNRESOLVED',
      at: new Date().toISOString(),
    };
  }
  next.state = deriveReviewState(next);
  return saveReviewState(next, file);
}

export function setDisposition(state, fingerprint, {
  kind,
  reason = '',
  evidence = [],
} = {}) {
  if (!FINDING_DISPOSITIONS.includes(kind)) {
    return { ok: false, reason: 'invalid_disposition', state };
  }
  if ((kind === 'REJECT_WITH_REASON' || kind === 'DEFER') && String(reason || '').trim().length < 8) {
    return { ok: false, reason: 'missing_reason', state };
  }
  if (kind === 'DEFER') {
    // Autonomous policy: defer is not an escape for open findings.
    return { ok: false, reason: 'defer_not_allowed', state };
  }
  const finding = (state.findings || []).find((item) => item.fingerprint === fingerprint);
  if (!finding) return { ok: false, reason: 'unknown_fingerprint', state };
  const dispositions = {
    ...state.dispositions,
    [fingerprint]: {
      kind,
      reason: String(reason || '').slice(0, 500),
      evidence: (evidence || []).map(String).slice(0, 10),
      at: new Date().toISOString(),
    },
  };
  let next = { ...state, dispositions };
  if (kind === 'ACCEPT') {
    next.reReviewRequired = true;
  }
  next.state = deriveReviewState(next);
  if (kind === 'ACCEPT' && next.state === 'CODERABBIT_FINDINGS') {
    // Still unresolved siblings may keep FINDINGS; accepted ones require repair path.
    const acceptedOnly = Object.values(dispositions).some((item) => item.kind === 'ACCEPT');
    if (acceptedOnly && allDispositioned(next)) {
      next.state = 'CODERABBIT_FINDINGS_FIXED';
      next.reReviewRequired = true;
    }
  }
  return { ok: true, reason: 'dispositioned', state: next };
}

export function noteRepair(state, { fingerprints = null } = {}) {
  const targets = fingerprints || Object.entries(state.dispositions || {})
    .filter(([, value]) => value.kind === 'ACCEPT')
    .map(([key]) => key);
  if (!targets.length) {
    return { ...state, state: deriveReviewState(state) };
  }
  const repairAttempts = { ...(state.repairAttempts || {}) };
  for (const fingerprint of targets) {
    repairAttempts[fingerprint] = (repairAttempts[fingerprint] || 0) + 1;
  }
  const blocked = Object.entries(repairAttempts).some(([, count]) => count >= 3);
  const next = {
    ...state,
    repairOccurred: true,
    reReviewRequired: true,
    repairAttempts,
    state: blocked ? 'CODERABBIT_REVIEW_BLOCKED' : 'CODERABBIT_RE_REVIEW_REQUIRED',
  };
  return next;
}

export function applyCleanReReviewPure(state, { headSha, findings = [], paths = [], diffFingerprint } = {}) {
  if ((findings || []).length > 0) {
    const next = {
      ...state,
      headSha,
      paths: paths.length ? paths : state.paths,
      diffFingerprint: diffFingerprint || state.diffFingerprint,
      findings: findings.map((finding) => ({ ...finding })),
      dispositions: {},
      repairOccurred: false,
      reReviewRequired: false,
    };
    for (const finding of next.findings) {
      next.dispositions[finding.fingerprint] = { kind: 'UNRESOLVED', at: new Date().toISOString() };
    }
    next.state = 'CODERABBIT_FINDINGS';
    return next;
  }
  // Accepted findings require note-repair before a clean review can close debt.
  if (anyAccepted(state) && !state.repairOccurred) {
    return {
      ...state,
      headSha,
      paths: paths.length ? paths : state.paths,
      diffFingerprint: diffFingerprint || state.diffFingerprint,
      reReviewRequired: true,
      state: 'CODERABBIT_FINDINGS_FIXED',
    };
  }
  // Every prior finding must be dispositioned; unresolved siblings cannot vanish.
  if ((state.findings || []).length > 0 && !allDispositioned(state)) {
    return {
      ...state,
      headSha,
      paths: paths.length ? paths : state.paths,
      diffFingerprint: diffFingerprint || state.diffFingerprint,
      state: deriveReviewState(state),
    };
  }
  if (!state.repairOccurred && (state.findings || []).length > 0 && !allRejected(state)) {
    return {
      ...state,
      headSha,
      paths: paths.length ? paths : state.paths,
      diffFingerprint: diffFingerprint || state.diffFingerprint,
      state: deriveReviewState(state),
    };
  }
  if (anyAccepted(state) && state.repairOccurred && !allDispositioned(state)) {
    return {
      ...state,
      headSha,
      paths: paths.length ? paths : state.paths,
      diffFingerprint: diffFingerprint || state.diffFingerprint,
      reReviewRequired: true,
      state: 'CODERABBIT_RE_REVIEW_REQUIRED',
    };
  }
  return {
    ...state,
    headSha,
    paths: paths.length ? paths : state.paths,
    diffFingerprint: diffFingerprint || state.diffFingerprint,
    findings: [],
    dispositions: {},
    reReviewRequired: false,
    state: state.repairOccurred ? 'CODERABBIT_PASS_AFTER_REPAIR' : 'CODERABBIT_PASS',
  };
}

const OWNER_LOCAL_PATHS = new Set(['.cursor/settings.json']);

function relevantPaths(paths = []) {
  return [...new Set((paths || []).map(String).filter((file) => file && !OWNER_LOCAL_PATHS.has(file)))];
}

/**
 * Whether unresolved CodeRabbit debt blocks pushing this candidate HEAD.
 */
export function assertReviewDebtClear(candidate = {}, state = emptyReviewState()) {
  const head = String(candidate.headSha || candidate.head || '').toLowerCase();
  const derived = deriveReviewState(state);
  if (TERMINAL_CLOSED.has(derived) || derived === 'EMPTY') {
    const closedAuthorizing = derived === 'CODERABBIT_PASS'
      || derived === 'CODERABBIT_PASS_AFTER_REPAIR'
      || derived === 'CODERABBIT_FINDINGS_REJECTED_WITH_REASON';
    if (closedAuthorizing && state.headSha && head && state.headSha.toLowerCase() !== head) {
      const candidateRelevant = relevantPaths(candidate.paths || []);
      // Owner-local-only candidate paths may keep a closed receipt on a new HEAD.
      // Any product path on a different HEAD is unreviewed.
      if (candidateRelevant.length === 0) {
        return { ok: true, reason: 'clear', state: derived };
      }
      return {
        ok: false,
        reason: 'stale_review_head',
        state: derived,
        detail: `reviewed ${state.headSha} cannot authorize ${head}`,
      };
    }
    return { ok: true, reason: 'clear', state: derived };
  }
  if (derived === 'CODERABBIT_FINDINGS'
    || derived === 'CODERABBIT_FINDINGS_FIXED'
    || derived === 'CODERABBIT_RE_REVIEW_REQUIRED'
    || derived === 'CODERABBIT_REVIEW_BLOCKED') {
    return {
      ok: false,
      reason: 'review_debt_open',
      state: derived,
      findings: (state.findings || []).map((item) => item.fingerprint),
    };
  }
  if (derived === 'CODERABBIT_DEFERRED_RATE_LIMIT' || derived === 'CODERABBIT_DEFERRED_UNAVAILABLE') {
    if ((state.findings || []).length > 0 || state.repairOccurred) {
      return { ok: false, reason: 'review_debt_deferred', state: derived };
    }
    return { ok: true, reason: 'no_required_review', state: derived };
  }
  if (derived === 'CODERABBIT_FAILED') {
    if (state.loadError || (state.findings || []).length > 0 || state.repairOccurred) {
      return { ok: false, reason: 'review_debt_failed', state: derived };
    }
    return { ok: true, reason: 'no_required_review', state: derived };
  }
  return { ok: true, reason: 'clear', state: derived };
}

export function occurrenceEvidence(state, fingerprint) {
  return occurrenceKey({
    baseSha: state.baseSha,
    headSha: state.headSha,
    fingerprint,
  });
}
