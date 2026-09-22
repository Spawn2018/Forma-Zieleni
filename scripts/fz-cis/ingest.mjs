import { addRecord } from './store.mjs';
import { validateRecord } from './policy.mjs';

/** Outcomes that may enter FZ-CIS. Routine PASS is never ingested. */
export const INGEST_KINDS = Object.freeze([
  'test_failed',
  'test_flaky',
  'build_failed',
  'ci_failed',
  'ci_regression',
  'coderabbit_finding',
  'grok_finding',
  'security_finding',
  'near_miss',
  'repeated_failure',
]);

const KIND_MAP = {
  test_failed: { source: 'test', signalType: 'failure', severity: 'high' },
  test_flaky: { source: 'test', signalType: 'near-miss', severity: 'medium' },
  build_failed: { source: 'agent', signalType: 'failure', severity: 'high' },
  ci_failed: { source: 'agent', signalType: 'failure', severity: 'high' },
  ci_regression: { source: 'agent', signalType: 'failure', severity: 'critical' },
  coderabbit_finding: { source: 'coderabbit', signalType: 'review-finding', severity: 'medium' },
  grok_finding: { source: 'grok', signalType: 'review-finding', severity: 'medium' },
  security_finding: { source: 'security', signalType: 'failure', severity: 'high' },
  near_miss: { source: 'agent', signalType: 'near-miss', severity: 'medium' },
  repeated_failure: { source: 'test', signalType: 'failure', severity: 'high' },
};

function slug(value, fallback = 'signal') {
  const text = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const parts = text.split('-').filter(Boolean).slice(0, 8);
  if (parts.length < 2) parts.push('event');
  return parts.join('-');
}

const PATTERN_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+){1,8}$/;

