import { spawn } from 'node:child_process';
import { lstatSync, realpathSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const supervisor = fileURLToPath(new URL('./native-job.ps1', import.meta.url));

export function executableIdentity(file) {
  if (!path.isAbsolute(file) || !/\.exe$/i.test(file)) throw new Error('EXECUTABLE_REQUIRED');
  const info = lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('EXECUTABLE_UNSAFE');
  return { path: realpathSync(file), sha256: createHash('sha256').update(readFileSync(file)).digest('hex') };
}

// Internal primitive: callers supply reviewed identities, never task/model executables or argv.
export function runNativeProcess({ executable, powershell, cwd, args, env, input = '', timeoutMs, signal, maxOutput = 262144 }) {
  if (process.platform !== 'win32') throw new Error('WINDOWS_REQUIRED');
  for (const identity of [executable, powershell]) if (executableIdentity(identity.path).sha256 !== identity.sha256) throw new Error('EXECUTABLE_CHANGED');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 180000 || !Number.isInteger(maxOutput) || maxOutput < 1 || maxOutput > 1048576) throw new Error('PROCESS_BUDGET_INVALID');
  if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string' || arg.includes('\0'))) throw new Error('ARGUMENT_INVALID');
  const request = JSON.stringify({ executable: executable.path, cwd: realpathSync(cwd), arguments: args, env, input });
  if (Buffer.byteLength(request) > 65536) throw new Error('PACKET_TOO_LARGE');
  return new Promise(resolve => {
    const startedAt = new Date().toISOString();
    if (signal?.aborted) { resolve({ status: 'CANCELLED', exitCode: null, stdout: '', stderr: '', startedAt, finishedAt: startedAt, jobReady: false }); return; }
    const child = spawn(powershell.path, ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', supervisor], {
      cwd, env, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
    });
    let status = 'EXITED', bytes = 0, stdout = '', stderr = '';
    const stop = reason => { if (status === 'EXITED') status = reason; child.kill(); };
    const abort = () => stop('CANCELLED');
    const timer = setTimeout(() => stop('TIMEOUT'), timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    for (const [stream, name] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']]) stream.setEncoding('utf8').on('data', chunk => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxOutput) { stop('OUTPUT_LIMIT'); return; }
      if (name === 'stdout') stdout += chunk; else stderr += chunk;
    });
    child.on('error', () => { status = 'SPAWN_FAILED'; });
    child.stdin.on('error', () => {}); // Early rejection can close stdin; close/exit remains authoritative.
    child.on('close', code => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      resolve({ status, exitCode: code, stdout, stderr, startedAt, finishedAt: new Date().toISOString(), jobReady: stderr.includes('NATIVE_SUPERVISOR_READY') });
    });
    child.stdin.end(`${request}\n`);
  });
}
