import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BING_WEBMASTER_READ_METHODS,
  CONNECTOR_IDS,
  QUOTA_REREAD_DATE,
  RECORDED_QUOTAS,
  assertFixtureOnly,
  createFixtureConnectors,
  redactForLog,
} from './src/search-connectors.ts';

test('fixture connectors expose adapter boundaries without live secrets', () => {
  const connectors = createFixtureConnectors();
  assert.deepEqual(connectors.map((c) => c.id).sort(), [...CONNECTOR_IDS].sort());
  for (const connector of connectors) {
    assertFixtureOnly(connector);
    assert.equal(connector.mode, 'fixture');
    assert.throws(
      () => connector.fetch({ propertyId: 'synthetic', cursor: null, secrets: [{ kind: 'api_key', value: 'secret-value' }] }),
      /LIVE_SECRET_REJECTED/,
    );
  }
  const gsc = connectors.find((c) => c.id === 'google-search-console');
  const ok = gsc.fetch({ propertyId: 'property-synthetic', cursor: null });
  assert.equal(ok.status, 'ok');
  assert.equal(ok.rows.length, 1);
  assert.equal(ok.rows[0].origin, 'google-search-console');
  assert.equal(ok.checkpoint, 'gsc-cursor-1');
  assert.equal(gsc.fetch({ propertyId: 'outage', cursor: null }).status, 'outage');
  assert.equal(gsc.fetch({ propertyId: 'rate-limited', cursor: null }).status, 'rate_limited');
});

test('tokens never appear in a redacted log payload', () => {
  const payload = {
    access_token: 'ya29.secret',
    refresh_token: '1//refresh',
    api_key: 'bing-key',
    nested: { authorization: 'Bearer abc.def', note: 'safe' },
    message: 'Authorization Bearer ya29.abc-def_ghi',
  };
  const redacted = redactForLog(payload);
  const text = JSON.stringify(redacted);
  assert.equal(text.includes('ya29'), false);
  assert.equal(text.includes('bing-key'), false);
  assert.equal(text.includes('1//refresh'), false);
  assert.match(text, /\[REDACTED\]/);
  assert.match(text, /"note":"safe"/);
});

test('quotas were re-read today and Bing methods are listed without an AI citation API', () => {
  assert.equal(QUOTA_REREAD_DATE, '2026-09-22');
  assert.equal(RECORDED_QUOTAS.length, CONNECTOR_IDS.length);
  for (const quota of RECORDED_QUOTAS) {
    assert.equal(quota.reReadAt, QUOTA_REREAD_DATE);
    assert.ok(quota.limits.length > 0);
  }
  const gsc = RECORDED_QUOTAS.find((q) => q.connectorId === 'google-search-console');
  assert.equal(gsc.limits.some((l) => l.name === 'urlInspection.perSiteQpd' && l.value === '2000'), true);
  assert.equal(gsc.limits.some((l) => l.name === 'searchAnalytics.maxRowsPerDayPerSearchType' && l.value === '50000'), true);
  const bing = RECORDED_QUOTAS.find((q) => q.connectorId === 'bing-webmaster');
  assert.equal(bing.limits.some((l) => l.name === 'aiPerformanceApi' && l.value.includes('none')), true);
  assert.ok(BING_WEBMASTER_READ_METHODS.includes('GetQueryStats'));
  assert.ok(BING_WEBMASTER_READ_METHODS.includes('GetPageStats'));
  const bingConnector = createFixtureConnectors().find((c) => c.id === 'bing-webmaster');
  const rows = bingConnector.fetch({ propertyId: 'property-synthetic', cursor: null }).rows;
  assert.equal(rows.some((row) => row.entity === 'AICitationObservation'), false);
});
