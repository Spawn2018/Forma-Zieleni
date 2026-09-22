import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const spec = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contracts/openapi.json'), 'utf8'));

test('shared OpportunityRecord fields stay aligned with the OpenAPI Opportunity schema', () => {
  const opportunity = spec.components.schemas.Opportunity;
  assert.deepEqual(opportunity.required, ['id', 'leadId', 'status', 'createdAt', 'updatedAt']);
  assert.equal(opportunity.properties.status.$ref, '#/components/schemas/OpportunityStatus');
  assert.deepEqual(spec.components.schemas.OpportunityStatus.enum, ['open']);
  assert.equal(Object.hasOwn(opportunity.properties, 'price'), false);
  assert.equal(Object.hasOwn(opportunity.properties, 'stage'), false);
  assert.deepEqual(spec.components.schemas.OpportunityCreate.required, ['leadId']);
  assert.equal(Object.hasOwn(spec.components.schemas.OpportunityCreate.properties, 'status'), false);
});
