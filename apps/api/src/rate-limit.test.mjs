import test from 'node:test';
import assert from 'node:assert/strict';
import { captureKey, WindowLimiter } from './rate-limit.ts';

test('capture keys ignore untrusted forwarding and keep peers apart', () => {
  assert.equal(captureKey({ peer: '203.0.113.10', forwardedFor: '198.51.100.8', trustProxy: false, trustedPeers: [] }), 'peer:203.0.113.10');
  assert.equal(captureKey({ peer: '198.51.100.10', forwardedFor: '203.0.113.9', trustProxy: false, trustedPeers: [] }), 'peer:198.51.100.10');
  assert.equal(captureKey({ peer: '127.0.0.1', forwardedFor: '10.0.0.4, 203.0.113.9', trustProxy: true, trustedPeers: ['127.0.0.1'] }), 'fwd:203.0.113.9');
  assert.equal(captureKey({ peer: '203.0.113.10', forwardedFor: '198.51.100.8', trustProxy: true, trustedPeers: ['127.0.0.1'] }), 'peer:203.0.113.10');
  assert.equal(captureKey({ peer: null, forwardedFor: '203.0.113.9', trustProxy: false, trustedPeers: [] }), null);
});

test('window limiter isolates keys, recovers, and stays bounded', () => {
  const limiter = new WindowLimiter(1, 1000, 2);
  assert.equal(limiter.allow('a', 0), true);
  assert.equal(limiter.allow('a', 10), false);
  assert.equal(limiter.allow('b', 10), true);
  assert.equal(limiter.allow('c', 10), false);
  assert.equal(limiter.size(10), 2);
  assert.equal(limiter.allow('c', 1010), true);
  assert.equal(limiter.size(1010), 1);
});
