import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BING_AI_API_STATUS,
  assertNoCompositeAiScore,
  bingCitationRows,
  createAiVisibilitySnapshot,
  summarizeAiVisibility,
} from './src/search-ai-visibility.ts';

test('Bing citations stay empty and are absent, not zero', () => {
  assert.equal(BING_AI_API_STATUS.apiAvailable, false);
  assert.equal(BING_AI_API_STATUS.reReadAt, '2026-09-22');
  const snapshot = createAiVisibilitySnapshot('property-synthetic', '2026-09-22T02:00:00.000Z');
  const rows = bingCitationRows(snapshot);
  assert.equal(rows.length, 0);
  const bing = snapshot.providers.find((p) => p.provider === 'bing-ai-performance');
  assert.equal(bing.citationAvailability, 'ABSENT_NO_API');
  assert.equal(bing.citationCount, null);
});

test('no composite AI score is emitted or accepted', () => {
  const snapshot = createAiVisibilitySnapshot('property-synthetic', '2026-09-22T02:00:00.000Z');
  const summary = summarizeAiVisibility(snapshot);
  assert.equal(summary.compositeScore, null);
  assert.equal(summary.absentProviders, 1);
  assert.equal(summary.unreliableProviders, 3);
  assert.equal(summary.measuredCitationProviders, 0);
  assert.throws(() => assertNoCompositeAiScore({ aiScore: 0.42 }), /COMPOSITE_AI_SCORE_REJECTED/);
  assert.throws(() => assertNoCompositeAiScore({ geo_score: 12 }), /COMPOSITE_AI_SCORE_REJECTED/);
  assert.throws(() => assertNoCompositeAiScore({ chatgptRank: 3 }), /COMPOSITE_AI_SCORE_REJECTED/);
  assert.throws(() => assertNoCompositeAiScore({ score: 0 }), /COMPOSITE_AI_SCORE_REJECTED/);
});
