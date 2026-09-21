import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 16_000;
const MAX_PIXELS = 40_000_000;

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function sniffImage(bytes) {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'image/webp';
  return null;
}

export function imageDimensions(bytes, mime) {
  if (mime === 'image/png') return pngSize(bytes);
  if (mime === 'image/jpeg') return jpegSize(bytes);
  if (mime === 'image/webp') return webpSize(bytes);
  throw new Error('MIME_DENIED');
}

export async function storeMaster(options) {
  const bytes = Buffer.from(options.bytes);
  if (bytes.length === 0 || bytes.length > MAX_BYTES) throw new Error('MEDIA_SIZE_DENIED');
  const mime = sniffImage(bytes);
  if (!mime || !ALLOWED.has(mime)) throw new Error('MIME_DENIED');
  if (options.declaredMime && options.declaredMime !== mime) throw new Error('MIME_MISMATCH');
  const { width, height } = imageDimensions(bytes, mime);
  if (width < 1 || height < 1 || width > MAX_EDGE || height > MAX_EDGE || width * height > MAX_PIXELS) {
    throw new Error('PIXEL_BOMB');
  }
  const checksum = createHash('sha256').update(bytes).digest('hex');
  const relativePath = path.posix.join('masters', checksum.slice(0, 2), checksum);
  const root = path.resolve(options.root);
  const absolute = path.resolve(root, ...relativePath.split('/'));
  if (!absolute.startsWith(root + path.sep)) throw new Error('PATH_ESCAPE');
  if (absolute.includes(`${path.sep}public${path.sep}`)) throw new Error('PUBLIC_PATH_DENIED');
  await mkdir(path.dirname(absolute), { recursive: true });
  try {
    await writeFile(absolute, bytes, { flag: 'wx' });
  } catch (error) {
    if (!error || error.code !== 'EEXIST') throw error;
    const existing = await readFile(absolute);
    if (!existing.equals(bytes)) throw new Error('MASTER_IMMUTABLE');
  }
  const stored = await stat(absolute);
  return {
    checksum,
    mime,
    width,
    height,
    bytes: stored.size,
    relativePath,
    publicUrl: null,
  };
}

function pngSize(bytes) {
  if (ascii(bytes, 12, 4) !== 'IHDR') throw new Error('IMAGE_HEADER_INVALID');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegSize(bytes) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('IMAGE_HEADER_INVALID');
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error('IMAGE_HEADER_INVALID');
}

function webpSize(bytes) {
  if (ascii(bytes, 12, 4) !== 'VP8X' || bytes.length < 30) throw new Error('IMAGE_HEADER_INVALID');
  const width = 1 + bytes.readUIntLE(24, 3);
  const height = 1 + bytes.readUIntLE(27, 3);
  return { width, height };
}

function ascii(bytes, start, length) {
  return bytes.subarray(start, start + length).toString('ascii');
}
