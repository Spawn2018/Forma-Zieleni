import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  classifyMcp,
  classifyShell,
  decideFollowup,
  emptySession,
  nextWarsawDeadline,
  noteAttempt,
  parseExecutionGraph,
  selectReady,
  STALL_MESSAGE,
} from './policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const node = process.execPath;

function at(iso) {
  return nextWarsawDeadline(9, new Date(iso));
}

test('next /noc 9 uses Europe/Warsaw with daylight saving', () => {
  assert.equal(at('2026-09-21T19:17:00.000Z').until, '2026-09-22T09:00:00+02:00');
  assert.equal(at('2026-09-21T19:17:00.000Z').untilUtc, '2026-09-22T07:00:00.000Z');
  assert.equal(at('2026-09-22T06:30:00.000Z').until, '2026-09-22T09:00:00+02:00');
  assert.equal(at('2026-09-22T07:00:00.000Z').until, '2026-09-23T09:00:00+02:00');
  assert.equal(nextWarsawDeadline(9, new Date('2026-01-15T20:00:00.000Z')).until, '2026-01-16T09:00:00+01:00');
  assert.equal(nextWarsawDeadline(9, new Date('2026-07-15T19:00:00.000Z')).untilUtc, '2026-07-16T07:00:00.000Z');
  assert.equal(nextWarsawDeadline(2, new Date('2026-03-29T00:30:00.000Z')).untilUtc, '2026-03-30T00:00:00.000Z');
  assert.equal(nextWarsawDeadline(3, new Date('2026-10-24T23:30:00.000Z')).until, '2026-10-25T03:00:00+01:00');
});

test('hour 7 is 07:00 and 21 is 21:00', () => {
  const morning = nextWarsawDeadline(7, new Date('2026-09-21T19:17:00.000Z'));
  const evening = nextWarsawDeadline(21, new Date('2026-09-21T10:00:00.000Z'));
  assert.equal(morning.until, '2026-09-22T07:00:00+02:00');
  assert.equal(evening.until, '2026-09-21T21:00:00+02:00');
  assert.throws(() => nextWarsawDeadline(24), /0 through 23/);
  assert.throws(() => nextWarsawDeadline('9pm'), /0 through 23/);
});

