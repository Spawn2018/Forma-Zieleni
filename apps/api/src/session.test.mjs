import test from 'node:test';
import assert from 'node:assert/strict';
import { betterAuthAuthenticator } from './auth.ts';
import { ApiFailure } from './errors.ts';

const actor = {
  actorId: 'actorstaffana0000001',
  issuer: 'better-auth',
  sub: 'user-1',
  clientId: 'admin',
  capabilities: ['leads:read', 'leads:qualify'],
};

function authFor(seen) {
  return betterAuthAuthenticator({
    trustedOrigins: ['http://127.0.0.1:3000'],
    async lookup(headers) {
      seen.push(headers.get('authorization') ?? headers.get('cookie') ?? '');
      if ((headers.get('authorization') ?? '').endsWith('good') || (headers.get('cookie') ?? '').includes('good-cookie')) return { userId: 'user-1' };
      return null;
    },
    async loadActor() {
      return actor;
    },
  });
}

test('cookie mutations require a trusted origin and bearer does not', async () => {
  const seen = [];
  const auth = authFor(seen);
  await assert.rejects(
    () => auth.authenticate(new Request('http://127.0.0.1:3000/v1/leads/x/qualify', {
      method: 'POST',
      headers: { cookie: 'better-auth.session_token=good-cookie', origin: 'https://evil.example' },
    })),
    error => error instanceof ApiFailure && error.status === 403 && error.code === 'CSRF_ORIGIN',
  );
  assert.equal(seen.length, 0);
  const allowed = await auth.authenticate(new Request('http://127.0.0.1:3000/v1/leads', {
    headers: { cookie: 'better-auth.session_token=good-cookie', origin: 'http://127.0.0.1:3000' },
  }));
  assert.equal(allowed?.actorId, actor.actorId);
  const bearer = await auth.authenticate(new Request('http://127.0.0.1:3000/v1/leads', {
    method: 'POST',
    headers: { authorization: 'Bearer good', origin: 'https://evil.example' },
  }));
  assert.equal(bearer?.sub, 'user-1');
  const expired = await auth.authenticate(new Request('http://127.0.0.1:3000/v1/leads', {
    headers: { authorization: 'Bearer expired' },
  }));
  assert.equal(expired, null);
});
