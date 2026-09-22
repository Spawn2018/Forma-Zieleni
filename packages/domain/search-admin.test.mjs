import assert from 'node:assert/strict';
import test from 'node:test';
import { presentAdminPanel, presentAiCitations, presentAttribution, presentSearchMetric } from './src/search-admin.ts';

const window = { start: '2026-08-25', end: '2026-09-21' };
const freshness = { collectedAt: '2026-09-22T09:00:00.000Z' };

test('every admin metric shows definition, source, window, freshness, and evidence class', () => {
  const metric = presentSearchMetric({
    panel: 'seo',
    label: 'Clicks',
    definition: 'Clicks counted by the synthetic fixture. Not a live provider pull.',
    source: 'synthetic-fixture',
    window,
    freshness,
    evidenceClass: 'DERIVED',
    value: null,
  });
  const panel = presentAdminPanel({ panel: 'seo', metrics: [metric] });
  assert.equal(panel.metrics[0].definition.length > 0, true);
  assert.equal(panel.metrics[0].source, 'synthetic-fixture');
  assert.deepEqual(panel.metrics[0].window, window);
  assert.equal(panel.metrics[0].freshness.collectedAt, freshness.collectedAt);
  assert.equal(panel.metrics[0].evidenceClass, 'DERIVED');
  assert.equal(panel.metrics[0].value, null);
  assert.throws(() => presentSearchMetric({ ...metric, definition: '  ' }), /DEFINITION_REQUIRED/);
  assert.throws(() => presentSearchMetric({ ...metric, freshness: { collectedAt: '' } }), /FRESHNESS_REQUIRED/);
  assert.throws(() => presentAdminPanel({ panel: 'seo', metrics: [{ ...metric, panel: 'crawl-intelligence' }] }), /PANEL_MISMATCH/);
});

test('average position names the provider definition and external scores stay forbidden', () => {
  const position = presentSearchMetric({
    panel: 'seo',
    label: 'Average position',
    definition: 'Average position uses the Google Search Console definition.',
    source: 'Google Search Console',
    window,
    freshness,
    evidenceClass: 'MEASURED',
    value: 12.4,
  });
  assert.equal(position.definition.includes(position.source), true);
  assert.throws(() => presentSearchMetric({
    ...position,
    definition: 'Average rank across the web.',
  }), /POSITION_PROVIDER_DEFINITION/);
  assert.throws(() => presentSearchMetric({
    ...position,
    label: 'GEO score',
    definition: 'A single generative score.',
    evidenceClass: 'DERIVED',
  }), /FORBIDDEN_EXTERNAL_SCORE/);
  const internal = presentSearchMetric({
    ...position,
    label: 'GEO score',
    definition: 'INTERNAL SIGNAL / HEURISTIC. Not an external ranking.',
    evidenceClass: 'HEURISTIC',
    value: null,
  });
  assert.equal(internal.evidenceClass, 'HEURISTIC');
});

test('absent citation providers stay in limitations and are not a percentage', () => {
  const coverage = presentAiCitations([
    {
      name: 'bing-ai-performance',
      citationCount: null,
      definition: '',
      source: 'synthetic-fixture',
      window,
      freshness,
      evidenceClass: null,
    },
    {
      name: 'manual-export',
      citationCount: 3,
      definition: 'Citations counted in the manual-export file.',
      source: 'synthetic-fixture',
      window,
      freshness,
      evidenceClass: 'MEASURED',
    },
  ]);
  assert.equal(coverage.percentage, null);
  assert.deepEqual(coverage.limitations, ['bing-ai-performance is listed under measurement limitations.']);
  assert.equal(coverage.metrics.length, 1);
  assert.equal(coverage.metrics[0].value, 3);
  assert.equal(coverage.metrics[0].label, 'Citations from manual-export');
  assert.throws(() => presentAiCitations([{ ...coverage.metrics[0], name: 'manual-export', citationCount: -1, definition: 'Citations counted in the manual-export file.', evidenceClass: 'MEASURED' }]), /CITATION_COUNT/);
});

test('attribution is an association under a named model', () => {
  const metric = presentAttribution({
    model: 'first-touch',
    label: 'Leads',
    definition: 'Lead count on the synthetic fixture.',
    source: 'synthetic-fixture',
    window,
    freshness,
    evidenceClass: 'DERIVED',
    value: 2,
  });
  assert.equal(metric.definition.startsWith('Associated under the first-touch model.'), true);
  assert.equal(metric.panel, 'conversions');
  assert.throws(() => presentAttribution({
    model: 'last-touch',
    label: 'Revenue',
    definition: 'The visit caused the contract.',
    source: 'synthetic-fixture',
    window,
    freshness,
    evidenceClass: 'DERIVED',
    value: null,
  }), /CAUSAL_CLAIM/);
  const draft = presentSearchMetric({
    panel: 'content-intelligence',
    label: 'Title draft',
    definition: 'AI-SUGGESTED title. Not published.',
    source: 'synthetic-fixture',
    window,
    freshness,
    evidenceClass: 'AI-SUGGESTED',
    value: null,
  });
  assert.equal(draft.evidenceClass, 'AI-SUGGESTED');
  assert.throws(() => presentSearchMetric({ ...draft, definition: 'A better title.' }), /AI_SUGGESTED_UNMARKED/);
});
