import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import test from 'node:test';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { storeMaster } from '../media/src/master.mjs';
import { publicContentHtml, redactCmsLog, reviewOutboundUrl } from './src/cms-harden.ts';

const token = 'UNPUBLISHED_TOKEN_9f3a';

test('svg upload is denied and public html omits the unpublished token', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'fz-harden-'));
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  await assert.rejects(() => storeMaster({ root, bytes: svg, declaredMime: 'image/svg+xml' }), /MIME_DENIED/);
  const html = publicContentHtml('Projekt ogrodu', token);
  assert.equal(html.includes(token), false);
  assert.equal(html, '<h1>Projekt ogrodu</h1>');
  const hostile = publicContentHtml('<img src=x onerror=alert(1)>', token);
  assert.equal(hostile.includes('<img'), false);
  assert.match(hostile, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.throws(() => publicContentHtml(`Projekt ${token}`, token), /UNPUBLISHED_IN_TITLE/);
});

test('outbound fetches reject private and link-local targets', () => {
  assert.equal(reviewOutboundUrl('https://example.test/media').ok, true);
  for (const target of [
    'http://127.0.0.1/latest',
    'http://localhost/admin',
    'http://169.254.169.254/latest/meta-data',
    'http://10.1.2.3/',
    'http://192.168.0.5/',
    'http://172.16.0.4/',
    'http://[::1]/',
    'file:///etc/passwd',
    'https://user:pass@example.test/',
  ]) {
    assert.equal(reviewOutboundUrl(target).ok, false, target);
  }
});

test('cms logs redact secrets and the unpublished token', () => {
  const redacted = redactCmsLog(
    {
      authorization: 'Bearer ya29.secret',
      cookie: 'session=secret',
      draftBody: `szkic ${token}`,
      note: `seen ${token}`,
    },
    [token],
  );
  const text = JSON.stringify(redacted);
  assert.equal(text.includes('ya29'), false);
  assert.equal(text.includes(token), false);
  assert.equal(text.includes('session=secret'), false);
  assert.match(text, /\[REDACTED\]/);
});
