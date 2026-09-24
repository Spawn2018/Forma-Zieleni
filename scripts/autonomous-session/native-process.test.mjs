import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { executableIdentity, runNativeProcess } from './native-process.mjs';

const windows = process.platform === 'win32';
const repository = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const fixtureRoot = path.join(repository, 'tmp', 'native-process-tests');
function resolvePowerShell() {
  const configured = process.env.NATIVE_TEST_POWERSHELL;
  if (configured) return path.isAbsolute(configured) && /\.exe$/i.test(configured) && existsSync(configured) ? configured : null;
  for (const dir of (process.env.PATH ?? process.env.Path ?? '').split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir.replace(/^"(.*)"$/, '$1'), 'pwsh.exe');
    if (path.isAbsolute(candidate) && existsSync(candidate)) return candidate;
  }
  return null;
}
const pwsh = resolvePowerShell();
const nativeSkip = !windows ? 'Windows only' : !pwsh ? 'pwsh not on PATH or NATIVE_TEST_POWERSHELL' : false;
function fixture(t) {
  mkdirSync(fixtureRoot, { recursive: true });
  const cwd = mkdtempSync(path.join(fixtureRoot, 'spaces & literal '));
  t.after(() => {
    assert.ok(path.resolve(cwd).startsWith(path.resolve(fixtureRoot) + path.sep));
    rmSync(cwd, { recursive: true, force: true });
  });
  const env = Object.fromEntries(['SystemRoot', 'WINDIR', 'TEMP', 'TMP'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
  if (!pwsh) throw new Error('POWERSHELL_UNAVAILABLE');
  // GHA Windows cold-start can spend >15s on the first pwsh+Add-Type Job Object
  // compile before NATIVE_SUPERVISOR_READY; keep the budget above that floor.
  return { executable: executableIdentity(process.execPath), powershell: executableIdentity(pwsh), cwd, env, timeoutMs: 60000 };
}
function alive(pid) { try { process.kill(pid, 0); return true; } catch (error) { if (error.code === 'ESRCH') return false; throw error; } }
async function eventually(predicate, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (!predicate()) { assert.ok(Date.now() < deadline, 'condition did not become true within budget'); await delay(50); }
}

test('real Windows supervisor preserves argv, stdin and spaced cwd without shell expansion', { skip: nativeSkip }, async t => {
  const options = fixture(t);
  const args = ['two words', '', 'quote"inside', 'trailing\\', '& echo injected', '$(Get-Process)', '%PATH%', 'zażółć'];
  const script = path.join(options.cwd, 'echo & arguments.cjs');
  writeFileSync(script, 'let input="";process.stdin.setEncoding("utf8");process.stdin.on("data",c=>input+=c);process.stdin.on("end",()=>console.log(JSON.stringify({args:process.argv.slice(2),input,cwd:process.cwd()})));');
  const input = 'literal stdin zażółć 🌿\n" & $(no command)\n';
  const result = await runNativeProcess({ ...options, args: [script, ...args], input });
  assert.equal(result.status, 'EXITED', JSON.stringify(result));
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.jobReady, true);
  assert.deepEqual(JSON.parse(result.stdout), { args, input, cwd: options.cwd });
});

test('real Windows child receives only supplied environment, omitting inherited poison', { skip: nativeSkip }, async t => {
  const options = fixture(t);
  const key = 'NATIVE_PROCESS_TEST_POISON';
  const previous = process.env[key];
  process.env[key] = 'must-not-leak';
  t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  const result = await runNativeProcess({ ...options, args: ['-e', `console.log(JSON.stringify({poison:process.env.${key}??null,nodeOptions:process.env.NODE_OPTIONS??null}))`] });
  assert.equal(result.exitCode, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { poison: null, nodeOptions: null });
});

test('changed executable identity rejects before launch', { skip: nativeSkip }, t => {
  const options = fixture(t);
  assert.throws(() => runNativeProcess({ ...options, executable: { ...options.executable, sha256: '0'.repeat(64) }, args: [] }), /EXECUTABLE_CHANGED/);
  assert.throws(() => runNativeProcess({ ...options, powershell: { ...options.powershell, sha256: '0'.repeat(64) }, args: [] }), /EXECUTABLE_CHANGED/);
});

test('real Windows output flooding is bounded', { skip: nativeSkip }, async t => {
  const result = await runNativeProcess({ ...fixture(t), maxOutput: 4096, args: ['-e', 'setInterval(()=>process.stdout.write("x".repeat(65536)),1)'] });
  assert.equal(result.status, 'OUTPUT_LIMIT', JSON.stringify(result));
  assert.ok(Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr) <= 4096);
});

test('real Windows streamed Unicode survives chunk boundaries', { skip: nativeSkip }, async t => {
  const script = 'const bytes=Buffer.from([240,159,140,191]);let i=0;const timer=setInterval(()=>{process.stdout.write(bytes.subarray(i,i+1));if(++i===bytes.length)clearInterval(timer)},50);';
  const result = await runNativeProcess({ ...fixture(t), args: ['-e', script] });
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.stdout, '🌿');
});

for (const mode of ['TIMEOUT', 'CANCELLED']) {
  test(`real Windows ${mode} closes job and terminates descendant`, { skip: nativeSkip }, async t => {
    const options = fixture(t);
    const pidFile = path.join(options.cwd, 'descendant.pid');
    const parentFile = path.join(options.cwd, 'parent.cjs');
    writeFileSync(parentFile, 'const {spawn}=require("node:child_process");const {writeFileSync}=require("node:fs");const child=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore",windowsHide:true});writeFileSync(process.argv[2],String(child.pid));setInterval(()=>{},1000);');
    const controller = new AbortController();
    let pid;
    t.after(() => { if (pid && alive(pid)) process.kill(pid); });
    const running = runNativeProcess({ ...options, args: [parentFile, pidFile], timeoutMs: mode === 'TIMEOUT' ? 12000 : 20000, signal: controller.signal });
    await eventually(() => existsSync(pidFile));
    pid = Number(readFileSync(pidFile, 'utf8'));
    assert.ok(Number.isSafeInteger(pid) && pid > 0);
    assert.equal(alive(pid), true, 'descendant must exist before termination');
    if (mode === 'CANCELLED') controller.abort();
    const result = await running;
    assert.equal(result.status, mode, JSON.stringify(result));
    assert.equal(result.jobReady, true, result.stderr);
    await eventually(() => !alive(pid), 3000);
  });
}

test('already cancelled request never starts supervisor', { skip: nativeSkip }, async t => {
  const controller = new AbortController();
  controller.abort();
  const result = await runNativeProcess({ ...fixture(t), args: ['-e', 'process.exit(99)'], signal: controller.signal });
  assert.equal(result.status, 'CANCELLED');
  assert.equal(result.jobReady, false);
  assert.equal(result.stdout, '');
});
