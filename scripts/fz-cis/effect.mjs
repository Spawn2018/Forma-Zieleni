/**
 * VERIFY EFFECT for FZ-CIS.
 * Effect observations are data. Never execute evidence text.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { evidenceSupportsEffect, EVIDENCE_CLASSES } from './learning-governance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const EFFECT_METHODS = Object.freeze([
  'DETERMINISTIC_REPLAY',
  'NATURAL_RECURRENCE',
  'EXPERIMENT',
  'BEFORE_AFTER',
  'MANUAL_VERIFICATION',
]);

export const EFFECT_STATES = Object.freeze([
  'UNPLANNED',
  'PLANNED',
  'OBSERVING',
  'SUPPORTED',
  'NOT_SUPPORTED',
  'INCONCLUSIVE',
]);

export const EFFECT_OBSERVATION_TYPES = Object.freeze([
  'CONTROL_CAUGHT',
  'CONTROL_MISSED',
  'DOWNSTREAM_ESCAPE',
  'FALSE_BLOCK',
  'REPLAY_CAUGHT',
  'REPLAY_MISSED',
  'EXPERIMENT_SUPPORTED',
  'EXPERIMENT_REJECTED',
  'INCONCLUSIVE',
]);

const SUPPORTING = new Set([
  'CONTROL_CAUGHT',
  'REPLAY_CAUGHT',
  'EXPERIMENT_SUPPORTED',
]);

const COUNTER = new Set([
  'CONTROL_MISSED',
  'DOWNSTREAM_ESCAPE',
  'FALSE_BLOCK',
  'REPLAY_MISSED',
  'EXPERIMENT_REJECTED',
]);

const FORBIDDEN_KEYS = new Set([
  'secret', 'token', 'password', 'credential', 'credentials', 'customerEmail', 'rawPii',
  'privateKey', 'authorization', 'command', 'shell', 'eval', 'systemPrompt', 'toolCall',
  'argv', 'spawn', 'exec', 'learnAwayOwnerGate', 'autoApprove',
]);
const SECRET = /-----BEGIN |AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9\-._~+/]{20,}|password\s*[:=]\s*\S+|api[_-]?key\s*[:=]\s*\S+/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const OBS_ID = /^effect:[a-z0-9][a-z0-9:._-]{3,180}$/;
const CONTROL_REF = /^(?:[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)+|ext:[a-z0-9][a-z0-9._-]{2,80})$/;
const COMMIT_RE = /^[0-9a-f]{7,40}$/i;
const MAX_OBSERVATIONS = 40;
const MAX_EVIDENCE = 12;

function fail(errors, code) {
  errors.push(code);
}

function scanValue(value, errors, seen = new Set()) {
  if (value == null || seen.has(value)) return;
  if (typeof value === 'string') {
    if (SECRET.test(value)) fail(errors, 'SECRET_REJECTED');
    if (EMAIL.test(value)) fail(errors, 'PII_REJECTED');
    if (value.length > 2000) fail(errors, 'VALUE_TOO_LONG');
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

function error(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}

export function isSupportingObservation(type) {
  return SUPPORTING.has(type);
}

export function isCounterObservation(type) {
  return COUNTER.has(type);
}

/**
 * Minimum supporting observations required by method.
 * Deterministic replay needs one genuine REPLAY_CAUGHT; anecdotes need more.
 */
