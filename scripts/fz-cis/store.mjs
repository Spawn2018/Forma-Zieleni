import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeLearning } from './analysis.mjs';
import {
  applyEffectObservation,
  applyEffectPlan,
  evaluateEffect,
  refreshEffectState,
} from './effect.mjs';
import { doraFromEvents, incorporate, learningDebt, pushBlockers, transition, validateRecord } from './policy.mjs';

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

function refuseId(id) {
  if (typeof id !== 'string' || id.includes('/') || id.includes('\\') || id.includes('..')) {
    throw Object.assign(new Error('REFUSED_PATH'), { code: 'REFUSED_PATH' });
  }
}

function findRecord(store, id) {
  const current = store.records.find((record) => record.id === id);
  if (!current) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  return current;
}

function writeRecord(store, updated, file) {
  saveStore({
    version: 1,
    records: store.records.map((record) => (record.id === updated.id ? updated : record)),
  }, file);
  return { record: updated, wroteCanon: false };
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

export function changeStatus(id, next, extra = {}, file = storeFile(), options = {}) {
  refuseId(id);
  const store = loadStore(file);
  const current = findRecord(store, id);
  const updated = transition(current, next, extra, options);
  return writeRecord(store, updated, file);
}

/**
 * Mark an external finding as locally verified without promoting it.
 * Does not change lifecycle status.
 */
export function markLocallyVerified(id, extra = {}, file = storeFile()) {
  refuseId(id);
  const store = loadStore(file);
  const current = findRecord(store, id);
  const appended = (extra.evidence || []).map(String);
  const probe = validateRecord({
    ...current,
    evidence: appended.length > 0 ? appended : current.evidence,
  }, 'stored');
  if (!probe.ok && (probe.errors.includes('SECRET_REJECTED') || probe.errors.includes('PII_REJECTED')
    || probe.errors.includes('FORBIDDEN_FIELD') || probe.errors.includes('VALUE_TOO_LONG'))) {
    throw Object.assign(new Error(probe.errors[0]), { code: probe.errors[0], errors: probe.errors });
  }
  for (const item of appended) {
    if (/-----BEGIN |AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9\-._~+/]{20,}|password\s*[:=]\s*\S+|api[_-]?key\s*[:=]\s*\S+/i.test(item)) {
      throw Object.assign(new Error('SECRET_REJECTED'), { code: 'SECRET_REJECTED' });
    }
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(item)) {
      throw Object.assign(new Error('PII_REJECTED'), { code: 'PII_REJECTED' });
    }
  }
  const evidence = [...new Set([
    ...(current.evidence || []),
    ...appended,
  ])].slice(0, 20);
  const updated = {
    ...current,
    locallyVerified: true,
    evidence,
    lastSeen: new Date().toISOString(),
  };
  return writeRecord(store, updated, file);
}

export function setEffectPlan(id, plan, extra = {}, file = storeFile()) {
  refuseId(id);
  const store = loadStore(file);
  const current = findRecord(store, id);
  let updated = applyEffectPlan(current, plan);
  if (extra.controlRef) updated.controlRef = String(extra.controlRef);
  if (extra.controlCommit) updated.controlCommit = String(extra.controlCommit);
  updated = refreshEffectState(updated);
  updated.lastSeen = new Date().toISOString();
  return writeRecord(store, updated, file);
}

export function recordEffectObservation(id, observation, file = storeFile()) {
  refuseId(id);
  const store = loadStore(file);
  const current = findRecord(store, id);
  const result = applyEffectObservation(current, observation);
  result.record.lastSeen = new Date().toISOString();
  writeRecord(store, result.record, file);
  return {
    record: result.record,
    added: result.added,
    duplicate: result.duplicate,
    evaluation: result.evaluation,
    wroteCanon: false,
  };
}

export function evaluateRecordEffect(id, file = storeFile()) {
  refuseId(id);
  const store = loadStore(file);
  const current = findRecord(store, id);
  const evaluation = evaluateEffect(current);
  const refreshed = refreshEffectState(current);
  if (refreshed.effectState !== current.effectState) {
    writeRecord(store, refreshed, file);
  }
  return { record: refreshed, evaluation, wroteCanon: false };
}

export function reportCheck(file = storeFile(), options = {}) {
  const store = loadStore(file);
  const analysis = analyzeLearning(store.records, options);
  return {
    ...analysis,
    storeVersion: store.version,
    recordCount: store.records.length,
    checkedAt: new Date().toISOString(),
  };
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
