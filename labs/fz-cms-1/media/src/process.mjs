import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { cropWindow, WIDTHS } from '../../native/src/media.mjs';

export async function encodeDerivatives(master, placements) {
  const checksum = createHash('sha256').update(master.bytes).digest('hex');
  const image = sharp(master.bytes, { failOn: 'none' });
  const meta = await image.metadata();
  const results = [];
  for (const placement of placements) {
    const crop = cropWindow({
      width: meta.width,
      height: meta.height,
      targetRatio: placement.ratio,
      focal: master.focal,
      mode: placement.mode,
      safeRegion: master.safeRegion,
    });
    const targetWidth = WIDTHS.find(width => width >= placement.displayWidth) ?? WIDTHS.at(-1);
    const outWidth = Math.min(targetWidth, crop.width);
    const outHeight = Math.max(1, Math.round(outWidth * crop.height / crop.width));
    const pipeline = sharp(master.bytes, { failOn: 'none' }).extract({
      left: crop.x,
      top: crop.y,
      width: crop.width,
      height: crop.height,
    }).resize(outWidth, outHeight);
    const webp = await pipeline.clone().webp({ quality: 78 }).toBuffer();
    const avif = await pipeline.clone().avif({ quality: 45 }).toBuffer();
    const jpeg = await pipeline.clone().jpeg({ quality: 78 }).toBuffer();
    const webpMeta = await sharp(webp).metadata();
    const avifMeta = await sharp(avif).metadata();
    results.push({
      placement: placement.name,
      crop,
      masterChecksum: checksum,
      masterBytes: master.bytes.length,
      webp: { bytes: webp.length, width: webpMeta.width, height: webpMeta.height, mime: `image/${webpMeta.format}`, checksum: createHash('sha256').update(webp).digest('hex'), buffer: webp },
      avif: { bytes: avif.length, width: avifMeta.width, height: avifMeta.height, mime: `image/${avifMeta.format}`, checksum: createHash('sha256').update(avif).digest('hex'), buffer: avif },
      jpeg: { bytes: jpeg.length, mime: 'image/jpeg', buffer: jpeg },
    });
  }
  return { master: { checksum, width: meta.width, height: meta.height, bytes: master.bytes.length, hasExif: Boolean(meta.exif), orientation: meta.orientation ?? 1 }, results };
}
