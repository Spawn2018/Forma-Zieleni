import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyRegions } from './regions.mjs';
import { loadPublicSnapshot, renderDocumentationCatalog, renderProgress } from './status.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readmePath = path.join(root, 'README.md');

export function projectReadme(text, snapshot = loadPublicSnapshot(root)) {
  return applyRegions(text, {
    progress() {
      return renderProgress(snapshot);
    },
    docs() {
      return renderDocumentationCatalog(root);
    },
  });
}

function run(mode) {
  const before = readFileSync(readmePath, 'utf8');
  const after = projectReadme(before);
  if (before === after) {
    console.log(`readme: ${mode} unchanged`);
    return;
  }
  if (mode === 'check') {
    throw new Error('readme: stale machine-owned region');
  }
  const temporary = `${readmePath}.tmp`;
  writeFileSync(temporary, after);
  renameSync(temporary, readmePath);
  console.log('readme: wrote machine-owned regions');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode !== 'check' && mode !== 'write') {
    console.error('usage: node scripts/readme/cli.mjs check|write');
    process.exit(2);
  }
  try {
    run(mode);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