export function minimumEvidenceFor(method) {
  switch (method) {
    case 'DETERMINISTIC_REPLAY':
      return 1;
    case 'EXPERIMENT':
      return 1;
    case 'BEFORE_AFTER':
      return 2;
    case 'NATURAL_RECURRENCE':
      return 2;
    case 'MANUAL_VERIFICATION':
      return 2;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

export function validateEffectPlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    return { ok: false, errors: ['NOT_AN_OBJECT'] };
  }
  scanValue(plan, errors);
  if (!EFFECT_METHODS.includes(plan.method)) fail(errors, 'BAD_EFFECT_METHOD');
  if (typeof plan.successSignal !== 'string' || plan.successSignal.trim().length < 8) {
    fail(errors, 'BAD_SUCCESS_SIGNAL');
  }
  if (typeof plan.failureSignal !== 'string' || plan.failureSignal.trim().length < 8) {
    fail(errors, 'BAD_FAILURE_SIGNAL');
  }
  if (plan.minimumEvidence != null) {
    const n = Number(plan.minimumEvidence);
    if (!Number.isInteger(n) || n < 1 || n > 20) fail(errors, 'BAD_MINIMUM_EVIDENCE');
    else if (EFFECT_METHODS.includes(plan.method) && n < minimumEvidenceFor(plan.method)) {
      fail(errors, 'MINIMUM_EVIDENCE_TOO_LOW');
    }
  }
  if (plan.command != null || plan.shell != null || plan.argv != null) fail(errors, 'FORBIDDEN_EXECUTABLE');
  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateEffectObservation(obs) {
  const errors = [];
  if (!obs || typeof obs !== 'object' || Array.isArray(obs)) {
    return { ok: false, errors: ['NOT_AN_OBJECT'] };
  }
  scanValue(obs, errors);
  if (typeof obs.id !== 'string' || !OBS_ID.test(obs.id)) fail(errors, 'BAD_OBSERVATION_ID');
  if (typeof obs.at !== 'string' || Number.isNaN(Date.parse(obs.at))) fail(errors, 'BAD_EFFECT_TIME');
  if (!EFFECT_OBSERVATION_TYPES.includes(obs.type)) fail(errors, 'BAD_OBSERVATION_TYPE');
  if (!Array.isArray(obs.evidence) || obs.evidence.length === 0
    || obs.evidence.some((item) => typeof item !== 'string' || item.trim().length < 3)) {
    fail(errors, 'BAD_EFFECT_EVIDENCE');
  } else if (obs.evidence.length > MAX_EVIDENCE) {
    fail(errors, 'EVIDENCE_CAP');
  }
  if (obs.relatedCommit != null && !COMMIT_RE.test(String(obs.relatedCommit))) {
    fail(errors, 'BAD_RELATED_COMMIT');
  }
  if (obs.controlCommit != null && !COMMIT_RE.test(String(obs.controlCommit))) {
    fail(errors, 'BAD_CONTROL_COMMIT');
  }
  if (obs.afterControl != null && typeof obs.afterControl !== 'boolean') {
    fail(errors, 'BAD_AFTER_CONTROL');
  }
  if (obs.evidenceClass != null && !EVIDENCE_CLASSES.includes(obs.evidenceClass)) {
    fail(errors, 'BAD_EVIDENCE_CLASS');
  }
  if (obs.command != null || obs.shell != null || obs.argv != null) fail(errors, 'FORBIDDEN_EXECUTABLE');
  return { ok: errors.length === 0, errors: [...new Set(errors)] };
}

export function validateControlRefShape(controlRef) {
  const errors = [];
  if (typeof controlRef !== 'string' || !CONTROL_REF.test(controlRef)) {
    return { ok: false, errors: ['BAD_CONTROL_REF'] };
  }
  if (controlRef.includes('..') || path.isAbsolute(controlRef)) {
    return { ok: false, errors: ['CONTROL_PATH_TRAVERSAL'] };
  }
  if (controlRef.startsWith('ext:')) {
    return { ok: true, errors: [], kind: 'external', resolved: controlRef };
  }
  // Shape-only: no filesystem probe (avoids existence oracle during ordinary validate).
  const normalized = controlRef.replace(/\\/g, '/');
  if (normalized.split('/').some((part) => part === '..' || part === '')) {
    return { ok: false, errors: ['CONTROL_PATH_TRAVERSAL'] };
  }
  return { ok: true, errors: [], kind: 'path', resolved: normalized };
}

export function validateControlRef(controlRef, options = {}) {
  const shape = validateControlRefShape(controlRef);
  if (!shape.ok) return shape;
  if (controlRef.startsWith('ext:')) return shape;
  const cwd = options.root || root;
  const resolved = path.resolve(cwd, controlRef);
  const rel = path.relative(cwd, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return { ok: false, errors: ['CONTROL_PATH_TRAVERSAL'] };
  }
  if (!existsSync(resolved)) {
    return { ok: false, errors: ['CONTROL_MISSING'] };
  }
  if (options.requireTracked !== false) {
    const listed = (options.gitLsFiles || defaultGitLsFiles)(controlRef, cwd);
    if (!listed) return { ok: false, errors: ['CONTROL_NOT_TRACKED'] };
  }
  return { ok: true, errors: [], kind: 'tracked', resolved: controlRef.replace(/\\/g, '/') };
}

function defaultGitLsFiles(rel, cwd) {
  const ran = spawnSync('git', ['ls-files', '--', rel], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  if ((ran.status ?? 1) !== 0) return false;
  const lines = String(ran.stdout || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.some((line) => line.replace(/\\/g, '/') === rel.replace(/\\/g, '/'));
}

export function validateControlCommit(controlCommit, options = {}) {
  if (controlCommit == null || controlCommit === '') return { ok: true, errors: [], skipped: true };
  if (!COMMIT_RE.test(String(controlCommit))) return { ok: false, errors: ['BAD_CONTROL_COMMIT'] };
  const verify = options.gitCatFile || defaultGitCatFile;
  if (!verify(String(controlCommit), options.root || root)) {
    return { ok: false, errors: ['CONTROL_COMMIT_UNKNOWN'] };
  }
  return { ok: true, errors: [] };
}

function defaultGitCatFile(sha, cwd) {
  const ran = spawnSync('git', ['cat-file', '-e', `${sha}^{commit}`], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  return (ran.status ?? 1) === 0;
}

/**
 * Idempotent merge of one observation into the list.
 * Same id never counts twice.
 */
export function mergeEffectObservation(existing, observation) {
  const checked = validateEffectObservation(observation);
  if (!checked.ok) {
    return { ok: false, errors: checked.errors, observations: existing || [], added: false };
  }
  const list = Array.isArray(existing) ? [...existing] : [];
  const idx = list.findIndex((item) => item.id === observation.id);
  if (idx !== -1) {
    return { ok: true, errors: [], observations: list, added: false, duplicate: true };
  }
  if (list.length >= MAX_OBSERVATIONS) {
    return { ok: false, errors: ['OBSERVATION_CAP'], observations: list, added: false };
  }
  const normalized = {
    id: observation.id,
    at: observation.at,
    type: observation.type,
    evidence: observation.evidence.map(String).slice(0, MAX_EVIDENCE),
  };
  if (observation.relatedCommit) normalized.relatedCommit = String(observation.relatedCommit);
  if (observation.controlCommit) normalized.controlCommit = String(observation.controlCommit);
  if (typeof observation.afterControl === 'boolean') normalized.afterControl = observation.afterControl;
  if (observation.evidenceClass) normalized.evidenceClass = observation.evidenceClass;
  list.push(normalized);
  return { ok: true, errors: [], observations: list, added: true, duplicate: false };
}

function afterControlFilter(observations, controlCommit) {
  if (!controlCommit) return observations;
  return observations.filter((obs) => {
    if (obs.afterControl === false) return false;
    if (obs.afterControl === true) return true;
    if (!obs.relatedCommit) return true;
    // Without graph order, treat missing afterControl as post-control when tagged.
    return true;
  });
}

/**
 * Derive effect state from plan + observations. Manual effectState is ignored.
 */
export function evaluateEffect(record) {
  const plan = record?.effectPlan;
  if (!plan) {
    return {
      effectState: 'UNPLANNED',
      supported: false,
      supportingCount: 0,
      counterCount: 0,
      reason: 'NO_EFFECT_PLAN',
    };
  }
  const planCheck = validateEffectPlan(plan);
  if (!planCheck.ok) {
    return {
      effectState: 'INCONCLUSIVE',
      supported: false,
      supportingCount: 0,
      counterCount: 0,
      reason: planCheck.errors[0] || 'BAD_EFFECT_PLAN',
    };
  }
  const observations = Array.isArray(record.effectObservations) ? record.effectObservations : [];
  const seenIds = new Set();
  const deduped = [];
  for (const obs of observations) {
    const checked = validateEffectObservation(obs);
    if (!checked.ok) {
      return {
        effectState: 'INCONCLUSIVE',
        supported: false,
        supportingCount: 0,
        counterCount: 0,
        reason: checked.errors[0] || 'BAD_OBSERVATION',
      };
    }
    if (seenIds.has(obs.id)) continue;
    seenIds.add(obs.id);
    deduped.push(obs);
  }
  if (deduped.length === 0) {
    return {
      effectState: 'PLANNED',
      supported: false,
      supportingCount: 0,
      counterCount: 0,
      reason: 'NO_OBSERVATIONS',
    };
  }

  const relevant = afterControlFilter(deduped, record.controlCommit);
  const typedSupport = relevant.filter((obs) => SUPPORTING.has(obs.type));
  const supporting = typedSupport.filter((obs) => {
    if (!evidenceSupportsEffect(obs)) return false;
    if (plan.method === 'MANUAL_VERIFICATION' && obs.evidenceClass !== 'HUMAN_VERIFIED') return false;
    return true;
  });
  const aiOnlySupport = typedSupport.filter((obs) => !evidenceSupportsEffect(obs));
  const counter = relevant.filter((obs) => COUNTER.has(obs.type));
  const escape = relevant.filter((obs) => obs.type === 'DOWNSTREAM_ESCAPE');
  const falseBlock = relevant.filter((obs) => obs.type === 'FALSE_BLOCK');
  const needed = Math.max(
    plan.minimumEvidence != null ? Number(plan.minimumEvidence) : 0,
    minimumEvidenceFor(plan.method),
  );

  if (escape.length > 0) {
    return {
      effectState: 'NOT_SUPPORTED',
      supported: false,
      supportingCount: supporting.length,
      counterCount: counter.length,
      reason: 'COUNTER_ESCAPE',
    };
  }

  if (falseBlock.length >= 2 && supporting.length === 0) {
    return {
      effectState: 'NOT_SUPPORTED',
      supported: false,
      supportingCount: supporting.length,
      counterCount: counter.length,
      reason: 'FALSE_BLOCK_PATTERN',
    };
  }

  if (supporting.length === 0 && aiOnlySupport.length > 0 && escape.length === 0) {
    return {
      effectState: 'INCONCLUSIVE',
      supported: false,
      supportingCount: 0,
      counterCount: counter.length,
      reason: 'AI_CIRCULAR_EVIDENCE',
    };
  }

  if (counter.length > supporting.length) {
    return {
      effectState: 'NOT_SUPPORTED',
      supported: false,
      supportingCount: supporting.length,
      counterCount: counter.length,
      reason: 'COUNTER_DOMINATES',
    };
  }

  if (supporting.length < needed) {
    return {
      effectState: supporting.length > 0 || counter.length > 0 ? 'OBSERVING' : 'PLANNED',
      supported: false,
      supportingCount: supporting.length,
      counterCount: counter.length,
      reason: 'INSUFFICIENT_SUPPORT',
    };
  }

  // Newer counter after support blocks false SUPPORTED, even when counts match.
  if (supporting.length > 0) {
    const lastSupport = Math.max(...supporting.map((obs) => Date.parse(obs.at)));
    const laterCounter = counter.filter((obs) => Date.parse(obs.at) > lastSupport);
    if (laterCounter.length > 0) {
      return {
        effectState: 'NOT_SUPPORTED',
        supported: false,
        supportingCount: supporting.length,
        counterCount: counter.length,
        reason: 'NEWER_COUNTER_EVIDENCE',
      };
    }
  }

  if (counter.length > 0 && supporting.length === counter.length) {
    return {
      effectState: 'INCONCLUSIVE',
      supported: false,
      supportingCount: supporting.length,
      counterCount: counter.length,
      reason: 'MIXED_EVIDENCE',
    };
  }

  if (plan.method === 'DETERMINISTIC_REPLAY') {
    const replayCaught = supporting.filter((obs) => obs.type === 'REPLAY_CAUGHT');
    if (replayCaught.length === 0) {
      return {
        effectState: 'OBSERVING',
        supported: false,
        supportingCount: supporting.length,
        counterCount: counter.length,
        reason: 'REPLAY_REQUIRED',
      };
    }
  }

  return {
    effectState: 'SUPPORTED',
    supported: true,
    supportingCount: supporting.length,
    counterCount: counter.length,
    reason: 'EFFECT_SUPPORTED',
  };
}

export function applyEffectPlan(record, plan) {
  const checked = validateEffectPlan(plan);
  if (!checked.ok) throw error(checked.errors[0] || 'BAD_EFFECT_PLAN');
  const floor = minimumEvidenceFor(plan.method);
  const requested = plan.minimumEvidence != null ? Number(plan.minimumEvidence) : floor;
  const next = {
    ...record,
    effectPlan: {
      method: plan.method,
      successSignal: plan.successSignal.trim(),
      failureSignal: plan.failureSignal.trim(),
      minimumEvidence: Math.max(requested, floor),
    },
  };
  const evaluated = evaluateEffect(next);
  next.effectState = evaluated.effectState;
  return next;
}

export function applyEffectObservation(record, observation) {
  const merged = mergeEffectObservation(record.effectObservations, observation);
  if (!merged.ok) throw error(merged.errors[0] || 'BAD_OBSERVATION');
  const next = { ...record, effectObservations: merged.observations };
  const evaluated = evaluateEffect(next);
  next.effectState = evaluated.effectState;
  return { record: next, added: merged.added, duplicate: merged.duplicate === true, evaluation: evaluated };
}

export function refreshEffectState(record) {
  const evaluated = evaluateEffect(record);
  return { ...record, effectState: evaluated.effectState };
}

export function assertEffectSupportedForProven(record) {
  const evaluated = evaluateEffect(record);
  if (!record.effectPlan) throw error('MISSING_EFFECT_PLAN');
  if (evaluated.effectState !== 'SUPPORTED' || !evaluated.supported) {
    throw error('EFFECT_NOT_SUPPORTED');
  }
  // Refuse forged state: stored SUPPORTED without derived support.
  if (record.effectState === 'SUPPORTED' && !evaluated.supported) {
    throw error('EFFECT_FORGED');
  }
  return evaluated;
}
