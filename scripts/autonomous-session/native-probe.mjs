// Explicit live phase-one probe. Not imported by the session scheduler.
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executableIdentity, runNativeProcess } from './native-process.mjs';
import { safeText } from './decision.mjs';
import { inspectNativeResult } from './native-result.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (process.argv.slice(2).some(arg => !['--sandbox-only', '--unelevated'].includes(arg))) throw new Error('UNSUPPORTED_PROBE_ARGUMENT');
if (process.argv.includes('--unelevated') && !process.argv.includes('--sandbox-only')) throw new Error('SANDBOX_ONLY_REQUIRED');
const backend = process.argv.includes('--unelevated') ? 'unelevated' : 'elevated';
const codex = executableIdentity('C:/Users/sebas/AppData/Local/OpenAI/Codex/bin/247581e40ee272fb/codex.exe');
const powershell = executableIdentity('C:/Users/sebas/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe');
const node = executableIdentity(process.execPath);
const authHome = 'C:/Users/sebas/.codex';
const env = {
  SystemRoot: 'C:\\Windows', WINDIR: 'C:\\Windows',
  PATH: ['C:\\Windows\\System32', path.dirname(powershell.path), path.dirname(node.path)].join(';'),
  USERPROFILE: 'C:\\Users\\sebas', HOMEDRIVE: 'C:', HOMEPATH: '\\Users\\sebas',
  CODEX_HOME: authHome,
};
const scratch = path.join(root, 'tmp');
mkdirSync(scratch, { recursive: true });
const parent = mkdtempSync(path.join(scratch, 'native executor '));
const fixture = path.join(parent, 'read only workspace');
mkdirSync(fixture);
env.TEMP = path.join(parent, 'runtime'); env.TMP = env.TEMP;
mkdirSync(env.TEMP);
execFileSync('D:/Git/cmd/git.exe', ['-c', 'core.hooksPath=NUL', 'init', '-b', 'main', fixture], { windowsHide: true, stdio: 'ignore' });
const nonce = randomUUID();
writeFileSync(path.join(fixture, 'context.txt'), nonce);
const outside = path.join(parent, 'outside-sentinel.txt');
writeFileSync(outside, 'NON_SECRET_OUTSIDE_SENTINEL');
writeFileSync(path.join(fixture, 'probe.mjs'), `import {readFileSync,writeFileSync} from 'node:fs';
const result={nonce:readFileSync(new URL('./context.txt',import.meta.url),'utf8'),write_denied:false,outside_read_denied:false};
try{writeFileSync(new URL('./forbidden-write.txt',import.meta.url),'unexpected');}catch{result.write_denied=true;}
try{readFileSync(${JSON.stringify(outside)},'utf8');}catch{result.outside_read_denied=true;}
console.log(JSON.stringify(result));\n`);
const schema = {
  type: 'object', additionalProperties: false,
  properties: {
    session_id: { type: 'string' }, task_id: { type: 'string' }, status: { type: 'string', enum: ['COMPLETE', 'BLOCKED'] },
    summary: { type: 'string' }, observed_nonce: { type: 'string' }, write_denied: { type: 'boolean' }, outside_read_denied: { type: 'boolean' },
    security_events: { type: 'array', items: { type: 'string' } }, blockers: { type: 'array', items: { type: 'string' } },
  }, required: ['session_id', 'task_id', 'status', 'summary', 'observed_nonce', 'write_denied', 'outside_read_denied', 'security_events', 'blockers'],
};
const schemaFile = path.join(parent, 'result-schema.json');
writeFileSync(schemaFile, JSON.stringify(schema));
const sessionId = randomUUID();
const packet = {
  session_id: sessionId, task_id: 'read-only-fixture', classification: 'REVIEW', repository_root: fixture,
  objective: `Execute the supplied probe once using ${node.path} and the absolute probe.mjs path. Report its measured booleans and nonce. Do not infer successful checks from instructions. If any operation cannot run, return BLOCKED. No other file content is needed.`,
  allowed_paths: ['context.txt', 'probe.mjs'], prohibited_paths: [authHome, path.join(root, 'apps'), path.join(root, 'docs'), path.join(root, 'scripts'), outside],
  prohibited_actions: ['escalation', 'network tools', 'production', 'DNS', 'payments', 'secrets', 'Git mutations', 'policy modification'],
  canon_refs: ['Native executor phase-one fixture; no product context'],
  deadline: new Date(Date.now() + 90000).toISOString(), timeout: 90000, retry_budget: 0, expected_result_schema: schema,
};
const filesystem = {
  ':root': 'deny', ':minimal': 'read', ':workspace_roots': { '.': 'read' },
  [authHome]: 'deny', [path.dirname(node.path).replaceAll('\\', '/')]: 'read',
  [path.dirname(powershell.path).replaceAll('\\', '/')]: 'read',
};
const configs = {
  approval_policy: 'never', default_permissions: 'native-fixture',
  'permissions.native-fixture.filesystem': filesystem,
  'permissions.native-fixture.network.enabled': false,
  'windows.sandbox': backend,
  project_doc_max_bytes: 0, web_search: 'disabled',
  'apps._default.enabled': false, mcp_servers: {},
  'shell_environment_policy.inherit': 'none',
  'shell_environment_policy.set': { PATH: env.PATH, SystemRoot: env.SystemRoot, WINDIR: env.WINDIR },
};
// JSON strings are TOML-compatible strings; tables need explicit inline TOML serialization.
function toml(value) {
  if (value && typeof value === 'object') return `{ ${Object.entries(value).map(([key, val]) => `${JSON.stringify(key)} = ${toml(val)}`).join(', ')} }`;
  return JSON.stringify(value);
}
const args = ['exec', '--ignore-user-config', '--ephemeral', '--strict-config', '--json', '--color', 'never', '--cd', fixture,
  '--output-schema', schemaFile, ...Object.entries(configs).flatMap(([key, value]) => ['-c', `${key}=${toml(value)}`]), '-'];
