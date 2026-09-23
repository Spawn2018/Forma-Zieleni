/**
 * Deterministic FZ-CIS learning analysis.
 * Reports evidence-backed actions. Does not mutate records.
 */

import { CLASS_WIDE, EXTERNAL_SOURCES, PROMOTABLE_STRENGTH } from './policy.mjs';
import {
  evaluateEffect,
  validateControlCommit,
  validateControlRef,
} from './effect.mjs';

const CR_OCCURRENCE = /^cr-occurrence:[a-z0-9][a-z0-9:._-]{4,200}$/i;
const CI_RUN = /^ci-run:[a-z0-9][a-z0-9:._-]{4,120}$/i;
const OCCURRENCE_ANY = /^(?:cr-occurrence|ci-run):[a-z0-9][a-z0-9:._-]{4,200}$/i;

export function extractOccurrenceIds(evidence = []) {
  const ids = [];
  for (const item of evidence || []) {
    const text = String(item || '').trim();
    if (OCCURRENCE_ANY.test(text)) ids.push(text);
    // Also accept evidence lines that embed the id as a prefix token.
    const match = text.match(/\b((?:cr-occurrence|ci-run):[a-z0-9][a-z0-9:._-]{4,200})\b/i);
    if (match) ids.push(match[1]);
  }
  return [...new Set(ids)];
}

/**
 * Distinct independent occurrences for a record.
 * Same occurrence id read twice counts once.
 */
export function distinctOccurrences(record) {
  const fromEvidence = extractOccurrenceIds(record?.evidence || []);
  if (fromEvidence.length > 0) {
    return {
      ids: fromEvidence,
      count: fromEvidence.length,
      trustworthy: true,
      source: fromEvidence[0].startsWith('cr-occurrence:') ? 'coderabbit'
        : fromEvidence[0].startsWith('ci-run:') ? 'ci' : 'structured',
    };
  }
  return {
    ids: [],
    count: Number(record?.occurrences) || 1,
    trustworthy: false,
    source: 'raw_count',
    note: 'stronger_recurrence_proof_unavailable',
  };
}

export function isRecurrenceCandidate(record) {
  if (!record || ['REJECTED', 'SUPERSEDED'].includes(record.status)) return false;
  const occ = distinctOccurrences(record);
  if (!occ.trustworthy) return false;
  return occ.count >= 2;
}

function entry(record, extra = {}) {
  return {
    id: record.id,
    patternKey: record.patternKey,
    status: record.status,
    generalizability: record.generalizability,
    evidenceStrength: record.evidenceStrength || null,
    effectState: evaluateEffect(record).effectState,
    ...extra,
  };
}

function isUrgent(record) {
  if (!record) return false;
  if (['REJECTED', 'SUPERSEDED', 'PROMOTED', 'PROVEN'].includes(record.status)) return false;
  if (record.generalizability === 'CRITICAL') return true;
  if (record.generalizability === 'SYSTEMIC'
    && ['high', 'critical'].includes(record.severity)
    && ['HYPOTHESIS', 'VALIDATING', 'OBSERVED'].includes(record.status)) {
    return true;
  }
  return false;
}

function hasDurableControl(record, options = {}) {
  if (!record.controlRef) return false;
  const ref = validateControlRef(record.controlRef, options);
  if (!ref.ok) return false;
  if (record.controlCommit) {
    const commit = validateControlCommit(record.controlCommit, options);
    if (!commit.ok) return false;
  }
  return true;
}

/**
 * Canonical learning check over the store records.
 */
