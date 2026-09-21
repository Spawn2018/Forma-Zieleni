import { randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { assertOpaqueLeadId } from '@forma-zieleni/domain';
import { problem, validateLeadCaptureRequest, validateLeadQualifyRequest } from '@forma-zieleni/validation';
import { allows, type SessionAuthenticator } from './auth.ts';
import { ApiFailure, badRequest, PersistenceFailure } from './errors.ts';
import { captureLead, listVisibleLeads, parseListQuery, qualifyExistingLead, readLead } from './leads.ts';
import { noopTracer, writeLog, type LogRecord, type Tracer } from './log.ts';
import { WindowLimiter } from './rate-limit.ts';
import type { LeadStore } from './store.ts';

type Vars = { requestId: string; actorId?: string; started: number };

export type AppOptions = {
  store: LeadStore;
  authenticator: SessionAuthenticator;
  now?: () => string;
  logs?: LogRecord[];
  tracer?: Tracer;
  limiter?: WindowLimiter;
  addressOf?: (request: Request) => string;
};

function mintRequestId(): string {
  return `req_${randomBytes(8).toString('hex')}`;
}

function requestId(header: string | undefined): string {
  if (header === undefined || header === '') return mintRequestId();
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(header)) throw badRequest('REQUEST_ID_INVALID', 'Request id is not valid.');
  return header;
}

function idempotencyKey(header: string | undefined): string {
  if (!header || !/^[\x21-\x7e]{8,128}$/.test(header)) throw badRequest('IDEMPOTENCY_KEY_INVALID', 'Idempotency key is not valid.');
  return header;
}

function pathLeadId(value: string): string {
  try {
    return assertOpaqueLeadId(decodeURIComponent(value));
  } catch {
    throw badRequest('LEAD_ID_INVALID', 'Lead id is not valid.');
  }
}

async function readCapped(request: Request, limit: number): Promise<Uint8Array> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const step = await reader.read();
    if (step.done) break;
    total += step.value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw badRequest('BODY_TOO_LARGE', 'Request body is too large.');
    }
    chunks.push(step.value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) throw badRequest('CONTENT_TYPE_INVALID', 'Content type must be application/json.');
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 8192)) throw badRequest('BODY_TOO_LARGE', 'Request body is too large.');
  const bytes = await readCapped(request, 8192);
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw badRequest('JSON_INVALID', 'Request body is not valid JSON.');
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw badRequest('JSON_INVALID', 'Request body is not valid JSON.');
  }
}

function pathnameOf(url: string): string {
  return new URL(url).pathname;
}

export function createApp(options: AppOptions): Hono<{ Variables: Vars }> {
  const now = options.now ?? (() => new Date().toISOString());
  const logs = options.logs ?? [];
  const tracer = options.tracer ?? noopTracer;
  const limiter = options.limiter ?? new WindowLimiter(30, 60_000);
  const addressOf = options.addressOf ?? (() => 'local');
  const app = new Hono<{ Variables: Vars }>();

  app.onError((error, c) => {
    const id = c.get('requestId') || mintRequestId();
    const failure = error instanceof ApiFailure ? error : null;
    const httpStatus = (failure?.status ?? (error instanceof PersistenceFailure ? 503 : 500)) as 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503;
    const code = failure?.code ?? (error instanceof PersistenceFailure ? 'PERSISTENCE_UNAVAILABLE' : 'UNEXPECTED');
    const message = failure?.message ?? (httpStatus === 503 ? 'The lead store is unavailable.' : 'The request could not be completed.');
    c.header('X-Request-Id', id);
    return c.json(problem(code, message, id, failure?.details ?? []), httpStatus);
  });

  app.use('*', async (c, next) => {
    const started = Date.now();
    let id = mintRequestId();
    try {
      id = requestId(c.req.header('x-request-id'));
    } catch (error) {
      c.set('requestId', id);
      c.set('actorId', '');
      c.set('started', started);
      writeLog(logs, {
        time: now(),
        level: 'info',
        msg: 'http.request',
        requestId: id,
        method: c.req.method,
        path: pathnameOf(c.req.url),
        status: error instanceof ApiFailure ? error.status : 500,
        durationMs: Date.now() - started,
      });
      throw error;
    }
    c.set('requestId', id);
    c.set('actorId', '');
    c.set('started', started);
    c.header('X-Request-Id', id);
    const span = tracer.startSpan('http.request');
    span.setAttribute('http.request.method', c.req.method);
    span.setAttribute('url.path', pathnameOf(c.req.url));
    await next();
    const status = c.res.status;
    span.setAttribute('http.response.status_code', status);
    span.end();
    writeLog(logs, {
      time: now(),
      level: status >= 500 ? 'error' : 'info',
      msg: 'http.request',
      requestId: id,
      method: c.req.method,
      path: pathnameOf(c.req.url),
      status,
      durationMs: Date.now() - started,
      ...(c.get('actorId') ? { actorId: c.get('actorId') } : {}),
    });
  });

  app.get('/v1/health', c => c.json({ ok: true }));

  app.post('/v1/leads', async c => {
    if (!limiter.allow(addressOf(c.req.raw), Date.now())) throw new ApiFailure(429, 'RATE_LIMITED', 'Too many lead captures.');
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateLeadCaptureRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'LEAD_INVALID', 'Lead could not be accepted.', parsed.errors);
    const lead = await captureLead(options.store, parsed.value, key, now());
    return c.json(lead, 201);
  });

  app.get('/v1/leads', async c => {
    const actor = requireActor(c, options.authenticator, 'leads:read');
    c.set('actorId', actor.actorId);
    const query = parseListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      status: c.req.query('status'),
    });
    const page = await listVisibleLeads(options.store, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.get('/v1/leads/:leadId', async c => {
    const actor = requireActor(c, options.authenticator, 'leads:read');
    c.set('actorId', actor.actorId);
    const lead = await readLead(options.store, pathLeadId(c.req.param('leadId')));
    if (!lead) throw new ApiFailure(404, 'LEAD_NOT_FOUND', 'Lead was not found.');
    return c.json(lead);
  });

  app.post('/v1/leads/:leadId/qualify', async c => {
    const actor = requireActor(c, options.authenticator, 'leads:qualify');
    c.set('actorId', actor.actorId);
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateLeadQualifyRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'LEAD_INVALID', 'Qualification could not be accepted.', parsed.errors);
    const lead = await qualifyExistingLead(options.store, pathLeadId(c.req.param('leadId')), parsed.value.capacityHold, actor, key, now());
    return c.json(lead);
  });

  return app;
}

function requireActor(c: { req: { header(name: string): string | undefined } }, authenticator: SessionAuthenticator, capability: 'leads:read' | 'leads:qualify') {
  const actor = authenticator.authenticate(c.req.header('authorization'));
  if (!actor) throw new ApiFailure(401, 'UNAUTHENTICATED', 'Authentication is required.');
  if (!allows(actor, capability)) throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
  return actor;
}
