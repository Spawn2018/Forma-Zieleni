import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldIngest } from '../fz-cis/ingest.mjs';
import { loadProductScope } from './product-scope.mjs';
import {
  BUSINESS_RULES,
  CRITICAL_JOURNEYS,
  E2E_FOUNDATION,
  QUALITY_CLASSES,
  checkQualityCoverage,
  clientAccessAllowed,
  completionAllowed,
  deadCodeFindings,
  evidenceSufficient,
  flakyDisposition,
  forbiddenImport,
  globalLearningAllowed,
  importSpecifiers,
  independentOccurrences,
  migrationReadiness,
  mutationSurvived,
  optimizationClaim,
  providerTestPlan,
  qualityLearningInput,
  restoreReadiness,
  securityFixDurable,
  selectQualityChecks,
  semanticDuplication,
  syntacticDuplicates,
  visualBaselineUpdate,
} from './quality-coverage.mjs';

test('every binding capability has a quality classification and no unknown cell', () => {
  const checked = checkQualityCoverage();
  assert.equal(checked.ok, true, checked.errors.join('; '));
  assert.equal(checked.summary.unknown, 0);
  assert.equal(checked.summary.binding, checked.summary.classified);
  assert.equal(checked.summary.secondStore, false);
  assert.equal(checked.summary.runtimeReadyMissingE2e, 0);
  assert.equal(checked.summary.productionExists, false);
  assert.equal(E2E_FOUNDATION.webRunner, 'playwright');
  assert.equal(E2E_FOUNDATION.runnerState, 'CONTRACTED_NOT_INSTALLED');
  assert.equal(E2E_FOUNDATION.levels.E2E_PRODUCTION_SAFE, 'WAITING_FOR_PRODUCTION');
  assert.ok(QUALITY_CLASSES.includes('E2E_CRITICAL'));
  assert.ok(loadProductScope().every((item) => checked.summary.binding >= 1));
});

test('a critical journey without an E2E class fails', () => {
  const journeys = CRITICAL_JOURNEYS.map((item) => ({ ...item }));
  journeys[0] = { ...journeys[0], runtimeReady: true, e2e: 'MISSING' };
  const checked = checkQualityCoverage({ journeys, imports: [], debug: [], edges: [] });
  assert.equal(checked.errors.includes('RUNTIME_JOURNEY_WITHOUT_E2E:www-lead'), true);
});

test('an API call cannot claim UI E2E', () => {
  const journeys = CRITICAL_JOURNEYS.map((item) => ({ ...item }));
  journeys[0] = { ...journeys[0], claimsUiE2e: true, transport: 'api' };
  const checked = checkQualityCoverage({ journeys, imports: [], debug: [], edges: [] });
  assert.equal(checked.errors.includes('API_CALL_IS_NOT_UI_E2E:www-lead'), true);
});

test('synthetic evidence cannot become production learning', () => {
  const rejected = qualityLearningInput({
    observation: 'A synthetic portal session failed closed.',
    evidence: ['fixture:synthetic-client-a'],
    provenanceEnvironment: 'SYNTHETIC',
    learningClaim: 'PRODUCTION',
  });
  assert.equal(rejected.ok, false);
  assert.equal(shouldIngest({ kind: 'pass', observation: 'all green', evidence: ['ci'] }).ok, false);
});

test('client A cannot access client B', () => {
  const decision = clientAccessAllowed({ clientId: 'A' }, { clientId: 'B' });
  assert.equal(decision.ok, false);
  assert.equal(decision.reason, 'BOLA');
});

test('exact repeated source is a syntactic duplicate', () => {
  const clones = syntacticDuplicates([
    { path: 'apps/admin/a.ts', text: 'export function sameRule(input) { return input.clientId === input.ownerId && input.state === "ready" && input.scope === "client" && input.source === "core-api"; }' },
    { path: 'apps/portal/a.ts', text: 'export function sameRule(input) { return input.clientId === input.ownerId && input.state === "ready" && input.scope === "client" && input.source === "core-api"; }' },
    { path: 'packages/domain/src/other.ts', text: 'export function different(input) { return input.kind; }' },
  ]);
  assert.equal(clones.length, 1);
  const spaced = syntacticDuplicates([
    { path: 'a.ts', text: 'export function label(input) { return input.name === "client portal" && input.owner === "core-api" && input.state === "ready"; }' },
    { path: 'b.ts', text: 'export function label(input) { return input.name === "clientportal" && input.owner === "core-api" && input.state === "ready"; }' },
  ]);
  assert.equal(spaced.length, 0);
  const checked = checkQualityCoverage({
    clones: [['apps/admin/a.ts', 'apps/portal/a.ts']],
    imports: [],
    debug: [],
    edges: [],
  });
  assert.equal(checked.errors.some((error) => error.startsWith('SYNTACTIC_DUPLICATION:')), true);
});

test('the same business rule with two owners is semantic duplication', () => {
  const rules = [...BUSINESS_RULES, { id: 'offer-lifecycle', owner: 'apps/admin' }];
  assert.deepEqual(semanticDuplication(rules), ['offer-lifecycle']);
  const checked = checkQualityCoverage({ rules, imports: [], debug: [], edges: [] });
  assert.equal(checked.errors.includes('SEMANTIC_DUPLICATION:offer-lifecycle'), true);
});

