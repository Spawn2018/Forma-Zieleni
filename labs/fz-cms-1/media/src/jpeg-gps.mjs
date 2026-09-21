function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

function rational(numerator, denominator = 1_000_000) {
  return Buffer.concat([u32(numerator), u32(denominator)]);
}

function ifdEntry(tag, type, count, valueOffsetOrInline) {
  return Buffer.concat([u16(tag), u16(type), u32(count), u32(valueOffsetOrInline)]);
}

export const SYNTHETIC_GPS = { lat: 12.345678, lon: 98.765432 };

export function jpegWithSyntheticGps(jpeg) {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error('NOT_JPEG');
  const lat = Math.round(SYNTHETIC_GPS.lat * 1_000_000);
  const lon = Math.round(SYNTHETIC_GPS.lon * 1_000_000);
  const gpsValues = Buffer.concat([
    Buffer.from('N\0'),
    rational(lat),
    rational(0),
    rational(0),
    Buffer.from('E\0'),
    rational(lon),
    rational(0),
    rational(0),
  ]);
  const tiffHeaderSize = 8;
  const ifd0Count = 1;
  const ifd0Size = 2 + 12 + 4;
  const gpsIfdOffset = tiffHeaderSize + ifd0Size;
  const gpsCount = 4;
  const gpsIfdSize = 2 + 12 * gpsCount + 4;
  const gpsValuesOffset = gpsIfdOffset + gpsIfdSize;
  const gpsIfd = Buffer.concat([
    u16(gpsCount),
    ifdEntry(0x0001, 2, 2, gpsValuesOffset),
    ifdEntry(0x0002, 5, 3, gpsValuesOffset + 2),
    ifdEntry(0x0003, 2, 2, gpsValuesOffset + 26),
    ifdEntry(0x0004, 5, 3, gpsValuesOffset + 28),
    u32(0),
  ]);
  const ifd0 = Buffer.concat([
    u16(ifd0Count),
    ifdEntry(0x8825, 4, 1, gpsIfdOffset),
    u32(0),
  ]);
  const tiff = Buffer.concat([
    Buffer.from('II*\0'),
    u32(8),
    ifd0,
    gpsIfd,
    gpsValues,
  ]);
  const exif = Buffer.concat([Buffer.from('Exif\0\0'), tiff]);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), u16be(exif.length + 2), exif]);
  return Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]);
}

function u16be(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value);
  return buffer;
}

export function bufferMentionsSyntheticGps(buffer) {
  return buffer.includes(Buffer.from('N\0')) && buffer.includes(Buffer.from('E\0')) && buffer.includes(Buffer.from([0x25, 0x88]));
}
