import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLeadCaptureBody,
  emptyLeadForm,
  leadCaptureCopy,
  leadCaptureView,
  parseLeadForm,
  postLeadCapture,
} from './lead-capture.ts';

const prohibited = [
  'kompleksowe rozwiązania',
  'z pasją',
  'innowacyjne',
  'najwyższa jakość',
  'lider',
  'eksperci',
  'premium',
  'bezkonkurencyjny',
  'dowiedz się więcej',
];

test('lead capture copy stays concrete and refuses marketing slop', () => {
  const copy = JSON.stringify(leadCaptureCopy()).toLowerCase();
  for (const phrase of prohibited) {
    assert.equal(copy.includes(phrase), false, phrase);
  }
  assert.match(leadCaptureCopy().intro, /Forma Zieleni/);
  assert.match(leadCaptureCopy().submitLabel, /Wyślij zapytanie/);
});

test('parseLeadForm and buildLeadCaptureBody keep source www and refuse invent fields', () => {
  const form = new FormData();
  form.set('name', ' Anna Testowa ');
  form.set('phone', '+48 600 111 222');
  form.set('email', ' Anna@Example.test ');
  form.set('locality', ' Kraków ');
  form.set('siteAnalysisRequested', 'on');
  form.set('budget_min_pln', '999');
  const fields = parseLeadForm(form);
  assert.equal(fields.name, ' Anna Testowa ');
  const built = buildLeadCaptureBody(fields);
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.deepEqual(built.body, {
    source: 'www',
    name: 'Anna Testowa',
    phone: '+48 600 111 222',
    email: 'anna@example.test',
    locality: 'Kraków',
    siteAnalysisRequested: true,
  });
  assert.equal(Object.hasOwn(built.body, 'budget_min_pln'), false);
});

test('buildLeadCaptureBody rejects short phones and empty names', () => {
  const bad = buildLeadCaptureBody({ ...emptyLeadForm(), name: '', phone: '123' });
  assert.equal(bad.ok, false);
  if (bad.ok) return;
  assert.equal(Boolean(bad.errors.name), true);
  assert.equal(Boolean(bad.errors.phone), true);
});

test('postLeadCapture posts to Core API leads path without staff tokens', async () => {
  const calls = [];
  const result = await postLeadCapture({
    origin: 'http://127.0.0.1:8787',
    idempotencyKey: 'idem-www-lead-0001',
    fields: {
      name: 'Anna Testowa',
      phone: '+48 600 111 222',
      email: '',
      locality: 'Kraków',
      siteAnalysisRequested: false,
    },
    fetchImpl: async (input, init) => {
      calls.push({ input: String(input), init });
      return new Response(JSON.stringify({ id: 'ld8k2n4p6q8r0s2t' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.leadId, 'ld8k2n4p6q8r0s2t');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, 'http://127.0.0.1:8787/v1/leads');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.authorization, undefined);
  assert.equal(calls[0].init.headers.cookie, undefined);
  assert.equal(calls[0].init.headers['idempotency-key'], 'idem-www-lead-0001');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    source: 'www',
    name: 'Anna Testowa',
    phone: '+48 600 111 222',
    locality: 'Kraków',
    siteAnalysisRequested: false,
  });
});

test('postLeadCapture refuses success without an opaque lead id', async () => {
  const result = await postLeadCapture({
    origin: 'http://127.0.0.1:8787',
    idempotencyKey: 'idem-bad-id',
    fields: { ...emptyLeadForm(), name: 'Anna', phone: '+48600111222' },
    fetchImpl: async () => new Response(JSON.stringify({ id: 'lead1' }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    }),
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'unavailable');
});

test('postLeadCapture reports unconfigured and unavailable without inventing success', async () => {
  const missing = await postLeadCapture({
    origin: undefined,
    idempotencyKey: 'idem-missing',
    fields: { ...emptyLeadForm(), name: 'Anna', phone: '+48600111222' },
  });
  assert.equal(missing.ok, false);
  if (missing.ok) return;
  assert.equal(missing.reason, 'unconfigured');

  const down = await postLeadCapture({
    origin: 'http://127.0.0.1:8787',
    idempotencyKey: 'idem-down',
    fields: { ...emptyLeadForm(), name: 'Anna', phone: '+48600111222' },
    fetchImpl: async () => {
      throw new Error('network');
    },
  });
  assert.equal(down.ok, false);
  if (down.ok) return;
  assert.equal(down.reason, 'unavailable');
});

test('leadCaptureView maps accepted and unconfigured states', () => {
  const accepted = leadCaptureView({
    originConfigured: true,
    result: { ok: true, leadId: 'ld8k2n4p6q8r0s2t' },
  });
  assert.equal(accepted.state, 'accepted');
  assert.match(accepted.notice || '', /przyjęte/);
  const unconfigured = leadCaptureView({ originConfigured: false });
  assert.equal(unconfigured.state, 'unconfigured');
});
