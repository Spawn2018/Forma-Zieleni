import test from 'node:test';
import assert from 'node:assert/strict';
import { leadPaths } from '../../packages/api-client/src/index.ts';
import {
  assertIosDoesNotOwnCommercialState,
  fetchIosCoreHealth,
  fetchIosCoreReady,
  iosClientFoundation,
} from './foundation.mjs';

test('iOS foundation stays a Core API client without commercial state or App Store credentials', () => {
  const foundation = iosClientFoundation();
  assert.equal(foundation.requirementId, 'FZ-REQ-MOBILE-003');
  assert.equal(foundation.surface, 'ios');
  assert.equal(foundation.businessTruth, 'core-api');
  assert.equal(foundation.ownsCommercialState, false);
  assert.equal(foundation.storeUpload, false);
  assert.equal(foundation.appStoreCredentialsInTree, false);
  assert.equal(foundation.clientPaths.health, leadPaths.health);
  assert.equal(foundation.clientPaths.ready, leadPaths.ready);
  assert.throws(
    () => assertIosDoesNotOwnCommercialState({ localLeadStore: true }),
    /IOS_COMMERCIAL_STATE_FORBIDDEN/,
  );
  assert.throws(
    () => assertIosDoesNotOwnCommercialState({ appStoreCredentialsInTree: true }),
    /IOS_APP_STORE_CREDENTIALS_FORBIDDEN/,
  );
});

test('iOS health probe maps ready, error, and forbidden without inventing CRM rows', async () => {
  const calls = [];
  const ready = await fetchIosCoreHealth({
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

  const forbidden = await fetchIosCoreHealth({
    baseUrl: 'https://core.example/',
    fetchImpl: async () => ({ ok: false, status: 403, async json() { return {}; } }),
  });
  assert.deepEqual(forbidden, { status: 'forbidden' });

  const errored = await fetchIosCoreHealth({
    baseUrl: 'https://core.example',
    fetchImpl: async () => {
      throw new Error('network');
    },
  });
  assert.deepEqual(errored, { status: 'error' });

  await assert.rejects(
    () => fetchIosCoreHealth({ baseUrl: '' }),
    /IOS_BASE_URL_REQUIRED/,
  );
});

test('iOS ready probe stays truthful for not-ready Core API', async () => {
  const notReady = await fetchIosCoreReady({
    baseUrl: 'https://core.example',
    fetchImpl: async () => ({ ok: false, status: 503, async json() { return {}; } }),
  });
  assert.deepEqual(notReady, { status: 'not-ready' });

  const ready = await fetchIosCoreReady({
    baseUrl: 'https://core.example',
    fetchImpl: async (url) => {
      assert.equal(url, `https://core.example${leadPaths.ready}`);
      return { ok: true, status: 200, async json() { return { ok: true }; } };
    },
  });
  assert.deepEqual(ready, { status: 'ready' });
});
