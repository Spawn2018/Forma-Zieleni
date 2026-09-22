import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const spec = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contracts/openapi.json'), 'utf8'));

test('shared ContractRecord fields stay aligned with the OpenAPI Contract schema', () => {
  const contract = spec.components.schemas.Contract;
  assert.deepEqual(contract.required, ['id', 'offerId', 'status', 'createdAt', 'updatedAt']);
  assert.equal(contract.properties.status.$ref, '#/components/schemas/ContractStatus');
  assert.deepEqual(spec.components.schemas.ContractStatus.enum, ['draft']);
  assert.equal(Object.hasOwn(contract.properties, 'signedAt'), false);
  assert.equal(Object.hasOwn(contract.properties, 'provider'), false);
  assert.deepEqual(spec.components.schemas.ContractCreate.required, ['offerId']);
  assert.equal(Object.hasOwn(spec.components.schemas.ContractCreate.properties, 'status'), false);
});
