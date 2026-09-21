import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUMS = 'SHA256SUMS.txt';
const SKIP = new Set([SUMS, '.cursor/settings.json']);

const forbidden = [
  [/^node_modules\//, 'node_modules'],
  [/^\.pnpm-store\//, '.pnpm-store'],
  [/^\.turbo\//, '.turbo'],
  [/^\.autonomous-sessions\//, '.autonomous-sessions'],
  [/^\.source-materials\//, '.source-materials'],
  [/^(tmp|temp)\//, 'tmp'],
  [/(^|\/)\.env$/, '.env'],
  [/(^|\/)\.env\.(?!example$).+/, '.env variant'],
  [/\.(pem|p12|pfx|jks|keystore)$/i, 'key/cert material'],
  [/(^|\/)id_(rsa|ed25519|ecdsa)(\.pub)?$/, 'ssh key'],
];

const linkScope = [
  'START-HERE-CURSOR.md',
  'README.md',
  'docs/engineering/REPOSITORY-INTEGRITY.md',
  'docs/engineering/PRE-PUSH-GATE.md',
  'docs/constitution/PROJECT-CONSTITUTION.md',
  'docs/architecture/CURRENT-ARCHITECTURE.md',
  'docs/architecture/README.md',
  'docs/architecture/SECURITY.md',
  'docs/architecture/DECISIONS.md',
  'docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md',
  'docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md',
  'docs/architecture/OWNER-DECISION-PACKETS-GATE-A.md',
  'docs/architecture/GATE-IMPLEMENTATION-CHECKPOINT.md',
  'docs/architecture/NEXT-SLICE-LEAD-VERTICAL.md',
  'docs/architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md',
  'docs/architecture/NEXT-SLICES-CMS.md',
  'docs/cursor-os/CURSOR-OS-2026.md',
  'docs/workflows/DECISION-GATES.md',
  'docs/domain/DOMAIN-MAP.md',
  'docs/domain/README.md',
  'docs/vision/PRODUCT-CANON.md',
  'docs/vision/MASTER-PLAN.md',
  'docs/ux/UX-PRODUCT-CANON.md',
  'docs/api/README.md',
  'docs/knowledge/README.md',
  'docs/knowledge/POST-V2-DECISIONS.md',
  'docs/contracts/FZ-SIGN-1-CURSOR-INSTRUCTIONS.md',
];

function fail(errors, message) {
  errors.push(message);
}

function trackedFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: root });
  return out.toString('utf8').split('\0').filter(Boolean);
}

function sha256(rel) {
  return createHash('sha256').update(readFileSync(path.join(root, rel))).digest('hex');
}

function renderSums(files) {
  const lines = files
    .filter((file) => !SKIP.has(file))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((file) => `${sha256(file)}  ${file}`);
  return `${lines.join('\n')}\n`;
}

function checkSums(files, errors) {
  const sumsPath = path.join(root, SUMS);
  if (!existsSync(sumsPath)) {
    fail(errors, `${SUMS} is missing`);
    return;
  }
  const expected = new Map();
  const text = readFileSync(sumsPath, 'utf8');
  if (text.includes('\r')) fail(errors, `${SUMS} must use LF line endings`);
  for (const line of text.split('\n')) {
    if (line.length === 0) continue;
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
    if (!match) {
      fail(errors, `${SUMS} has a non-canonical line: ${line.slice(0, 80)}`);
      continue;
    }
    if (SKIP.has(match[2])) fail(errors, `${SUMS} must not list ${match[2]}`);
    if (expected.has(match[2])) fail(errors, `${SUMS} lists ${match[2]} twice`);
    expected.set(match[2], match[1]);
  }
  const wanted = files.filter((file) => !SKIP.has(file));
  for (const file of wanted) {
    if (!expected.has(file)) fail(errors, `${SUMS} is missing ${file}`);
  }
  for (const file of expected.keys()) {
    if (!wanted.includes(file)) fail(errors, `${SUMS} lists untracked or excluded path ${file}`);
  }
  for (const file of wanted) {
    const recorded = expected.get(file);
    if (!recorded) continue;
    const actual = sha256(file);
    if (actual !== recorded) fail(errors, `${SUMS} mismatch ${file}`);
  }
}

function checkSecrets(files, errors) {
  const secret = /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----[\s\S]{0,40}[A-Za-z0-9+/]{40,}|AKIA[0-9A-Z]{16}/;
  const binary = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.zip', '.gz', '.apk', '.pdf', '.woff', '.woff2', '.ico']);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (binary.has(ext)) continue;
    const abs = path.join(root, file);
    const info = statSync(abs);
    if (info.size > 1_000_000) continue;
    const text = readFileSync(abs, 'utf8');
    if (text.includes('\u0000')) continue;
    if (secret.test(text)) fail(errors, `secret-like material in tracked file ${file}`);
  }
}
function checkHygiene(files, errors) {
  for (const file of files) {
    for (const [pattern, label] of forbidden) {
      if (pattern.test(file)) fail(errors, `tracked forbidden file (${label}): ${file}`);
    }
    if (/(^|\/)(customer-data|client-data|private)\//.test(file)) {
      fail(errors, `tracked private/customer path: ${file}`);
    }
  }
}

function checkWorkspace(errors) {
  const workspace = readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
  for (const glob of ['apps/*', 'packages/*', 'tooling/*']) {
    if (!workspace.includes(`"${glob}"`) && !workspace.includes(`'${glob}'`)) {
      fail(errors, `pnpm-workspace.yaml is missing ${glob}`);
    }
  }
  for (const dir of ['apps', 'packages', 'tooling']) {
    const abs = path.join(root, dir);
    if (!existsSync(abs)) continue;
    for (const name of readdirSync(abs)) {
      const child = path.join(abs, name);
      if (!statSync(child).isDirectory()) continue;
      const manifest = path.join(child, 'package.json');
      if (!existsSync(manifest)) continue;
      let parsed;
      try {
        parsed = JSON.parse(readFileSync(manifest, 'utf8'));
      } catch {
        fail(errors, `${dir}/${name}/package.json is not valid JSON`);
        continue;
      }
      if (typeof parsed.name !== 'string' || parsed.name.length === 0) {
        fail(errors, `${dir}/${name}/package.json has no name`);
      }
    }
  }
}

function mustContain(errors, rel, needles) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) {
    fail(errors, `missing ${rel}`);
    return '';
  }
  const text = readFileSync(abs, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) fail(errors, `${rel} is missing ${JSON.stringify(needle)}`);
  }
  return text;
}

