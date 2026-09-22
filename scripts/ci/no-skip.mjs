import { spawnSync } from 'node:child_process';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/ci/no-skip.mjs <test-file>...');
  process.exit(2);
}

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.startsWith('NODE_TEST') || key.startsWith('NODE_CHANNEL')) delete env[key];
}

const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
  encoding: 'utf8',
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);

const skipped = (result.stdout ?? '').match(/# SKIP\b/g)?.length ?? 0;
if (skipped > 0) {
  console.error(`no-skip: ${skipped} skipped test(s)`);
  process.exit(1);
}
