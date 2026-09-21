import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { doraFromEvents, incorporate, learningDebt, pushBlockers, transition } from './policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const learningDir = path.resolve(root, 'docs', 'engineering', 'learning');

function inside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

export function resolveStore(file = storeFile()) {
  const resolved = path.resolve(file);
  const parent = path.dirname(resolved);
  const allowed = path.basename(resolved) === 'records.json'
    && (parent === learningDir || inside(path.resolve(tmpdir()), parent));
  if (!allowed) throw Object.assign(new Error('REFUSED_PATH'), { code: 'REFUSED_PATH' });
  return resolved;
}

export function storeFile() {
  return path.resolve(process.env.FZ_CIS_STORE || path.join(root, 'docs', 'engineering', 'learning', 'records.json'));
}

export function newId(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `LR-${y}${m}${d}-${randomBytes(4).toString('hex')}`;
}

export function loadStore(file = storeFile()) {
  const resolved = resolveStore(file);
  if (!existsSync(resolved)) throw Object.assign(new Error('MISSING_STORE'), { code: 'MISSING_STORE' });
  const parsed = JSON.parse(readFileSync(resolved, 'utf8'));
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.records)) {
    throw Object.assign(new Error('INVALID_STORE'), { code: 'INVALID_STORE' });
  }
  return parsed;
}

export function saveStore(store, file = storeFile()) {
  const resolved = resolveStore(file);
  if (store.version !== 1 || !Array.isArray(store.records)) {
    throw Object.assign(new Error('INVALID_STORE'), { code: 'INVALID_STORE' });
  }
  writeFileSync(resolved, `${JSON.stringify(store, null, 2)}\n`);
  return { wroteCanon: false, file: resolved };
}

export function addRecord(input, file = storeFile()) {
  const store = loadStore(file);
  const result = incorporate(store.records, { ...input, id: input.id || newId() });
  if (!result.ok) {
    const err = new Error(result.errors.join(','));
    err.code = result.errors[0];
    err.errors = result.errors;
    throw err;
  }
  saveStore({ version: 1, records: result.records }, file);
  return { ...result, wroteCanon: false };
}

export function changeStatus(id, next, extra = {}, file = storeFile()) {
  if (typeof id !== 'string' || id.includes('/') || id.includes('\\') || id.includes('..')) {
    throw Object.assign(new Error('REFUSED_PATH'), { code: 'REFUSED_PATH' });
  }
  const store = loadStore(file);
  const current = store.records.find((record) => record.id === id);
  if (!current) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  const updated = transition(current, next, extra);
  saveStore({
    version: 1,
    records: store.records.map((record) => (record.id === id ? updated : record)),
  }, file);
  return { record: updated, wroteCanon: false };
}

export function reportDebt(file = storeFile()) {
  return learningDebt(loadStore(file).records);
}

export function reportBlockers(file = storeFile()) {
  return pushBlockers(loadStore(file).records);
}

export function reportDora(events) {
  return doraFromEvents(events);
}
