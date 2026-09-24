import test from 'node:test';
import assert from 'node:assert/strict';
import { createLead, qualifyLead } from './src/lead.ts';
import { createOpportunity } from './src/opportunity.ts';
import { createOffer } from './src/offer.ts';
import { createContract } from './src/contract.ts';
import { createProject } from './src/project.ts';
import {
  applySiteIntelligenceRules,
} from './src/product-boundaries.ts';
import {
  assertOpaqueSiteConstraintId,
  assertOpaqueSiteOpportunityId,
  assertSiteIntelligenceAiCannotWrite,
  projectSiteIntelligenceForPortal,
  recordSiteIntelligenceFromRules,
  siteIntelligenceDomainBoundary,
} from './src/site-intelligence.ts';

const at = '2026-09-24T15:00:00.000Z';
const capture = {
  name: 'Anna Kowalska',
  phone: '+48 600 000 000',
  email: 'anna@example.invalid',
  locality: 'Kraków',
  siteAnalysisRequested: true,
};

function ownedProject(clientSubject = 'portal-ola') {
  const lead = qualifyLead(createLead('ld8k2n4p6q8r0s2t', 'www', capture, at), false, '2026-09-24T15:05:00.000Z');
  const opportunity = createOpportunity('p9k2n4p6q8r0s2t4', lead, '2026-09-24T15:10:00.000Z');
  const offer = createOffer('f9k2n4p6q8r0s2t4', opportunity, '2026-09-24T15:15:00.000Z');
  const contract = createContract('c9k2n4p6q8r0s2t4', offer, '2026-09-24T15:20:00.000Z');
  return createProject('j9k2n4p6q8r0s2t4', contract, '2026-09-24T15:25:00.000Z', clientSubject);
}

test('Site Intelligence domain boundary forbids AI write, HTTP, twin, and credentials', () => {
  const boundary = siteIntelligenceDomainBoundary();
  assert.equal(boundary.requirementId, 'FZ-REQ-SITEINTEL-003');
  assert.equal(boundary.stage, 'DOMAIN');
  assert.equal(boundary.producedFrom, 'rules-output');
  assert.equal(boundary.aiWriteForbidden, true);
  assert.equal(boundary.httpSiteApi, false);
  assert.equal(boundary.twinDatabase, false);
  assert.equal(boundary.thirdPartyCredentials, false);
  assert.throws(() => assertSiteIntelligenceAiCannotWrite({ aiAuthored: true }), /SITEINTEL_AI_WRITE_FORBIDDEN/);
  assert.throws(
    () => assertSiteIntelligenceAiCannotWrite({ inventedSiteFacts: true }),
    /SITEINTEL_AI_INVENT_FORBIDDEN/,
  );
});

test('opaque site intelligence identifiers reject guessable values', () => {
  assert.equal(assertOpaqueSiteConstraintId('s9k2n4p6q8r0s2t4'), 's9k2n4p6q8r0s2t4');
  assert.equal(assertOpaqueSiteOpportunityId('o9k2n4p6q8r0s2t4'), 'o9k2n4p6q8r0s2t4');
  assert.throws(() => assertOpaqueSiteConstraintId('constraint1'), /SITEINTEL_CONSTRAINT_ID_GUESSABLE/);
  assert.throws(() => assertOpaqueSiteOpportunityId('opportunity1'), /SITEINTEL_OPPORTUNITY_ID_GUESSABLE/);
});

test('domain records constraints and opportunities only from RULES over normalized observations', () => {
  const project = ownedProject('portal-ola');
  const rules = applySiteIntelligenceRules([
    {
      observationId: 'obs-slope-01',
      kind: 'slope',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    },
    {
      observationId: 'obs-sun-0001',
      kind: 'sun',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    },
  ]);
  assert.deepEqual(rules.constraints, [{ code: 'slope-constraint', observationIds: ['obs-slope-01'], kind: 'slope' }]);
  assert.deepEqual(rules.opportunities, [{ code: 'sun-exposure', observationIds: ['obs-sun-0001'], kind: 'sun' }]);
  const bundle = recordSiteIntelligenceFromRules(
    project,
    rules,
    {
      constraintIds: ['s9k2n4p6q8r0s2t4'],
      opportunityIds: ['o9k2n4p6q8r0s2t4'],
    },
    '2026-09-24T15:30:00.000Z',
  );
  assert.equal(bundle.sourceStage, 'RULES');
  assert.equal(bundle.projectId, project.id);
  assert.equal(bundle.clientSubject, 'portal-ola');
  assert.deepEqual(bundle.observationIds, ['obs-slope-01', 'obs-sun-0001']);
  assert.equal(bundle.constraints.length, 1);
  assert.equal(bundle.constraints[0].code, 'slope-constraint');
  assert.deepEqual(bundle.constraints[0].observationIds, ['obs-slope-01']);
  assert.equal(bundle.constraints[0].sourceStage, 'RULES');
  assert.equal(bundle.constraints[0].clientSubject, 'portal-ola');
  assert.equal(bundle.opportunities[0].code, 'sun-exposure');
  assert.deepEqual(bundle.opportunities[0].observationIds, ['obs-sun-0001']);
  assert.equal(Object.hasOwn(bundle, 'twinDatabase'), false);
  assert.equal(Object.hasOwn(bundle.constraints[0], 'aiConclusion'), false);
  const mine = projectSiteIntelligenceForPortal(bundle, 'portal-ola');
  assert.ok(mine);
  assert.equal(mine.projectId, project.id);
  assert.equal(mine.constraints[0].code, 'slope-constraint');
  assert.equal(Object.hasOwn(mine, 'clientSubject'), false);
  assert.equal(projectSiteIntelligenceForPortal(bundle, 'portal-other'), null);
});

