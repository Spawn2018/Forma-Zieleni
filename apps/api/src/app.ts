import { randomBytes } from 'node:crypto';
import { getConnInfo } from '@hono/node-server/conninfo';
import { Hono } from 'hono';
import { assertNoClientSuppliedAuthority, assertOpaqueContractId, assertOpaqueLeadId, assertOpaqueOfferId, assertOpaqueOpportunityId, assertOpaqueProjectFileId, assertOpaqueProjectId, compileMarketingPlan, decideDraftRead } from '@forma-zieleni/domain';
import { problem, validateContractCreateRequest, validateLeadCaptureRequest, validateLeadQualifyRequest, validateOfferCreateRequest, validateOpportunityCreateRequest, validateProjectCreateRequest, validateProjectFileCreateRequest } from '@forma-zieleni/validation';
import { allows, type Capability, type SessionAuthenticator } from './auth.ts';
import { ApiFailure, badRequest, PersistenceFailure } from './errors.ts';
import { createContractFromOffer, listVisibleContracts, parseContractListQuery, readContract } from './contracts.ts';
import { createProjectFileRecord, listPortalProjectFiles, listVisibleProjectFiles, parseProjectFileListQuery, readPortalProjectFile, readProjectFile } from './files.ts';
import { captureLead, listVisibleLeads, parseListQuery, qualifyExistingLead, readLead } from './leads.ts';
import { createOfferFromOpportunity, listPortalOffers, listVisibleOffers, parseOfferListQuery, readOffer, readPortalOffer } from './offers.ts';
import { createOpportunityFromLead, listVisibleOpportunities, parseOpportunityListQuery, readOpportunity } from './opportunities.ts';
import { createProjectFromContract, listPortalProjects, listVisibleProjects, parseProjectListQuery, readPortalProject, readProject } from './projects.ts';
import { noopTracer, writeLog, type LogRecord, type Tracer } from './log.ts';
import { captureKey, WindowLimiter } from './rate-limit.ts';
import type { LeadStore } from './store.ts';

type Vars = { requestId: string; actorId?: string; started: number };

