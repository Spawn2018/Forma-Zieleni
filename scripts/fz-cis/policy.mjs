import {
  EFFECT_METHODS,
  EFFECT_OBSERVATION_TYPES,
  EFFECT_STATES,
  assertEffectSupportedForProven,
  evaluateEffect,
  mergeEffectObservation,
  refreshEffectState,
  validateControlCommit,
  validateControlRef,
  validateEffectObservation,
  validateEffectPlan,
} from './effect.mjs';

const STATUSES = ['OBSERVED', 'HYPOTHESIS', 'VALIDATING', 'PROVEN', 'REJECTED', 'PROMOTED', 'SUPERSEDED', 'DEFERRED'];
const SOURCES = ['test', 'production', 'review', 'grok', 'coderabbit', 'owner', 'security', 'performance', 'ux', 'customer', 'search', 'incident', 'agent', 'manual-toil', 'experiment'];
const EXTERNAL_SOURCES = new Set(['grok', 'coderabbit', 'customer', 'search']);
const SIGNAL_TYPES = ['failure', 'near-miss', 'success', 'toil', 'assumption', 'review-finding', 'incident', 'experiment'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const GENERALIZABILITY = ['ONE-OFF', 'LOCAL', 'RECURRING', 'SYSTEMIC', 'CRITICAL'];
const EVIDENCE_STRENGTH = ['ANECDOTAL', 'REPEATED', 'TESTED', 'MEASURED', 'STRONG'];
const PRIVACY = ['PUBLIC', 'INTERNAL'];
const PROMOTION_TARGETS = ['CODE', 'TEST', 'CONTRACT', 'TYPE', 'SCHEMA', 'LINT', 'REPO_CHECK', 'SECURITY_CONTROL', 'OBSERVABILITY', 'SLO', 'RUNBOOK', 'ADR', 'CANON', 'SKILL', 'AGENT', 'HOOK', 'AUTOMATION', 'DESIGN_SYSTEM', 'CONTENT_RULE', 'PRODUCT_RULE'];
const GATES = ['OWNER-DECISION', 'OWNER-ONLY', 'DANGEROUS'];
const DEMOTION_REASONS = ['STALE', 'HARMFUL', 'REDUNDANT', 'SUPERSEDED'];
const HORIZONS = ['FOUNDATION_NOW', 'WHEN_PRODUCT_EXISTS', 'PRODUCTION_LATER', 'BACKLOG'];
const EVENT_TYPES = [
  'slice_started', 'slice_completed', 'slice_blocked', 'test_failed', 'test_flaky',
  'review_finding', 'security_finding', 'ux_finding', 'grok_finding', 'coderabbit_finding',
  'owner_intervention', 'gate_reached', 'assumption_invalidated', 'incident', 'near_miss',
  'experiment_started', 'experiment_completed', 'learning_promoted', 'learning_rejected',
  'learning_demoted', 'toil_detected', 'automation_added', 'deployment', 'deployment_failed',
  'rollback', 'recovery_completed',
];
const DORA_EVENT_TYPES = ['commit', 'deployment', 'deployment_failed', 'rollback', 'recovery_completed'];
const EXPERIMENT_STATUSES = ['DRAFT', 'RUNNING', 'COMPLETED'];
const EXPERIMENT_DECISIONS = ['ADOPT', 'REVISE', 'REJECT', 'NEEDS_MORE_DATA'];
const FRESHNESS = {
  'architecture-decision': 'STABLE',
  'owner-decision': 'STABLE',
  'schema': 'SLOW-CHANGING',
  'dora-definition': 'SLOW-CHANGING',
  'cursor-api': 'FAST-CHANGING',
  'vendor-pricing': 'FAST-CHANGING',
  'search-engine-behavior': 'FAST-CHANGING',
  'security-advisory': 'LIVE/EXTERNAL',
};
const TRANSITIONS = {
  OBSERVED: ['HYPOTHESIS', 'REJECTED', 'DEFERRED'],
  HYPOTHESIS: ['VALIDATING', 'REJECTED', 'DEFERRED'],
  VALIDATING: ['PROVEN', 'REJECTED', 'DEFERRED'],
  PROVEN: ['PROMOTED', 'REJECTED', 'DEFERRED'],
  PROMOTED: ['SUPERSEDED'],
  REJECTED: ['SUPERSEDED'],
  DEFERRED: ['OBSERVED', 'HYPOTHESIS'],
  SUPERSEDED: [],
};
const FORBIDDEN_KEYS = new Set([
  'secret', 'token', 'password', 'credential', 'credentials', 'customerEmail', 'rawPii',
  'privateKey', 'authorization', 'command', 'shell', 'eval', 'systemPrompt', 'toolCall',
  'learnAwayOwnerGate', 'autoApprove', 'argv', 'spawn', 'exec',
]);
const SECRET = /-----BEGIN |AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9\-._~+/]{20,}|password\s*[:=]\s*\S+|api[_-]?key\s*[:=]\s*\S+/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PATTERN_KEY = /^[a-z0-9]+(?:-[a-z0-9]+){1,8}$/;
const ID_RE = /^LR-\d{8}-[a-f0-9]{8}$/;
const PROMOTABLE_STRENGTH = new Set(['TESTED', 'MEASURED', 'STRONG']);
const CLASS_WIDE = new Set(['RECURRING', 'SYSTEMIC', 'CRITICAL']);
const TRACKED_PROMOTION_TARGETS = new Set([
  'CODE', 'TEST', 'CONTRACT', 'TYPE', 'SCHEMA', 'LINT', 'REPO_CHECK', 'SECURITY_CONTROL',
  'RUNBOOK', 'ADR', 'CANON', 'SKILL', 'AGENT', 'HOOK', 'AUTOMATION', 'DESIGN_SYSTEM',
  'CONTENT_RULE', 'PRODUCT_RULE',
]);

