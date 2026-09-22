import assert from 'node:assert/strict';
import test from 'node:test';
import { readPublishedHome, PublishedHomeUnavailable, retainPublishedHome } from './published-home.ts';
import { homeShell } from './shell.ts';
import { renderToStaticMarkup } from 'react-dom/server';

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

test('the last published title survives when the editorial read stops', async () => {
  let open = true;
  const read = async () => {
    if (!open) throw new PublishedHomeUnavailable();
    return { state: 'published', title: 'Projekt ogrodu' };
  };
  const first = await retainPublishedHome(null, read);
  assert.deepEqual(first.home, { state: 'published', title: 'Projekt ogrodu' });
  open = false;
  const served = await retainPublishedHome(first.snapshot, read);
  assert.deepEqual(served.home, { state: 'published', title: 'Projekt ogrodu' });
  const html = renderToStaticMarkup(homeShell(served.home));
  assert.match(html, /Projekt ogrodu/);
  assert.equal(html.includes('Szkic'), false);
  const missed = await retainPublishedHome(null, async () => ({ state: 'absent' }));
  await assert.rejects(() => retainPublishedHome(missed.snapshot, read), PublishedHomeUnavailable);
});
