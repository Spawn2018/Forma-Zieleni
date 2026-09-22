import test from 'node:test';
import assert from 'node:assert/strict';
import {
  publicSearchPreview,
  redactSearchSecurityLog,
  sanitizeImportedLabel,
  sanitizeSearchUrl,
} from './src/search-security.ts';

test('imported labels reject XSS and control characters', () => {
  assert.equal(sanitizeImportedLabel('<script>alert(1)</script>').rawRejected, true);
  assert.equal(sanitizeImportedLabel('onclick=alert(1)').rawRejected, true);
  assert.equal(sanitizeImportedLabel('javascript:alert(1)').rawRejected, true);
  const ok = sanitizeImportedLabel('Ogród <prywatny>');
  assert.equal(ok.rawRejected, false);
  assert.equal(ok.label, 'Ogród &lt;prywatny&gt;');
});

test('search URLs are sanitized and credentials are refused', () => {
  assert.equal(sanitizeSearchUrl('https://formazieleni.pl/uslugi').ok, true);
  assert.equal(sanitizeSearchUrl('javascript:alert(1)').ok, false);
  assert.equal(sanitizeSearchUrl('https://user:pass@evil.example/').reason, 'URL_USERINFO');
  assert.equal(sanitizeSearchUrl('ftp://example.com').reason, 'URL_SCHEME');
});

test('public preview does not leak draft bodies and logs redact tokens', () => {
  const draft = publicSearchPreview({
    title: 'Szkic',
    draftBody: 'secret draft prose',
    published: false,
  });
  assert.equal(draft.mode, 'draft');
  assert.equal(draft.draftBody, null);
  assert.equal(draft.title, null);
  const published = publicSearchPreview({
    title: 'Opublikowane',
    draftBody: 'should not appear',
    published: true,
  });
  assert.equal(published.mode, 'public');
  assert.equal(published.draftBody, null);
  assert.equal(published.title, 'Opublikowane');
  const redacted = redactSearchSecurityLog({
    access_token: 'ya29.secret',
    note: 'safe',
  });
  assert.equal(JSON.stringify(redacted).includes('ya29'), false);
  assert.match(JSON.stringify(redacted), /\[REDACTED\]/);
});
