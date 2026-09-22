import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createContentStore,
  createDraft,
  editDraft,
  publicRedirects,
  publishRevision,
} from '../../../packages/domain/src/content-publish.ts';
import { webPageJsonLd } from './structured-data.ts';
import { resolvePublicRequest, robotsTxt } from './technical-seo.ts';

test('a published slug change writes a redirect and the search fixtures stay clean', () => {
  const store = createContentStore();
  const actorId = 'actoreditor000001';
  const at = '2026-09-22T12:00:00.000Z';
  createDraft(store, {
    id: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2ta',
    type: 'Service',
    fields: { title: 'Projekt ogrodu' },
    actorId,
    at,
  });
  publishRevision(store, { documentId: 'pg8k2n4p6q8r0s2t', revisionId: 'rv8k2n4p6q8r0s2ta', actorId, at });
  editDraft(store, {
    documentId: 'pg8k2n4p6q8r0s2t',
    revisionId: 'rv8k2n4p6q8r0s2tb',
    fields: { title: 'Druga wersja' },
    actorId,
  });
  publishRevision(store, { documentId: 'pg8k2n4p6q8r0s2t', revisionId: 'rv8k2n4p6q8r0s2tb', actorId, at });
  const table = publicRedirects(store);
  assert.equal(table['/projekt-ogrodu'], '/druga-wersja');
  assert.deepEqual(resolvePublicRequest(new URL('http://127.0.0.1/projekt-ogrodu'), table), {
    status: 301,
    location: '/druga-wersja',
  });
  const json = JSON.stringify(webPageJsonLd({ name: 'Forma Zieleni', description: 'Opis', price: '999 PLN' }));
  assert.equal(json.includes('999'), false);
  assert.equal(json.includes('price'), false);
  const robots = robotsTxt('production', 'https://example.test');
  assert.equal(/^Disallow: \/$/m.test(robots), false);
  assert.equal(robots.includes('GPTBot'), false);
});