export type AppOptions = {
  store: LeadStore;
  authenticator: SessionAuthenticator;
  now?: () => string;
  logs?: LogRecord[];
  tracer?: Tracer;
  limiter?: WindowLimiter;
  addressOf?: (request: Request) => string | null;
  trustProxy?: boolean;
  trustedPeers?: readonly string[];
  trustedOrigins?: readonly string[];
  ready?: () => Promise<boolean>;
  authHandler?: (request: Request) => Promise<Response>;
  contentDocuments?: Readonly<Record<string, { title: string; status: 'draft' | 'published' }>>;
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

function pathOpportunityId(value: string): string {
  try {
    return assertOpaqueOpportunityId(decodeURIComponent(value));
  } catch {
    throw badRequest('OPPORTUNITY_ID_INVALID', 'Opportunity id is not valid.');
  }
}

function pathOfferId(value: string): string {
  try {
    return assertOpaqueOfferId(decodeURIComponent(value));
  } catch {
    throw badRequest('OFFER_ID_INVALID', 'Offer id is not valid.');
  }
}

function pathContractId(value: string): string {
  try {
    return assertOpaqueContractId(decodeURIComponent(value));
  } catch {
    throw badRequest('CONTRACT_ID_INVALID', 'Contract id is not valid.');
  }
}

function pathProjectId(value: string): string {
  try {
    return assertOpaqueProjectId(decodeURIComponent(value));
  } catch {
    throw badRequest('PROJECT_ID_INVALID', 'Project id is not valid.');
  }
}

function pathProjectFileId(value: string): string {
  try {
    return assertOpaqueProjectFileId(decodeURIComponent(value));
  } catch {
    throw badRequest('PROJECT_FILE_ID_INVALID', 'Project file id is not valid.');
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
  const trustProxy = options.trustProxy ?? false;
  const trustedPeers = options.trustedPeers ?? [];
  const trustedOrigins = options.trustedOrigins ?? [];
  const ready = options.ready ?? (async () => true);
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
    const origin = c.req.header('origin');
    if (origin && trustedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Vary', 'Origin');
      c.header('Access-Control-Allow-Credentials', 'true');
      c.header('Access-Control-Allow-Headers', 'authorization, content-type, idempotency-key, x-request-id');
      c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
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

  app.get('/v1/ready', async c => {
    if (!(await ready())) throw new ApiFailure(503, 'NOT_READY', 'The API is not ready.');
    return c.json({ ok: true });
  });

  app.get('/v1/portal/session', async c => {
    const actor = await options.authenticator.authenticate(c.req.raw);
    if (!actor) throw new ApiFailure(401, 'UNAUTHENTICATED', 'Authentication is required.');
    c.set('actorId', actor.actorId);
    // Identity only — no offers, projects, files, or payments.
    return c.json({
      authenticated: true,
      clientId: actor.clientId,
    });
  });

  app.get('/v1/portal/offers', async c => {
    const actor = await requireActor(c, options.authenticator, 'offers:portal-read');
    if (actor.clientId !== 'portal') throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
    c.set('actorId', actor.actorId);
    const query = parseOfferListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      status: c.req.query('status'),
    });
    const page = await listPortalOffers(options.store, actor.sub, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.get('/v1/portal/offers/:offerId', async c => {
    const actor = await requireActor(c, options.authenticator, 'offers:portal-read');
    if (actor.clientId !== 'portal') throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
    c.set('actorId', actor.actorId);
    const projection = await readPortalOffer(options.store, pathOfferId(c.req.param('offerId')), actor.sub);
    if (!projection) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    return c.json(projection);
  });

  app.get('/v1/portal/projects', async c => {
    const actor = await requireActor(c, options.authenticator, 'projects:portal-read');
    if (actor.clientId !== 'portal') throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
    c.set('actorId', actor.actorId);
    const query = parseProjectListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      status: c.req.query('status'),
    });
    const page = await listPortalProjects(options.store, actor.sub, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.get('/v1/portal/projects/:projectId', async c => {
    const actor = await requireActor(c, options.authenticator, 'projects:portal-read');
    if (actor.clientId !== 'portal') throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
    c.set('actorId', actor.actorId);
    const projection = await readPortalProject(options.store, pathProjectId(c.req.param('projectId')), actor.sub);
    if (!projection) throw new ApiFailure(404, 'PROJECT_NOT_FOUND', 'Project was not found.');
    return c.json(projection);
  });

  app.get('/v1/portal/files', async c => {
    const actor = await requireActor(c, options.authenticator, 'files:portal-read');
    if (actor.clientId !== 'portal') throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
    c.set('actorId', actor.actorId);
    const query = parseProjectFileListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      projectId: c.req.query('projectId'),
    });
    const page = await listPortalProjectFiles(options.store, actor.sub, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.get('/v1/portal/files/:fileId', async c => {
    const actor = await requireActor(c, options.authenticator, 'files:portal-read');
    if (actor.clientId !== 'portal') throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
    c.set('actorId', actor.actorId);
    const projection = await readPortalProjectFile(options.store, pathProjectFileId(c.req.param('fileId')), actor.sub);
    if (!projection) throw new ApiFailure(404, 'PROJECT_FILE_NOT_FOUND', 'Project file was not found.');
    return c.json(projection);
  });

  app.options('*', c => c.body(null, trustedOrigins.includes(c.req.header('origin') ?? '') ? 204 : 403));

  if (options.authHandler) {
    app.on(['GET', 'POST'], '/api/auth/*', c => options.authHandler!(c.req.raw));
  }

  app.post('/v1/leads', async c => {
    const keyName = captureKey({
      peer: peerAddress(c),
      forwardedFor: c.req.header('x-forwarded-for') ?? null,
      trustProxy,
      trustedPeers,
    });
    if (!keyName || !limiter.allow(keyName, Date.now())) throw new ApiFailure(429, 'RATE_LIMITED', 'Too many lead captures.');
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateLeadCaptureRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'LEAD_INVALID', 'Lead could not be accepted.', parsed.errors);
    const lead = await captureLead(options.store, parsed.value, key, now());
    return c.json(lead, 201);
  });

  app.get('/v1/leads', async c => {
    const actor = await requireActor(c, options.authenticator, 'leads:read');
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
    const actor = await requireActor(c, options.authenticator, 'leads:read');
    c.set('actorId', actor.actorId);
    const lead = await readLead(options.store, pathLeadId(c.req.param('leadId')));
    if (!lead) throw new ApiFailure(404, 'LEAD_NOT_FOUND', 'Lead was not found.');
    return c.json(lead);
  });

  app.post('/v1/leads/:leadId/qualify', async c => {
    const actor = await requireActor(c, options.authenticator, 'leads:qualify');
    c.set('actorId', actor.actorId);
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateLeadQualifyRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'LEAD_INVALID', 'Qualification could not be accepted.', parsed.errors);
    const lead = await qualifyExistingLead(options.store, pathLeadId(c.req.param('leadId')), parsed.value.capacityHold, actor, key, now());
    return c.json(lead);
  });

  app.post('/v1/opportunities', async c => {
    const actor = await requireActor(c, options.authenticator, 'opportunities:create');
    c.set('actorId', actor.actorId);
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateOpportunityCreateRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'OPPORTUNITY_INVALID', 'Opportunity could not be accepted.', parsed.errors);
    const opportunity = await createOpportunityFromLead(options.store, parsed.value.leadId, actor, key, now());
    return c.json(opportunity, 201);
  });

  app.get('/v1/opportunities', async c => {
    const actor = await requireActor(c, options.authenticator, 'opportunities:read');
    c.set('actorId', actor.actorId);
    const query = parseOpportunityListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      status: c.req.query('status'),
    });
    const page = await listVisibleOpportunities(options.store, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.get('/v1/opportunities/:opportunityId', async c => {
    const actor = await requireActor(c, options.authenticator, 'opportunities:read');
    c.set('actorId', actor.actorId);
    const opportunity = await readOpportunity(options.store, pathOpportunityId(c.req.param('opportunityId')));
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    return c.json(opportunity);
  });

  app.post('/v1/offers', async c => {
    const actor = await requireActor(c, options.authenticator, 'offers:create');
    c.set('actorId', actor.actorId);
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateOfferCreateRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'OFFER_INVALID', 'Offer could not be accepted.', parsed.errors);
    const offer = await createOfferFromOpportunity(
      options.store,
      parsed.value.opportunityId,
      actor,
      key,
      now(),
      parsed.value.clientSubject ?? null,
    );
    return c.json(offer, 201);
  });

  app.get('/v1/offers', async c => {
    const actor = await requireActor(c, options.authenticator, 'offers:read');
    c.set('actorId', actor.actorId);
    const query = parseOfferListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      status: c.req.query('status'),
    });
    const page = await listVisibleOffers(options.store, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.get('/v1/offers/:offerId', async c => {
    const actor = await requireActor(c, options.authenticator, 'offers:read');
    c.set('actorId', actor.actorId);
    const offer = await readOffer(options.store, pathOfferId(c.req.param('offerId')));
    if (!offer) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    return c.json(offer);
  });

  app.post('/v1/contracts', async c => {
    const actor = await requireActor(c, options.authenticator, 'contracts:create');
    c.set('actorId', actor.actorId);
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateContractCreateRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'CONTRACT_INVALID', 'Contract could not be accepted.', parsed.errors);
    const contract = await createContractFromOffer(options.store, parsed.value.offerId, actor, key, now());
    return c.json(contract, 201);
  });

  app.get('/v1/contracts', async c => {
    const actor = await requireActor(c, options.authenticator, 'contracts:read');
    c.set('actorId', actor.actorId);
    const query = parseContractListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      status: c.req.query('status'),
    });
    const page = await listVisibleContracts(options.store, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.get('/v1/contracts/:contractId', async c => {
    const actor = await requireActor(c, options.authenticator, 'contracts:read');
    c.set('actorId', actor.actorId);
    const contract = await readContract(options.store, pathContractId(c.req.param('contractId')));
    if (!contract) throw new ApiFailure(404, 'CONTRACT_NOT_FOUND', 'Contract was not found.');
    return c.json(contract);
  });

  app.post('/v1/projects', async c => {
    const actor = await requireActor(c, options.authenticator, 'projects:create');
    c.set('actorId', actor.actorId);
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateProjectCreateRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'PROJECT_INVALID', 'Project could not be accepted.', parsed.errors);
    const project = await createProjectFromContract(
      options.store,
      parsed.value.contractId,
      actor,
      key,
      now(),
      parsed.value.clientSubject ?? null,
    );
    return c.json(project, 201);
  });

  app.get('/v1/projects', async c => {
    const actor = await requireActor(c, options.authenticator, 'projects:read');
    c.set('actorId', actor.actorId);
    const query = parseProjectListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      status: c.req.query('status'),
    });
    const page = await listVisibleProjects(options.store, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.get('/v1/projects/:projectId', async c => {
    const actor = await requireActor(c, options.authenticator, 'projects:read');
    c.set('actorId', actor.actorId);
    const project = await readProject(options.store, pathProjectId(c.req.param('projectId')));
    if (!project) throw new ApiFailure(404, 'PROJECT_NOT_FOUND', 'Project was not found.');
    return c.json(project);
  });

  app.get('/v1/files', async c => {
    const actor = await requireActor(c, options.authenticator, 'files:read');
    c.set('actorId', actor.actorId);
    const query = parseProjectFileListQuery({
      limit: c.req.query('limit'),
      cursor: c.req.query('cursor'),
      sort: c.req.query('sort'),
      projectId: c.req.query('projectId'),
    });
    const page = await listVisibleProjectFiles(options.store, query);
    return c.json({ items: page.items, meta: { limit: query.limit, nextCursor: page.nextCursor } });
  });

  app.post('/v1/files', async c => {
    const actor = await requireActor(c, options.authenticator, 'files:create');
    c.set('actorId', actor.actorId);
    const key = idempotencyKey(c.req.header('idempotency-key'));
    const parsed = validateProjectFileCreateRequest(await readJson(c.req.raw));
    if (!parsed.ok) throw new ApiFailure(400, 'PROJECT_FILE_INVALID', 'Project file could not be accepted.', parsed.errors);
    const file = await createProjectFileRecord(options.store, parsed.value, actor, key, now());
    return c.json(file, 201);
  });

  app.get('/v1/files/:fileId', async c => {
    const actor = await requireActor(c, options.authenticator, 'files:read');
    c.set('actorId', actor.actorId);
    const file = await readProjectFile(options.store, pathProjectFileId(c.req.param('fileId')));
    if (!file) throw new ApiFailure(404, 'PROJECT_FILE_NOT_FOUND', 'Project file was not found.');
    return c.json(file);
  });

  app.post('/v1/growth/plans', async c => {
    const actor = await requireActor(c, options.authenticator, 'growth:plan');
    c.set('actorId', actor.actorId);
    const body = await readJson(c.req.raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('PLAN_INVALID', 'Plan input is not valid.');
    const record = body as Record<string, unknown>;
    try {
      assertNoClientSuppliedAuthority(record);
    } catch {
      throw badRequest('CLIENT_AUTHORITY_REJECTED', 'Plan authority is granted on the server.');
    }
    if ('spend' in record || 'publish' in record || record.authorizesSpend === true) {
      throw badRequest('PLAN_AUTHORITY', 'A plan cannot authorize spend or publication.');
    }
    if (typeof record.goal !== 'string' || typeof record.budgetPln !== 'number' || typeof record.horizonDays !== 'number') {
      throw badRequest('PLAN_INVALID', 'Plan input is not valid.');
    }
    try {
      const plan = compileMarketingPlan({
        goal: record.goal,
        budgetPln: record.budgetPln,
        horizonDays: record.horizonDays,
        now: now(),
        excludedChannels: Array.isArray(record.excludedChannels) ? record.excludedChannels.filter(item => typeof item === 'string') : [],
      });
      return c.json(plan, 201);
    } catch (error) {
      if (error instanceof Error && /GOAL_TOO_THIN|BUDGET_INVALID|HORIZON_INVALID|DATE_INVALID/.test(error.message)) {
        throw badRequest('PLAN_INVALID', 'Plan input is not valid.');
      }
      throw error;
    }
  });

  app.get('/v1/content/:contentId', async c => {
    const supplied: Record<string, unknown> = {};
    for (const key of ['role', 'capabilities', 'actorId']) {
      if (c.req.query(key) != null) supplied[key] = c.req.query(key);
    }
    try {
      assertNoClientSuppliedAuthority(supplied);
    } catch {
      throw new ApiFailure(400, 'CLIENT_AUTHORITY_REJECTED', 'Content authority is granted on the server.');
    }
    let contentId: string;
    try {
      contentId = assertOpaqueLeadId(decodeURIComponent(c.req.param('contentId')));
    } catch {
      throw badRequest('CONTENT_ID_INVALID', 'Content id is not valid.');
    }
    const document = options.contentDocuments?.[contentId];
    if (!document) throw new ApiFailure(404, 'CONTENT_NOT_FOUND', 'Content was not found.');
    const actor = await options.authenticator.authenticate(c.req.raw);
    const decision = decideDraftRead(actor, document.status);
    if (decision === 'unauthenticated') throw new ApiFailure(401, 'UNAUTHENTICATED', 'Authentication is required.');
    if (decision === 'forbidden') throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
    if (actor) c.set('actorId', actor.actorId);
    if (document.status !== 'published') c.header('Cache-Control', 'private, no-store');
    return c.json({ id: contentId, title: document.title, status: document.status });
  });

  return app;

  function peerAddress(c: { req: { raw: Request } }): string | null {
    if (options.addressOf) return options.addressOf(c.req.raw);
    try {
      return getConnInfo(c as never).remote.address ?? null;
    } catch {
      return null;
    }
  }
}

async function requireActor(c: { req: { raw: Request }; set: (key: 'actorId', value: string) => void }, authenticator: SessionAuthenticator, capability: Capability) {
  const actor = await authenticator.authenticate(c.req.raw);
  if (!actor) throw new ApiFailure(401, 'UNAUTHENTICATED', 'Authentication is required.');
  if (!allows(actor, capability)) throw new ApiFailure(403, 'FORBIDDEN', 'This operation is not allowed.');
  return actor;
}
