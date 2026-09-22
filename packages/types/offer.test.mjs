import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const spec = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contracts/openapi.json'), 'utf8'));

test('shared OfferRecord fields stay aligned with the OpenAPI Offer schema', () => {
  const offer = spec.components.schemas.Offer;
  assert.deepEqual(offer.required, ['id', 'opportunityId', 'status', 'createdAt', 'updatedAt']);
  assert.equal(offer.properties.status.$ref, '#/components/schemas/OfferStatus');
  assert.deepEqual(spec.components.schemas.OfferStatus.enum, ['draft']);
  assert.equal(Object.hasOwn(offer.properties, 'price'), false);
  assert.equal(Object.hasOwn(offer.properties, 'amountPln'), false);
  assert.deepEqual(spec.components.schemas.OfferCreate.required, ['opportunityId']);
  assert.equal(Object.hasOwn(spec.components.schemas.OfferCreate.properties, 'status'), false);
  assert.equal(Object.hasOwn(spec.components.schemas.OfferCreate.properties, 'price'), false);
});
