import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const spec = JSON.parse(readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../contracts/openapi.json'), 'utf8'));

test('shared ProjectMilestone and DecisionLogEntry align with OpenAPI without payment/signing', () => {
  const milestone = spec.components.schemas.ProjectMilestone;
  assert.deepEqual(milestone.required, ['id', 'projectId', 'title', 'status', 'dueAt', 'createdAt', 'updatedAt']);
  assert.equal(milestone.properties.status.$ref, '#/components/schemas/MilestoneStatus');
  assert.deepEqual(spec.components.schemas.MilestoneStatus.enum, ['planned', 'active', 'done']);
  assert.equal(Object.hasOwn(milestone.properties, 'payment'), false);
  assert.equal(Object.hasOwn(milestone.properties, 'provider'), false);
  assert.equal(Object.hasOwn(milestone.properties, 'signing'), false);

  const entry = spec.components.schemas.DecisionLogEntry;
  assert.deepEqual(entry.required, ['id', 'projectId', 'kind', 'summary', 'recordedByActorId', 'relatedMilestoneId', 'createdAt']);
  assert.deepEqual(spec.components.schemas.DecisionLogKind.enum, ['decision', 'change_order']);
  assert.equal(Object.hasOwn(entry.properties, 'email'), false);
  assert.equal(Object.hasOwn(entry.properties, 'phone'), false);
  assert.equal(Object.hasOwn(spec.components.schemas.DecisionLogCreate.properties, 'recordedByActorId'), false);
});
