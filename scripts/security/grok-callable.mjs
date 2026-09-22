import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grokDisposition } from '../fz-noc/policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceDir = path.join(root, 'tmp', 'grok');
const evidenceFile = process.env.GROK_PROBE_EVIDENCE || path.join(evidenceDir, 'last-probe.json');
const authPath = process.env.GROK_AUTH_PATH || path.join(process.env.USERPROFILE || process.env.HOME || '', '.grok', 'auth.json');

const SYNTHETIC_PROMPT = [
  'Review this SYNTHETIC architecture decision only. Do not access any repository files.',
  'Decision: a garden CMS stores published page HTML in a CDN and drafts only in a private DB.',
  'List 3 failure modes. Reply in under 120 words. Start with GROK_PROBE_OK.',
].join(' ');

function resolveGrok() {
  if (process.env.GROK_BIN && existsSync(process.env.GROK_BIN)) return process.env.GROK_BIN;
  const which = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['grok'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (which.status === 0) {
    const first = (which.stdout || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (first) return first;
  }
  return null;
}

/** Read-only status of the binding Grok CLI channel. Never prints secrets. */
export function grokChannelStatus() {
  const bin = resolveGrok();
  const authPresent = Boolean(authPath) && existsSync(authPath);
  return {
    channel: 'grok-cli',
    installed: Boolean(bin),
    authenticated: authPresent,
    reachable: Boolean(bin),
    bin: bin || null,
    mutation: 'read-only-required',
    authPathPresent: authPresent,
  };
}

export function planGrokChallenge(input = {}) {
  const disposition = grokDisposition(input);
  if (disposition === 'GROK_NOT_NEEDED') {
    return { state: disposition, action: 'skip', reason: 'not_needed' };
  }
  const status = grokChannelStatus();
  if (!status.installed || !status.authenticated) {
    return {
      state: grokDisposition({ ...input, unavailable: true }),
      action: 'skip',
      reason: status.installed ? 'not_authenticated' : 'not_installed',
      status,
    };
  }
  return { state: disposition, action: 'invoke', reason: 'triggered', status };
}

/**
 * Harmless synthetic probe. Does not send repository contents.
 * Owner must already have completed `grok login`.
 */
export function runSyntheticProbe(options = {}) {
  const status = grokChannelStatus();
  if (!status.installed) {
    return { ok: false, state: 'GROK_DEFERRED', reason: 'not_installed', status };
  }
  if (!status.authenticated && options.requireAuth !== false) {
    return {
      ok: false,
      state: 'GROK_DEFERRED',
      reason: 'not_authenticated',
      ownerAction: 'Run `grok login` (browser or --device-auth). Do not paste API keys into the repo.',
      status,
    };
  }
  if (options.dryRun === true) {
    return { ok: true, state: 'GROK_REQUESTED', dryRun: true, status };
  }
  const args = [
    '-p',
    options.prompt || SYNTHETIC_PROMPT,
    '--output-format',
    'plain',
    '--disable-web-search',
    '--deny',
    'bash,edit,write,read,glob,grep',
    '--max-turns',
    '1',
  ];
  const started = new Date().toISOString();
  const result = spawnSync(status.bin, args, {
    cwd: options.cwd || root,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, CI: '1' },
  });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const marker = output.includes('GROK_PROBE_OK');
  const ok = result.status === 0 && marker;
  const evidence = {
    started,
    finished: new Date().toISOString(),
    ok,
    exitCode: result.status,
    marker,
    readOnly: true,
    repositoryMutation: false,
    synthetic: true,
    responseChars: output.length,
    responsePreview: output.slice(0, 500),
  };
  if (options.persist !== false) {
    mkdirSync(path.dirname(evidenceFile), { recursive: true });
    writeFileSync(evidenceFile, JSON.stringify(evidence, null, 2));
  }
  return {
    ok,
    state: ok ? 'GROK_SUCCEEDED' : 'GROK_FAILED',
    status,
    evidence,
    evidencePath: evidenceFile,
  };
}

export function lastProbeEvidence() {
  if (!existsSync(evidenceFile)) return null;
  try {
    return JSON.parse(readFileSync(evidenceFile, 'utf8'));
  } catch {
    return null;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const command = process.argv[2] || 'status';
  let result;
  if (command === 'status') result = grokChannelStatus();
  else if (command === 'plan') result = planGrokChallenge({ adversarial: true });
  else if (command === 'probe') result = runSyntheticProbe({ dryRun: process.argv.includes('--dry-run') });
  else {
    console.error('usage: node scripts/security/grok-callable.mjs [status|plan|probe] [--dry-run]');
    process.exitCode = 2;
    result = null;
  }
  if (result) {
    console.log(JSON.stringify(result, null, 2));
    if (result.ok === false) process.exitCode = 1;
  }
}
