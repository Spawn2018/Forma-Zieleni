import assert from 'node:assert/strict';
import test from 'node:test';
import { readPublishedHome, PublishedHomeUnavailable } from './published-home.ts';

const origin = 'http://127.0.0.1:8787';
const documentId = 'pg8k2n4p6q8r0s2t';

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('an unconfigured home does not call the API', async () => {
  let called = false;
  const home = await readPublishedHome({
    origin: undefined,
    documentId: undefined,
    fetchImpl: async () => {
      called = true;
      return json(200, {});
    },
  });
  assert.deepEqual(home, { state: 'unconfigured' });
  assert.equal(called, false);
});

test('a published title is the only field kept', async () => {
  let requested = null;
  const home = await readPublishedHome({
    origin,
    documentId,
    fetchImpl: async (url, init) => {
      requested = { href: String(url), redirect: init.redirect };
      return json(200, {
        id: documentId,
        title: '  Rabata cienista  ',
        status: 'published',
        summary: 'Najwyższa jakość i kompleksowe rozwiązania.',
      });
    },
  });
  assert.deepEqual(home, { state: 'published', title: 'Rabata cienista' });
  assert.equal(requested.href, `${origin}/v1/content/${documentId}`);
  assert.equal(requested.redirect, 'error');
});

test('draft and missing documents stay off the public page', async () => {
  for (const status of [401, 403, 404]) {
    const home = await readPublishedHome({
      origin,
      documentId,
      fetchImpl: async () => json(status, { id: documentId, title: 'Szkic', status: 'draft' }),
    });
    assert.deepEqual(home, { state: 'absent' });
  }
});

test('a bad origin, id, or payload fails closed', async () => {
  await assert.rejects(
    () => readPublishedHome({ origin: 'http://user:pass@127.0.0.1', documentId, fetchImpl: async () => json(200, {}) }),
    PublishedHomeUnavailable,
  );
  await assert.rejects(
    () => readPublishedHome({ origin: 'file:///tmp/api', documentId, fetchImpl: async () => json(200, {}) }),
    PublishedHomeUnavailable,
  );
  await assert.rejects(
    () => readPublishedHome({ origin, documentId: '../etc/passwd', fetchImpl: async () => json(200, {}) }),
    PublishedHomeUnavailable,
  );
  await assert.rejects(
    () =>
      readPublishedHome({
        origin,
        documentId,
        fetchImpl: async () => json(200, { id: 'otherdocumentid00', title: 'Inny', status: 'published' }),
      }),
    PublishedHomeUnavailable,
  );
  await assert.rejects(
    () =>
      readPublishedHome({
        origin,
        documentId,
        fetchImpl: async () => json(200, { id: documentId, title: 'Linia\nzła', status: 'published' }),
      }),
    PublishedHomeUnavailable,
  );
  await assert.rejects(
    () => readPublishedHome({ origin, documentId, fetchImpl: async () => json(500, { id: documentId }) }),
    PublishedHomeUnavailable,
  );
});
