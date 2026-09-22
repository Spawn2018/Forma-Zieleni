import { createHmac, timingSafeEqual } from 'node:crypto';
import { isContentCapability, isGrowthCapability, type ContentCapability } from '@forma-zieleni/domain';
import { ApiFailure } from './errors.ts';

export const CLIENTS = ['web', 'portal', 'admin', 'mobile', 'sketchup', 'm2m'] as const;
export type ClientId = (typeof CLIENTS)[number];
export type LeadCapability = 'leads:read' | 'leads:qualify';
export type OpportunityCapability = 'opportunities:read' | 'opportunities:create';
export type OfferCapability = 'offers:read' | 'offers:create' | 'offers:portal-read';
export type ContractCapability = 'contracts:read' | 'contracts:create';
export type GrowthCapability = 'growth:plan' | 'semantic:review';
export type Capability = LeadCapability | OpportunityCapability | OfferCapability | ContractCapability | ContentCapability | GrowthCapability;

export type Actor = {
  actorId: string;
  issuer: string;
  sub: string;
  clientId: ClientId;
  capabilities: Capability[];
};

export interface SessionAuthenticator {
  authenticate(request: Request): Promise<Actor | null>;
}

type TokenBody = {
  actorId: string;
  issuer: string;
  sub: string;
  clientId: ClientId;
  capabilities: Capability[];
};

function isClient(value: unknown): value is ClientId {
  return typeof value === 'string' && CLIENTS.includes(value as ClientId);
}

function isCapability(value: unknown): value is Capability {
  return value === 'leads:read' || value === 'leads:qualify'
    || value === 'opportunities:read' || value === 'opportunities:create'
    || value === 'offers:read' || value === 'offers:create' || value === 'offers:portal-read'
    || value === 'contracts:read' || value === 'contracts:create'
    || (typeof value === 'string' && (isContentCapability(value) || isGrowthCapability(value)));
}

export function mintTestSession(secret: string, actor: Actor): string {
  const payload = Buffer.from(JSON.stringify(actor), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function testAuthenticator(secret: string): SessionAuthenticator {
  if (secret.length < 16) throw new Error('TEST_AUTH_SECRET_TOO_SHORT');
  return {
    async authenticate(request) {
      const authorization = request.headers.get('authorization') ?? undefined;
      if (!authorization?.startsWith('Bearer ')) return null;
      const token = authorization.slice('Bearer '.length);
      const split = token.split('.');
      if (split.length !== 2) return null;
      const [payload, signature] = split;
      const expected = createHmac('sha256', secret).update(payload).digest('base64url');
      const left = Buffer.from(signature);
      const right = Buffer.from(expected);
      if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
      let parsed: TokenBody;
      try {
        parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenBody;
      } catch {
        return null;
      }
      if (!parsed || typeof parsed.actorId !== 'string' || typeof parsed.issuer !== 'string' || typeof parsed.sub !== 'string') return null;
      if (!isClient(parsed.clientId) || !Array.isArray(parsed.capabilities) || !parsed.capabilities.every(isCapability)) return null;
      return {
        actorId: parsed.actorId,
        issuer: parsed.issuer,
        sub: parsed.sub,
        clientId: parsed.clientId,
        capabilities: parsed.capabilities,
      };
    },
  };
}

export function failClosedAuthenticator(): SessionAuthenticator {
  return { async authenticate() { return null; } };
}

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function betterAuthAuthenticator(options: {
  lookup: (headers: Headers) => Promise<{ userId: string } | null>;
  loadActor: (subject: string) => Promise<Actor | null>;
  trustedOrigins: readonly string[];
}): SessionAuthenticator {
  return {
    async authenticate(request) {
      const authorization = request.headers.get('authorization') ?? '';
      const bearer = authorization.toLowerCase().startsWith('bearer ');
      const cookieSession = (request.headers.get('cookie') ?? '').includes('better-auth.session_token');
      if (!bearer && cookieSession && UNSAFE.has(request.method.toUpperCase())) {
        const origin = request.headers.get('origin');
        if (!origin || !options.trustedOrigins.includes(origin)) {
          throw new ApiFailure(403, 'CSRF_ORIGIN', 'The request origin is not allowed.');
        }
      }
      if (!bearer && !cookieSession) return null;
      const session = await options.lookup(request.headers);
      if (!session) return null;
      return options.loadActor(session.userId);
    },
  };
}

export function allows(actor: Actor, capability: Capability): boolean {
  return actor.capabilities.includes(capability);
}
