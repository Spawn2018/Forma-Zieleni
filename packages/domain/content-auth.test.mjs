import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertNoClientSuppliedAuthority,
  bindContentRole,
  capabilitiesForContentRole,
  decideDraftRead,
} from './src/content-auth.ts';

test('content roles bind to an actor and never grant lead capabilities', () => {
  for (const role of ['editor', 'reviewer', 'publisher', 'admin']) {
    const grant = bindContentRole('actoreditor000001', role);
    assert.equal(grant.actorId, 'actoreditor000001');
    assert.equal(grant.capabilities.includes('content:read-draft'), true);
    assert.equal(grant.capabilities.some(capability => capability.startsWith('leads:')), false);
  }
  assert.equal(capabilitiesForContentRole('publisher').includes('content:publish'), true);
  assert.equal(capabilitiesForContentRole('editor').includes('content:publish'), false);
  assert.throws(() => bindContentRole('short', 'editor'));
});

test('a client cannot supply its own role or capabilities', () => {
  assert.doesNotThrow(() => assertNoClientSuppliedAuthority({ title: 'Usługa' }));
  assert.throws(() => assertNoClientSuppliedAuthority({ role: 'admin' }), /CLIENT_AUTHORITY_REJECTED/);
  assert.throws(() => assertNoClientSuppliedAuthority({ capabilities: ['content:admin'] }), /CLIENT_AUTHORITY_REJECTED/);
  assert.throws(() => assertNoClientSuppliedAuthority({ actorId: 'actoreditor000001' }), /CLIENT_AUTHORITY_REJECTED/);
});

test('unpublished content is anonymous 401, ungranted 403, and public when published', () => {
  assert.equal(decideDraftRead(null, 'draft'), 'unauthenticated');
  assert.equal(decideDraftRead({ capabilities: ['leads:read'] }, 'draft'), 'forbidden');
  assert.equal(decideDraftRead({ capabilities: ['content:read-draft'] }, 'draft'), 'allow');
  assert.equal(decideDraftRead(null, 'published'), 'allow');
});