export {
  CLASS_WIDE, DEMOTION_REASONS, DORA_EVENT_TYPES, EFFECT_METHODS, EFFECT_OBSERVATION_TYPES,
  EFFECT_STATES, EVIDENCE_STRENGTH, EVENT_TYPES, EXPERIMENT_DECISIONS, EXPERIMENT_STATUSES,
  EXTERNAL_SOURCES, FRESHNESS, GATES, GENERALIZABILITY, HORIZONS, PATTERN_KEY, PRIVACY,
  PROMOTABLE_STRENGTH, PROMOTION_TARGETS, SEVERITIES, SIGNAL_TYPES, SOURCES, STATUSES,
  TRACKED_PROMOTION_TARGETS, TRANSITIONS,
};

function fail(errors, code) {
  errors.push(code);
}

function scanValue(value, errors, seen = new Set()) {
  if (value == null || seen.has(value)) return;
  if (typeof value === 'string') {
    if (SECRET.test(value)) fail(errors, 'SECRET_REJECTED');
    if (EMAIL.test(value)) fail(errors, 'PII_REJECTED');
    if (value.length > 4000) fail(errors, 'VALUE_TOO_LONG');
    return;
  }
  if (typeof value !== 'object') return;
  seen.add(value);
  if (Array.isArray(value)) {
    if (value.length > 30) fail(errors, 'LIST_TOO_LONG');
    for (const item of value) scanValue(item, errors, seen);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) fail(errors, 'FORBIDDEN_FIELD');
    scanValue(child, errors, seen);
  }
}

