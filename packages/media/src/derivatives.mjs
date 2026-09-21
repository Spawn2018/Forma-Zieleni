import { createHash } from 'node:crypto';
import sharp from 'sharp';

const WIDTHS = [400, 800, 1200, 1600, 2400];

export function cropWindow({ width, height, targetRatio, focal = { x: 0.5, y: 0.5 }, mode }) {
  const sourceRatio = width / height;
  if (mode === 'CONTAIN' || mode === 'ADAPTIVE_LAYOUT' || Math.abs(sourceRatio - targetRatio) < 0.01) {
    return { x: 0, y: 0, width, height };
  }
  if (sourceRatio > targetRatio) {
    const cropW = Math.max(1, Math.round(height * targetRatio));
    const x = Math.max(0, Math.min(width - cropW, Math.round(focal.x * width - cropW / 2)));
    return { x, y: 0, width: cropW, height };
  }
  const cropH = Math.max(1, Math.round(width / targetRatio));
  const y = Math.max(0, Math.min(height - cropH, Math.round(focal.y * height - cropH / 2)));
  return { x: 0, y, width, height: cropH };
}

export async function encodePublicDerivative(masterBytes, placement) {
  const master = Buffer.from(masterBytes);
  const checksum = createHash('sha256').update(master).digest('hex');
  const meta = await sharp(master, { failOn: 'none' }).metadata();
  if (!meta.width || !meta.height) throw new Error('IMAGE_HEADER_INVALID');
  const crop = cropWindow({
    width: meta.width,
    height: meta.height,
    targetRatio: placement.ratio,
    focal: placement.focal,
    mode: placement.mode,
  });
  const targetWidth = WIDTHS.find(width => width >= placement.displayWidth) ?? WIDTHS[WIDTHS.length - 1];
  const outWidth = Math.max(1, Math.min(targetWidth, crop.width));
  const outHeight = Math.max(1, Math.round(outWidth * crop.height / crop.width));
  const pipeline = sharp(master, { failOn: 'none' }).extract({
    left: crop.x,
    top: crop.y,
    width: crop.width,
    height: crop.height,
  }).resize(outWidth, outHeight);
  const webp = await pipeline.clone().webp({ quality: 78 }).toBuffer();
  const avif = await pipeline.clone().avif({ quality: 45 }).toBuffer();
  const jpeg = await pipeline.clone().jpeg({ quality: 78 }).toBuffer();
  if (!master.equals(Buffer.from(masterBytes))) throw new Error('MASTER_MUTATED');
  return {
    masterChecksum: checksum,
    crop,
    webp,
    avif,
    jpeg,
    width: outWidth,
    height: outHeight,
  };
}
