import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  activeExecutionGraph,
  bindingMaterializationGap,
  classifyMcp,
  classifyShell,
  decideFollowup,
  emptySession,
  nextWarsawDeadline,
  noteAttempt,
  parseExecutionGraph,
  selectReady,
  grokDisposition,
  coderabbitDisposition,
  coderabbitPrivacyBlocked,
  coderabbitDiffContentBlocked,
  portalCapabilityIsProductComplete,
  missingExecutablePathDeclarations,
  STALL_MESSAGE,
} from './policy.mjs';
import { requirements } from '../requirements/registry.mjs';

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
  const cms = readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-CMS.md'), 'utf8');
  const main = readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-MAIN.md'), 'utf8');
  const cmsOnly = selectReady(parseExecutionGraph(cms));
  assert.equal(cmsOnly.selected, null);
  assert.equal(cmsOnly.ready.includes('RETURN-ROADMAP'), false);
  assert.equal(cmsOnly.ready.includes('CMS-ACCEPT'), false);
  assert.equal(cmsOnly.ready.includes('SEARCH-ACCEPT'), false);
  assert.equal(cmsOnly.selected, null);
  assert.equal(cmsOnly.masterProductScopeExhausted, false);
  const picked = selectReady(activeExecutionGraph(cms, main));
  assert.notEqual(picked.selected, null);
  assert.equal(picked.ready.includes('ADMIN-APP'), false);
  assert.equal(picked.ready.includes('MOBILE-CLIENT-BOUNDARY'), false);
  assert.equal(picked.ready.includes('ATLAS-PROVENANCE-BOUNDARY'), false);
  assert.equal(picked.ready.includes('CRM-PROJECT-DOMAIN'), false);
  assert.equal(picked.ready.includes('LEAD-SEC-ACCEPT'), false);
  assert.equal(picked.ready.includes('RETURN-ROADMAP'), false);
  assert.equal(picked.exhaustionAllowed, false);
  assert.equal(picked.masterProductScopeExhausted, false);
  assert.equal(picked.internalGap, null);
});

test('activeExecutionGraph stays on CMS until RETURN-ROADMAP is COMPLETE', () => {
  const cmsOpen = `### RETURN-ROADMAP\n\nGate: AUTO.\nStatus: OPEN.\nAutonomous: yes.\nDependencies: none.\nNext: LEAD-SEC-SESSION.\n`;
  const main = readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-MAIN.md'), 'utf8');
  const before = activeExecutionGraph(cmsOpen, main);
  assert.equal(before.some((slice) => slice.id === 'RETURN-ROADMAP'), true);
  assert.equal(before.some((slice) => slice.id === 'LEAD-SEC-SESSION'), false);
  const cmsDone = cmsOpen.replace('Status: OPEN.', 'Status: COMPLETE.');
  const after = activeExecutionGraph(cmsDone, main);
  assert.equal(after.some((slice) => slice.id === 'LEAD-SEC-SESSION'), true);
  assert.equal(after.some((slice) => slice.id === 'RETURN-ROADMAP'), false);
  const crawl = readFileSync(path.join(root, 'docs/architecture/OWNER-DECISION-PACKET-FZ-SEARCH-CRAWL-1.md'), 'utf8');
  const sign = readFileSync(path.join(root, 'docs/architecture/OWNER-DECISION-PACKET-FZ-SIGN-1.md'), 'utf8');
  assert.match(crawl, /Status:\s*OPEN/i);
  assert.match(sign, /OPEN/);
});

test('git commit messages mentioning git push are not false-denied', () => {
  assert.equal(
    classifyShell('git commit -m "feat: use pnpm push:main instead of git push"').permission,
    'allow',
  );
  assert.equal(classifyShell('git status && git push origin main').permission, 'deny');
});

