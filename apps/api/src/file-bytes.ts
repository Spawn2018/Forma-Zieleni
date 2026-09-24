import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Local private project-file bytes (FZ-A4). Not a public URL and not Garage. */
export const FILE_BYTES_MAX = 25 * 1024 * 1024;

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../private/project-files');

export type StoredFileBytes = {
  checksum: string;
  sizeBytes: number;
  relativePath: string;
  publicUrl: null;
};

export function defaultFileBytesRoot(): string {
  return DEFAULT_ROOT;
}

function resolveUnderRoot(root: string, relativePosix: string): string {
  const absolute = path.resolve(root, ...relativePosix.split('/'));
  if (!absolute.startsWith(root + path.sep) && absolute !== root) throw new Error('PATH_ESCAPE');
  if (absolute.includes(`${path.sep}public${path.sep}`)) throw new Error('PUBLIC_PATH_DENIED');
  return absolute;
}

export async function storeProjectFileBytes(options: {
  root?: string;
  fileId: string;
  bytes: Uint8Array | Buffer;
  expectedSizeBytes: number;
}): Promise<StoredFileBytes> {
  const root = path.resolve(options.root ?? DEFAULT_ROOT);
  const bytes = Buffer.from(options.bytes);
  if (bytes.length === 0 || bytes.length > FILE_BYTES_MAX) throw new Error('FILE_BYTES_SIZE_DENIED');
  if (bytes.length !== options.expectedSizeBytes) throw new Error('FILE_BYTES_SIZE_MISMATCH');
  const checksum = createHash('sha256').update(bytes).digest('hex');
  const objectRelative = path.posix.join('objects', checksum.slice(0, 2), checksum);
  const indexRelative = path.posix.join('index', options.fileId.slice(0, 2), `${options.fileId}.json`);
  const objectAbsolute = resolveUnderRoot(root, objectRelative);
  const indexAbsolute = resolveUnderRoot(root, indexRelative);
  await mkdir(path.dirname(objectAbsolute), { recursive: true });
  await mkdir(path.dirname(indexAbsolute), { recursive: true });
  try {
    await writeFile(objectAbsolute, bytes, { flag: 'wx' });
  } catch (error) {
    if (!error || (error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const existing = await readFile(objectAbsolute);
    if (!existing.equals(bytes)) throw new Error('FILE_BYTES_IMMUTABLE');
  }
  const record = {
    fileId: options.fileId,
    checksum,
    sizeBytes: bytes.length,
    objectRelative,
    // Non-guessable opaque token kept off API responses.
    objectToken: randomBytes(16).toString('hex'),
  };
  try {
    await writeFile(indexAbsolute, `${JSON.stringify(record)}\n`, { flag: 'wx' });
  } catch (error) {
    if (!error || (error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const existingRaw = await readFile(indexAbsolute);
    const existing = JSON.parse(existingRaw.toString('utf8')) as { checksum?: string; sizeBytes?: number; objectRelative?: string };
    if (existing.checksum !== checksum || existing.sizeBytes !== bytes.length || existing.objectRelative !== objectRelative) {
      throw new Error('FILE_BYTES_IMMUTABLE');
    }
  }
  return {
    checksum,
    sizeBytes: bytes.length,
    relativePath: objectRelative,
    publicUrl: null,
  };
}

export async function readProjectFileBytes(options: {
  root?: string;
  fileId: string;
}): Promise<{ bytes: Buffer; checksum: string; sizeBytes: number } | null> {
  const root = path.resolve(options.root ?? DEFAULT_ROOT);
  const indexRelative = path.posix.join('index', options.fileId.slice(0, 2), `${options.fileId}.json`);
  let indexAbsolute: string;
  try {
    indexAbsolute = resolveUnderRoot(root, indexRelative);
  } catch {
    return null;
  }
  let raw: Buffer;
  try {
    raw = await readFile(indexAbsolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const record = JSON.parse(raw.toString('utf8')) as { checksum?: string; sizeBytes?: number; objectRelative?: string };
  if (!record.checksum || !record.objectRelative || typeof record.sizeBytes !== 'number') {
    throw new Error('FILE_BYTES_INDEX_INVALID');
  }
  const objectAbsolute = resolveUnderRoot(root, record.objectRelative);
  const bytes = await readFile(objectAbsolute);
  const checksum = createHash('sha256').update(bytes).digest('hex');
  if (checksum !== record.checksum || bytes.length !== record.sizeBytes) {
    throw new Error('FILE_BYTES_CORRUPT');
  }
  return { bytes, checksum, sizeBytes: bytes.length };
}