test('proven unused code is detected and a future contract is protected', () => {
  const dead = deadCodeFindings([
    { id: 'old-flag', referenced: false },
    { id: 'garden-contract', referenced: false, protection: 'future-binding' },
  ]);
  assert.deepEqual(dead.map((item) => item.id), ['old-flag']);
  const checked = checkQualityCoverage({
    dead: [{ id: 'old-flag', referenced: false }],
    imports: [],
    debug: [],
    edges: [],
  });
  assert.equal(checked.errors.includes('DEAD_CODE:old-flag'), true);
});

test('architecture import scan sees side-effect and dynamic specifiers', () => {
  const specs = importSpecifiers([
    "import '@forma-zieleni/domain';",
    "const loaded = import('@forma-zieleni/api');",
    "const sibling = require('@forma-zieleni/portal');",
    "import helper from '@forma-zieleni/validation';",
  ].join('\n'));
  assert.deepEqual(specs, [
    '@forma-zieleni/domain',
    '@forma-zieleni/api',
    '@forma-zieleni/portal',
    '@forma-zieleni/validation',
  ]);
});

test('a forbidden package cycle fails', () => {
  const checked = checkQualityCoverage({
    edges: [['@forma-zieleni/portal', '@forma-zieleni/domain'], ['@forma-zieleni/domain', '@forma-zieleni/portal']],
    imports: [],
    debug: [],
  });
  assert.equal(checked.errors.some((error) => error.startsWith('DEPENDENCY_CYCLE:')), true);
  assert.equal(forbiddenImport('apps/portal/app/home.ts', '@forma-zieleni/domain'), 'client-app-owns-domain');
  assert.equal(forbiddenImport('apps/api/src/app.ts', '@forma-zieleni/domain'), null);
});

test('a surviving critical mutant is a quality failure', () => {
  assert.equal(mutationSurvived({ coverageClaim: 'strong', mutantKilled: false }), true);
  assert.equal(mutationSurvived({ coverageClaim: 'strong', mutantKilled: true }), false);
});

test('repeated reruns of one failure are one occurrence', () => {
  const events = Array.from({ length: 10 }, () => ({ signature: 'ci:same-failure' }));
  assert.equal(independentOccurrences(events), 1);
});

test('a flaky test does not pass because a retry succeeded', () => {
  const result = flakyDisposition({ firstAttemptFailed: true, passed: true, retries: 2 });
  assert.equal(result.pass, false);
  assert.equal(result.instability, true);
});

test('an optimization claim without a baseline fails', () => {
  assert.equal(optimizationClaim({ improved: true }).ok, false);
  assert.equal(optimizationClaim({ improved: true, baseline: 'p95=40ms' }).ok, true);
});

test('a migration that only succeeds on a fresh database fails', () => {
  assert.equal(migrationReadiness({ applicable: true, freshOk: true, previousSchemaOk: false }).ok, false);
});

test('a missing remote acknowledgement cannot be shown as complete', () => {
  assert.equal(completionAllowed({ requestSent: true, remoteAck: false, uiComplete: true }), false);
});

test('backup configuration is not accepted restore readiness', () => {
  assert.equal(restoreReadiness({ config: true, restoreVerified: false }).accepted, false);
  assert.equal(restoreReadiness({ config: true, restoreVerified: false }).state, 'WAITING_FOR_ENVIRONMENT');
});

test('an automatic screenshot cannot replace a visual baseline', () => {
  assert.equal(visualBaselineUpdate({ automatic: true, reviewed: false }).ok, false);
  assert.equal(visualBaselineUpdate({ automatic: true, reviewed: true }).ok, true);
});

test('another model agreeing is not local verification', () => {
  assert.equal(evidenceSufficient({ aiAgreement: true, local: false }), false);
  assert.equal(evidenceSufficient({ aiAgreement: true, local: true }), true);
});

test('a customer-scoped correction cannot become global learning', () => {
  assert.equal(globalLearningAllowed({ scope: 'CUSTOMER', generalizability: 'GLOBAL' }), false);
});

test('an undecided provider keeps sandbox E2E gated and neutral tests executable', () => {
  const plan = providerTestPlan({ selected: false });
  assert.equal(plan.sandbox, 'OWNER_GATED');
  assert.equal(plan.neutralContract, 'EXECUTABLE');
});

test('an unknown future capability fails classification', () => {
  const checked = checkQualityCoverage({
    productScope: [...loadProductScope(), { id: 'FUTURE-SURFACE', requirementIds: [] }],
    imports: [],
    debug: [],
    edges: [],
  });
  assert.equal(checked.errors.includes('UNCLASSIFIED:FUTURE-SURFACE'), true);
});

test('a domain-only change does not drag in unrelated full E2E', () => {
  const checks = selectQualityChecks({ domainOnly: true, capability: 'GARDENOS' });
  assert.equal(checks.includes('e2e-critical'), false);
  const journey = selectQualityChecks({ uiJourney: true });
  assert.equal(journey.includes('e2e-critical'), true);
  assert.equal(journey.includes('a11y'), true);
});

test('a security fix that only deletes the failing test is not durable', () => {
  assert.equal(securityFixDurable({ removedFailingTest: true }), false);
  assert.equal(securityFixDurable({ removedFailingTest: true, regressionControl: 'authz test' }), true);
});

test('material quality failures can enter FZ-CIS and a pass cannot', () => {
  const prepared = qualityLearningInput({
    kind: 'test_failed',
    observation: 'Offer portal journey lost the client scope.',
    evidence: ['e2e:offer-portal'],
    patternKey: 'e2e-offer-portal-scope',
  });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.record.source, 'test');
  const noise = qualityLearningInput({ kind: 'pass', observation: 'quality gate passed', evidence: ['local'] });
  assert.equal(noise.ok, false);
});
