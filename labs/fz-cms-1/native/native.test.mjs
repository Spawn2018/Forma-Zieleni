import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syntheticImage } from './src/png.mjs';
import { cropWindow, planDerivatives, validateUpload } from './src/media.mjs';
import { addAsset, addCollection, createDocument, createStore, exportBundle, publicView, publish, reorderCollection, rollback, updateDraft } from './src/content.mjs';
import { galleryMarkup, lightboxContract } from './src/gallery.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('page and article use the same draft isolation as service', () => {
  const store = createStore();
  const page = createDocument(store, 'Page', { title: 'Oferta', slug: 'oferta', seo: { title: 'Oferta' }, blocks: [{ type: 'Hero' }] });
  const article = createDocument(store, 'Article', { title: 'Nawadnianie', slug: 'nawadnianie', summary: 'Szkic laboratoryjny', seo: { title: 'Nawadnianie' } });
  assert.equal(publicView(store, page.document.id), null);
  assert.equal(publicView(store, article.document.id), null);
  publish(store, page.document.id, page.revision.id);
  publish(store, article.document.id, article.revision.id);
  updateDraft(store, page.document.id, { title: 'Oferta — szkic', slug: 'oferta', seo: { title: 'Szkic' }, blocks: [{ type: 'Hero' }] });
  assert.equal(publicView(store, page.document.id).fields.title, 'Oferta');
  assert.equal(publicView(store, article.document.id).fields.title, 'Nawadnianie');
});

test('native content core drafts, publishes, updates and rolls back without leaking the draft', () => {
  const store = createStore();
  const service = createDocument(store, 'Service', { title: 'Projekt ogrodu', slug: 'projekt-ogrodu', seo: { title: 'Projekt ogrodu' } });
  assert.equal(publicView(store, service.document.id), null);
  publish(store, service.document.id, service.revision.id);
  const live = publicView(store, service.document.id);
  assert.equal(live.fields.title, 'Projekt ogrodu');
  updateDraft(store, service.document.id, { title: 'Projekt ogrodu — szkic', slug: 'projekt-ogrodu', seo: { title: 'Szkic' } });
  assert.equal(publicView(store, service.document.id).fields.title, 'Projekt ogrodu');
  rollback(store, service.document.id, service.revision.id);
  assert.equal(publicView(store, service.document.id).id, service.revision.id);
  assert.equal(store.events.at(-1).type, 'content.published');
});

test('project case study can attach thirty synthetic assets and reorder a gallery', () => {
  const store = createStore();
  const kinds = ['landscape', 'portrait', 'square', 'panorama', 'large', 'small', 'transparent'];
  const ids = [];
  for (let i = 0; i < 30; i += 1) {
    const image = syntheticImage(kinds[i % kinds.length]);
    assert.equal(validateUpload(image).ok, true);
    ids.push(addAsset(store, { ...image, bytes: image.bytes.length, alt: `syntetyczne ${i + 1}` }).id);
  }
  const gallery = addCollection(store, 'Realizacja laboratoryjna', ids);
  const reversed = [...ids].reverse();
  reorderCollection(store, gallery.id, reversed);
  assert.equal(store.collections.get(gallery.id).itemIds[0], ids[29]);
  const study = createDocument(store, 'ProjectCaseStudy', {
    title: 'Ogród laboratoryjny',
    slug: 'ogrod-laboratoryjny',
    publicLocality: 'Kraków',
    galleryId: gallery.id,
    heroAssetId: reversed[0],
    businessProjectRef: null,
  });
  publish(store, study.document.id, study.revision.id);
  const exported = exportBundle(store);
  assert.equal(exported.assets.length, 30);
  assert.equal(exported.assets.every(asset => asset.gpsStripped && !('bytes' in asset)), true);
  assert.equal(exported.revisions.some(item => item.fields.businessProjectRef === null), true);
});

test('fit modes do not distort and adaptive layout keeps the full source', () => {
  const landscape = { width: 1600, height: 900, focal: { x: 0.2, y: 0.5 } };
  const contain = cropWindow({ ...landscape, targetRatio: 1, mode: 'CONTAIN' });
  assert.equal(contain.cropped, false);
  const fill = cropWindow({ ...landscape, targetRatio: 1, mode: 'SMART_FILL' });
  assert.equal(fill.cropped, true);
  assert.equal(fill.width / fill.height, 1);
  assert.equal(fill.x, 0);
  const fillRight = cropWindow({ width: 1600, height: 900, focal: { x: 0.8, y: 0.5 }, targetRatio: 1, mode: 'SMART_FILL' });
  assert.ok(fillRight.x > 0);
  assert.equal(fillRight.width / fillRight.height, 1);
  const adaptive = cropWindow({ width: 2400, height: 600, focal: { x: 0.5, y: 0.5 }, targetRatio: 0.6, mode: 'ADAPTIVE_LAYOUT' });
  assert.equal(adaptive.layoutAdapts, true);
  assert.equal(adaptive.shown, 1);
  const denied = validateUpload({ mime: 'image/svg+xml', bytes: 10, width: 10, height: 10 });
  assert.equal(denied.ok, false);
  assert.equal(validateUpload({ mime: 'image/png', bytes: 10, width: Number.NaN, height: 10 }).ok, false);
  const matched = cropWindow({ width: 1600, height: 900, targetRatio: 16 / 9, mode: 'SMART_FILL' });
  assert.equal(matched.cropped, false);
  assert.throws(() => createDocument(createStore(), 'Lead', { title: 'no' }), /CONTENT_TYPE_DENIED/);
});

test('gallery markup and lightbox contract stay keyboard-first', () => {
  const store = createStore();
  const first = addAsset(store, { ...syntheticImage('landscape'), bytes: 12, alt: 'Rabata' });
  const collection = addCollection(store, 'Galeria', [first.id]);
  const html = galleryMarkup(collection, store.assets);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="Zamknij"/);
  assert.match(html, /loading="eager"/);
  assert.equal(lightboxContract().imageClickDoesNotClose, true);
  assert.equal(lightboxContract().usesDerivativeNotMaster, true);
});

test('write lab evidence without customer pixels', () => {
  const image = syntheticImage('landscape');
  const plans = planDerivatives({ ...image, focal: { x: 0.4, y: 0.5 } }, [
    { name: 'desktop-hero', ratio: 16 / 9, displayWidth: 1600, mode: 'SMART_FILL' },
    { name: 'project-card', ratio: 4 / 3, displayWidth: 400, mode: 'CONTAIN' },
    { name: 'lightbox', ratio: image.width / image.height, displayWidth: 1600, mode: 'CONTAIN' },
  ]);
  mkdirSync(path.join(root, 'evidence', 'generated'), { recursive: true });
  writeFileSync(path.join(root, 'evidence', 'generated', 'media-stress.json'), JSON.stringify({
    researchDate: '2026-09-21',
    input: { kind: image.kind, width: image.width, height: image.height, bytes: image.bytes.length, checksum: image.checksum },
    plans,
    note: 'AVIF/WebP bytes are planned, not encoded, until a lab encoder is added. Masters stay immutable.',
  }, null, 2));
  assert.equal(plans[0].masterPreserved, true);
});
