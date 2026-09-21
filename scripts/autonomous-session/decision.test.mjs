import test from 'node:test';
import assert from 'node:assert/strict';
import { CHOOSE_AUDIT_ID, decide, decideOwner, parseOwnerReply, requestDecision, resolveOwnerDecision, safeText, validateDecision } from './decision.mjs';

const valid = { classification: 'AI-DECISION', choice: 'repo-audit', approved: true, rationale: 'Read-only repository evidence is needed.' };
const envelope = value => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });
const response = value => new Response(JSON.stringify(value), { status: 200 });
const request = transport => requestDecision({ question: 'Audit?' }, { model: 'test-model', key: 'dummy-local-key', signal: new AbortController().signal, transport });
const state = (overrides = {}) => ({ gitHeadBefore: 'test-head', policyHash: 'test-hash', completedWork: [], apiCalls: 0, deadline: null, ...overrides });

async function withEnvironment(values, body) {
  const previous = Object.fromEntries(Object.keys(values).map(name => [name, process.env[name]]));
  try {
    for (const [name, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
    return await body();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
}
const configured = body => withEnvironment({ OPENAI_API_KEY: 'dummy-local-key', OPENAI_MODEL: 'test-model' }, body);

test('request uses strict bounded Responses API configuration without tools or storage', async () => {
  let calls = 0;
  const result = await request(async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.equal(body.max_output_tokens, 1200);
    assert.equal(Object.hasOwn(body, 'tools'), false);
    assert.equal(body.text.format.strict, true);
    assert.equal(body.text.format.schema.additionalProperties, false);
    assert.deepEqual(body.text.format.schema.properties.choice.enum, ['repo-audit', 'canon-audit']);
    return response(envelope(valid));
  });
  assert.deepEqual(result, valid);
  assert.equal(calls, 1);
});

test('decision validation rejects extra fields, escalation, missing fields and invalid rationale', () => {
  for (const value of [null, {}, { ...valid, command: 'shell' }, { ...valid, classification: 'AUTO' },
    { ...valid, choice: 'deploy' }, { ...valid, approved: 'true' }, { ...valid, rationale: '' },
    { ...valid, rationale: 'x'.repeat(1001) }]) assert.throws(() => validateDecision(value));
});

test('provider refusals, incomplete responses, mixed content and HTTP failures are rejected', async () => {
  for (const body of [
    { ...envelope(valid), status: 'incomplete' },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }] },
    { status: 'completed', output: [] },
    { status: 'completed', output: [...envelope(valid).output, ...envelope(valid).output] },
    envelope({ ...valid, extra: 'unexpected' }),
  ]) await assert.rejects(request(async () => response(body)));
  await assert.rejects(request(async () => new Response('private provider detail', { status: 429 })), /PROVIDER_REQUEST_FAILED/);
});

test('response size is enforced across streamed chunks and reader is cancelled', async () => {
  let cancelled = false;
  const chunks = [new Uint8Array(32768), new Uint8Array(32769)];
  const body = new ReadableStream({
    pull(controller) { if (chunks.length) controller.enqueue(chunks.shift()); },
    cancel() { cancelled = true; },
  });
  await assert.rejects(request(async () => new Response(body)), /PROVIDER_RESPONSE_TOO_LARGE/);
  assert.equal(cancelled, true);
});

test('proposal and independent review agree before a decision is accepted; charges persist before transport', async () => configured(async () => {
  const current = state(), snapshots = [], instructions = [];
  const result = await decide(current, { online: true, signal: new AbortController().signal,
    checkpoint: s => snapshots.push(structuredClone(s)),
    transport: async (_, options) => {
      assert.equal(snapshots.at(-1).apiCalls, instructions.length + 1);
      const body = JSON.parse(options.body);
      instructions.push(body.instructions);
      const packet = JSON.parse(body.input);
      if (instructions.length === 2) assert.deepEqual(packet.proposal, valid);
      return response(envelope(valid));
    },
  });
  assert.equal(result.choice, 'repo-audit');
  assert.match(result.review, /packet SHA256=[a-f0-9]{64}/);
  assert.notEqual(instructions[0], instructions[1]);
  assert.equal(current.apiCalls, 2);
}));

test('reviewer disagreement or rejection never produces a fallback decision', async () => configured(async () => {
  for (const review of [{ ...valid, choice: 'canon-audit' }, { ...valid, approved: false }]) {
    let calls = 0;
    const result = await decide(state(), { online: true, signal: new AbortController().signal, checkpoint() {},
      transport: async () => response(envelope(++calls === 1 ? valid : review)),
    });
    assert.equal(result, null);
    assert.equal(calls, 2);
  }
}));

