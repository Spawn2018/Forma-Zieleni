import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectFileCreateRequest, validateProjectFileVisibilityRequest } from './src/project-file.ts';

test('validateProjectFileCreateRequest accepts metadata-only bodies', () => {
  const ok = validateProjectFileCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    name: 'plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
  });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.name, 'plan.pdf');
});

test('validateProjectFileCreateRequest rejects binary and unknown fields', () => {
  const binary = validateProjectFileCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    name: 'plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1,
    bytes: 'abc',
  });
  assert.equal(binary.ok, false);
  const unknown = validateProjectFileCreateRequest({
    projectId: 'j9k2n4p6q8r0s2t4',
    name: 'plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1,
    path: '/tmp/x',
  });
  assert.equal(unknown.ok, false);
});

test('validateProjectFileVisibilityRequest accepts only a boolean', () => {
  const ok = validateProjectFileVisibilityRequest({ visible: false });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.visible, false);
  assert.equal(validateProjectFileVisibilityRequest({ visible: 'false' }).ok, false);
  assert.equal(validateProjectFileVisibilityRequest({ visible: true, clientSubject: 'other' }).ok, false);
  assert.equal(validateProjectFileVisibilityRequest({ visible: true, bytes: 'abc' }).ok, false);
});