export function validateRecord(input, mode = 'create') {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['NOT_AN_OBJECT'] };
  }
  scanValue(input, errors);
  const status = input.status || 'OBSERVED';
  if (!STATUSES.includes(status)) fail(errors, 'BAD_STATUS');
  if (mode === 'create' && !['OBSERVED', 'HYPOTHESIS'].includes(status)) fail(errors, 'CREATE_STATUS');
  if (input.id != null && !ID_RE.test(input.id)) fail(errors, 'BAD_ID');
  if (typeof input.patternKey !== 'string' || !PATTERN_KEY.test(input.patternKey)) fail(errors, 'BAD_PATTERN');
  if (!SOURCES.includes(input.source)) fail(errors, 'BAD_SOURCE');
  if (typeof input.scope !== 'string' || input.scope.length < 2 || input.scope.length > 120) fail(errors, 'BAD_SCOPE');
  if (!SIGNAL_TYPES.includes(input.signalType)) fail(errors, 'BAD_SIGNAL');
  if (!SEVERITIES.includes(input.severity)) fail(errors, 'BAD_SEVERITY');
  if (typeof input.observation !== 'string' || input.observation.trim().length < 8) fail(errors, 'BAD_OBSERVATION');
  if (!Array.isArray(input.evidence) || input.evidence.length === 0 || input.evidence.some((item) => typeof item !== 'string' || item.length < 3)) {
    fail(errors, 'BAD_EVIDENCE');
  }
  if (!GENERALIZABILITY.includes(input.generalizability)) fail(errors, 'BAD_GENERALIZABILITY');
  if (!PRIVACY.includes(input.privacyClassification)) fail(errors, 'BAD_PRIVACY');
  if (input.evidenceStrength != null && !EVIDENCE_STRENGTH.includes(input.evidenceStrength)) fail(errors, 'BAD_STRENGTH');
  if (input.promotionTarget != null && !PROMOTION_TARGETS.includes(input.promotionTarget)) fail(errors, 'BAD_TARGET');
  if (input.horizon != null && !HORIZONS.includes(input.horizon)) fail(errors, 'BAD_HORIZON');
  if (input.ownerGate != null) {
    if (!GATES.includes(input.ownerGate)) fail(errors, 'BAD_GATE');
    if (input.gateDisposition !== 'PRESERVED') fail(errors, 'GATE_EROSION');
  }
  const proposal = `${input.proposedImprovement || ''}`;
  if (/auto-?approv|automat\w*\s+approv|approve\s+(this|it|dangerous|owner)|learn away|downgrad\w*\s+(the\s+)?(gate|owner)/i.test(proposal)) {
    fail(errors, 'GATE_EROSION');
  }
  if (input.effectPlan != null) {
    const plan = validateEffectPlan(input.effectPlan);
    if (!plan.ok) for (const code of plan.errors) fail(errors, code);
  }
  if (input.effectObservations != null) {
    if (!Array.isArray(input.effectObservations)) fail(errors, 'BAD_EFFECT_OBSERVATIONS');
    else {
      if (input.effectObservations.length > 40) fail(errors, 'OBSERVATION_CAP');
      for (const obs of input.effectObservations) {
        const checkedObs = validateEffectObservation(obs);
        if (!checkedObs.ok) for (const code of checkedObs.errors) fail(errors, code);
      }
    }
  }
  if (input.effectState != null && !EFFECT_STATES.includes(input.effectState)) {
    fail(errors, 'BAD_EFFECT_STATE');
  }
  if (input.controlRef != null) {
    const ref = validateControlRef(input.controlRef, { requireTracked: false });
    if (!ref.ok) for (const code of ref.errors) fail(errors, code);
  }
  if (input.controlCommit != null && (typeof input.controlCommit !== 'string'
    || !/^[0-9a-f]{7,40}$/i.test(input.controlCommit))) {
    fail(errors, 'BAD_CONTROL_COMMIT');
  }
  if (status === 'PROMOTED') {
    if (input.validatedLocally !== true) fail(errors, 'RAW_SIGNAL_CANNOT_PROMOTE');
    if (EXTERNAL_SOURCES.has(input.source) && input.locallyVerified !== true) fail(errors, 'EXTERNAL_NON_AUTHORITATIVE');
  }
  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    record: errors.length === 0 ? { ...input, status } : null,
  };
}

export function incorporate(records, input, now = new Date()) {
  if (!Array.isArray(records)) return { ok: false, errors: ['BAD_STORE'], wroteCanon: false };
  const checked = validateRecord(input, 'create');
  if (!checked.ok) return { ok: false, errors: checked.errors, wroteCanon: false };
  const record = checked.record;
  const open = records.find((item) => item.patternKey === record.patternKey && !['REJECTED', 'SUPERSEDED'].includes(item.status));
  if (open) {
    const next = {
      ...open,
      occurrences: (open.occurrences || 1) + 1,
      evidence: [...new Set([...(open.evidence || []), ...record.evidence])].slice(0, 20),
      lastSeen: now.toISOString(),
    };
    return {
      ok: true,
      action: 'occurrence',
      wroteCanon: false,
      record: next,
      records: records.map((item) => (item.id === open.id ? next : item)),
    };
  }
  const created = {
    ...record,
    status: record.status || 'OBSERVED',
    occurrences: 1,
    evidenceStrength: record.evidenceStrength || 'ANECDOTAL',
    validatedLocally: false,
    locallyVerified: EXTERNAL_SOURCES.has(record.source) ? false : record.locallyVerified === true,
    firstSeen: now.toISOString(),
    lastSeen: now.toISOString(),
  };
  return { ok: true, action: 'create', wroteCanon: false, record: created, records: [...records, created] };
}

