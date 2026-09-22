import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createMediaLibrary } from './library.mjs';

export function createMediaRestoreBundle(library, root) {
  const assets = [];
  for (const asset of library.assets.values()) {
    assets.push({
      id: asset.id,
      checksum: asset.checksum,
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      bytes: asset.bytes,
      relativePath: asset.relativePath,
      publicUrl: null,
    });
  }
  const references = [];
  for (const [assetId, owners] of library.references.entries()) {
    for (const ownerId of owners) references.push({ assetId, ownerId });
  }
  return {
    kind: 'fz-cms-media-restore',
    version: 1,
    rootMarker: path.basename(root),
    assets,
    references,
  };
}

export async function materializeMediaBackup(library, root, backupRoot) {
  await rm(backupRoot, { recursive: true, force: true });
  await mkdir(backupRoot, { recursive: true });
  const bundle = createMediaRestoreBundle(library, root);
  for (const asset of bundle.assets) {
    const source = path.resolve(root, ...asset.relativePath.split('/'));
    const target = path.resolve(backupRoot, ...asset.relativePath.split('/'));
    if (!target.startsWith(path.resolve(backupRoot) + path.sep)) throw new Error('PATH_ESCAPE');
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
  await writeFile(path.join(backupRoot, 'manifest.json'), JSON.stringify(bundle, null, 2));
  return bundle;
}

export async function restoreMediaFromBackup(backupRoot, restoreRoot) {
  const manifest = JSON.parse(await readFile(path.join(backupRoot, 'manifest.json'), 'utf8'));
  if (manifest.kind !== 'fz-cms-media-restore' || manifest.version !== 1) {
    throw new Error('MEDIA_RESTORE_INVALID');
  }
  await rm(restoreRoot, { recursive: true, force: true });
  await mkdir(restoreRoot, { recursive: true });
  const library = createMediaLibrary();
  for (const asset of manifest.assets) {
    const source = path.resolve(backupRoot, ...asset.relativePath.split('/'));
    const target = path.resolve(restoreRoot, ...asset.relativePath.split('/'));
    if (!target.startsWith(path.resolve(restoreRoot) + path.sep)) throw new Error('PATH_ESCAPE');
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    const bytes = await readFile(target);
    const checksum = createHash('sha256').update(bytes).digest('hex');
    if (checksum !== asset.checksum) throw new Error('MASTER_CHECKSUM_MISMATCH');
    library.assets.set(asset.id, {
      id: asset.id,
      checksum: asset.checksum,
      mime: asset.mime,
      width: asset.width,
      height: asset.height,
      bytes: asset.bytes,
      relativePath: asset.relativePath,
      publicUrl: null,
    });
    library.references.set(asset.id, new Set());
  }
  for (const ref of manifest.references) {
    const owners = library.references.get(ref.assetId);
    if (!owners) throw new Error('ASSET_NOT_FOUND');
    owners.add(ref.ownerId);
  }
  return { library, manifest };
}
