import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { carouselElement, galleryCards, galleryPerformanceNotes, slidesFromPlacements } from './gallery.ts';

test('thirty gallery cards use a derivative thumb and reserve width and height', () => {
  const placements = Array.from({ length: 32 }, (_, index) => ({
    assetId: `a${String(index + 1).padStart(15, '0')}`,
    alt: `Kadr ${index + 1}`,
    caption: '',
    width: 2400,
    height: 1600,
  }));
  const slides = slidesFromPlacements(placements);
  const cards = galleryCards(slides);
  const notes = galleryPerformanceNotes(cards);
  assert.equal(notes.count, 32);
  assert.equal(notes.originalsOnCards, false);
  assert.equal(notes.cls, 'width-height');
  assert.equal(notes.lcpCandidate, '/media/a000000000000001/w400.webp');
  assert.equal(cards.every((card) => card.src.endsWith('/w400.webp') && card.width === 400 && card.height === 267), true);
  assert.equal(cards[0].loading, 'eager');
  assert.equal(cards.slice(1).every((card) => card.loading === 'lazy'), true);
  const html = renderToStaticMarkup(carouselElement(slides, 0, () => {}));
  assert.equal(html.includes('master'), false);
  assert.equal(html.includes('w1600'), false);
  assert.equal(html.split('loading="eager"').length - 1, 1);
  assert.equal(html.split('loading="lazy"').length - 1, 31);
  assert.match(html, /width="400"/);
  assert.match(html, /height="267"/);
});
