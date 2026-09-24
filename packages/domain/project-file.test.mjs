import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectFile, projectFileForPortal } from './src/project-file.ts';

const project = {
  id: 'jabcdefghijklmnop',
  contractId: 'cabcdefghijklmnop',
  status: 'planned',
  clientSubject: 'client-a',
  createdAt: '2026-09-24T00:00:00.000Z',
  updatedAt: '2026-09-24T00:00:00.000Z',
};

test('creates metadata-only project file records', () => {
  const file = createProjectFile(
    'uabcdefghijklmnop',
    project,
    { name: 'plan.pdf', mimeType: 'application/pdf', sizeBytes: 1024 },
    '2026-09-24T00:00:00.000Z',
  );
  assert.equal(file.projectId, project.id);
  assert.equal(file.clientSubject, 'client-a');
  assert.equal(file.name, 'plan.pdf');
});

test('projects portal-safe fields only for matching clientSubject', () => {
  const file = createProjectFile(
    'uabcdefghijklmnopq',
    project,
    { name: 'plan.pdf', mimeType: 'application/pdf', sizeBytes: 1024 },
    '2026-09-24T00:00:00.000Z',
  );
  assert.deepEqual(projectFileForPortal(file, 'client-a'), {
    id: file.id,
    projectId: project.id,
    name: 'plan.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    createdAt: file.createdAt,
  });
  assert.equal(projectFileForPortal(file, 'client-b'), null);
  const staffOnly = createProjectFile(
    'uabcdefghijklmnopqr',
    { ...project, clientSubject: null },
    { name: 'staff.pdf', mimeType: 'application/pdf', sizeBytes: 10, clientSubject: null },
    '2026-09-24T00:00:00.000Z',
  );
  assert.equal(projectFileForPortal(staffOnly, 'client-a'), null);
});

test('rejects guessable file ids', () => {
  assert.throws(
    () => createProjectFile('file1', project, { name: 'a', mimeType: 'text/plain', sizeBytes: 1 }, '2026-09-24T00:00:00.000Z'),
    /PROJECT_FILE_ID_GUESSABLE/,
  );
});
