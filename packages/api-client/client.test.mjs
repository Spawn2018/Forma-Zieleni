import test from 'node:test';
import assert from 'node:assert/strict';
import { contentPaths, generatedSurfaces, leadPaths, opportunityPaths } from './src/index.ts';

test('typed client paths stay on /v1 and cover every current lead operation', () => {
  assert.equal(leadPaths.health, '/v1/health');
  assert.equal(leadPaths.ready, '/v1/ready');
  assert.equal(leadPaths.leads, '/v1/leads');
  assert.equal(leadPaths.lead('ld8k2n4p6q8r0s2t'), '/v1/leads/ld8k2n4p6q8r0s2t');
  assert.equal(leadPaths.qualify('ld8k2n4p6q8r0s2t'), '/v1/leads/ld8k2n4p6q8r0s2t/qualify');
  assert.equal(opportunityPaths.opportunities, '/v1/opportunities');
  assert.equal(opportunityPaths.opportunity('p9k2n4p6q8r0s2t4'), '/v1/opportunities/p9k2n4p6q8r0s2t4');
  assert.equal(contentPaths.document('pg8k2n4p6q8r0s2t'), '/v1/content/pg8k2n4p6q8r0s2t');
  assert.deepEqual([...generatedSurfaces], ['web', 'portal', 'admin', 'mobile']);
});