function error(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}

export function transition(record, next, extra = {}, options = {}) {
  const checked = validateRecord(record, 'stored');
  if (!checked.ok) throw error(checked.errors[0] || 'INVALID_RECORD');
  const allowed = TRANSITIONS[record.status] || [];
  if (!allowed.includes(next)) throw error('ILLEGAL_TRANSITION');
  if (next === 'REJECTED' && (typeof extra.rejectionReason !== 'string' || extra.rejectionReason.trim().length < 8)) {
    throw error('MISSING_REJECTION');
  }
  if (next === 'SUPERSEDED' && !DEMOTION_REASONS.includes(extra.demotionReason)) throw error('MISSING_DEMOTION_REASON');

  // effectState cannot be forged via transition extras; always re-derive.
  // effectObservations must merge idempotently — never append duplicate ids wholesale.
  const { effectState: _forgedState, effectObservations: extraObs, ...safeExtra } = extra;
  void _forgedState;
  let mergedObs = record.effectObservations;
  if (Array.isArray(extraObs)) {
    mergedObs = Array.isArray(record.effectObservations) ? [...record.effectObservations] : [];
    for (const obs of extraObs) {
      const merged = mergeEffectObservation(mergedObs, obs);
      if (!merged.ok) throw error(merged.errors[0] || 'BAD_OBSERVATION');
      mergedObs = merged.observations;
    }
  }

  let updated = {
    ...record,
    ...safeExtra,
    ...(extraObs ? { effectObservations: mergedObs } : {}),
    status: next,
    validatedLocally: next === 'PROMOTED' ? true : (safeExtra.validatedLocally === true || record.validatedLocally === true),
  };
  updated = refreshEffectState(updated);

  if (next === 'PROVEN') {
    if (EXTERNAL_SOURCES.has(record.source) && updated.locallyVerified !== true) {
      throw error('EXTERNAL_NON_AUTHORITATIVE');
    }
    if (CLASS_WIDE.has(record.generalizability)
      && !PROMOTABLE_STRENGTH.has(updated.evidenceStrength || record.evidenceStrength)) {
      throw error('INSUFFICIENT_EVIDENCE');
    }
    // Anecdotal LOCAL/ONE-OFF cannot become class-wide proof.
    if ((updated.evidenceStrength || record.evidenceStrength) === 'ANECDOTAL'
      && CLASS_WIDE.has(record.generalizability)) {
      throw error('INSUFFICIENT_EVIDENCE');
    }
    assertEffectSupportedForProven(updated);
    if (updated.validatedLocally !== true) throw error('MISSING_LOCAL_VALIDATION');
    if (record.ownerGate && updated.gateDisposition !== 'PRESERVED') throw error('GATE_EROSION');
  }

  if (next === 'PROMOTED') {
    if (record.validatedLocally !== true && safeExtra.validatedLocally !== true) {
      throw error('RAW_SIGNAL_CANNOT_PROMOTE');
    }
    updated.validatedLocally = true;
    if (EXTERNAL_SOURCES.has(record.source) && updated.locallyVerified !== true) {
      throw error('EXTERNAL_NON_AUTHORITATIVE');
    }
    if (CLASS_WIDE.has(record.generalizability)
      && !PROMOTABLE_STRENGTH.has(updated.evidenceStrength || record.evidenceStrength)) {
      throw error('INSUFFICIENT_EVIDENCE');
    }
    if (!PROMOTION_TARGETS.includes(updated.promotionTarget)) throw error('MISSING_TARGET');
    if (record.ownerGate && updated.gateDisposition !== 'PRESERVED') throw error('GATE_EROSION');

    assertEffectSupportedForProven(updated);
    if (typeof updated.controlRef !== 'string' || !updated.controlRef.trim()) {
      throw error('MISSING_CONTROL_REF');
    }
    const requireTracked = TRACKED_PROMOTION_TARGETS.has(updated.promotionTarget)
      && !String(updated.controlRef).startsWith('ext:');
    const ref = validateControlRef(updated.controlRef, {
      requireTracked,
      root: options.root,
      gitLsFiles: options.gitLsFiles,
    });
    if (!ref.ok) throw error(ref.errors[0] || 'BAD_CONTROL_REF');
    if (updated.controlCommit) {
      const commit = validateControlCommit(updated.controlCommit, {
        root: options.root,
        gitCatFile: options.gitCatFile,
      });
      if (!commit.ok) throw error(commit.errors[0] || 'BAD_CONTROL_COMMIT');
    } else if (requireTracked) {
      throw error('MISSING_CONTROL_COMMIT');
    }
    const again = validateRecord(updated, 'stored');
    if (!again.ok) throw error(again.errors[0]);
  }

  // Keep derived effectState authoritative on the stored row.
  const derived = evaluateEffect(updated);
  updated.effectState = derived.effectState;
  return updated;
}

