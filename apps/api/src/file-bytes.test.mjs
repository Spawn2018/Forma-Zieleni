import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readProjectFileBytes, storeProjectFileBytes } from './file-bytes.ts';

test('local private adapter stores checksummed bytes without a public URL', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-file-bytes-'));
  try {
    const bytes = Buffer.from('synthetic-plan-bytes');
    const stored = await storeProjectFileBytes({
      root,
      fileId: 'fileabcdefghijklmnop',
      bytes,
      expectedSizeBytes: bytes.length,
    });
    assert.equal(stored.publicUrl, null);
    assert.equal(stored.sizeBytes, bytes.length);
    assert.match(stored.checksum, /^[a-f0-9]{64}$/);
    assert.equal(stored.relativePath.includes('public'), false);

    const again = await storeProjectFileBytes({
      root,
      fileId: 'fileabcdefghijklmnop',
      bytes,
      expectedSizeBytes: bytes.length,
    });
    assert.equal(again.checksum, stored.checksum);

    const read = await readProjectFileBytes({ root, fileId: 'fileabcdefghijklmnop' });
    assert.ok(read);
    assert.equal(read.checksum, stored.checksum);
    assert.ok(read.bytes.equals(bytes));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('size mismatch and empty payload are denied', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-file-bytes-'));
  try {
    await assert.rejects(
      () => storeProjectFileBytes({
        root,
        fileId: 'fileabcdefghijklmnop',
        bytes: Buffer.from('abc'),
        expectedSizeBytes: 99,
      }),
      /FILE_BYTES_SIZE_MISMATCH/,
    );
    await assert.rejects(
      () => storeProjectFileBytes({
        root,
        fileId: 'fileabcdefghijklmnop',
        bytes: Buffer.alloc(0),
        expectedSizeBytes: 0,
      }),
      /FILE_BYTES_SIZE_DENIED/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
