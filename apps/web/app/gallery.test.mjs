import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  assertPublicDerivative,
  carouselElement,
  createGalleryState,
  lightboxAnimation,
  lightboxContract,
  lightboxLabels,
  reduceGallery,
  slidesFromPlacements,
} from './gallery.ts';

const placements = [
  { assetId: 'ma8k2n4p6q8r0001', alt: 'Cis przed', caption: 'Przed', width: 1600, height: 900 },
  { assetId: 'ma8k2n4p6q8r0002', alt: 'Cis po', caption: '', width: 800, height: 800 },
];

test('thumbs use derivatives and the lightbox keeps the keyboard contract', () => {
  const slides = slidesFromPlacements(placements);
  assert.equal(slides[0].thumb, '/media/ma8k2n4p6q8r0001/w400.webp');
  assert.equal(slides[0].large, '/media/ma8k2n4p6q8r0001/w1600.webp');
  assert.equal(slides[1].largeWidth, 800);
  const html = renderToStaticMarkup(carouselElement(slides, 0, () => {}));
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /w400\.webp/);
  assert.equal(html.includes('w1600'), false);
  assert.equal(html.includes('master'), false);
  assert.equal(html.includes('loading="lazy"'), true);
  assert.throws(() => assertPublicDerivative('/masters/ma8k2n4p6q8r0001.jpg'), /MASTER_URL_REJECTED/);
  assert.match(html, /aria-current="true"/);
  assert.equal(slidesFromPlacements([{ assetId: 'ma8k2n4p6q8r0001', alt: '  ', caption: '', width: 400, height: 300 }])[0].alt, '');
  const unnamed = renderToStaticMarkup(carouselElement(slidesFromPlacements([{ assetId: 'ma8k2n4p6q8r0001', alt: '', caption: '', width: 400, height: 300 }]), 0, () => {}));
  assert.match(unnamed, /aria-label="Zdjęcie 1 z 1"/);
  assert.match(unnamed, /alt=""/);
  const captioned = renderToStaticMarkup(carouselElement(slidesFromPlacements([{ assetId: 'ma8k2n4p6q8r0001', alt: '', caption: 'Przed', width: 400, height: 300 }]), 0, () => {}));
  assert.match(captioned, /aria-label="Przed"/);
  assert.equal(lightboxLabels.Close, 'Zamknij');
  assert.equal(lightboxLabels['{index} of {total}'], '{index} z {total}');
  assert.equal(lightboxContract.focusTrap, true);
  assert.equal(lightboxContract.restoreFocus, true);
  assert.deepEqual(lightboxAnimation(true), { fade: 0, swipe: 0 });
  assert.equal(lightboxAnimation(false).swipe > 0, true);
});

test('arrows move, Escape and the backdrop close, and the image click does not', () => {
  const opened = reduceGallery(createGalleryState(), { type: 'open', index: 0, triggerId: 'thumb-ma8k2n4p6q8r0001' }, 2);
  const next = reduceGallery(opened, { type: 'move', key: 'ArrowRight' }, 2);
  assert.equal(next.open, true);
  assert.equal(next.index, 1);
  const previous = reduceGallery(next, { type: 'move', key: 'ArrowLeft' }, 2);
  assert.equal(previous.index, 0);
  assert.equal(reduceGallery(opened, { type: 'image' }, 2).open, true);
  const closed = reduceGallery(opened, { type: 'escape' }, 2);
  assert.equal(closed.open, false);
  assert.equal(closed.restoreId, 'thumb-ma8k2n4p6q8r0001');
  assert.equal(reduceGallery(opened, { type: 'backdrop' }, 2).open, false);
  assert.equal(reduceGallery(closed, { type: 'escape' }, 2).open, false);
});

test('the gallery route renders the lightbox library and no master urls', () => {
  const route = readFileSync(new URL('./routes/gallery.tsx', import.meta.url), 'utf8');
  const view = readFileSync(new URL('./gallery-view.tsx', import.meta.url), 'utf8');
  assert.match(route, /Nie ma opublikowanej galerii/);
  assert.match(view, /yet-another-react-lightbox/);
  assert.match(view, /closeOnBackdropClick: true/);
  assert.equal(route.includes('master'), false);
  assert.equal(view.includes('/masters/'), false);
});
