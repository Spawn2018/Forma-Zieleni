import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const spec = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contracts/openapi.json'), 'utf8'));

test('shared LeadRecord fields stay aligned with the OpenAPI Lead schema', () => {
  const lead = spec.components.schemas.Lead;
  assert.deepEqual(lead.required, [
    'id', 'source', 'status', 'contact', 'property', 'siteAnalysisRequested', 'qualification', 'createdAt', 'updatedAt',
  ]);
  assert.equal(lead.properties.status.$ref, '#/components/schemas/LeadStatus');
  assert.deepEqual(spec.components.schemas.LeadStatus.enum, [
    'received', 'site_analysis', 'qualified', 'consultation_ready', 'unqualified',
  ]);
  assert.equal(Object.hasOwn(lead.properties, 'budget_min_pln'), false);
});
