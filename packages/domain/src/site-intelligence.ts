import { assertOpaqueProjectId, type Project } from './project.ts';
import {
  assertAiCannotInventSiteFacts,
  assertNoSiteIntelTwinDatabase,
  siteIntelligenceConstraintCodes,
  siteIntelligenceKindForCode,
  siteIntelligenceOpportunityCodes,
  type SiteIntelligenceCodedFinding,
  type SiteIntelligenceRulesResult,
} from './product-boundaries.ts';

/**
 * Site Intelligence domain records (FZ-REQ-SITEINTEL-003).
 * Constraints and opportunities come only from RULES output over
 * normalized observations. AI cannot write these records. No HTTP site
 * API, twin database, or third-party credentials.
 */

export type SiteConstraintRecord = {
  id: string;
  projectId: string;
  /** Copied from the project owner for BOLA. Null = staff-only. */
  clientSubject: string | null;
  code: string;
  observationIds: readonly string[];
  sourceStage: 'RULES';
  createdAt: string;
};

export type SiteOpportunityRecord = {
  id: string;
  projectId: string;
  clientSubject: string | null;
  code: string;
  observationIds: readonly string[];
  sourceStage: 'RULES';
  createdAt: string;
};

export type SiteIntelligenceDomainBoundary = {
  requirementId: 'FZ-REQ-SITEINTEL-003';
  stage: 'DOMAIN';
  producedFrom: 'rules-output';
  aiWriteForbidden: true;
  httpSiteApi: false;
  twinDatabase: false;
  thirdPartyCredentials: false;
};

export type SiteIntelligenceDomainBundle = {
  projectId: string;
  clientSubject: string | null;
  observationIds: readonly string[];
  constraints: readonly SiteConstraintRecord[];
  opportunities: readonly SiteOpportunityRecord[];
  sourceStage: 'RULES';
  createdAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const CODE = /^[a-z][a-z0-9-]{2,63}$/;

export function siteIntelligenceDomainBoundary(): SiteIntelligenceDomainBoundary {
  return {
    requirementId: 'FZ-REQ-SITEINTEL-003',
    stage: 'DOMAIN',
    producedFrom: 'rules-output',
    aiWriteForbidden: true,
    httpSiteApi: false,
    twinDatabase: false,
    thirdPartyCredentials: false,
  };
}

export function assertOpaqueSiteConstraintId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:constraint|scn|id)\d+$/i.test(id)) {
    throw new Error('SITEINTEL_CONSTRAINT_ID_GUESSABLE');
  }
  return id;
}

export function assertOpaqueSiteOpportunityId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:opportunity|sop|id)\d+$/i.test(id)) {
    throw new Error('SITEINTEL_OPPORTUNITY_ID_GUESSABLE');
  }
  return id;
}

function assertCode(code: string): string {
  const trimmed = code.trim();
  if (!CODE.test(trimmed)) throw new Error('SITEINTEL_CODE_INVALID');
  return trimmed;
}

export function assertSiteIntelligenceAiCannotWrite(claim: {
  aiAuthored?: boolean;
  inventedSiteFacts?: boolean;
  aheadOfRules?: boolean;
}): void {
  if (claim.aiAuthored) throw new Error('SITEINTEL_AI_WRITE_FORBIDDEN');
  assertAiCannotInventSiteFacts(claim);
}

