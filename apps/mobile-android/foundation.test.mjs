import test from 'node:test';
import assert from 'node:assert/strict';
import { leadPaths } from '../../packages/api-client/src/index.ts';
import {
  androidClientFoundation,
  assertAndroidDoesNotOwnCommercialState,
  fetchAndroidCoreHealth,
  fetchAndroidCoreReady,
} from './foundation.mjs';

test('Android foundation stays a Core API client without commercial state or Play credentials', () => {
  const foundation = androidClientFoundation();
  assert.equal(foundation.requirementId, 'FZ-REQ-MOBILE-002');
  assert.equal(foundation.surface, 'android');
  assert.equal(foundation.businessTruth, 'core-api');
  assert.equal(foundation.ownsCommercialState, false);
  assert.equal(foundation.storeUpload, false);
  assert.equal(foundation.playCredentialsInTree, false);
  assert.equal(foundation.clientPaths.health, leadPaths.health);
  assert.equal(foundation.clientPaths.ready, leadPaths.ready);
  assert.throws(
    () => assertAndroidDoesNotOwnCommercialState({ localLeadStore: true }),
    /ANDROID_COMMERCIAL_STATE_FORBIDDEN/,
  );
  assert.throws(
    () => assertAndroidDoesNotOwnCommercialState({ playCredentialsInTree: true }),
    /ANDROID_PLAY_CREDENTIALS_FORBIDDEN/,
  );
});

test('Android health probe maps ready, error, and forbidden without inventing CRM rows', async () => {
  const calls = [];
  const ready = await fetchAndroidCoreHealth({
    baseUrl: 'https://core.example',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        async json() {
          return { ok: true };
        },
      };
    },
  });
  assert.deepEqual(ready, { status: 'ready', ok: true });
  assert.equal(calls[0].url, `https://core.example${leadPaths.health}`);
  assert.equal(calls[0].init.signal instanceof AbortSignal, true);

  const forbidden = await fetchAndroidCoreHealth({
    baseUrl: 'https://core.example/',
    fetchImpl: async () => ({ ok: false, status: 403, async json() { return {}; } }),
  });
  assert.deepEqual(forbidden, { status: 'forbidden' });

  const errored = await fetchAndroidCoreHealth({
    baseUrl: 'https://core.example',
    fetchImpl: async () => {
      throw new Error('network');
    },
  });
  assert.deepEqual(errored, { status: 'error' });

  await assert.rejects(
    () => fetchAndroidCoreHealth({ baseUrl: '' }),
    /ANDROID_BASE_URL_REQUIRED/,
  );
});

test('Android ready probe stays truthful for not-ready Core API', async () => {
  const notReady = await fetchAndroidCoreReady({
    baseUrl: 'https://core.example',
    fetchImpl: async () => ({ ok: false, status: 503, async json() { return {}; } }),
  });
  assert.deepEqual(notReady, { status: 'not-ready' });

  const ready = await fetchAndroidCoreReady({
    baseUrl: 'https://core.example',
    fetchImpl: async (url) => {
      assert.equal(url, `https://core.example${leadPaths.ready}`);
      return { ok: true, status: 200, async json() { return { ok: true }; } };
    },
  });
  assert.deepEqual(ready, { status: 'ready' });
});
