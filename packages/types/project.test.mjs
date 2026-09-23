import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const spec = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contracts/openapi.json'), 'utf8'));

test('shared ProjectRecord fields stay aligned with the OpenAPI Project schema', () => {
  const project = spec.components.schemas.Project;
  assert.deepEqual(project.required, ['id', 'contractId', 'status', 'clientSubject', 'createdAt', 'updatedAt']);
  assert.equal(project.properties.status.$ref, '#/components/schemas/ProjectStatus');
  assert.deepEqual(spec.components.schemas.ProjectStatus.enum, ['planned', 'delivered']);
  assert.equal(Object.hasOwn(project.properties, 'payment'), false);
  assert.equal(Object.hasOwn(project.properties, 'provider'), false);
  assert.equal(Object.hasOwn(project.properties, 'deposit'), false);
  assert.equal(Object.hasOwn(project.properties, 'clientSubject'), true);
  assert.deepEqual(spec.components.schemas.ProjectCreate.required, ['contractId']);
  assert.equal(Object.hasOwn(spec.components.schemas.ProjectCreate.properties, 'status'), false);
  assert.equal(Object.hasOwn(spec.components.schemas.ProjectCreate.properties, 'clientSubject'), true);
});
