import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAttribution } from './src/attribution.ts';

test('a missing referrer stays unknown and a hostile referrer drops its path', () => {
  assert.equal(sanitizeAttribution({}).searchSourceClass, 'UNKNOWN');
  assert.equal(sanitizeAttribution({ referrer: '' }).aiReferralProvider, null);
  const hostile = sanitizeAttribution({
    referrer: 'https://evil.example/steal?token=1',
    landingPage: '/ogrody?utm_source=evil',
    utmSource: '<script>',
    utmCampaign: 'Ogrod Kampania',
  });
  assert.equal(hostile.referrerDomain, 'evil.example');
  assert.equal(hostile.searchSourceClass, 'REFERRAL');
  assert.equal(hostile.aiReferralProvider, null);
  assert.equal(hostile.landingPage, '/ogrody');
  assert.equal(hostile.utmSource, null);
  assert.equal(hostile.utmCampaign, null);
});

test('only an allowlisted AI host is labeled an AI referral', () => {
  const touch = sanitizeAttribution({
    referrer: 'https://chatgpt.com/c/private-thread',
    utmSource: 'chatgpt',
    utmMedium: 'referral',
  });
  assert.equal(touch.searchSourceClass, 'AI_REFERRAL');
  assert.equal(touch.aiReferralProvider, 'chatgpt.com');
  assert.equal(touch.referrerDomain, 'chatgpt.com');
  assert.equal(touch.utmSource, 'chatgpt');
  const spoof = sanitizeAttribution({ referrer: 'https://not-chatgpt.com', utmSource: 'chatgpt' });
  assert.equal(spoof.aiReferralProvider, null);
  assert.equal(spoof.searchSourceClass, 'REFERRAL');
});
