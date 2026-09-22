import test from 'node:test';
import assert from 'node:assert/strict';
import { createContentStore, createDraft, publishRevision } from './src/content-publish.ts';
import {
  assertExportOmitsPrivateGps,
  exportCmsBundle,
  exportedPublicTitles,
  importCmsBundle,
} from './src/cms-export.ts';

test('CMS export includes content, slugs, SEO, media regeneration rules and omits GPS', () => {
  const store = createContentStore();
  createDraft(store, {
    id: 'studylabordydomowy',
    revisionId: 'revisionstudycms003',
    type: 'ProjectCaseStudy',
    fields: { title: 'Ogród laboratoryjny', summary: 'Synthetic export' },
    actorId: 'owneradminsession01',
    at: '2026-09-22T04:00:00.000Z',
  });
  publishRevision(store, {
    documentId: 'studylabordydomowy',
    revisionId: 'revisionstudycms003',
    actorId: 'owneradminsession01',
    at: '2026-09-22T04:00:00.000Z',
  });

  const bundle = exportCmsBundle({
    store,
    exportedAt: '2026-09-22T04:00:00.000Z',
    media: [{
      id: 'ma8k2n4p6q8rex01',
      checksum: 'abc123checksumvalue00',
      mime: 'image/png',
      relativePath: 'masters/ab/abc123checksumvalue00',
      gps: { lat: 50.06, lon: 19.94 },
      customerName: 'Secret Client',
    }],
  });

  assert.equal(bundle.documents.length, 1);
  assert.equal(bundle.documents[0].slug.includes('ogrod'), true);
  assert.equal(bundle.documents[0].seo.title, 'Ogród laboratoryjny');
  assert.equal(bundle.media.length, 1);
  assert.equal(bundle.media[0].regeneration.stripGps, true);
  assert.deepEqual([...bundle.media[0].regeneration.derivatives], ['webp', 'avif', 'jpeg']);
  assert.equal(/"gps"\s*:/i.test(JSON.stringify(bundle)), false);
  assert.equal(JSON.stringify(bundle).includes('Secret Client'), false);
  assertExportOmitsPrivateGps(bundle);

  const imported = importCmsBundle(bundle);
  assert.deepEqual(exportedPublicTitles(imported.store), ['Ogród laboratoryjny']);
  assert.deepEqual(imported.mediaIds, ['ma8k2n4p6q8rex01']);
});
