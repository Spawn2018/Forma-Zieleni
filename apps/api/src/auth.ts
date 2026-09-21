import { createHmac, timingSafeEqual } from 'node:crypto';

export const CLIENTS = ['web', 'portal', 'admin', 'mobile', 'sketchup', 'm2m'] as const;
export type ClientId = (typeof CLIENTS)[number];
export type Capability = 'leads:read' | 'leads:qualify';

export type Actor = {
  actorId: string;
  issuer: string;
  sub: string;
  clientId: ClientId;
  capabilities: Capability[];
};

export interface SessionAuthenticator {
  authenticate(authorization: string | undefined): Actor | null;
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
  return value === 'leads:read' || value === 'leads:qualify';
}

export function mintTestSession(secret: string, actor: Actor): string {
  const payload = Buffer.from(JSON.stringify(actor), 'utf8').toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function testAuthenticator(secret: string): SessionAuthenticator {
  if (secret.length < 16) throw new Error('TEST_AUTH_SECRET_TOO_SHORT');
  return {
    authenticate(authorization) {
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
  return { authenticate: () => null };
}

export function authenticatorFromEnv(env: { AUTH_MODE?: string; TEST_AUTH_SECRET?: string }): SessionAuthenticator {
  if (env.AUTH_MODE === 'test') return testAuthenticator(env.TEST_AUTH_SECRET ?? '');
  return failClosedAuthenticator();
}

export function allows(actor: Actor, capability: Capability): boolean {
  return actor.capabilities.includes(capability);
}
