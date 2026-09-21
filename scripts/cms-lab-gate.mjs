import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const labTest = path.join(root, 'labs/fz-cms-1/native/native.test.mjs');
const lintFiles = [
  'labs/fz-cms-1/native/native.test.mjs',
  'labs/fz-cms-1/native/src/png.mjs',
  'labs/fz-cms-1/native/src/media.mjs',
  'labs/fz-cms-1/native/src/content.mjs',
  'labs/fz-cms-1/native/src/gallery.mjs',
  'labs/fz-cms-1/schemas/payload-collections.mjs',
  'labs/fz-cms-1/schemas/apostrophe-modules.mjs',
];

if (!existsSync(labTest)) {
  console.log('cms-lab-gate: skipped (labs/fz-cms-1 absent)');
  process.exit(0);
}

const lint = process.argv.includes('--lint');
if (lint) {
  for (const file of lintFiles) {
    const result = spawnSync(process.execPath, ['--check', path.join(root, file)], {
      cwd: root,
      stdio: 'inherit',
      windowsHide: true,
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
  process.exit(0);
}

const result = spawnSync(process.execPath, ['--test', labTest], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
});
process.exit(result.status ?? 1);
