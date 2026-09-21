import { referenceAsset } from './library.mjs';

export function createCollectionStore(library) {
  return { library, collections: new Map() };
}

export function createCollection(store, id) {
  if (store.collections.has(id)) throw new Error('COLLECTION_EXISTS');
  const collection = { id, items: [], heroId: null, beforeAfter: null };
  store.collections.set(id, collection);
  return collection;
}

export function addToCollection(store, collectionId, assetId, fields = {}) {
  const collection = must(store, collectionId);
  if (!store.library.assets.has(assetId)) throw new Error('ASSET_NOT_FOUND');
  if (collection.items.some(item => item.assetId === assetId)) throw new Error('ASSET_ALREADY_PLACED');
  referenceAsset(store.library, assetId, collectionId);
  collection.items.push({
    assetId,
    caption: text(fields.caption),
    alt: text(fields.alt),
    focal: point(fields.focal),
    safeRegion: point(fields.safeRegion),
  });
}

export function updatePlacement(store, collectionId, assetId, fields) {
  const item = mustItem(store, collectionId, assetId);
  if ('caption' in fields) item.caption = text(fields.caption);
  if ('alt' in fields) item.alt = text(fields.alt);
  if ('focal' in fields) item.focal = point(fields.focal);
  if ('safeRegion' in fields) item.safeRegion = point(fields.safeRegion);
}

export function reorderCollection(store, collectionId, assetIds) {
  const collection = must(store, collectionId);
  if (assetIds.length !== collection.items.length || new Set(assetIds).size !== assetIds.length) {
    throw new Error('REORDER_MISMATCH');
  }
  const byId = new Map(collection.items.map(item => [item.assetId, item]));
  collection.items = assetIds.map(id => {
    const item = byId.get(id);
    if (!item) throw new Error('REORDER_UNKNOWN');
    return item;
  });
}

export function setHero(store, collectionId, assetId) {
  mustItem(store, collectionId, assetId);
  must(store, collectionId).heroId = assetId;
}

export function setBeforeAfter(store, collectionId, beforeId, afterId) {
  if (beforeId === afterId) throw new Error('PAIR_IDENTICAL');
  mustItem(store, collectionId, beforeId);
  mustItem(store, collectionId, afterId);
  must(store, collectionId).beforeAfter = { beforeId, afterId };
}

function must(store, collectionId) {
  const collection = store.collections.get(collectionId);
  if (!collection) throw new Error('COLLECTION_ABSENT');
  return collection;
}

function mustItem(store, collectionId, assetId) {
  const item = must(store, collectionId).items.find(entry => entry.assetId === assetId);
  if (!item) throw new Error('PLACEMENT_ABSENT');
  return item;
}

function text(value) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > 500) throw new Error('TEXT_INVALID');
  return value;
}

function point(value) {
  if (value == null) return null;
  if (!value || typeof value.x !== 'number' || typeof value.y !== 'number') throw new Error('POINT_INVALID');
  if (value.x < 0 || value.x > 1 || value.y < 0 || value.y > 1) throw new Error('POINT_INVALID');
  return { x: value.x, y: value.y };
}