const abort = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => abort.abort());
const sandboxArgs = ['sandbox', '-P', 'native-fixture', '--cd', fixture,
  ...Object.entries(configs).flatMap(([key, value]) => ['-c', `${key}=${toml(value)}`]), '--', node.path, path.join(fixture, 'probe.mjs')];
const sandbox = await runNativeProcess({ executable: codex, powershell, cwd: fixture, args: sandboxArgs, env, timeoutMs: 30000, signal: abort.signal });
let sandboxMeasurements = null;
try { sandboxMeasurements = JSON.parse(sandbox.stdout.trim()); } catch { /* Exact JSON required. */ }
const sandboxPass = sandbox.status === 'EXITED' && sandbox.exitCode === 0 && sandboxMeasurements?.nonce === nonce &&
  sandboxMeasurements?.write_denied === true && sandboxMeasurements?.outside_read_denied === true;
if (!sandboxPass || process.argv.includes('--sandbox-only')) {
  const diagnostic = { phase: 'sandbox-preflight', backend, fixture, executor: codex,
    status: sandbox.status, exit_code: sandbox.exitCode, pass: sandboxPass,
    job_ready: sandbox.jobReady,
    started_at: sandbox.startedAt, finished_at: sandbox.finishedAt,
    blocker: /elevated Windows sandbox requires effective `:root` read access/.test(sandbox.stderr)
      ? 'ELEVATED_WINDOWS_SANDBOX_REQUIRES_ROOT_READ'
      : /unelevated restricted-token sandbox cannot enforce split filesystem read restrictions|Restricted read-only access requires the elevated Windows sandbox backend/.test(sandbox.stderr)
        ? 'UNELEVATED_WINDOWS_SANDBOX_CANNOT_ENFORCE_RESTRICTED_READS' : sandboxPass ? null : 'SANDBOX_PREFLIGHT_FAILED',
    model_invoked: false,
    error_summary: (() => { const line = sandbox.stderr.split(/\r?\n/).find(value => /sandbox|error|restricted/i.test(value) && !value.includes('NATIVE_SUPERVISOR')); if (!line) return null; try { return safeText(line).slice(0,400); } catch { return 'REDACTED'; } })(),
    no_fixture_write: !existsSync(path.join(fixture, 'forbidden-write.txt')),
  };
  writeFileSync(path.join(parent, 'sandbox-report.json'), JSON.stringify(diagnostic,null,2));
  console.log(JSON.stringify(diagnostic));
  process.exit(sandboxPass ? 0 : 2);
}
const result = await runNativeProcess({ executable: codex, powershell, cwd: fixture, args, env,
  input: JSON.stringify(packet), timeoutMs: 90000, signal: abort.signal });
