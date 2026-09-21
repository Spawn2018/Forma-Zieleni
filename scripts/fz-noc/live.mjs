import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function repoRoot() {
  if (process.env.FZ_NOC_ROOT) return process.env.FZ_NOC_ROOT;
  if (process.env.CURSOR_PROJECT_DIR) return process.env.CURSOR_PROJECT_DIR;
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
}

export function livePath(root = repoRoot()) {
  return process.env.FZ_NOC_LIVE || path.join(root, '.fz-noc', 'live.json');
}

export function readSession(file = livePath()) {
  try {
    const value = JSON.parse(readFileSync(file, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeSession(session, file = livePath()) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(session, null, 2)}\n`);
  renameSync(temporary, file);
}