function checkCanon(errors) {
  mustContain(errors, 'START-HERE-CURSOR.md', [
    'docs/constitution/PROJECT-CONSTITUTION.md',
    'docs/architecture/CURRENT-ARCHITECTURE.md',
    'docs/cursor-os/CURSOR-OS-2026.md',
  ]);
  mustContain(errors, 'docs/architecture/README.md', [
    'Sole CURRENT / BINDING architecture entrypoint',
  ]);
  mustContain(errors, 'docs/cursor-os/CURSOR-OS-2026.md', [
    'sole binding definition',
    'DECISION GATE is not a normal terminal step of the loop.',
  ]);
  mustContain(errors, 'docs/workflows/DECISION-GATES.md', ['OWNER-DECISION']);
  mustContain(errors, 'docs/knowledge/POST-V2-DECISIONS.md', [
    'docs/cursor-os/CURSOR-OS-2026.md',
  ]);
  const packets = mustContain(errors, 'docs/architecture/OWNER-DECISION-PACKETS-GATE-A.md', [
    'Status: DECIDED',
    'DECISION FZ-A1: OPTION A',
    'DEPLOY=compose',
    'DECISION FZ-A2: OPTION F',
    'API=Hono',
    'DECISION FZ-A3: OPTION E',
    'DECISION FZ-A4: OPTION A',
    'LATER=garage',
    'DECISION FZ-A5: OPTION E',
    'EMBED=B',
    'DECISION FZ-A6: OPTION B',
    'OBS=openobserve',
    'SECRETS=sops-age',
    'BACKUP=restic',
    'PG=pgbackrest',
    'DECISION FZ-A7: OPTION A',
    'OVERLAY=none',
  ]);
  if (/^Status: OPEN\b/m.test(packets)) {
    fail(errors, 'Gate A packet status is still OPEN');
  }
  mustContain(errors, 'docs/architecture/DECISIONS.md', [
    '## ADR-014 — Gate A architecture selection',
    '## ADR-015 — Content / media / visual publishing (FZ-CMS-1)',
  ]);
  mustContain(errors, 'docs/architecture/OWNER-DECISION-PACKET-FZ-CMS-1.md', [
    'Status: OPEN',
    'DECISION FZ-CMS-1: OPTION',
  ]);
  mustContain(errors, 'docs/architecture/NEXT-SLICES-CMS.md', ['READY only after']);
  mustContain(errors, 'docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md', [
    'Provider **UNDECIDED**',
    '# FZ-SIGN-1 — Contract Lifecycle & Electronic Signature',
  ]);
  mustContain(errors, 'docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md', [
    'No engine is selected',
    'FZ-SIGN-1-CONTRACT-LIFECYCLE.md',
  ]);
  mustContain(errors, 'docs/contracts/FZ-SIGN-1-CURSOR-INSTRUCTIONS.md', [
    'a second lifecycle',
    'FZ-SIGN-1-CONTRACT-LIFECYCLE.md',
  ]);
  mustContain(errors, 'docs/domain/DOMAIN-MAP.md', [
    'FZ-SIGN-1-CONTRACT-LIFECYCLE.md',
  ]);
  mustContain(errors, 'docs/architecture/SECURITY.md', [
    'nie podpis elektroniczny umowy',
  ]);
  mustContain(errors, 'docs/knowledge/README.md', [
    'legacy/` directory is intentionally non-canonical',
  ]);
  mustContain(errors, 'docs/architecture/CURRENT-ARCHITECTURE.md', [
    'Legacy',
    'do not decide',
    'apps/api` = Hono',
    'React Router Framework Mode',
    'Kysely',
    'Better Auth',
    'OpenObserve',
    'Garage',
    'Cloudflare Tunnel',
    'Docker Compose',
  ]);
  const lifecycleHeaders = trackedFiles().filter((file) => {
    if (!file.endsWith('.md')) return false;
    const text = readFileSync(path.join(root, file), 'utf8');
    return text.startsWith('# FZ-SIGN-1 — Contract Lifecycle & Electronic Signature');
  });
  if (lifecycleHeaders.length !== 1 || lifecycleHeaders[0] !== 'docs/architecture/FZ-SIGN-1-CONTRACT-LIFECYCLE.md') {
    fail(errors, `expected one FZ-SIGN-1 lifecycle definition, found ${lifecycleHeaders.join(', ') || 'none'}`);
  }
}

