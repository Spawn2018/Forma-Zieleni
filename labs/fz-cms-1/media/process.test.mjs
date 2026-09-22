import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { syntheticImage } from '../native/src/png.mjs';
import { cropWindow } from '../native/src/media.mjs';
import { jpegWithSyntheticGps, bufferMentionsSyntheticGps, SYNTHETIC_GPS } from './src/jpeg-gps.mjs';
import { encodeDerivatives } from './src/process.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('sharp writes webp and avif smaller than a high-resolution master without distorting', async () => {
  const png = syntheticImage('large');
  const jpeg = await sharp(png.bytes).jpeg({ quality: 90 }).toBuffer();
  const encoded = await encodeDerivatives({ bytes: jpeg, focal: { x: 0.5, y: 0.5 } }, [
    { name: 'project-card', ratio: 4 / 3, displayWidth: 400, mode: 'CONTAIN' },
    { name: 'lightbox', ratio: png.width / png.height, displayWidth: 1600, mode: 'CONTAIN' },
  ]);
  const card = encoded.results[0];
  assert.equal(card.webp.mime, 'image/webp');
  assert.equal(card.avif.buffer.includes(Buffer.from('avif')), true);
  assert.ok(card.webp.bytes < encoded.master.bytes);
  assert.ok(card.avif.bytes < encoded.master.bytes);
  assert.equal(card.webp.width, 400);
  assert.equal(card.webp.width / card.webp.height, card.avif.width / card.avif.height);
  assert.ok(card.webp.width < encoded.master.width);
  const again = await encodeDerivatives({ bytes: jpeg, focal: { x: 0.5, y: 0.5 } }, [
    { name: 'project-card', ratio: 4 / 3, displayWidth: 400, mode: 'CONTAIN' },
  ]);
  assert.equal(again.results[0].webp.checksum, card.webp.checksum);
  mkdirSync(path.join(root, 'evidence', 'generated'), { recursive: true });
  writeFileSync(path.join(root, 'evidence', 'generated', 'media-bytes.json'), JSON.stringify({
    researchDate: '2026-09-21',
    processor: 'sharp',
    master: encoded.master,
    card: { webp: { ...card.webp, buffer: undefined }, avif: { ...card.avif, buffer: undefined } },
  }, null, 2));
});

test('public derivatives drop synthetic GPS that is present on the master jpeg', async () => {
  const png = syntheticImage('landscape');
  const cleanJpeg = await sharp(png.bytes).jpeg({ quality: 90 }).toBuffer();
  const tagged = jpegWithSyntheticGps(cleanJpeg);
  assert.equal(bufferMentionsSyntheticGps(cleanJpeg), false);
  assert.equal(bufferMentionsSyntheticGps(tagged), true);
  const taggedMeta = await sharp(tagged).metadata();
  assert.ok(taggedMeta.exif);
  const encoded = await encodeDerivatives({ bytes: tagged, focal: { x: 0.5, y: 0.5 } }, [
    { name: 'card', ratio: 16 / 9, displayWidth: 800, mode: 'CONTAIN' },
  ]);
  const webp = encoded.results[0].webp;
  const avif = encoded.results[0].avif;
  const jpeg = encoded.results[0].jpeg;
  assert.equal(bufferMentionsSyntheticGps(webp.buffer), false);
  assert.equal(bufferMentionsSyntheticGps(avif.buffer), false);
  assert.equal(bufferMentionsSyntheticGps(jpeg.buffer), false);
  assert.equal((await sharp(webp.buffer).metadata()).exif, undefined);
  assert.equal(JSON.stringify(webp.buffer).includes(String(SYNTHETIC_GPS.lat)), false);
});

test('executed crop modes keep aspect and honor left/center/right focal points', () => {
  const landscape = { width: 1600, height: 900 };
  const contain = cropWindow({ ...landscape, targetRatio: 1, mode: 'CONTAIN' });
  assert.equal(contain.cropped, false);
  const left = cropWindow({ ...landscape, targetRatio: 1, mode: 'SMART_FILL', focal: { x: 0.15, y: 0.5 } });
  const center = cropWindow({ ...landscape, targetRatio: 1, mode: 'SMART_FILL', focal: { x: 0.5, y: 0.5 } });
  const right = cropWindow({ ...landscape, targetRatio: 1, mode: 'SMART_FILL', focal: { x: 0.85, y: 0.5 } });
  assert.equal(left.width / left.height, 1);
  assert.ok(left.x < center.x);
  assert.ok(center.x < right.x);
  const safe = cropWindow({
    ...landscape,
    targetRatio: 1,
    mode: 'SMART_FILL',
    focal: { x: 0.1, y: 0.5 },
    safeRegion: { x: 0.7, y: 0.2, w: 0.2, h: 0.2 },
  });
  assert.equal(safe.safeRegionHonored, true);
  assert.ok(safe.x + safe.width >= Math.round(0.9 * 1600));
  const adaptive = cropWindow({ width: 2400, height: 600, targetRatio: 0.6, mode: 'ADAPTIVE_LAYOUT' });
  assert.equal(adaptive.layoutAdapts, true);
  assert.equal(adaptive.cropped, false);
  const portrait = cropWindow({ width: 900, height: 1600, targetRatio: 1, mode: 'SMART_FILL', focal: { x: 0.5, y: 0.2 } });
  const panorama = cropWindow({ width: 2400, height: 600, targetRatio: 16 / 9, mode: 'CONTAIN' });
  const square = cropWindow({ width: 1200, height: 1200, targetRatio: 1, mode: 'SMART_FILL' });
  assert.equal(portrait.width / portrait.height, 1);
  assert.equal(portrait.cropped, true);
  assert.equal(panorama.cropped, false);
  assert.equal(square.cropped, false);
});
