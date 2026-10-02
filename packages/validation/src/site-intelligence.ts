import { assertOpaqueProjectId } from '../../domain/src/project.ts';
import type { NormalizedSiteObservation } from '../../domain/src/product-boundaries.ts';

export type FieldError = { field: string; reason: string };

export type SiteIntelligenceCreateRequest = {
  projectId: string;
  observations: NormalizedSiteObservation[];
};

const FORBIDDEN = new Set([
  'twinDatabase',
  'liveThirdPartyInCriticalUx',
  'thirdPartyCredentials',
  'geoportal',
  'credentials',
  'aiAuthored',
  'inventedSiteFacts',
  'aheadOfRules',
  'aiConclusion',
  'clientSubject',
  'constraints',
  'opportunities',
  'sourceStage',
  'crawl',
  'productionCrawl',
]);

const ALLOWED_KINDS = new Set([
  'slope',
  'topography',
  'soil',
  'sun',
  'aspect',
  'surroundings',
  'climate',
]);

function validateObservation(
  value: unknown,
  index: number,
): { ok: true; value: NormalizedSiteObservation } | { ok: false; errors: FieldError[] } {
  const prefix = `observations[${index}]`;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: prefix, reason: 'OBJECT_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (!['observationId', 'kind', 'normalized', 'source', 'synthetic'].includes(key)) {
      return { ok: false, errors: [{ field: `${prefix}.${key}`, reason: 'UNKNOWN_FIELD' }] };
    }
  }
  if (typeof body.observationId !== 'string' || body.observationId.length < 8) {
    return { ok: false, errors: [{ field: `${prefix}.observationId`, reason: 'OBSERVATION_ID_INVALID' }] };
  }
  if (typeof body.kind !== 'string' || !ALLOWED_KINDS.has(body.kind.trim().toLowerCase())) {
    return { ok: false, errors: [{ field: `${prefix}.kind`, reason: 'OBSERVATION_KIND_INVALID' }] };
  }
  if (body.normalized !== true) {
    return { ok: false, errors: [{ field: `${prefix}.normalized`, reason: 'NORMALIZED_REQUIRED' }] };
  }
  if (body.source !== 'normalized') {
    return { ok: false, errors: [{ field: `${prefix}.source`, reason: 'SOURCE_NORMALIZED_REQUIRED' }] };
  }
  if (body.synthetic !== true) {
    return { ok: false, errors: [{ field: `${prefix}.synthetic`, reason: 'SYNTHETIC_REQUIRED' }] };
  }
  return {
    ok: true,
    value: {
      observationId: body.observationId,
      kind: body.kind.trim().toLowerCase(),
      normalized: true,
      source: 'normalized',
      synthetic: true,
    },
  };
}

export function validateSiteIntelligenceCreateRequest(
  value: unknown,
): { ok: true; value: SiteIntelligenceCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN.has(key)) {
      return { ok: false, errors: [{ field: key, reason: 'SITEINTEL_SURFACE_FORBIDDEN' }] };
    }
  }
  const extra = Object.keys(body).filter(key => key !== 'projectId' && key !== 'observations');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.projectId !== 'string') {
    return { ok: false, errors: [{ field: 'projectId', reason: 'STRING_REQUIRED' }] };
  }
  let projectId: string;
  try {
    projectId = assertOpaqueProjectId(body.projectId);
  } catch {
    return { ok: false, errors: [{ field: 'projectId', reason: 'PROJECT_ID_INVALID' }] };
  }
  if (!Array.isArray(body.observations) || body.observations.length === 0) {
    return { ok: false, errors: [{ field: 'observations', reason: 'OBSERVATIONS_REQUIRED' }] };
  }
  if (body.observations.length > 32) {
    return { ok: false, errors: [{ field: 'observations', reason: 'OBSERVATIONS_TOO_MANY' }] };
  }
  const observations: NormalizedSiteObservation[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < body.observations.length; i += 1) {
    const parsed = validateObservation(body.observations[i], i);
    if (!parsed.ok) return parsed;
    if (seen.has(parsed.value.observationId)) {
      return { ok: false, errors: [{ field: `observations[${i}].observationId`, reason: 'OBSERVATION_ID_DUPLICATE' }] };
    }
    seen.add(parsed.value.observationId);
    observations.push(parsed.value);
  }
  return { ok: true, value: { projectId, observations } };
}