test('direct git push is denied; force stays DANGEROUS; pnpm push:main is the AUTO path', () => {
  assert.equal(classifyShell('git push origin main').permission, 'deny');
  assert.equal(classifyShell('git push').permission, 'deny');
  assert.match(classifyShell('git push origin main').agent_message, /pnpm push:main/);
  assert.equal(classifyShell('pnpm push:main').permission, 'allow');
  for (const command of ['git push --force', 'git push --force-with-lease', 'git push --mirror', 'git push origin --delete branch']) {
    assert.equal(classifyShell(command).permission, 'deny', command);
    assert.match(classifyShell(command).user_message, /git-push-force/);
  }
  assert.equal(classifyShell('git push --no-verify').permission, 'deny');
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

test('missing Offer after Opportunity is a materialization gap, not Owner roadmap refresh', () => {
  const offerRequired = [{
    id: 'FZ-REQ-CRM-OFFER-001',
    status: 'BLOCKED_BY_DEPENDENCY',
    gate: 'NONE',
    blockerClass: 'INTERNAL',
    executableSlice: 'CRM-OFFER-CONTRACT',
    executableWhenComplete: ['CRM-OPPORTUNITY-CONTRACT'],
    safePreblockerWork: true,
  }];
  const slices = [
    {
      id: 'CRM-OPPORTUNITY-CONTRACT',
      status: 'COMPLETE',
      gate: 'REVIEW',
      dependsOn: [],
      next: [],
      autonomous: true,
      reportOnly: false,
      externalUnmet: false,
    },
    {
      id: 'ADMIN-APP',
      status: 'OPEN',
      gate: 'REVIEW',
      dependsOn: [],
      next: [],
      autonomous: true,
      reportOnly: false,
      externalUnmet: false,
    },
  ];
  const gap = bindingMaterializationGap(slices, offerRequired);
  assert.equal(gap.id, 'CRM-OFFER-CONTRACT');
  const picked = selectReady(slices, { requirements: offerRequired });
  assert.equal(picked.selected, 'ADMIN-APP');
  assert.equal(picked.exhaustionAllowed, false);
  const exhausted = selectReady([
    {
      id: 'CRM-OPPORTUNITY-CONTRACT',
      status: 'COMPLETE',
      gate: 'REVIEW',
      dependsOn: [],
      next: [],
      autonomous: true,
      reportOnly: false,
      externalUnmet: false,
    },
  ], { requirements: offerRequired });
  assert.equal(exhausted.selected, null);
  assert.equal(exhausted.internalGap.id, 'CRM-OFFER-CONTRACT');
  assert.equal(exhausted.exhaustionAllowed, false);
  assert.match(exhausted.reason, /FZ-REQ-CRM-OFFER-001|CRM-OFFER-CONTRACT/);
});

test('main graph after Opportunity keeps product READY without ZAP or Lead acceptance', () => {
  const cms = readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-CMS.md'), 'utf8');
  const main = readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-MAIN.md'), 'utf8');
  const picked = selectReady(activeExecutionGraph(cms, main));
  assert.notEqual(picked.selected, null);
  assert.equal(picked.ready.includes('MOBILE-CLIENT-BOUNDARY'), false);
  assert.equal(picked.ready.includes('ADMIN-CRM-LEAD'), false);
  assert.equal(picked.ready.includes('MOBILE-ANDROID-FOUNDATION'), false);
  assert.equal(picked.ready.includes('SIGN-STATE-NEUTRAL'), false);
  assert.equal(picked.ready.includes('PORTAL-FILE-PROJECTION'), false);
  assert.equal(picked.withheld.some((item) => item.id === 'LEAD-SEC-ACCEPT'), false);
  assert.equal(picked.exhaustionAllowed, false);
  assert.equal(picked.ready.includes('PXI-SIGNAL-MODEL'), false);
  assert.equal(picked.ready.includes('SITEINTEL-RULES'), true);
});

test('a report-only acceptance checkpoint does not block the return', () => {
  const slices = [
    { id: 'CMS-ACCEPT', status: 'OPEN', gate: 'REVIEW', dependsOn: [], next: ['RETURN-ROADMAP'], autonomous: true, reportOnly: true, externalUnmet: false },
    { id: 'RETURN-ROADMAP', status: 'OPEN', gate: 'AUTO', dependsOn: ['CMS-ACCEPT'], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
  ];
  const picked = selectReady(slices);
  assert.equal(picked.selected, 'RETURN-ROADMAP');
  assert.equal(picked.ready.includes('CMS-ACCEPT'), false);
});

test('routine work does not request Grok and an unavailable challenge stays deferred', () => {
  assert.equal(grokDisposition({ routine: true }), 'GROK_NOT_NEEDED');
  assert.equal(grokDisposition({}), 'GROK_NOT_NEEDED');
  assert.equal(grokDisposition({ adversarial: true, routine: true }), 'GROK_NOT_NEEDED');
  assert.equal(grokDisposition({ externalResearch: true }), 'GROK_REQUESTED');
  assert.equal(grokDisposition({ adversarial: true, unavailable: true }), 'GROK_DEFERRED');
  assert.equal(grokDisposition({ adversarial: true, failed: true }), 'GROK_FAILED');
  assert.equal(grokDisposition({ adversarial: true, succeeded: true, adopted: true }), 'GROK_FINDING_ADOPTED_AFTER_LOCAL_VERIFICATION');
  assert.equal(grokDisposition({ adversarial: true, succeeded: true, rejected: true }), 'GROK_FINDING_REJECTED');
  assert.equal(grokDisposition({ adversarial: true, succeeded: true }), 'GROK_SUCCEEDED');
});

test('CodeRabbit checkpoint states stay advisory and privacy-gated', () => {
  assert.equal(coderabbitDisposition({ trivial: true }), 'CODERABBIT_NOT_NEEDED');
  assert.equal(coderabbitDisposition({ checkpoint: true }), 'CODERABBIT_REQUESTED');
  assert.equal(coderabbitDisposition({ passed: true }), 'CODERABBIT_PASS');
  assert.equal(coderabbitDisposition({ findings: true }), 'CODERABBIT_FINDINGS');
  assert.equal(coderabbitDisposition({ rateLimited: true }), 'CODERABBIT_DEFERRED_RATE_LIMIT');
  assert.equal(coderabbitDisposition({ privacyBlocked: true }), 'CODERABBIT_DEFERRED_UNAVAILABLE');
  assert.deepEqual(coderabbitPrivacyBlocked(['apps/web/x.tsx', '.env']), ['.env']);
  assert.ok(coderabbitDiffContentBlocked('api_key=supersecretvalue99').length > 0);
  assert.equal(coderabbitDiffContentBlocked('ordinary feature flag').length, 0);
  assert.equal(coderabbitDiffContentBlocked('const pathToken = slugPart(pathNorm, "path");').length, 0);
  const deletedSecretFixture = [
    'diff --git a/scripts/security/coderabbit-checkpoint.test.mjs b/scripts/security/coderabbit-checkpoint.test.mjs',
    '--- a/scripts/security/coderabbit-checkpoint.test.mjs',
    '+++ b/scripts/security/coderabbit-checkpoint.test.mjs',
    '@@ -1,1 +1,1 @@',
    `-      diffText: '${['pass', 'word = "hunter2hunter2"'].join('')}',`,
    '+      diffText: \'ordinary feature flag\',',
  ].join('\n');
  assert.equal(coderabbitDiffContentBlocked(deletedSecretFixture).length, 0);
  const addedSecretFixture = [
    'diff --git a/x.mjs b/x.mjs',
    '--- a/x.mjs',
    '+++ b/x.mjs',
    '@@ -1,0 +1,1 @@',
    `+${['pass', 'word = "hunter2hunter2"'].join('')}`,
  ].join('\n');
  assert.ok(coderabbitDiffContentBlocked(addedSecretFixture).length > 0);
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

test('shell and MCP guards deny dangerous operations and allow ordinary ones', () => {
  assert.equal(classifyShell('git status').permission, 'allow');
  assert.equal(classifyShell('git commit -m "chore: add autonomous Cursor orchestration"').permission, 'allow');
  assert.equal(classifyShell('git push').permission, 'deny');
  assert.equal(classifyShell('powershell -Command "git push"').permission, 'deny');
  assert.equal(classifyShell('git -C D:\\repo push origin main').permission, 'deny');
  assert.equal(classifyShell('pnpm push:main').permission, 'allow');
  assert.equal(classifyShell('git push --force').permission, 'deny');
  assert.equal(classifyShell('git push --force-with-lease').permission, 'deny');
  assert.equal(classifyShell('git reset --hard HEAD').permission, 'deny');
  assert.equal(classifyShell('git clean -fd').permission, 'deny');
  assert.equal(classifyShell('npx wrangler deploy').permission, 'deny');
  assert.equal(classifyShell('psql -c "DROP TABLE leads"').permission, 'deny');
  assert.equal(
    classifyShell(`node -e "console.log('git push --force')"`).permission,
    'allow',
  );
  assert.equal(
    classifyShell(`node -e "require('child_process').execSync('git push origin main')"`).permission,
    'deny',
  );
  assert.equal(
    classifyShell(`node -e "require('child_process').spawnSync('git',['push','--no-verify'])"`).permission,
    'deny',
  );
  assert.equal(classifyShell('powershell -Command "git push --force"').permission, 'deny');
  assert.equal(classifyMcp({ tool_name: 'search_cloudflare_documentation', mcp_server_name: 'plugin-cloudflare-cloudflare-docs' }).permission, 'allow');
  assert.equal(classifyMcp({ tool_name: 'd1_database_delete', mcp_server_name: 'plugin-cloudflare-cloudflare-bindings' }).permission, 'deny');
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

test('A: omitted Offer after Opportunity is an internal gap and blocks exhaustion', () => {
  const reqs = [{
    id: 'FZ-REQ-CRM-OFFER-001',
    status: 'BLOCKED_BY_DEPENDENCY',
    gate: 'NONE',
    blockerClass: 'INTERNAL',
    executableSlice: 'CRM-OFFER-CONTRACT',
    executableWhenComplete: ['CRM-OPPORTUNITY-CONTRACT'],
    safePreblockerWork: true,
  }];
  const slices = [{
    id: 'CRM-OPPORTUNITY-CONTRACT', status: 'COMPLETE', gate: 'REVIEW',
    dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false,
  }];
  const picked = selectReady(slices, { requirements: reqs });
  assert.equal(picked.selected, null);
  assert.equal(picked.internalGap.id, 'CRM-OFFER-CONTRACT');
  assert.equal(picked.exhaustionAllowed, false);
});

test('B: Admin binding without ADMIN-APP slice is an internal gap', () => {
  const reqs = [{
    id: 'FZ-REQ-ADMIN-001',
    status: 'BLOCKED_BY_DEPENDENCY',
    gate: 'NONE',
    blockerClass: 'INTERNAL',
    executableSlice: 'ADMIN-APP',
    executableWhenComplete: ['PORTAL-APP'],
    safePreblockerWork: true,
  }];
  const slices = [{
    id: 'PORTAL-APP', status: 'COMPLETE', gate: 'REVIEW',
    dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false,
  }];
  const picked = selectReady(slices, { requirements: reqs });
  assert.equal(picked.internalGap.id, 'ADMIN-APP');
  assert.equal(picked.exhaustionAllowed, false);
});

test('C: Portal foundation alone is not product-complete; full portal rows are complete after file projection', () => {
  const rows = requirements().filter((row) => row.productCapability === 'PORTAL' || String(row.id).startsWith('FZ-REQ-PORTAL-'));
  assert.ok(rows.some((row) => row.foundationOnly === true && row.status === 'DONE_AT_MAX_DEPTH'));
  assert.equal(portalCapabilityIsProductComplete(rows.filter((row) => row.foundationOnly === true)), false);
  assert.equal(portalCapabilityIsProductComplete(rows), true);
  assert.equal(rows.find((row) => row.id === 'FZ-REQ-PORTAL-005').status, 'DONE_AT_MAX_DEPTH');
  for (const id of ['FZ-REQ-PORTAL-002', 'FZ-REQ-PORTAL-003', 'FZ-REQ-PORTAL-004', 'FZ-REQ-PORTAL-005']) {
    assert.equal(rows.find((row) => row.id === id).status, 'DONE_AT_MAX_DEPTH');
  }
});

test('D: Mobile binding stays materialized on the main graph', () => {
  const main = parseExecutionGraph(readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-MAIN.md'), 'utf8'));
  assert.ok(main.some((slice) => slice.id === 'MOBILE-CLIENT-BOUNDARY'));
  const mobile = requirements().find((row) => row.id === 'FZ-REQ-MOBILE-001');
  assert.equal(mobile.executableSlice, 'MOBILE-CLIENT-BOUNDARY');
  assert.equal(mobile.status, 'DONE_AT_MAX_DEPTH');
});

test('E: Garden OS and SketchUp keep executable future chains', () => {
  const main = parseExecutionGraph(readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-MAIN.md'), 'utf8'));
  assert.ok(main.some((slice) => slice.id === 'GARDENOS-RELATION-BOUNDARY'));
  assert.ok(main.some((slice) => slice.id === 'SKETCHUP-ADAPTER-BOUNDARY'));
  assert.equal(requirements().find((row) => row.id === 'FZ-REQ-GARDENOS-001').executableSlice, 'GARDENOS-RELATION-BOUNDARY');
  assert.equal(requirements().find((row) => row.id === 'FZ-REQ-SKETCHUP-001').executableSlice, 'SKETCHUP-ADAPTER-BOUNDARY');
});

test('F: CMS-ACCEPT open does not block an independent Offer slice', () => {
  const slices = [
    { id: 'CMS-ACCEPT', status: 'OPEN', gate: 'REVIEW', dependsOn: [], next: [], autonomous: true, reportOnly: true, externalUnmet: false },
    { id: 'CRM-OFFER-CONTRACT', status: 'OPEN', gate: 'REVIEW', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
  ];
  const picked = selectReady(slices, { requirements: [] });
  assert.equal(picked.selected, 'CRM-OFFER-CONTRACT');
});

test('G: Lead security acceptance open does not block Admin', () => {
  const slices = [
    { id: 'LEAD-SEC-ACCEPT', status: 'OPEN', gate: 'REVIEW', dependsOn: [], next: [], autonomous: true, reportOnly: true, externalUnmet: false },
    { id: 'ADMIN-APP', status: 'OPEN', gate: 'REVIEW', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
  ];
  const picked = selectReady(slices, { requirements: [] });
  assert.equal(picked.selected, 'ADMIN-APP');
});

test('H: ZAP waiting does not appear as a READY product blocker', () => {
  const main = readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-MAIN.md'), 'utf8');
  assert.match(main, /ZAP ARMED_WAITING_FOR_TARGET/);
  assert.match(main, /does \*\*not\*\* block unrelated product/);
  const picked = selectReady(parseExecutionGraph(main), { requirements: [] });
  assert.equal(picked.ready.includes('PORTAL-FILE-PROJECTION'), false);
  assert.equal(picked.ready.includes('PXI-SIGNAL-MODEL'), false);
  assert.equal(picked.ready.includes('SITEINTEL-RULES'), true);
  assert.equal(picked.ready.some((id) => /ZAP|DEPENDENCY-CHECK/.test(id)), false);
  assert.equal(picked.exhaustionAllowed, false);
});

test('I: Dependency-Check NOT_JUSTIFIED does not create a product blocker', () => {
  const main = readFileSync(path.join(root, 'docs/architecture/NEXT-SLICES-MAIN.md'), 'utf8');
  assert.match(main, /Dependency-Check SCA/);
  assert.match(main, /Does \*\*not\*\* block Offer\/Admin\/Portal/);
  const graph = parseExecutionGraph(main);
  assert.equal(graph.some((slice) => /DEPENDENCY-CHECK/i.test(slice.id)), false);
});

test('J: only genuine Owner gates remaining may allow exhaustion', () => {
  const slices = [
    { id: 'PAY', status: 'OPEN', gate: 'OWNER-DECISION', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
    { id: 'SIGN', status: 'OPEN', gate: 'OWNER-DECISION', dependsOn: [], next: [], autonomous: true, reportOnly: false, externalUnmet: false },
  ];
  const picked = selectReady(slices, { requirements: [] });
  assert.equal(picked.selected, null);
  assert.equal(picked.exhaustionAllowed, true);
  assert.equal(picked.withheld.length, 2);
});

test('K: missing executableSlice declaration fails roadmap validation', () => {
  const missing = missingExecutablePathDeclarations([{
    id: 'FZ-REQ-SYNTH-001',
    status: 'BLOCKED_BY_DEPENDENCY',
    gate: 'NONE',
    blockerClass: 'INTERNAL',
    executableSlice: '',
    safePreblockerWork: true,
  }]);
  assert.deepEqual(missing, ['FZ-REQ-SYNTH-001']);
});

test('L: a synthetic unknown internal requirement omitted from the graph is caught without hard-coding its name', () => {
  const sliceId = 'SYNTHETIC-CAPABILITY-BOUNDARY';
  const reqs = [{
    id: 'FZ-REQ-SYNTHETIC-001',
    status: 'BLOCKED_BY_DEPENDENCY',
    gate: 'NONE',
    blockerClass: 'INTERNAL',
    executableSlice: sliceId,
    executableWhenComplete: [],
    safePreblockerWork: true,
  }];
  const picked = selectReady([], { requirements: reqs });
  assert.equal(picked.selected, null);
  assert.equal(picked.internalGap.id, sliceId);
  assert.equal(picked.exhaustionAllowed, false);
  assert.match(picked.reason, /FZ-REQ-SYNTHETIC-001/);
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
