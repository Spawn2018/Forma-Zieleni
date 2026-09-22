import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');

test('CI workflow verifies main and does not deploy', () => {
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\n {2}contents: read/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /node-version: 24/);
  assert.match(workflow, /pnpm@10\.33\.2/);
  assert.match(workflow, /--frozen-lockfile/);
  assert.match(workflow, /--ignore-workspace/);
  assert.match(workflow, /fetch-depth: 0/);
  for (const command of ['pnpm docs:check', 'pnpm typecheck', 'pnpm lint', 'pnpm test', 'pnpm repo:check', 'pnpm readme:check', 'pnpm audit --audit-level=moderate']) {
    assert.equal(workflow.includes(command), true, command);
  }
  assert.match(workflow, /runs-on: windows-latest/);
  assert.match(workflow, /native-process\.test\.mjs/);
  assert.match(workflow, /scripts\/ci\/no-skip\.mjs/);
  assert.equal(workflow.includes('pull_request_target'), false);
  assert.equal(workflow.includes('secrets.'), false);
  assert.equal(workflow.includes('contents: write'), false);
  assert.equal(/deploy|cloudflare|wrangler|npm publish/i.test(workflow), false);
});