export function learningDebt(records) {
  if (!Array.isArray(records)) throw error('BAD_STORE');
  return records
    .filter((record) => ['HYPOTHESIS', 'VALIDATING', 'PROVEN'].includes(record.status)
      && CLASS_WIDE.has(record.generalizability)
      && typeof record.proposedImprovement === 'string'
      && record.proposedImprovement.trim().length > 0)
    .map((record) => ({
      id: record.id,
      patternKey: record.patternKey,
      status: record.status,
      generalizability: record.generalizability,
      horizon: record.horizon || 'BACKLOG',
      proposedImprovement: record.proposedImprovement,
    }));
}

export function pushBlockers(records) {
  if (!Array.isArray(records)) throw error('BAD_STORE');
  return records.filter((record) => record.severity === 'critical'
    && ['security', 'incident'].includes(record.source)
    && ['OBSERVED', 'HYPOTHESIS', 'VALIDATING'].includes(record.status));
}

export function classifyFreshness(topic) {
  if (!Object.hasOwn(FRESHNESS, topic)) return { topic, freshness: null, state: 'UNCLASSIFIED' };
  const freshness = FRESHNESS[topic];
  return {
    topic,
    freshness,
    revalidate: freshness === 'STABLE' ? 'ON_SUPERSESSION' : 'BEFORE_USE',
  };
}

export function validateEvent(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['NOT_AN_OBJECT'] };
  scanValue(input, errors);
  if (!EVENT_TYPES.includes(input.type)) fail(errors, 'BAD_EVENT');
  if (typeof input.at !== 'string' || Number.isNaN(Date.parse(input.at))) fail(errors, 'BAD_TIME');
  if (input.service != null && (typeof input.service !== 'string' || input.service.length > 80)) fail(errors, 'BAD_SERVICE');
  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateDoraEvent(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['NOT_AN_OBJECT'] };
  scanValue(input, errors);
  if (!DORA_EVENT_TYPES.includes(input.type)) fail(errors, 'BAD_DORA_EVENT');
  if (typeof input.service !== 'string' || input.service.length < 2) fail(errors, 'BAD_SERVICE');
  if (typeof input.at !== 'string' || Number.isNaN(Date.parse(input.at))) fail(errors, 'BAD_TIME');
  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

