import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (~crc) >>> 0;
}

function chunk(type, data) {
  const header = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([header, data])));
  return Buffer.concat([length, header, data, crc]);
}

export function writePng({ width, height, rgba }) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function syntheticImage(kind) {
  const sizes = {
    landscape: [1600, 900],
    portrait: [900, 1600],
    square: [800, 800],
    panorama: [2400, 600],
    large: [3600, 2400],
    small: [240, 160],
    transparent: [640, 480],
  };
  const [width, height] = sizes[kind];
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      rgba[i] = kind === 'portrait' ? 40 : 70 + Math.floor((x / width) * 80);
      rgba[i + 1] = kind === 'landscape' ? 90 : 110;
      rgba[i + 2] = 70;
      rgba[i + 3] = kind === 'transparent' && x < width / 8 ? 0 : 255;
    }
  }
  const bytes = writePng({ width, height, rgba });
  return {
    kind,
    width,
    height,
    bytes,
    checksum: createHash('sha256').update(bytes).digest('hex'),
    mime: 'image/png',
  };
}
