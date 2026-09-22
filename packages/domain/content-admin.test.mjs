import test from 'node:test';
import assert from 'node:assert/strict';
import { createContentStore, publicProjection } from './src/content-publish.ts';
import {
  ADMIN_EDITORIAL_TYPES,
  assertAdminRequestHasNoClientAuthority,
  createEditorialDocument,
  editorialHappyPath,
  openContentAdminSession,
} from './src/content-admin.ts';

test('CMS-ADMIN editorial happy path creates Service and ProjectCaseStudy without CRM', () => {
  const { store, service, study } = editorialHappyPath();
  assert.deepEqual([...ADMIN_EDITORIAL_TYPES], ['Service', 'ProjectCaseStudy']);
  assert.equal(service.type, 'Service');
  assert.equal(service.published, true);
  assert.equal(service.publicTitle, 'Projekt ogrodu');
  assert.equal(study.type, 'ProjectCaseStudy');
  assert.equal(study.publicTitle, 'Ogród laboratoryjny');
  assert.equal(publicProjection(store, service.documentId)?.title, 'Projekt ogrodu');
  assert.equal(store.outbox.every((row) => row.type === 'content.published'), true);
  assert.equal(store.documents.size, 2);
});

test('an editor without publish can draft but not publish', () => {
  const store = createContentStore();
  const editor = openContentAdminSession('editoractorsession1', 'editor');
  const draft = createEditorialDocument(store, editor, {
    type: 'Service',
    documentId: 'servicedraftonlypath',
    revisionId: 'revisiondraftonly001',
    title: 'Szkic usługi',
    at: '2026-09-22T02:05:00.000Z',
  });
  assert.equal(draft.published, false);
  assert.equal(draft.publicTitle, null);
  assert.throws(
    () => createEditorialDocument(store, editor, {
      type: 'ProjectCaseStudy',
      documentId: 'studydraftpublishfail',
      revisionId: 'revisionstudypubfail1',
      title: 'Nie publikuj',
      at: '2026-09-22T02:05:00.000Z',
      publish: true,
    }),
    /CONTENT_PUBLISH_FORBIDDEN/,
  );
});

test('client-supplied authority is rejected on the admin request body', () => {
  assert.throws(
    () => assertAdminRequestHasNoClientAuthority({ role: 'admin', title: 'x' }),
    /CLIENT_AUTHORITY_REJECTED/,
  );
  assert.throws(
    () => assertAdminRequestHasNoClientAuthority({ actorId: 'forgedactor000001', title: 'x' }),
    /CLIENT_AUTHORITY_REJECTED/,
  );
});