function normalizePatternKey(value, fallbackParts = []) {
  const raw = String(value || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (raw && PATTERN_KEY_RE.test(raw) && raw.length <= 48) return raw;
  const parts = raw.split('-').filter(Boolean);
  if (parts.length >= 2) {
    const digest = parts[parts.length - 1];
    const budget = Math.max(8, 48 - digest.length - 1);
    const head = parts.slice(0, -1).join('-').slice(0, budget).replace(/-+$/g, '');
    const short = `${head}-${digest}`.replace(/-+/g, '-').slice(0, 48);
    if (PATTERN_KEY_RE.test(short)) return short;
  }
  return fingerprint(fallbackParts.length ? fallbackParts : [raw || 'signal']);
}

/**
 * Refuse noise. Success/PASS never becomes a learning record.
 * External AI findings stay OBSERVED and not locallyVerified until Cursor verifies them.
 */
export function shouldIngest(outcome = {}) {
  if (!outcome || typeof outcome !== 'object') return { ok: false, reason: 'invalid' };
  if (outcome.kind === 'pass' || outcome.kind === 'success' || outcome.passed === true) {
    return { ok: false, reason: 'noise_skip' };
  }
  if (!INGEST_KINDS.includes(outcome.kind)) return { ok: false, reason: 'unknown_kind' };
  if (typeof outcome.observation !== 'string' || outcome.observation.trim().length < 8) {
    return { ok: false, reason: 'weak_observation' };
  }
  if (!Array.isArray(outcome.evidence) || outcome.evidence.length === 0) {
    return { ok: false, reason: 'missing_evidence' };
  }
  return { ok: true, reason: 'ingest' };
}

function fingerprint(parts) {
  return slug(parts.filter(Boolean).join('-').slice(0, 80), 'signal-event');
}

export function toLearningInput(outcome = {}) {
  const gate = shouldIngest(outcome);
  if (!gate.ok) return { ok: false, reason: gate.reason, record: null };
  const mapped = KIND_MAP[outcome.kind];
  const external = mapped.source === 'coderabbit' || mapped.source === 'grok';
  const patternKey = outcome.patternKey
    ? normalizePatternKey(outcome.patternKey, [outcome.kind, outcome.observation?.slice(0, 40)])
    : fingerprint([
      outcome.kind,
      outcome.scope,
      outcome.relatedTest,
      outcome.relatedCommit,
      outcome.evidence?.[0],
      outcome.observation?.slice(0, 40),
    ]);
  const record = {
    patternKey,
    source: mapped.source,
    scope: String(outcome.scope || 'engineering').slice(0, 120),
    signalType: mapped.signalType,
    severity: outcome.severity || mapped.severity,
    observation: outcome.observation.trim(),
    evidence: outcome.evidence.map(String).slice(0, 20),
    generalizability: outcome.generalizability || (outcome.kind === 'ci_regression' ? 'RECURRING' : 'LOCAL'),
    privacyClassification: 'INTERNAL',
    status: 'OBSERVED',
    evidenceStrength: outcome.evidenceStrength || (external ? 'ANECDOTAL' : 'TESTED'),
    validatedLocally: outcome.validatedLocally === true,
    locallyVerified: external ? outcome.locallyVerified === true : outcome.locallyVerified !== false,
    relatedCommit: outcome.relatedCommit,
    relatedSlice: outcome.relatedSlice,
    relatedTest: outcome.relatedTest,
    horizon: outcome.horizon || 'FOUNDATION_NOW',
  };
  if (outcome.proposedImprovement) record.proposedImprovement = String(outcome.proposedImprovement).slice(0, 2000);
  const checked = validateRecord(record, 'create');
  if (!checked.ok) return { ok: false, reason: checked.errors.join(','), record: null };
  return { ok: true, reason: 'ready', record: checked.record };
}


/** Persist through the existing store. Dedupes on patternKey via incorporate(). */
export function ingestOutcome(outcome, options = {}) {
  const prepared = toLearningInput(outcome);
  if (!prepared.ok) return { ingested: false, reason: prepared.reason, wroteCanon: false };
  if (options.dryRun === true) {
    return { ingested: true, dryRun: true, reason: 'dry_run', record: prepared.record, wroteCanon: false };
  }
  const writer = options.addRecord || addRecord;
  const result = writer(prepared.record, options.file);
  return {
    ingested: true,
    reason: result.action || 'create',
    record: result.record,
    wroteCanon: false,
  };
}

/** Connect checkpoint tooling states into optional learning rows without inventing authority. */
export function ingestToolingEvent(event = {}, options = {}) {
  const state = String(event.state || '');
  const knownNoise = new Set([
    'CODERABBIT_PASS',
    'CODERABBIT_NOT_NEEDED',
    'CODERABBIT_DEFERRED_RATE_LIMIT',
    'CODERABBIT_DEFERRED_UNAVAILABLE',
    'GROK_NOT_NEEDED',
    'GROK_DEFERRED',
    'CI_PASS',
  ]);
  if (knownNoise.has(state) || (state === 'GROK_SUCCEEDED' && event.material !== true)) {
    return { ingested: false, reason: 'noise_skip', wroteCanon: false };
  }
  if (state === 'CODERABBIT_FINDINGS' || state === 'CODERABBIT_FINDINGS_FIXED') {
    return ingestOutcome({
      kind: 'coderabbit_finding',
      patternKey: event.patternKey || `coderabbit-${event.commit || 'local'}-${event.findings || 'n'}`,
      scope: 'checkpoint-review',
      observation: event.observation || `CodeRabbit checkpoint reported ${event.findings || 'findings'}`,
      evidence: event.evidence || [state, event.commit || 'local'].filter(Boolean),
      relatedCommit: event.commit,
      locallyVerified: state === 'CODERABBIT_FINDINGS_FIXED',
      validatedLocally: state === 'CODERABBIT_FINDINGS_FIXED',
      severity: 'medium',
    }, options);
  }
  if (state === 'GROK_FINDING_ADOPTED_AFTER_LOCAL_VERIFICATION' || state === 'GROK_FINDING_REJECTED') {
    return ingestOutcome({
      kind: 'grok_finding',
      patternKey: event.patternKey || `grok-${event.commit || 'local'}-${state.toLowerCase()}`,
      scope: 'adversarial-review',
      observation: event.observation || `Grok challenge state ${state}`,
      evidence: event.evidence || [state],
      relatedCommit: event.commit,
      locallyVerified: true,
      validatedLocally: state === 'GROK_FINDING_ADOPTED_AFTER_LOCAL_VERIFICATION',
      severity: 'medium',
    }, options);
  }
  if (state === 'CI_FAILED' || state === 'CI_REGRESSION') {
    return ingestOutcome({
      kind: state === 'CI_REGRESSION' ? 'ci_regression' : 'ci_failed',
      patternKey: event.patternKey || fingerprint([
        state === 'CI_REGRESSION' ? 'ci-regression' : 'ci-failed',
        event.scope || 'independent-ci',
        event.relatedTest || event.failureSignature,
      ]),
      scope: 'independent-ci',
      observation: event.observation || `Independent CI ${state}`,
      evidence: event.evidence || [event.url || 'ci', event.commit || 'unknown'].filter(Boolean),
      relatedCommit: event.commit,
      severity: state === 'CI_REGRESSION' ? 'critical' : 'high',
    }, options);
  }
  if (state === 'SECURITY_FINDING') {
    return ingestOutcome({
      kind: 'security_finding',
      patternKey: event.patternKey || `security-${event.scope || 'check'}-${event.commit || 'local'}`,
      scope: event.scope || 'security',
      observation: event.observation || 'Security check reported a finding',
      evidence: event.evidence || ['security'],
      relatedCommit: event.commit,
      severity: event.severity || 'high',
    }, options);
  }
  return { ingested: false, reason: 'unknown_state', wroteCanon: false };
}
