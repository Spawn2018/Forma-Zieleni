import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjectFile, projectFileForPortal, reviseProjectFileName } from './src/project-file.ts';

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

test('file name revision keeps bytes and refuses storage fields', () => {
  const file = createProjectFile(
    'uabcdefghijklmnopqs',
    project,
    { name: 'plan.pdf', mimeType: 'application/pdf', sizeBytes: 1024 },
    '2026-09-24T00:00:00.000Z',
  );
  const renamed = reviseProjectFileName(file, '  układ.pdf  ', '2026-09-24T01:00:00.000Z');
  assert.equal(renamed.name, 'układ.pdf');
  assert.equal(renamed.mimeType, file.mimeType);
  assert.equal(renamed.sizeBytes, file.sizeBytes);
  assert.equal(renamed.clientSubject, file.clientSubject);
  assert.equal(renamed.updatedAt, '2026-09-24T01:00:00.000Z');
  assert.equal(reviseProjectFileName(renamed, 'układ.pdf', '2026-09-24T02:00:00.000Z'), renamed);
  assert.throws(() => reviseProjectFileName(file, '   ', '2026-09-24T01:00:00.000Z'), /PROJECT_FILE_NAME_INVALID/);
  assert.throws(
    () => reviseProjectFileName(file, 'next.pdf', '2026-09-24T01:00:00.000Z', { storageKey: 'secret' }),
    /PROJECT_FILE_SURFACE_FORBIDDEN/,
  );
  assert.equal(projectFileForPortal(renamed, 'client-a')?.name, 'układ.pdf');
  assert.equal(Object.hasOwn(projectFileForPortal(renamed, 'client-a') ?? {}, 'updatedAt'), false);
});

test('rejects guessable file ids', () => {
  assert.throws(
    () => createProjectFile('file1', project, { name: 'a', mimeType: 'text/plain', sizeBytes: 1 }, '2026-09-24T00:00:00.000Z'),
    /PROJECT_FILE_ID_GUESSABLE/,
  );
});
