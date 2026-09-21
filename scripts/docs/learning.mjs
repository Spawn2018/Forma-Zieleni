import { validateRecord } from '../fz-cis/policy.mjs';

export const DOC_SIGNALS = [
  'DOC_STALE',
  'DOC_INCORRECT',
  'DOC_MISSING',
  'DOC_HARD_TO_FIND',
  'DOC_AMBIGUOUS',
  'DOC_DUPLICATE_TRUTH',
  'DOC_INCIDENT_FAILURE',
  'DOC_AGENT_CONTEXT_GAP',
  'DOC_USER_CONFUSION',
  'DOC_RUNBOOK_FAILURE',
];

export function documentationSignal(code, observation) {
  if (!DOC_SIGNALS.includes(code)) throw new Error('DOC_SIGNAL_UNKNOWN');
  if (typeof observation !== 'string' || observation.length < 8) throw new Error('DOC_OBSERVATION');
  const patternKey = code.toLowerCase().replaceAll('_', '-');
  const record = {
    patternKey,
    source: 'review',
    scope: 'documentation',
    signalType: 'review-finding',
    severity: 'medium',
    observation,
    evidence: [code],
    generalizability: 'LOCAL',
    privacyClassification: 'INTERNAL',
    status: 'OBSERVED',
  };
  const checked = validateRecord(record, 'create');
  if (!checked.ok) throw new Error(`DOC_SIGNAL_INVALID:${checked.errors.join(',')}`);
  return record;
}

export function assertSignalCannotPromote(record) {
  if (record.status === 'PROMOTED' || record.canonWrite === true) throw new Error('DOC_SIGNAL_AUTHORITY');
}
