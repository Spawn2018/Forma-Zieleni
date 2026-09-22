import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allowlistIsSafe,
  classifyObservedPrompt,
  loadProjectPermissions,
  terminalAllowlistCovers,
} from './permissions.mjs';
import { classifyMcp, classifyShell } from './policy.mjs';

test('project permissions.json exists and has a safe narrow allowlist', () => {
  const permissions = loadProjectPermissions();
  assert.ok(Array.isArray(permissions.terminalAllowlist));
  assert.ok(permissions.terminalAllowlist.length > 10);
  assert.deepEqual(allowlistIsSafe(permissions.terminalAllowlist), []);
  assert.equal(permissions.terminalAllowlist.includes('git'), false);
  assert.equal(permissions.terminalAllowlist.some((entry) => entry.startsWith('git push')), false);
  assert.ok(Array.isArray(permissions.autoRun.allow_instructions));
  assert.ok(Array.isArray(permissions.autoRun.block_instructions));
});

test('observed safe prompts classify as SAFE_* and are covered by the allowlist', () => {
  const cases = [
    ['git show HEAD', 'SAFE_READ_ONLY'],
    ['git status -sb', 'SAFE_READ_ONLY'],
    ['git diff --stat HEAD', 'SAFE_READ_ONLY'],
    ['Select-String -Pattern loop-noc', 'SAFE_READ_ONLY'],
    ['Select-Object Id,ProcessName', 'SAFE_READ_ONLY'],
    ['Measure-Object', 'SAFE_READ_ONLY'],
    ['Write-Host hello', 'SAFE_READ_ONLY'],
    ['node --test scripts/fz-noc/policy.test.mjs', 'SAFE_VERIFICATION'],
    ['pnpm docs:check', 'SAFE_VERIFICATION'],
    ['git add docs/architecture/NEXT-SLICES-MAIN.md', 'SAFE_CHECKPOINT_GIT'],
    ['git commit -m msg', 'SAFE_CHECKPOINT_GIT'],
    ['pnpm push:main', 'SAFE_CHECKPOINT_GIT'],
  ];
  for (const [command, expected] of cases) {
    assert.equal(classifyObservedPrompt(command), expected, command);
    if (expected !== 'SAFE_CHECKPOINT_GIT' || !command.startsWith('pnpm push')) {
      assert.equal(terminalAllowlistCovers(command), true, command);
    }
  }
  assert.equal(classifyObservedPrompt('git push origin main'), 'DANGEROUS');
  assert.equal(terminalAllowlistCovers('git push origin main'), false);
  assert.equal(terminalAllowlistCovers('pnpm push:main'), true);
});

test('dangerous and owner-gated prompts stay denied or classified away from allow', () => {
  for (const command of [
    'git push --force',
    'git push --force-with-lease',
    'git push --mirror',
    'git push origin --delete branch',
    'git reset --hard HEAD~1',
    'git clean -fdx',
    'wrangler deploy',
  ]) {
    assert.equal(classifyShell(command).permission, 'deny', command);
    assert.equal(classifyObservedPrompt(command), 'DANGEROUS', command);
  }
  assert.equal(classifyMcp({ tool_name: 'kv_namespace_delete', mcp_server_name: 'cloudflare' }).permission, 'deny');
  assert.equal(classifyObservedPrompt('coderabbit login with api_key'), 'OWNER_GATE');
});

test('allowlistIsSafe rejects bare git and force-capable prefixes', () => {
  assert.ok(allowlistIsSafe(['git']).length > 0);
  assert.ok(allowlistIsSafe(['git push']).length > 0);
  assert.ok(allowlistIsSafe(['git reset --hard']).length > 0);
  assert.ok(allowlistIsSafe(['wrangler']).length > 0);
  assert.ok(allowlistIsSafe(['powershell']).length > 0);
  assert.deepEqual(allowlistIsSafe(['git show', 'Select-String', 'node']), []);
});
