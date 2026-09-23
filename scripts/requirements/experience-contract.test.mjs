import assert from 'node:assert/strict';
import test from 'node:test';
import { loadProductScope } from './product-scope.mjs';
import {
  EXPERIENCE_CONTRACTS,
  checkExperienceContracts,
  contractErrors,
  integrationDisplayedEarly,
  propagateIntegrationFailure,
} from './experience-contract.mjs';

function clone() {
  return structuredClone(EXPERIENCE_CONTRACTS);
}

test('binding capabilities have a purpose, workflow, and learning path', () => {
  const checked = checkExperienceContracts();
  assert.equal(checked.ok, true, checked.errors.join('; '));
  assert.equal(checked.summary.orphanScreens, 0);
  assert.equal(checked.summary.actionsWithoutEffect, 0);
  assert.equal(checked.summary.missingEdges, 0);
  assert.equal(checked.summary.unjustifiedDeviations, 0);
  assert.equal(checked.summary.decorative, 0);
  assert.equal(checked.summary.browserEvidence, 'WAITING_FOR_RUNTIME');
  for (const capability of loadProductScope()) {
    assert.equal(EXPERIENCE_CONTRACTS.some((item) => item.id === capability.id), true, capability.id);
  }
});

test('a section without a business purpose fails', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'WWW').businessPurpose = '';
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'WWW:MISSING_BUSINESS_PURPOSE'), true);
});

test('a workflow that requires a surface and has none fails', () => {
  const catalog = clone();
  for (const item of catalog) {
    if (item.workflowId === 'growth-plan') item.screenId = null;
  }
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error.includes('ORPHAN_WORKFLOW:growth-plan')), true);
});

test('a UI action without a domain effect fails', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'OFFER').actions[0].domainEffect = '';
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'OFFER:ACTION_WITHOUT_DOMAIN_EFFECT'), true);
});

test('a domain effect without user feedback fails', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'OFFER').actions[0].feedback = '';
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'OFFER:EFFECT_WITHOUT_FEEDBACK'), true);
});

test('a journey edge without a downstream path fails', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'OFFER').downstream = catalog
    .find((item) => item.id === 'OFFER')
    .downstream
    .filter((item) => item.capability !== 'CONTRACT');
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.includes('MISSING_EDGE:OFFER:CONTRACT'), true);
});

test('automation without failure and audit semantics fails', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'OFFER').automation = { trigger: 'offer.accepted', idempotent: true };
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'OFFER:AUTOMATION_WITHOUT_FAILURE_AUDIT'), true);
});

test('an integration request is not success before acknowledgement', () => {
  assert.equal(integrationDisplayedEarly({ acknowledged: false, displayed: 'completed' }).reason, 'SUCCESS_BEFORE_ACK');
  assert.equal(integrationDisplayedEarly({ acknowledged: false, displayed: 'pending' }).ok, true);
  const failed = propagateIntegrationFailure();
  assert.equal(failed.canonicalUnchanged, true);
  assert.equal(failed.downstreamClaimsSuccess, false);
  const catalog = clone();
  catalog.find((item) => item.id === 'PAYMENT').integration = { facing: true, successRequiresAck: false, vendorOverwritesCanon: false };
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'PAYMENT:SUCCESS_BEFORE_ACK'), true);
});

test('a material mockup deviation without a record fails', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'PORTAL').materialDeviation = true;
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'PORTAL:UNJUSTIFIED_DEVIATION'), true);
});

test('visual acceptance and semantic acceptance both require a review record', () => {
  const catalog = clone();
  const portal = catalog.find((item) => item.id === 'PORTAL');
  portal.visualAcceptance = 'ACCEPTED';
  portal.semanticReview = 'ACCEPTED';
  portal.acceptanceState = 'VISUAL_ACCEPTED';
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'PORTAL:MISSING_VISUAL_REVIEW'), true);
  assert.equal(checked.errors.some((error) => error === 'PORTAL:MISSING_SEMANTIC_REVIEW'), true);
});

test('operational browser evidence without a screenshot fails', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'WWW').browserEvidence = 'OPERATIONAL';
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'WWW:FALSE_BROWSER_EVIDENCE'), true);
});

test('a backend-only capability does not require a visual screen', () => {
  const hosting = EXPERIENCE_CONTRACTS.find((item) => item.id === 'HOSTING');
  assert.equal(hosting.backendOnly, true);
  assert.equal(contractErrors(hosting).includes('BACKEND_VISUAL_BLOCKER'), false);
  assert.equal(hosting.screenId, null);
});

test('a new capability without a contract fails', () => {
  const scope = [...loadProductScope(), { id: 'FUTURE-UI', normative: true, requirementIds: [] }];
  const checked = checkExperienceContracts({ productScope: scope });
  assert.equal(checked.errors.includes('MISSING_CONTRACT:FUTURE-UI'), true);
});

test('a user-facing capability must keep its FZ-CIS learning path', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'PORTAL').learningCapability = 'NOT-A-LOOP';
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'PORTAL:MISSING_LEARNING_PATH'), true);
});

test('an unlinked screen is an orphan', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'FILES').workflowId = 'invented-flow';
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error.startsWith('ORPHAN_SCREEN:')), true);
});

test('a lowercase mobile surface still requires an offline state', () => {
  const catalog = clone();
  const mobile = catalog.find((item) => item.id === 'MOBILE');
  mobile.surface = 'mobile';
  mobile.states = mobile.states.filter((state) => state !== 'offline');
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'MOBILE:MOBILE_OFFLINE_MISSING'), true);
});

test('desktop coverage without a mobile workflow fails', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'PORTAL').responsive = ['desktop'];
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'PORTAL:MOBILE_WORKFLOW_MISSING'), true);
});

test('a later acceptance state implies visual review', () => {
  const catalog = clone();
  catalog.find((item) => item.id === 'WWW').acceptanceState = 'OPERATIONAL';
  const checked = checkExperienceContracts({ catalog });
  assert.equal(checked.errors.some((error) => error === 'WWW:MISSING_VISUAL_REVIEW'), true);
});