function unavailable(metric, note) {
  return { metric, state: 'NOT MEASURABLE', value: null, ...(note ? { note } : {}) };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function doraFromEvents(events) {
  if (!Array.isArray(events)) throw error('EVENTS_REQUIRED');
  for (const event of events) {
    const checked = validateDoraEvent(event);
    if (!checked.ok) throw error(checked.errors[0] || 'BAD_DORA_EVENT');
  }
  const deployments = events.filter((event) => event.type === 'deployment');
  if (deployments.length === 0) {
    return {
      evidence: 'NOT MEASURABLE',
      changeLeadTime: unavailable('changeLeadTime', 'NOT APPLICABLE YET'),
      deploymentFrequency: unavailable('deploymentFrequency', 'NOT APPLICABLE YET'),
      failedDeploymentRecoveryTime: unavailable('failedDeploymentRecoveryTime', 'NOT APPLICABLE YET'),
      changeFailRate: unavailable('changeFailRate', 'NOT APPLICABLE YET'),
      deploymentReworkRate: unavailable('deploymentReworkRate', 'NOT APPLICABLE YET'),
    };
  }
  const leadSamples = deployments
    .filter((event) => event.commitAt && event.at)
    .map((event) => Date.parse(event.at) - Date.parse(event.commitAt))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const failed = deployments.filter((event) => event.failed === true).length;
  const rework = deployments.filter((event) => event.unplanned === true).length;
  const recoveries = events
    .filter((event) => event.type === 'recovery_completed' && Number.isFinite(event.durationMs) && event.durationMs >= 0)
    .map((event) => event.durationMs);
  const stamps = deployments.map((event) => Date.parse(event.at)).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  const spanDays = stamps.length >= 2 ? (stamps[stamps.length - 1] - stamps[0]) / 86400000 : null;
  return {
    evidence: 'MEASURED',
    changeLeadTime: leadSamples.length === deployments.length
      ? { metric: 'changeLeadTime', state: 'MEASURED', valueMs: median(leadSamples) }
      : unavailable('changeLeadTime'),
    deploymentFrequency: {
      metric: 'deploymentFrequency',
      state: 'MEASURED',
      count: deployments.length,
      perDay: spanDays && spanDays > 0 ? deployments.length / spanDays : null,
      perDayState: spanDays && spanDays > 0 ? 'MEASURED' : 'NOT MEASURABLE',
    },
    failedDeploymentRecoveryTime: recoveries.length > 0
      ? { metric: 'failedDeploymentRecoveryTime', state: 'MEASURED', valueMs: median(recoveries) }
      : unavailable('failedDeploymentRecoveryTime'),
    changeFailRate: { metric: 'changeFailRate', state: 'MEASURED', value: failed / deployments.length },
    deploymentReworkRate: { metric: 'deploymentReworkRate', state: 'MEASURED', value: rework / deployments.length },
  };
}

export function validateExperiment(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['NOT_AN_OBJECT'] };
  scanValue(input, errors);
  if (!EXPERIMENT_STATUSES.includes(input.status)) fail(errors, 'BAD_EXPERIMENT_STATUS');
  for (const key of ['question', 'hypothesis', 'baseline', 'change', 'expectedEffect', 'stopCondition']) {
    if (typeof input[key] !== 'string' || input[key].trim().length < 8) fail(errors, 'BAD_EXPERIMENT_FIELD');
  }
  if (!Array.isArray(input.metrics) || input.metrics.length === 0) fail(errors, 'BAD_METRICS');
  if (!Array.isArray(input.guardrails) || input.guardrails.length === 0) fail(errors, 'BAD_GUARDRAILS');
  if (input.status === 'COMPLETED') {
    if (!EXPERIMENT_DECISIONS.includes(input.decision)) fail(errors, 'BAD_DECISION');
    if (typeof input.result !== 'string' || input.result.trim().length < 8) fail(errors, 'BAD_RESULT');
  } else if (input.decision != null) fail(errors, 'EARLY_DECISION');
  if (input.customerFacing === true && input.ownerApproved !== true) fail(errors, 'CUSTOMER_EXPERIMENT_GATE');
  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

export function advanceExperiment(experiment, next, extra = {}) {
  const checked = validateExperiment(experiment);
  if (!checked.ok) throw error(checked.errors[0]);
  const allowed = { DRAFT: ['RUNNING'], RUNNING: ['COMPLETED'], COMPLETED: [] };
  if (!allowed[experiment.status].includes(next)) throw error('ILLEGAL_EXPERIMENT');
  const updated = { ...experiment, ...extra, status: next };
  const again = validateExperiment(updated);
  if (!again.ok) throw error(again.errors[0]);
  return updated;
}
