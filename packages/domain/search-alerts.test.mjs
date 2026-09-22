import assert from 'node:assert/strict';
import test from 'node:test';
import { ALERT_RULES, evaluateSearchAlert, pageSearchAlert } from './src/search-alerts.ts';

const signals = [
  'sitemap-down',
  'robots-blocking',
  'important-noindex',
  'error-spike',
  'indexing-drop',
  'traffic-anomaly',
  'structured-data-break',
  'connector-stalled',
  'crawler-policy-mismatch',
  'citation-change',
  'visibility-drop',
];

test('a single-row blip does not page and there is no production channel', () => {
  assert.equal(ALERT_RULES.singleRowPages, false);
  assert.equal(ALERT_RULES.baselineRequired, true);
  assert.equal(ALERT_RULES.productionChannel, null);
  for (const signal of signals) {
    const single = evaluateSearchAlert({ signal, rows: 1, baseline: 10 });
    assert.equal(single.pages, false);
    assert.equal(single.channel, null);
    assert.equal(single.reason, 'SINGLE_ROW');
  }
  const noBaseline = evaluateSearchAlert({ signal: 'error-spike', rows: 8, baseline: null });
  assert.equal(noBaseline.pages, false);
  assert.equal(noBaseline.reason, 'NO_BASELINE');
  const quiet = evaluateSearchAlert({ signal: 'visibility-drop', rows: 8, baseline: 100 });
  assert.equal(quiet.pages, false);
  assert.equal(quiet.channel, null);
  assert.equal(quiet.reason, 'NO_CHANNEL');
  const citation = evaluateSearchAlert({ signal: 'citation-change', rows: 4, baseline: 2, measurable: false });
  assert.equal(citation.reason, 'UNMEASURABLE');
  assert.equal(citation.pages, false);
  assert.throws(() => pageSearchAlert(), /SEARCH_ALERT_DOES_NOT_PAGE/);
  assert.throws(() => evaluateSearchAlert({ signal: 'sitemap-down', rows: 0, baseline: null }), /ALERT_ROWS/);
});
