import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { jpegWithSyntheticGps, bufferMentionsSyntheticGps } from '../../labs/fz-cms-1/media/src/jpeg-gps.mjs';
import { cropWindow, encodePublicDerivative } from './src/derivatives.mjs';

test('contain keeps the frame and public bytes omit synthetic GPS', async () => {
  const plain = await sharp({
    create: { width: 80, height: 40, channels: 3, background: { r: 20, g: 90, b: 40 } },
  }).jpeg().toBuffer();
  const tagged = jpegWithSyntheticGps(plain);
  assert.equal(bufferMentionsSyntheticGps(tagged), true);
  const before = createHash('sha256').update(tagged).digest('hex');
  const encoded = await encodePublicDerivative(tagged, {
    ratio: 80 / 40,
    displayWidth: 400,
    mode: 'CONTAIN',
    focal: { x: 0.2, y: 0.2 },
  });
  assert.equal(createHash('sha256').update(tagged).digest('hex'), before);
  assert.equal(encoded.crop.width, 80);
  assert.equal(encoded.crop.height, 40);
  assert.equal(bufferMentionsSyntheticGps(encoded.webp), false);
  assert.equal(bufferMentionsSyntheticGps(encoded.avif), false);
  assert.equal(bufferMentionsSyntheticGps(encoded.jpeg), false);
  assert.equal((await sharp(encoded.webp).metadata()).format, 'webp');
  assert.equal((await sharp(encoded.avif).metadata()).format, 'heif');
});

test('smart fill crops toward the focal point without a generative expand', () => {
  const crop = cropWindow({ width: 200, height: 100, targetRatio: 1, focal: { x: 0.1, y: 0.5 }, mode: 'SMART_FILL' });
  assert.equal(crop.width, 100);
  assert.equal(crop.x < 50, true);
  const adaptive = cropWindow({ width: 200, height: 100, targetRatio: 1, mode: 'ADAPTIVE_LAYOUT' });
  assert.equal(adaptive.width, 200);
  assert.equal(adaptive.height, 100);
});