export function analyzeLearning(records, options = {}) {
  const list = Array.isArray(records) ? records : [];
  const recurrenceCandidates = [];
  const hypothesisNeeded = [];
  const validationDue = [];
  const effectDue = [];
  const provenReady = [];
  const promotionReady = [];
  const demotionReview = [];
  const learningDebt = [];
  const urgent = [];
  const meta = {
    repeatedPatterns: [],
    effectVerificationDue: [],
    supportedControls: [],
    unsupportedControls: [],
    openLearningDebt: [],
    counterEvidence: [],
    falseBlockSignals: [],
    repeatedReviewerFindings: [],
  };

  for (const record of list) {
    const effect = evaluateEffect(record);
    const occ = distinctOccurrences(record);

    if (isRecurrenceCandidate(record)) {
      recurrenceCandidates.push(entry(record, {
        distinctOccurrences: occ.count,
        occurrenceIds: occ.ids,
        evidenceStrengthCandidate: 'REPEATED',
        action: 'RECURRENCE_CANDIDATE',
      }));
      meta.repeatedPatterns.push(record.patternKey);
    }

    if (record.status === 'OBSERVED'
      && CLASS_WIDE.has(record.generalizability)
      && typeof record.proposedImprovement === 'string'
      && record.proposedImprovement.trim().length > 0) {
      hypothesisNeeded.push(entry(record, { action: 'HYPOTHESIS_NEEDED' }));
    }

    if (record.status === 'HYPOTHESIS' && CLASS_WIDE.has(record.generalizability)) {
      validationDue.push(entry(record, { action: 'VALIDATION_NEEDED' }));
    }

    if (record.status === 'VALIDATING') {
      if (!record.effectPlan || effect.effectState === 'UNPLANNED' || effect.effectState === 'PLANNED') {
        effectDue.push(entry(record, { action: 'VERIFY_EFFECT_DUE', effectReason: effect.reason }));
        meta.effectVerificationDue.push(record.id);
      } else if (effect.effectState === 'OBSERVING' || effect.effectState === 'INCONCLUSIVE') {
        effectDue.push(entry(record, { action: 'VERIFY_EFFECT_DUE', effectReason: effect.reason }));
        meta.effectVerificationDue.push(record.id);
      }
      if (effect.supported && effect.effectState === 'SUPPORTED') {
        provenReady.push(entry(record, { action: 'PROVEN_READY' }));
      }
      if (effect.effectState === 'NOT_SUPPORTED') {
        demotionReview.push(entry(record, { action: 'REVISE_CANDIDATE', effectReason: effect.reason }));
      }
    }

    if (record.status === 'PROVEN'
      && effect.supported
      && record.validatedLocally === true
      && record.promotionTarget
      && hasDurableControl(record, options)) {
      if (!(EXTERNAL_SOURCES.has(record.source) && record.locallyVerified !== true)) {
        if (!CLASS_WIDE.has(record.generalizability)
          || PROMOTABLE_STRENGTH.has(record.evidenceStrength)) {
          promotionReady.push(entry(record, {
            action: 'PROMOTION_READY',
            controlRef: record.controlRef,
          }));
        }
      }
    }

    if (record.status === 'PROMOTED') {
      const post = (record.effectObservations || []).filter((obs) => [
        'DOWNSTREAM_ESCAPE', 'CONTROL_MISSED', 'REPLAY_MISSED', 'FALSE_BLOCK',
      ].includes(obs.type));
      if (post.length > 0 || effect.effectState === 'NOT_SUPPORTED') {
        demotionReview.push(entry(record, {
          action: 'DEMOTION_REVIEW',
          counterCount: post.length,
          effectReason: effect.reason,
        }));
        meta.counterEvidence.push(record.id);
      }
    }

    if (['HYPOTHESIS', 'VALIDATING', 'PROVEN'].includes(record.status)
      && CLASS_WIDE.has(record.generalizability)
      && typeof record.proposedImprovement === 'string'
      && record.proposedImprovement.trim().length > 0) {
      learningDebt.push(entry(record, {
        horizon: record.horizon || 'BACKLOG',
        proposedImprovement: record.proposedImprovement,
        action: 'LEARNING_DEBT',
      }));
      meta.openLearningDebt.push(record.id);
    }

    if (isUrgent(record)) {
      urgent.push(entry(record, { action: 'LEARNING_INTERRUPT' }));
    }

    if (effect.effectState === 'SUPPORTED') meta.supportedControls.push(record.id);
    if (effect.effectState === 'NOT_SUPPORTED') meta.unsupportedControls.push(record.id);
    if ((record.effectObservations || []).some((obs) => obs.type === 'FALSE_BLOCK')) {
      meta.falseBlockSignals.push(record.id);
    }
    if (record.source === 'coderabbit' && occ.trustworthy && occ.count >= 2) {
      meta.repeatedReviewerFindings.push(record.patternKey);
    }
  }

  const material = recurrenceCandidates.length > 0
    || hypothesisNeeded.length > 0
    || validationDue.length > 0
    || effectDue.length > 0
    || provenReady.length > 0
    || promotionReady.length > 0
    || demotionReview.length > 0
    || urgent.length > 0
    || learningDebt.length > 0;

  return {
    material,
    recurrenceCandidates,
    hypothesisNeeded,
    validationDue,
    effectDue,
    provenReady,
    promotionReady,
    demotionReview,
    learningDebt,
    urgent,
    urgentLearningInterrupt: urgent.length > 0,
    meta,
  };
}

export function learningInterruptFromCheck(check) {
  if (!check?.urgentLearningInterrupt || !Array.isArray(check.urgent) || check.urgent.length === 0) {
    return null;
  }
  return {
    type: 'LEARNING_INTERRUPT',
    records: check.urgent.map((item) => item.id),
    patterns: check.urgent.map((item) => item.patternKey),
    reason: 'urgent_systemic_or_critical_learning',
  };
}

export { CR_OCCURRENCE, CI_RUN };