test('persisted API budget caps requests and charges failed transport without leaking errors', async () => configured(async () => {
  for (const initial of [2, 3, 4]) {
    let calls = 0;
    const current = state({ apiCalls: initial });
    await decide(current, { online: true, signal: new AbortController().signal, checkpoint() {},
      transport: async () => { calls++; return response(envelope(valid)); },
    });
    assert.equal(calls, initial === 2 ? 2 : 0);
    assert.equal(current.apiCalls, initial === 2 ? 4 : initial);
  }
  const current = state(), charged = [];
  const result = await decide(current, { online: true, signal: new AbortController().signal,
    checkpoint: s => charged.push(s.apiCalls), transport: async () => { throw new Error('SECRET_SENTINEL'); },
  });
  assert.equal(result, null);
  assert.deepEqual(charged, [1]);
  assert.equal(current.apiCalls, 1);
}));

test('offline, missing configuration, expired deadline and aborted signal make no requests', async () => {
  for (const config of [{ key: undefined, model: 'test-model', online: true },
    { key: 'dummy-local-key', model: undefined, online: true },
    { key: 'dummy-local-key', model: 'test-model', online: false }]) {
    await withEnvironment({ OPENAI_API_KEY: config.key, OPENAI_MODEL: config.model }, async () => {
      let calls = 0;
      const result = await decide(state(), { online: config.online, signal: new AbortController().signal, checkpoint() {},
        transport: async () => { calls++; return response(envelope(valid)); } });
      assert.equal(result, null);
      assert.equal(calls, 0);
    });
  }
  await configured(async () => {
    for (const expired of [true, false]) {
      let calls = 0;
      const controller = new AbortController();
      if (!expired) controller.abort();
      const current = state({ deadline: expired ? '2026-09-20T12:00:00Z' : null });
      assert.equal(await decide(current, { online: true, signal: controller.signal, now: () => Date.parse('2026-09-20T12:00:00Z'),
        checkpoint() {}, transport: async () => { calls++; return response(envelope(valid)); } }), null);
      assert.equal(calls, 0);
      assert.equal(current.apiCalls, 0);
    }
  });
});

test('Owner reply parser accepts one unambiguous packet reply and rejects silence or ambiguity', () => {
  assert.deepEqual(parseOwnerReply(`DECISION ${CHOOSE_AUDIT_ID}: OPTION A`), {
    id: CHOOSE_AUDIT_ID, option: 'A', constraints: '',
  });
  assert.deepEqual(resolveOwnerDecision(`DECISION ${CHOOSE_AUDIT_ID}: OPTION B keep read-only`), {
    choice: 'canon-audit',
    rationale: `Owner selected OPTION B for ${CHOOSE_AUDIT_ID}.`,
    review: 'Constraints: keep read-only',
  });
  assert.equal(decideOwner({}, {}), null);
  assert.equal(decideOwner({}, { reply: '' }), null);
  assert.equal(decideOwner({}, { reply: `DECISION ${CHOOSE_AUDIT_ID}: OPTION C` }).choice, 'invalid');
  assert.throws(() => resolveOwnerDecision(`DECISION FZ-OTHER: OPTION A`), /INVALID_DECISION/);
  for (const text of [
    `DECISION ${CHOOSE_AUDIT_ID}: OPTION A\nDECISION ${CHOOSE_AUDIT_ID}: OPTION B`,
    `please choose A`,
    `DECISION ${CHOOSE_AUDIT_ID}: OPTION A and OPTION B`,
  ]) assert.throws(() => parseOwnerReply(text), /INVALID_DECISION/);
});

test('safeText rejects credentials and known environment secret values', async () => {
  assert.equal(safeText('Read-only evidence reviewed.'), 'Read-only evidence reviewed.');
  for (const text of ['', ' ', 'sk-abcdefghijk', 'password: hunter2', 'api_key=example',
    '-----BEGIN RSA PRIVATE KEY-----', 'token: hidden']) assert.throws(() => safeText(text), /UNSAFE_TEXT/);
  await withEnvironment({ TEST_DECISION_SECRET: 'unique-local-dummy-value' }, async () => {
    assert.throws(() => safeText('Echo unique-local-dummy-value here'), /UNSAFE_TEXT/);
  });
});
