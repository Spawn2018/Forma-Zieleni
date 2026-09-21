import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const suites = [
  {
    test: 'labs/fz-cms-1/native/native.test.mjs',
    lint: [
      'labs/fz-cms-1/native/native.test.mjs',
      'labs/fz-cms-1/native/src/png.mjs',
      'labs/fz-cms-1/native/src/media.mjs',
      'labs/fz-cms-1/native/src/content.mjs',
      'labs/fz-cms-1/native/src/gallery.mjs',
      'labs/fz-cms-1/schemas/payload-collections.mjs',
      'labs/fz-cms-1/schemas/apostrophe-modules.mjs',
    ],
  },
  {
    test: 'labs/fz-cms-1/media/process.test.mjs',
    lint: [
      'labs/fz-cms-1/media/process.test.mjs',
      'labs/fz-cms-1/media/src/process.mjs',
      'labs/fz-cms-1/media/src/jpeg-gps.mjs',
    ],
  },
  {
    test: 'labs/fz-cms-1/www-proto/proto.test.mjs',
    lint: [
      'labs/fz-cms-1/www-proto/proto.test.mjs',
      'labs/fz-cms-1/www-proto/src/gallery.mjs',
      'labs/fz-cms-1/www-proto/src/before-after.mjs',
      'labs/fz-cms-1/www-proto/src/libraries.mjs',
    ],
  },
  {
    test: 'labs/fz-cms-1/vendors/vendor-status.test.mjs',
    lint: [
      'labs/fz-cms-1/vendors/vendor-status.test.mjs',
      'labs/fz-cms-1/vendors/strapi-exercise.mjs',
      'labs/fz-cms-1/vendors/payload-exercise.mjs',
      'labs/fz-cms-1/vendors/apos-exercise.mjs',
      'labs/fz-cms-1/vendors/try-vendors.mjs',
    ],
  },
];

const lint = process.argv.includes('--lint');
let ran = 0;

for (const suite of suites) {
  const abs = path.join(root, suite.test);
  if (!existsSync(abs)) continue;
  ran += 1;
  if (lint) {
    for (const file of suite.lint) {
      const result = spawnSync(process.execPath, ['--check', path.join(root, file)], {
        cwd: root,
        stdio: 'inherit',
        windowsHide: true,
      });
      if (result.status !== 0) process.exit(result.status ?? 1);
    }
    continue;
  }
  const result = spawnSync(process.execPath, ['--test', abs], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (ran === 0) {
  console.log('cms-lab-gate: skipped (labs/fz-cms-1 absent)');
}