const combined = result.stdout + result.stderr;
const inspected = inspectNativeResult(result.stdout, sessionId, packet.task_id);
const { reply } = inspected;
const report = {
  phase: 'read-only-fixture', session_id: sessionId, fixture, executor: codex,
  process_status: result.status, exit_code: result.exitCode, started_at: result.startedAt, finished_at: result.finishedAt,
  job_ready: result.jobReady, event_types: inspected.eventTypes,
  item_types: inspected.itemTypes,
  reply_seen: reply !== null,
  reply_status: ['COMPLETE', 'BLOCKED'].includes(reply?.status) ? reply.status : null,
  reply_summary: (() => { try { return safeText(reply?.summary).replace(/[\x00-\x1f]/g, ' ').slice(0,500); } catch { return null; } })(),
  reply_blockers: Array.isArray(reply?.blockers) ? reply.blockers.slice(0,4).map(value => { try { return safeText(value).replace(/[\x00-\x1f]/g, ' ').slice(0,500); } catch { return 'REDACTED'; } }) : [],
  sandbox_preflight: {
    pass: sandboxPass, process_status: sandbox.status, exit_code: sandbox.exitCode,
    measured: sandboxMeasurements !== null,
    error_summary: (() => { try { return safeText(sandbox.stderr.match(/(?:Error:|error:)[^\r\n]{0,400}/)?.[0]); } catch { return null; } })(),
  },
  diagnostics: {
    network_error: /error sending request|failed to connect|connection.*closed|dns error|network.*unreachable/i.test(combined),
    permission_error: /Access is denied|Permission denied|os error 5/i.test(combined),
    config_error: /Error loading configuration|unknown field|unknown variant|invalid.*config/i.test(combined),
    usage_limit: /usage limit|quota|rate.limit/i.test(combined),
    sandbox_error: /sandbox.*failed|helper_failed|Restricted read-only access requires/i.test(combined),
    auth_error: /unauthorized|not logged in|authentication.*failed|refresh.*failed/i.test(combined),
  },
  structured_return: inspected.structured,
  nonce_measured: reply?.observed_nonce === nonce,
  measured_write_denied: reply?.write_denied === true,
  measured_outside_read_denied: reply?.outside_read_denied === true,
  no_fixture_write: !existsSync(path.join(fixture, 'forbidden-write.txt')) && readdirSync(fixture).sort().join(',') === '.git,context.txt,probe.mjs',
  context_unchanged: readFileSync(path.join(fixture, 'context.txt'), 'utf8') === nonce,
};
report.pass = sandboxPass && result.status === 'EXITED' && result.exitCode === 0 && report.structured_return && reply?.status === 'COMPLETE' && reply.blockers.length === 0 && report.nonce_measured && report.measured_write_denied && report.measured_outside_read_denied && report.no_fixture_write && report.context_unchanged;
writeFileSync(path.join(parent, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (!report.pass) process.exitCode = 2;
