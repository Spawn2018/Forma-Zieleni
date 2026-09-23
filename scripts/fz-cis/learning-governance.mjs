/**
 * Shared FZ-CIS learning guards.
 * Scope, provenance, and effect evidence. Not a second learning store.
 */

export const LEARNING_SCOPES = Object.freeze([
  'GLOBAL',
  'CAPABILITY',
  'COMPONENT',
  'TENANT',
  'PROJECT',
  'CLIENT',
  'USER',
  'SESSION',
  'ENTITY',
  'CAMPAIGN',
  'CONTENT_ITEM',
  'PLANT',
  'SITE',
  'GARDEN',
]);

export const PROVENANCE_ENVIRONMENTS = Object.freeze([
  'PRODUCTION',
  'INTERNAL',
  'SYNTHETIC',
  'TEST',
  'FIXTURE',
]);

export const NON_PRODUCTION_ENVIRONMENTS = Object.freeze(['SYNTHETIC', 'TEST', 'FIXTURE']);

export const EVIDENCE_CLASSES = Object.freeze([
  'DETERMINISTIC',
  'HUMAN_VERIFIED',
  'EXPERIMENT',
  'RECURRENCE',
  'MEASUREMENT',
  'AI_OPINION',
  'AI_AGREEMENT',
]);

export const LEARNING_CLAIMS = Object.freeze(['ENGINEERING', 'PRODUCTION']);

export const HUMAN_ROLES = Object.freeze(['OWNER', 'STAFF', 'AGNIESZKA', 'CLIENT', 'EDITOR']);

export const HUMAN_ACTIONS = Object.freeze([
  'approve',
  'edit',
  'partial_approve',
  'reject',
  'defer',
  'correction',
]);

export const TENANT_BOUND_SCOPES = Object.freeze([
  'TENANT',
  'PROJECT',
  'CLIENT',
  'USER',
  'SESSION',
  'GARDEN',
  'SITE',
  'PLANT',
]);

const NARROW_SCOPES = new Set([
  'COMPONENT',
  'TENANT',
  'PROJECT',
  'CLIENT',
  'USER',
  'SESSION',
  'ENTITY',
  'CAMPAIGN',
  'CONTENT_ITEM',
  'PLANT',
  'SITE',
  'GARDEN',
]);

const AI_ONLY = new Set(['AI_OPINION', 'AI_AGREEMENT']);

export function evidenceSupportsEffect(observation) {
  if (!observation || typeof observation !== 'object') return false;
  if (AI_ONLY.has(observation.evidenceClass)) return false;
  return true;
}

export function assertScopePromotion(record, targetScope, extra = {}) {
  if (targetScope !== 'GLOBAL') return { ok: true };
  const from = record?.learningScope;
  if (!from || from === 'GLOBAL' || from === 'CAPABILITY') return { ok: true };
  if (!NARROW_SCOPES.has(from)) return { ok: true };
  if (NON_PRODUCTION_ENVIRONMENTS.includes(record.provenanceEnvironment)) {
    return { ok: false, code: 'SCOPE_PROMOTION_REFUSED' };
  }
  const ids = Array.isArray(extra.independentScopeIds)
    ? extra.independentScopeIds.filter((item) => typeof item === 'string' && item.length > 1 && item !== from && item !== record.tenantId)
    : [];
  if (new Set(ids).size < 2 || extra.humanApproval !== true || !HUMAN_ROLES.includes(extra.approvedByRole)) {
    return { ok: false, code: 'SCOPE_PROMOTION_REFUSED' };
  }
  return { ok: true };
}

export function assertNoCrossTenant(record, targetTenantId) {
  if (!record?.tenantId || !targetTenantId) return { ok: true };
  if (record.tenantId !== targetTenantId) return { ok: false, code: 'CROSS_TENANT_LEAK' };
  return { ok: true };
}

export function syntheticProductionRejected(input = {}) {
  const env = input.provenanceEnvironment;
  if (!NON_PRODUCTION_ENVIRONMENTS.includes(env)) return false;
  return input.learningClaim === 'PRODUCTION' || input.productionLearning === true;
}