export function recordSiteIntelligenceFromRules(
  project: Project,
  rules: SiteIntelligenceRulesResult,
  ids: {
    constraintIds: readonly string[];
    opportunityIds: readonly string[];
  },
  at: string,
  proposal: {
    aiAuthored?: boolean;
    inventedSiteFacts?: boolean;
    aheadOfRules?: boolean;
    twinDatabase?: boolean;
    liveThirdPartyInCriticalUx?: boolean;
    thirdPartyCredentials?: boolean;
    httpSiteApi?: boolean;
  } = {},
): SiteIntelligenceDomainBundle {
  if (proposal.thirdPartyCredentials) throw new Error('SITEINTEL_CREDENTIALS_FORBIDDEN');
  if (proposal.httpSiteApi) throw new Error('SITEINTEL_HTTP_FORBIDDEN');
  assertNoSiteIntelTwinDatabase(proposal);
  assertSiteIntelligenceAiCannotWrite(proposal);
  if (!rules || rules.stage !== 'RULES') throw new Error('SITEINTEL_RULES_REQUIRED');
  if (!Array.isArray(rules.observationIds) || rules.observationIds.length === 0) {
    throw new Error('SITEINTEL_OBSERVATIONS_REQUIRED');
  }
  for (const observationId of rules.observationIds) {
    if (typeof observationId !== 'string' || observationId.length < 8) {
      throw new Error('SITEINTEL_OBSERVATION_ID_INVALID');
    }
  }
  if (Array.isArray(rules.inventedFacts) && rules.inventedFacts.length > 0) {
    throw new Error('SITEINTEL_AI_INVENT_FORBIDDEN');
  }
  if (!Array.isArray(rules.constraints) || !Array.isArray(rules.opportunities)) {
    throw new Error('SITEINTEL_RULES_MALFORMED');
  }
  if (rules.constraints.length + rules.opportunities.length === 0) {
    throw new Error('SITEINTEL_FINDINGS_REQUIRED');
  }
  if (!rules.observationKinds || typeof rules.observationKinds !== 'object') {
    throw new Error('SITEINTEL_OBSERVATION_KINDS_REQUIRED');
  }
  for (const observationId of rules.observationIds) {
    const kind = rules.observationKinds[observationId];
    if (typeof kind !== 'string' || kind.trim().length === 0) {
      throw new Error('SITEINTEL_OBSERVATION_KIND_MISSING');
    }
  }
  const constraintCodes = siteIntelligenceConstraintCodes();
  const opportunityCodes = siteIntelligenceOpportunityCodes();
  const assertFinding = (
    finding: SiteIntelligenceCodedFinding | undefined,
    allowed: ReadonlySet<string>,
  ): void => {
    if (!finding || typeof finding.code !== 'string' || !allowed.has(finding.code)) {
      throw new Error('SITEINTEL_CODE_NOT_FROM_OBSERVATIONS');
    }
    if (typeof finding.kind !== 'string' || finding.kind.trim().length === 0) {
      throw new Error('SITEINTEL_FINDING_KIND_REQUIRED');
    }
    const expectedKind = siteIntelligenceKindForCode(finding.code);
    const findingKind = finding.kind.trim().toLowerCase();
    if (!expectedKind || expectedKind !== findingKind) {
      throw new Error('SITEINTEL_FINDING_KIND_MISMATCH');
    }
    if (!Array.isArray(finding.observationIds) || finding.observationIds.length === 0) {
      throw new Error('SITEINTEL_FINDING_OBSERVATION_REQUIRED');
    }
    for (const observationId of finding.observationIds) {
      if (typeof observationId !== 'string' || observationId.length < 8) {
        throw new Error('SITEINTEL_OBSERVATION_ID_INVALID');
      }
      if (!rules.observationIds.includes(observationId)) {
        throw new Error('SITEINTEL_FINDING_OBSERVATION_UNBOUND');
      }
      const observationKind = rules.observationKinds[observationId];
      if (observationKind !== findingKind) {
        throw new Error('SITEINTEL_FINDING_OBSERVATION_KIND_MISMATCH');
      }
    }
  };
  for (const finding of rules.constraints) assertFinding(finding, constraintCodes);
  for (const finding of rules.opportunities) assertFinding(finding, opportunityCodes);
  if (ids.constraintIds.length !== rules.constraints.length) {
    throw new Error('SITEINTEL_CONSTRAINT_ID_MISMATCH');
  }
  if (ids.opportunityIds.length !== rules.opportunities.length) {
    throw new Error('SITEINTEL_OPPORTUNITY_ID_MISMATCH');
  }

  const projectId = assertOpaqueProjectId(project.id);
  const clientSubject = project.clientSubject;
  const observationIds = [...rules.observationIds];
  const constraints: SiteConstraintRecord[] = [];
  const opportunities: SiteOpportunityRecord[] = [];

  for (let i = 0; i < rules.constraints.length; i += 1) {
    const finding = rules.constraints[i];
    const constraintId = ids.constraintIds[i];
    if (!finding || typeof constraintId !== 'string') {
      throw new Error('SITEINTEL_CONSTRAINT_ID_MISMATCH');
    }
    constraints.push({
      id: assertOpaqueSiteConstraintId(constraintId),
      projectId,
      clientSubject,
      code: assertCode(finding.code),
      observationIds: [...finding.observationIds],
      sourceStage: 'RULES',
      createdAt: at,
    });
  }
  for (let i = 0; i < rules.opportunities.length; i += 1) {
    const finding = rules.opportunities[i];
    const opportunityId = ids.opportunityIds[i];
    if (!finding || typeof opportunityId !== 'string') {
      throw new Error('SITEINTEL_OPPORTUNITY_ID_MISMATCH');
    }
    opportunities.push({
      id: assertOpaqueSiteOpportunityId(opportunityId),
      projectId,
      clientSubject,
      code: assertCode(finding.code),
      observationIds: [...finding.observationIds],
      sourceStage: 'RULES',
      createdAt: at,
    });
  }

  return {
    projectId,
    clientSubject,
    observationIds,
    constraints,
    opportunities,
    sourceStage: 'RULES',
    createdAt: at,
  };
}

/** Fields a portal client may see. No twin, credentials, or AI conclusions. */
export type PortalSiteIntelligenceProjection = {
  projectId: string;
  observationIds: readonly string[];
  constraints: readonly { id: string; code: string }[];
  opportunities: readonly { id: string; code: string }[];
  createdAt: string;
};

export function projectSiteIntelligenceForPortal(
  bundle: SiteIntelligenceDomainBundle,
  readerSubject: string,
): PortalSiteIntelligenceProjection | null {
  if (!bundle.clientSubject || bundle.clientSubject !== readerSubject) return null;
  return {
    projectId: bundle.projectId,
    observationIds: [...bundle.observationIds],
    constraints: bundle.constraints.map((item) => ({ id: item.id, code: item.code })),
    opportunities: bundle.opportunities.map((item) => ({ id: item.id, code: item.code })),
    createdAt: bundle.createdAt,
  };
}