function checkLinks(errors) {
  const linkRe = /\[[^\]]*\]\(([^)\s]+)\)/g;
  for (const rel of linkScope) {
    const abs = path.join(root, rel);
    if (!existsSync(abs)) continue;
    const text = readFileSync(abs, 'utf8');
    for (const match of text.matchAll(linkRe)) {
      const raw = match[1];
      if (/^(https?:|mailto:|#)/.test(raw)) continue;
      const target = raw.split('#')[0].split('?')[0];
      if (target.length === 0) continue;
      const resolved = path.resolve(path.dirname(abs), target);
      if (!existsSync(resolved)) fail(errors, `${rel} links to missing ${raw}`);
    }
  }
}

function check(files) {
  const errors = [];
  checkHygiene(files, errors);
  checkSecrets(files, errors);
  checkWorkspace(errors);
  checkCanon(errors);
  checkLinks(errors);
  checkSums(files, errors);
  return errors;
}

const files = trackedFiles();
const write = process.argv.includes('--write');
if (write) {
  writeFileSync(path.join(root, SUMS), renderSums(files));
}
const errors = check(files);
if (errors.length > 0) {
  for (const error of errors) console.error(error);
  console.error(`repo-integrity: ${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`repo-integrity: ok (${files.filter((file) => !SKIP.has(file)).length} tracked files)`);
