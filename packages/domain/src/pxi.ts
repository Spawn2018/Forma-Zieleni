/**
 * Versioned product-experience signal contract (PXI).
 * Production telemetry stays off. Signals never carry form PII or a score.
 */

export const EXPERIENCE_SIGNAL_CONTRACT_VERSION = 1 as const;

export const EXPERIENCE_SIGNAL_EVENTS = [
  'form_view',
  'form_start',
  'field_error',
  'validation_retry',
  'abandon',
  'submit_success',
] as const;

export type ExperienceSignalEvent = (typeof EXPERIENCE_SIGNAL_EVENTS)[number];

export const EXPERIENCE_SIGNAL_PII_KEYS = [
  'name',
  'email',
  'phone',
  'address',
  'message',
  'fieldValue',
] as const;

export type ExperienceSignalPiiKey = (typeof EXPERIENCE_SIGNAL_PII_KEYS)[number];

export type ExperienceSignalContract = {
  version: typeof EXPERIENCE_SIGNAL_CONTRACT_VERSION;
  requirementId: 'FZ-REQ-PXI-001';
  replay: 'OFF';
  productionTelemetry: false;
  universalExperienceScore: false;
  events: typeof EXPERIENCE_SIGNAL_EVENTS;
  rejectedPiiKeys: typeof EXPERIENCE_SIGNAL_PII_KEYS;
};

export type ExperienceSignal = {
  version: typeof EXPERIENCE_SIGNAL_CONTRACT_VERSION;
  name: ExperienceSignalEvent;
  conclusion: false;
  score: null;
};

const ALLOWED_EVENTS = new Set<string>(EXPERIENCE_SIGNAL_EVENTS);
const FORBIDDEN_PII = new Set<string>(EXPERIENCE_SIGNAL_PII_KEYS);
const SCORE_KEYS = new Set([
  'score',
  'experienceScore',
  'universalScore',
  'universalExperienceScore',
  'pxiScore',
]);

export function experienceSignalContract(): ExperienceSignalContract {
  return {
    version: EXPERIENCE_SIGNAL_CONTRACT_VERSION,
    requirementId: 'FZ-REQ-PXI-001',
    replay: 'OFF',
    productionTelemetry: false,
    universalExperienceScore: false,
    events: EXPERIENCE_SIGNAL_EVENTS,
    rejectedPiiKeys: EXPERIENCE_SIGNAL_PII_KEYS,
  };
}

export function sessionReplayStatus(): 'OFF' {
  return 'OFF';
}

export function enableSessionReplay(): never {
  throw new Error('SESSION_REPLAY_OFF');
}

export function assertNoUniversalExperienceScore(claim: {
  universalScore?: boolean;
  experienceScore?: number;
  score?: number;
  universalExperienceScore?: boolean;
}): void {
  if (claim.universalScore === true || claim.universalExperienceScore === true) {
    throw new Error('UNIVERSAL_EXPERIENCE_SCORE_FORBIDDEN');
  }
  if (typeof claim.experienceScore === 'number' || typeof claim.score === 'number') {
    throw new Error('UNIVERSAL_EXPERIENCE_SCORE_FORBIDDEN');
  }
}

export function recordExperienceSignal(event: Record<string, unknown>): ExperienceSignal {
  if (event.sessionReplay === true) throw new Error('SESSION_REPLAY_OFF');
  if ('replayPayload' in event && event.replayPayload != null) {
    throw new Error('SESSION_REPLAY_OFF');
  }

  for (const key of Object.keys(event)) {
    if (FORBIDDEN_PII.has(key) && event[key] != null && event[key] !== '') {
      throw new Error('FORM_VALUE_REJECTED');
    }
    if (SCORE_KEYS.has(key) && event[key] != null && event[key] !== false) {
      throw new Error('UNIVERSAL_EXPERIENCE_SCORE_FORBIDDEN');
    }
  }

  if (typeof event.event !== 'string') throw new Error('EVENT_NAME_REQUIRED');
  if (!ALLOWED_EVENTS.has(event.event)) throw new Error('EVENT_NAME_REJECTED');

  return {
    version: EXPERIENCE_SIGNAL_CONTRACT_VERSION,
    name: event.event as ExperienceSignalEvent,
    conclusion: false,
    score: null,
  };
}
