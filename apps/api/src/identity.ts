import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { PostgresDialect, type Kysely } from 'kysely';
import type pg from 'pg';
import { newOpaqueId } from './ids.ts';
import { isContentCapability, isGrowthCapability } from '@forma-zieleni/domain';
import type { Actor, Capability, ClientId } from './auth.ts';
import { PersistenceFailure } from './errors.ts';
import type { Database } from './db.ts';

function isUnique(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === '23505');
}

function isCapability(value: string): value is Capability {
  return value === 'leads:read' || value === 'leads:qualify'
    || value === 'opportunities:read' || value === 'opportunities:create'
    || value === 'offers:read' || value === 'offers:create'
    || isContentCapability(value) || isGrowthCapability(value);
}

export async function ensureActor(db: Kysely<Database>, issuer: string, subject: string): Promise<Actor> {
  let row = await db.selectFrom('identity_principal').selectAll().where('issuer', '=', issuer).where('subject', '=', subject).executeTakeFirst();
  if (!row) {
    try {
      await db.insertInto('identity_principal').values({
        actor_id: newOpaqueId('a'),
        issuer,
        subject,
        client_id: 'web',
        created_at: new Date(),
      }).execute();
    } catch (error) {
      if (!isUnique(error)) throw new PersistenceFailure();
    }
    row = await db.selectFrom('identity_principal').selectAll().where('issuer', '=', issuer).where('subject', '=', subject).executeTakeFirst();
  }
  if (!row) throw new PersistenceFailure();
  const grants = await db.selectFrom('actor_capability').select(['capability']).where('actor_id', '=', row.actor_id).execute();
  return {
    actorId: row.actor_id,
    issuer: row.issuer,
    sub: row.subject,
    clientId: row.client_id as ClientId,
    capabilities: grants.map(grant => grant.capability).filter(isCapability),
  };
}

export function createLeadAuth(input: {
  pool: pg.Pool;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  allowSignUp: boolean;
}): {
  handler: (request: Request) => Promise<Response>;
  lookup: (headers: Headers) => Promise<{ userId: string } | null>;
} {
  const auth = betterAuth({
    secret: input.secret,
    baseURL: input.baseURL,
    trustedOrigins: input.trustedOrigins,
    emailAndPassword: {
      enabled: true,
      disableSignUp: !input.allowSignUp,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    session: { expiresIn: 60 * 60 * 8 },
    advanced: {
      useSecureCookies: input.baseURL.startsWith('https:'),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        secure: input.baseURL.startsWith('https:'),
        path: '/',
      },
    },
    database: {
      dialect: new PostgresDialect({ pool: input.pool }),
      type: 'postgres',
      schemaName: 'auth',
    },
    plugins: [bearer({ requireSignature: true })],
  });
  return {
    handler: request => auth.handler(request),
    async lookup(headers) {
      const session = await auth.api.getSession({ headers });
      if (!session?.user?.id) return null;
      const expiresAt = session.session?.expiresAt ? new Date(session.session.expiresAt) : null;
      if (expiresAt && expiresAt.getTime() <= Date.now()) return null;
      return { userId: session.user.id };
    },
  };
}
