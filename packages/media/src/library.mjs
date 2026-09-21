import { storeMaster } from './master.mjs';

export function createMediaLibrary() {
  return { assets: new Map(), references: new Map() };
}

export async function ingestBatch(library, files, root, onProgress) {
  const results = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    try {
      const stored = await storeMaster({ root, bytes: file.bytes, declaredMime: file.declaredMime });
      const existing = [...library.assets.values()].find(asset => asset.checksum === stored.checksum);
      const asset = existing ?? { id: file.id, ...stored };
      if (!existing) library.assets.set(asset.id, asset);
      if (!library.references.has(asset.id)) library.references.set(asset.id, new Set());
      results.push({ ok: true, id: asset.id, checksum: asset.checksum, duplicate: Boolean(existing) });
    } catch (error) {
      results.push({ ok: false, id: file.id, code: error instanceof Error ? error.message : 'MEDIA_FAILED' });
    }
    if (onProgress) onProgress({ completed: index + 1, total: files.length });
  }
  return results;
}

export function referenceAsset(library, assetId, ownerId) {
  const owners = library.references.get(assetId);
  if (!owners) throw new Error('ASSET_NOT_FOUND');
  owners.add(ownerId);
}

export function deleteAsset(library, assetId) {
  const owners = library.references.get(assetId);
  if (!owners) throw new Error('ASSET_NOT_FOUND');
  if (owners.size > 0) throw new Error('ASSET_REFERENCED');
  library.assets.delete(assetId);
  library.references.delete(assetId);
}