test('AI, twin, credentials, HTTP, and unbound codes cannot write site domain records', () => {
  const project = ownedProject();
  const rules = applySiteIntelligenceRules([
    {
      observationId: 'obs-slope-01',
      kind: 'slope',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    },
  ]);
  const ids = { constraintIds: ['s9k2n4p6q8r0s2t4'], opportunityIds: [] };
  assert.throws(
    () => recordSiteIntelligenceFromRules(project, rules, ids, at, { aiAuthored: true }),
    /SITEINTEL_AI_WRITE_FORBIDDEN/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(project, rules, ids, at, { inventedSiteFacts: true }),
    /SITEINTEL_AI_INVENT_FORBIDDEN/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(project, rules, ids, at, { twinDatabase: true }),
    /SITEINTEL_TWIN_FORBIDDEN/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(project, rules, ids, at, { thirdPartyCredentials: true }),
    /SITEINTEL_CREDENTIALS_FORBIDDEN/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(project, rules, ids, at, { httpSiteApi: true }),
    /SITEINTEL_HTTP_FORBIDDEN/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      { ...rules, stage: 'AI' },
      ids,
      at,
    ),
    /SITEINTEL_RULES_REQUIRED/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      { ...rules, constraints: [], opportunities: [] },
      { constraintIds: [], opportunityIds: [] },
      at,
    ),
    /SITEINTEL_FINDINGS_REQUIRED/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      { ...rules, constraints: [{ code: 'invented-code', observationIds: ['obs-slope-01'], kind: 'slope' }] },
      ids,
      at,
    ),
    /SITEINTEL_CODE_NOT_FROM_OBSERVATIONS/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      { ...rules, constraints: [{ code: 'slope-constraint', observationIds: ['obs-other-01'], kind: 'slope' }] },
      ids,
      at,
    ),
    /SITEINTEL_FINDING_OBSERVATION_UNBOUND/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      { ...rules, constraints: [{ code: 'slope-constraint', observationIds: ['obs-slope-01'], kind: 'soil' }] },
      ids,
      at,
    ),
    /SITEINTEL_FINDING_KIND_MISMATCH/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      {
        ...rules,
        constraints: [{ code: 'sun-exposure', observationIds: ['obs-slope-01'], kind: 'sun' }],
      },
      ids,
      at,
    ),
    /SITEINTEL_CODE_NOT_FROM_OBSERVATIONS/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      {
        ...rules,
        observationIds: [...rules.observationIds, 'obs-sun-0001'],
        observationKinds: { ...rules.observationKinds, 'obs-sun-0001': 'sun' },
        constraints: [{
          code: 'slope-constraint',
          observationIds: ['obs-sun-0001'],
          kind: 'slope',
        }],
        opportunities: [],
      },
      ids,
      at,
    ),
    /SITEINTEL_FINDING_OBSERVATION_KIND_MISMATCH/,
  );
});

test('constraint and opportunity id lists must match RULES codes', () => {
  const project = ownedProject();
  const rules = applySiteIntelligenceRules([
    {
      observationId: 'obs-slope-01',
      kind: 'slope',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    },
    {
      observationId: 'obs-sun-0001',
      kind: 'sun',
      normalized: true,
      source: 'normalized',
      synthetic: true,
    },
  ]);
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      rules,
      { constraintIds: [], opportunityIds: ['o9k2n4p6q8r0s2t4'] },
      at,
    ),
    /SITEINTEL_CONSTRAINT_ID_MISMATCH/,
  );
  assert.throws(
    () => recordSiteIntelligenceFromRules(
      project,
      rules,
      { constraintIds: ['s9k2n4p6q8r0s2t4'], opportunityIds: [] },
      at,
    ),
    /SITEINTEL_OPPORTUNITY_ID_MISMATCH/,
  );
});