test('owner gates are not selected and an open decision does not block other work', () => {
  const slices = [
    { id: 'SIGN', status: 'OPEN', gate: 'OWNER-DECISION', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
    { id: 'CRAWL', status: 'OPEN', gate: 'OWNER-DECISION', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
    { id: 'PAY', status: 'OPEN', gate: 'OWNER-ONLY', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
    { id: 'DNS', status: 'OPEN', gate: 'DANGEROUS', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
    { id: 'MEDIA', status: 'COMPLETE', gate: 'REVIEW', dependsOn: [], next: ['COLLECTIONS'], autonomous: true, reportOnly: false, externalUnmet: false },
    { id: 'COLLECTIONS', status: 'OPEN', gate: 'REVIEW', dependsOn: ['MEDIA'], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
  ];
  const picked = selectReady(slices);
  assert.equal(picked.selected, 'COLLECTIONS');
  assert.deepEqual(picked.ready, ['COLLECTIONS']);
  assert.equal(picked.withheld.some((item) => item.gate === 'DANGEROUS'), true);
  const stolen = selectReady(slices, { blockedIds: ['COLLECTIONS'] });
  assert.equal(stolen.selected, null);
});

test('work-stealing prefers another READY slice when the critical one is blocked', () => {
  const slices = [
    { id: 'DONE', status: 'COMPLETE', gate: 'REVIEW', dependsOn: [], next: ['PRIMARY'], autonomous: true, reportOnly: false, externalUnmet: false },
    { id: 'PRIMARY', status: 'OPEN', gate: 'REVIEW', dependsOn: ['DONE'], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
    { id: 'OTHER', status: 'OPEN', gate: 'AUTO', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
  ];
  const picked = selectReady(slices, { blockedIds: ['PRIMARY'] });
  assert.equal(picked.selected, 'OTHER');
  assert.equal(picked.ready.includes('PRIMARY'), false);
});

test('the CMS graph reconstructs READY work without executing it', () => {
  const markdown = readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-CMS.md'), 'utf8');
  const picked = selectReady(parseExecutionGraph(markdown));
  assert.equal(picked.selected, 'CMS-SEO');
  assert.equal(picked.ready.includes('SEARCH-SITEMAP-ROBOTS'), false);
  assert.equal(picked.ready.includes('CMS-SEO'), true);
  assert.equal(picked.ready.includes('WWW-APP'), false);
  assert.equal(picked.ready.includes('GALLERY-WWW'), false);
  assert.equal(picked.ready.includes('BEFORE-AFTER'), false);
  assert.equal(picked.internalGap, null);
  assert.equal(picked.ready.includes('MEDIA-COLLECTIONS'), false);
  assert.equal(picked.ready.includes('SEARCH-ATTRIBUTION'), false);
  assert.equal(picked.ready.includes('SEARCH-DATA-MODEL'), false);
  assert.equal(picked.ready.includes('SEARCH-CONNECTORS'), false);
  assert.equal(picked.ready.includes('SEARCH-SYNC'), false);
  assert.equal(picked.ready.includes('SEARCH-HISTORY'), false);
  assert.equal(picked.ready.includes('CMS-ADMIN'), false);
  assert.equal(picked.ready.includes('CMS-RESTORE'), false);
  assert.equal(picked.ready.includes('SEARCH-AI-VISIBILITY'), false);
  assert.equal(picked.ready.includes('SEARCH-CRAWLER-INTELLIGENCE'), false);
  assert.equal(picked.ready.includes('SEARCH-RECOVERY'), false);
  assert.equal(picked.ready.includes('SEARCH-SECURITY'), false);
  assert.equal(picked.ready.includes('CMS-EXPORT'), false);
  assert.equal(picked.ready.includes('CMS-ACCEPT'), false);
  const crawl = readFileSync(path.join(root, 'docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md'), 'utf8');
  const sign = readFileSync(path.join(root, 'docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md'), 'utf8');
  assert.match(crawl, /Status:\s*OPEN/i);
  assert.match(sign, /OPEN/);
});

test('a fast-forward checkpoint push is AUTO inside noc and dangerous pushes stay gated', () => {
  assert.equal(classifyShell('git push origin main').permission, 'allow');
  assert.equal(classifyShell('git push').permission, 'allow');
  for (const command of ['git push --force', 'git push --force-with-lease', 'git push --mirror', 'git push origin --delete branch']) {
    assert.equal(classifyShell(command).permission, 'ask', command);
  }
});

test('an omitted www app row is an internal gap and does not authorize exhaustion', () => {
  const markdown = [
    '### GALLERY-WWW',
    'Dependencies: MEDIA-COLLECTIONS. Blocked until the www app slice exists.',
    'Gate: REVIEW.',
    'Autonomous: yes.',
    '',
  ].join('\n');
  const picked = selectReady(parseExecutionGraph(markdown));
  assert.equal(picked.selected, null);
  assert.equal(picked.internalGap.id, 'WWW-APP');
  assert.equal(picked.exhaustionAllowed, false);
  const session = emptySession(nextWarsawDeadline(9, new Date('2026-09-21T19:17:00.000Z')));
  assert.equal(session.exhausted, false);
});

test('repeated identical attempts block a slice', () => {
  let session = emptySession(nextWarsawDeadline(9, new Date('2026-09-21T19:17:00.000Z')));
  const attempt = { slice: 'MEDIA-COLLECTIONS', commit: 'abc', signature: 'pnpm test' };
  session = noteAttempt(session, attempt);
  session = noteAttempt(session, attempt);
  assert.equal(session.blocked.includes('MEDIA-COLLECTIONS'), false);
  session = noteAttempt(session, attempt);
  assert.equal(session.blocked.includes('MEDIA-COLLECTIONS'), true);
  assert.equal(session.currentSlice, null);
});

test('stop follow-up continues only inside an active window', () => {
  const deadline = nextWarsawDeadline(9, new Date('2026-09-21T19:17:00.000Z'));
  const session = emptySession(deadline, new Date('2026-09-21T19:17:00.000Z'));
  const now = new Date('2026-09-21T20:00:00.000Z');
  assert.equal(decideFollowup(null, { status: 'completed' }, now).followup, null);
  assert.equal(decideFollowup(session, { status: 'aborted' }, now).followup, null);
  assert.match(decideFollowup(session, { status: 'completed' }, now).followup, /FZ orchestrator/);
  const stopped = { ...session, status: 'stop' };
  assert.equal(decideFollowup(stopped, { status: 'completed' }, now).followup, null);
  const late = decideFollowup(session, { status: 'completed' }, new Date(deadline.untilUtc));
  assert.match(late.followup, /Do not start a new slice/);
});

test('silent turns stall and then stop', () => {
  const deadline = nextWarsawDeadline(9, new Date('2026-09-21T19:17:00.000Z'));
  let session = emptySession(deadline, new Date('2026-09-21T19:17:00.000Z'));
  const now = new Date('2026-09-21T20:00:00.000Z');
  let stalled = false;
  for (let turn = 0; turn < 6; turn += 1) {
    const decision = decideFollowup(session, { status: 'completed' }, now);
    session = decision.session;
    if (decision.followup === STALL_MESSAGE) stalled = true;
  }
  assert.equal(stalled, true);
  assert.equal(session.status, 'stop');
  assert.equal(decideFollowup(session, { status: 'completed' }, now).followup, null);
});

test('shell and MCP guards ask for dangerous operations and allow ordinary ones', () => {
  assert.equal(classifyShell('git status').permission, 'allow');
  assert.equal(classifyShell('git commit -m "chore: add autonomous Cursor orchestration"').permission, 'allow');
  assert.equal(classifyShell('git push').permission, 'allow');
  assert.equal(classifyShell('powershell -Command "git push"').permission, 'allow');
  assert.equal(classifyShell('git -C D:\\repo push origin main').permission, 'allow');
  assert.equal(classifyShell('git push --force').permission, 'ask');
  assert.equal(classifyShell('git push --force-with-lease').permission, 'ask');
  assert.equal(classifyShell('git reset --hard HEAD').permission, 'ask');
  assert.equal(classifyShell('git clean -fd').permission, 'ask');
  assert.equal(classifyShell('npx wrangler deploy').permission, 'ask');
  assert.equal(classifyShell('psql -c "DROP TABLE leads"').permission, 'ask');
  assert.equal(classifyMcp({ tool_name: 'search_cloudflare_documentation', mcp_server_name: 'plugin-cloudflare-cloudflare-docs' }).permission, 'allow');
  assert.equal(classifyMcp({ tool_name: 'd1_database_delete', mcp_server_name: 'plugin-cloudflare-cloudflare-bindings' }).permission, 'ask');
  assert.equal(classifyMcp({ tool_name: 'd1_database_query', mcp_server_name: 'other' }).permission, 'allow');
});

test('hook scripts emit the documented JSON contract', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'fz-noc-'));
  const live = path.join(directory, 'live.json');
  const env = { ...process.env, FZ_NOC_LIVE: live, FZ_NOC_ROOT: root, CURSOR_PROJECT_DIR: root };
  try {
    const started = spawnSync(node, ['scripts/fz-noc/cli.mjs', 'start', '9'], { cwd: root, env, encoding: 'utf8' });
    assert.equal(started.status, 0, started.stderr);
    const again = spawnSync(node, ['scripts/fz-noc/cli.mjs', 'start', '9'], { cwd: root, env, encoding: 'utf8' });
    assert.equal(again.status, 1);
    const stop = spawnSync(node, ['.cursor/hooks/fz-noc-stop.mjs'], {
      cwd: root,
      env,
      encoding: 'utf8',
      input: JSON.stringify({ status: 'completed', loop_count: 0 }),
    });
    assert.equal(stop.status, 0, stop.stderr);
    assert.match(JSON.parse(stop.stdout).followup_message, /FZ orchestrator/);
    const aborted = spawnSync(node, ['.cursor/hooks/fz-noc-stop.mjs'], {
      cwd: root,
      env,
      encoding: 'utf8',
      input: JSON.stringify({ status: 'aborted' }),
    });
    assert.deepEqual(JSON.parse(aborted.stdout), {});
    const shell = spawnSync(node, ['.cursor/hooks/fz-dangerous-shell.mjs'], {
      cwd: root,
      env,
      encoding: 'utf8',
      input: JSON.stringify({ command: 'pnpm test', cwd: root }),
    });
    assert.equal(JSON.parse(shell.stdout).permission, 'allow');
    const session = spawnSync(node, ['.cursor/hooks/fz-session-start.mjs'], {
      cwd: root,
      env,
      encoding: 'utf8',
      input: JSON.stringify({ session_id: 'test', is_background_agent: false, composer_mode: 'agent' }),
    });
    assert.match(JSON.parse(session.stdout).additional_context, /START-HERE-CURSOR.md/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('new controller files do not import another product queue', () => {
  const files = [
    ...walk(path.join(root, 'scripts/fz-noc')).filter((file) => !file.endsWith('.test.mjs')),
    path.join(root, '.cursor/commands/noc.md'),
    path.join(root, '.cursor/skills/fz-autonomous-execution/SKILL.md'),
  ];
  const banned = ['OpenFGA', 'noc-preflight', 'factory_cycle', 'plaster'];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const word of banned) assert.equal(text.includes(word), false, `${file} contains ${word}`);
  }
});

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}
