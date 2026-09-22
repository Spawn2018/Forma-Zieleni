/**
 * Cursor Approvals & Execution alignment for Forma Zieleni /noc.
 * This module owns classification of observed shell prompts and guards
 * the committed .cursor/permissions.json allowlist INTENT file.
 *
 * Cursor 3.21.16: project .cursor/permissions.json is schema-valid but
 * repository-level terminalAllowlist is NOT applied to the IDE Shell
 * allowlist UI (Cursor staff, 2026-08-10). Auto-review must keep using
 * the IDE-managed allowlist. Do not write ~/.cursor/permissions.json
 * terminalAllowlist while Auto-review must stay selected (forces
 * Allowlist mode). Decision Gates remain in policy.mjs.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyShell } from './policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PERMISSIONS_PATH = path.join(root, '.cursor', 'permissions.json');

export const PROMPT_CLASSES = Object.freeze([
  'SAFE_READ_ONLY',
  'SAFE_REPO_LOCAL',
  'SAFE_VERIFICATION',
  'SAFE_CHECKPOINT_GIT',
  'EXTERNAL_READ_ONLY',
  'OWNER_GATE',
  'DANGEROUS',
]);

const FORBIDDEN_ALLOWLIST_PREFIXES = [
  'git push',
  'git reset',
  'git clean',
  'git rebase',
  'git filter',
  'wrangler',
  'powershell',
  'pwsh',
  'cmd',
  'bash',
];

/** Bare `git` would allow force-push via prefix match. */
const FORBIDDEN_EXACT = new Set(['git', 'git.exe', '*', 'rm', 'del', 'Remove-Item', 'sh']);

export function loadProjectPermissions() {
  return JSON.parse(readFileSync(PERMISSIONS_PATH, 'utf8'));
}

export function classifyObservedPrompt(command) {
  const text = String(command || '').trim();
  const shell = classifyShell(text);
  if (shell.permission === 'deny') return 'DANGEROUS';
  if (/\b(wrangler|api\.cloudflare\.com)\b/i.test(text) && /\b(deploy|delete|put|post|patch)\b/i.test(text)) {
    return 'DANGEROUS';
  }
  if (/\b(OWNER-ONLY|OWNER-DECISION)\b/i.test(text)) return 'OWNER_GATE';
  if (/\b(coderabbit|grok)\b/i.test(text) && /\b(login|auth|oauth|api[_-]?key)\b/i.test(text)) {
    return 'OWNER_GATE';
  }
  if (/^git\s+(status|diff|show|log|rev-parse|merge-base|ls-files|grep)\b/i.test(text)) {
    return 'SAFE_READ_ONLY';
  }
  if (/^(Select-String|Select-Object|Measure-Object|Write-Host|Write-Output|Get-Content|Get-ChildItem|Test-Path)\b/i.test(text)) {
    return 'SAFE_READ_ONLY';
  }
  if (/^git\s+(add|commit)\b/i.test(text)) return 'SAFE_CHECKPOINT_GIT';
  if (/^git\s+push\b/i.test(text)) return 'DANGEROUS';
  if (/^(pnpm\s+push:main|node\s+scripts\/ci\/push-main\.mjs)\b/i.test(text)) return 'SAFE_CHECKPOINT_GIT';
  if (/^(node|pnpm|npm\s+(test|run)|npx|turbo)\b/i.test(text)) return 'SAFE_VERIFICATION';
  if (/\b(curl|WebFetch|web-search|grok|coderabbit)\b/i.test(text)) return 'EXTERNAL_READ_ONLY';
  return 'SAFE_REPO_LOCAL';
}

export function allowlistIsSafe(entries) {
  const problems = [];
  for (const entry of entries || []) {
    if (typeof entry !== 'string' || entry.length === 0) {
      problems.push(`non-string or empty allowlist entry: ${JSON.stringify(entry)}`);
      continue;
    }
    if (FORBIDDEN_EXACT.has(entry)) {
      problems.push(`forbidden exact allowlist entry: ${entry}`);
      continue;
    }
    for (const prefix of FORBIDDEN_ALLOWLIST_PREFIXES) {
      if (entry === prefix || entry.startsWith(`${prefix} `) || entry.startsWith(`${prefix}.`)) {
        problems.push(`forbidden allowlist prefix ${prefix}: ${entry}`);
      }
    }
  }
  return problems;
}

export function terminalAllowlistCovers(command, entries = loadProjectPermissions().terminalAllowlist) {
  const text = String(command || '').trim();
  return (entries || []).some((entry) => text === entry || text.startsWith(`${entry} `) || text.startsWith(entry));
}
