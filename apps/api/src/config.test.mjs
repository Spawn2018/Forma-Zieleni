import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRuntimeConfig } from './config.ts';

const database = 'postgres://forma@127.0.0.1:5432/forma';
const secret = 'better-auth-secret-value-32-chars-min';

function base(overrides = {}) {
  return { LEAD_DATABASE_URL: database, BETTER_AUTH_SECRET: secret, ...overrides };
}

test('runtime config rejects test auth outside an explicit non-production switch', () => {
  assert.throws(() => parseRuntimeConfig(base({ NODE_ENV: 'production', AUTH_MODE: 'test', ALLOW_TEST_AUTH: '1', TEST_AUTH_SECRET: 'test-secret-value' })), /TEST_AUTH_IN_PRODUCTION/);
  assert.throws(() => parseRuntimeConfig(base({ AUTH_MODE: 'test', TEST_AUTH_SECRET: 'test-secret-value' })), /TEST_AUTH_NOT_ENABLED/);
  assert.throws(() => parseRuntimeConfig(base({ BETTER_AUTH_SECRET: 'test-secret-value' })), /BETTER_AUTH_SECRET_UNSAFE/);
  assert.throws(() => parseRuntimeConfig(base({ BETTER_AUTH_SECRET: 'short' })), /BETTER_AUTH_SECRET_TOO_SHORT/);
  assert.throws(() => parseRuntimeConfig(base({ TRUST_PROXY: '1' })), /TRUSTED_PROXIES_REQUIRED/);
  const parsed = parseRuntimeConfig(base());
  assert.equal(parsed.authMode, 'better-auth');
  assert.equal(parsed.trustProxy, false);
  assert.throws(() => parseRuntimeConfig({ LEAD_DATABASE_URL: 'sqlite://local' }), /LEAD_DATABASE_URL_INVALID/);
});
