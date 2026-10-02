import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSiteIntelligenceCreateRequest } from './src/site-intelligence.ts';

const observation = {
  observationId: 'obs-slope-01',
  kind: 'slope',
  normalized: true,
  source: 'normalized',
  synthetic: true,
};

test('validateSiteIntelligenceCreateRequest accepts synthetic normalized observations', () => {
  const ok = validateSiteIntelligenceCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    observations: [observation],
  });
  assert.equal(ok.ok, true);
  if (!ok.ok) return;
  assert.equal(ok.value.projectId, 'j9k2n4p6q8r0s2t4');
  assert.equal(ok.value.observations[0].kind, 'slope');
  assert.equal(ok.value.observations[0].synthetic, true);
});

test('validateSiteIntelligenceCreateRequest rejects invent, credentials, and non-synthetic', () => {
  for (const field of ['twinDatabase', 'thirdPartyCredentials', 'geoportal', 'aiAuthored', 'inventedSiteFacts', 'aiConclusion']) {
    const bad = validateSiteIntelligenceCreateRequest({
      projectId: 'j9k2n4p6q8r0s2t4',
      observations: [observation],
      [field]: true,
    });
    assert.equal(bad.ok, false);
  }
  const live = validateSiteIntelligenceCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    observations: [{ ...observation, synthetic: false }],
  });
  assert.equal(live.ok, false);
  const raw = validateSiteIntelligenceCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    observations: [{ ...observation, source: 'geoportal' }],
  });
  assert.equal(raw.ok, false);
  assert.equal(validateSiteIntelligenceCreateRequest({ projectId: 'prj1', observations: [observation] }).ok, false);
  assert.equal(validateSiteIntelligenceCreateRequest({ projectId: 'j9k2n4p6q8r0s2t4', observations: [] }).ok, false);
});
