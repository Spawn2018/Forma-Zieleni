import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const spec = JSON.parse(readFileSync(path.join(root, 'openapi.json'), 'utf8'));
const inventory = JSON.parse(readFileSync(path.join(root, 'inventory.json'), 'utf8'));

function operations() {
  const found = [];
  for (const [pathName, item] of Object.entries(spec.paths)) {
    for (const method of Object.keys(item)) found.push(`${method.toUpperCase()} ${pathName}`);
  }
  return found.sort();
}

test('current contract is OpenAPI 3.0.4 and stays on the /v1 server prefix', () => {
  assert.equal(spec.openapi, '3.0.4');
  assert.equal(spec.openapi, inventory.openapi);
  assert.ok(spec.servers[0].url.includes('/v1'));
});

test('breaking-change inventory of lead paths and required fields remains exact', () => {
  assert.deepEqual(operations(), inventory.paths.slice().sort());
  assert.deepEqual(spec.components.schemas.Lead.required, inventory.requiredLeadFields);
  for (const field of inventory.forbiddenLeadFields) {
    assert.equal(Object.hasOwn(spec.components.schemas.Lead.properties, field), false);
    assert.equal(Object.hasOwn(spec.components.schemas.LeadCapture.properties, field), false);
  }
  assert.deepEqual(spec.components.schemas.Opportunity.required, inventory.requiredOpportunityFields);
  for (const field of inventory.forbiddenOpportunityFields) {
    assert.equal(Object.hasOwn(spec.components.schemas.Opportunity.properties, field), false);
    assert.equal(Object.hasOwn(spec.components.schemas.OpportunityCreate.properties, field), false);
  }
  assert.deepEqual(spec.components.schemas.Offer.required, inventory.requiredOfferFields);
  for (const field of inventory.forbiddenOfferFields) {
    assert.equal(Object.hasOwn(spec.components.schemas.Offer.properties, field), false);
    assert.equal(Object.hasOwn(spec.components.schemas.OfferCreate.properties, field), false);
  }
  assert.deepEqual(spec.components.schemas.Contract.required, inventory.requiredContractFields);
  assert.deepEqual(spec.components.schemas.PortalContractProjection.required, inventory.requiredPortalContractFields);
  for (const field of inventory.forbiddenPortalContractFields) {
    assert.equal(Object.hasOwn(spec.components.schemas.PortalContractProjection.properties, field), false);
  }
  for (const field of inventory.forbiddenContractFields) {
    assert.equal(Object.hasOwn(spec.components.schemas.Contract.properties, field), false);
    assert.equal(Object.hasOwn(spec.components.schemas.ContractCreate.properties, field), false);
  }
  assert.deepEqual(spec.components.schemas.Project.required, inventory.requiredProjectFields);
  for (const field of inventory.forbiddenProjectFields) {
    assert.equal(Object.hasOwn(spec.components.schemas.Project.properties, field), false);
    assert.equal(Object.hasOwn(spec.components.schemas.ProjectCreate.properties, field), false);
  }
  assert.deepEqual(spec.components.schemas.Garden.required, inventory.requiredGardenFields);
  for (const field of inventory.forbiddenGardenFields) {
    assert.equal(Object.hasOwn(spec.components.schemas.Garden.properties, field), false);
    assert.equal(Object.hasOwn(spec.components.schemas.GardenCreate.properties, field), false);
  }
  assert.deepEqual(spec.components.schemas.CapacityWindow.required, inventory.requiredCapacityWindowFields);
  for (const field of inventory.forbiddenCapacityFields) {
    assert.equal(Object.hasOwn(spec.components.schemas.CapacityWindow.properties, field), false);
    assert.equal(Object.hasOwn(spec.components.schemas.CapacityWindowCreate.properties, field), false);
  }
});

test('mutations require idempotency and public capture has no bearer requirement', () => {
  assert.deepEqual(spec.paths['/leads'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/leads'].post.security, []);
  assert.deepEqual(spec.paths['/leads'].get.security, [{ bearerAuth: [] }]);
  assert.equal(spec.components.parameters.IdempotencyKey.required, true);
  assert.deepEqual(spec.paths['/opportunities'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/opportunities'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/opportunities'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/opportunities/{opportunityId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/offers'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/offers'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/offers'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/offers/{offerId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/contracts'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/contracts'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/contracts'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/contracts/{contractId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/contracts/{contractId}/lifecycle'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/contracts/{contractId}/lifecycle'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/ContractId',
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/projects'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/projects'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/projects'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/projects/{projectId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/projects/{projectId}/deliver'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/projects/{projectId}/deliver'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/ProjectId',
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/portal/contracts'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/contracts/{contractId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/projects'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/projects/{projectId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/files'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/files/{fileId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/gardens'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/gardens/{gardenId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/milestones'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/milestones/{milestoneId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/files'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/files'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/gardens'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/gardens'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/gardens'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/gardens/{gardenId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/capacity-windows'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/capacity-windows'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/capacity-windows'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/capacity-windows/{windowId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/capacity-decisions'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/site-intelligence'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/site-intelligence'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/site-intelligence'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/site-intelligence/{recordId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/site-intelligence'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/portal/site-intelligence/{recordId}'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/milestones'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/milestones'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/milestones'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/decision-log'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/decision-log'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/decision-log'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(spec.paths['/payment-schedules'].get.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/payment-schedules'].post.security, [{ bearerAuth: [] }]);
  assert.deepEqual(spec.paths['/payment-schedules'].post.parameters.map(p => p.$ref), [
    '#/components/parameters/IdempotencyKey',
    '#/components/parameters/RequestId',
  ]);
  assert.deepEqual(
    spec.paths['/payment-schedules/{scheduleId}/installments/{installmentId}/transition'].post.security,
    [{ bearerAuth: [] }],
  );
});

test('public capture cannot assert internal sources and qualify declares idempotency conflict', () => {
  assert.deepEqual(spec.components.schemas.PublicLeadSource.enum, ['www', 'other']);
  assert.equal(spec.components.schemas.LeadCapture.properties.source.$ref, '#/components/schemas/PublicLeadSource');
  assert.deepEqual(spec.components.schemas.LeadSource.enum, ['www', 'portal', 'admin', 'other']);
  assert.equal(spec.paths['/leads/{leadId}/qualify'].post.responses['409'].$ref, '#/components/responses/Conflict');
});

test('errors share one schema and object reads are authorized', () => {
  for (const name of ['BadRequest', 'Unauthorized', 'Forbidden', 'NotFound', 'Conflict', 'TooManyRequests']) {
    assert.equal(spec.components.responses[name].content['application/json'].schema.$ref, '#/components/schemas/ApiError');
  }
  assert.deepEqual(spec.paths['/leads/{leadId}'].get.security, [{ bearerAuth: [] }]);
});
