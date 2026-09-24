import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectFileCreateRequest } from './src/project-file.ts';

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
