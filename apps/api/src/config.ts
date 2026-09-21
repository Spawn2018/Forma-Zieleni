const WEAK_SECRETS = new Set([
  'test-secret-value',
  'changeme',
  'password',
  'REPLACE_WITH_32_PLUS_RANDOM_CHARACTERS',
]);

export type RuntimeConfig = {
  authMode: 'test' | 'better-auth';
  databaseUrl: string;
  port: number;
  testAuthSecret: string | null;
  betterAuthSecret: string | null;
  baseURL: string;
  trustedOrigins: string[];
  issuer: string;
  trustProxy: boolean;
  trustedPeers: string[];
};

function fail(code: string): never {
  throw new Error(code);
}

function originList(value: string): string[] {
  const origins = value.split(',').map(item => item.trim()).filter(Boolean);
  if (origins.length === 0 || origins.includes('*')) fail('TRUSTED_ORIGINS_INVALID');
  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      fail('TRUSTED_ORIGINS_INVALID');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') fail('TRUSTED_ORIGINS_INVALID');
    if (parsed.username || parsed.password) fail('TRUSTED_ORIGINS_INVALID');
  }
  return origins;
}

export function parseRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const authMode = env.AUTH_MODE ?? 'better-auth';
  if (authMode !== 'test' && authMode !== 'better-auth') fail('AUTH_MODE_INVALID');
  const databaseUrl = env.LEAD_DATABASE_URL ?? '';
  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) fail('LEAD_DATABASE_URL_INVALID');
  const port = env.PORT === undefined || env.PORT === '' ? 3000 : Number(env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail('PORT_INVALID');
  const trustProxy = env.TRUST_PROXY === '1';
  if (env.TRUST_PROXY !== undefined && env.TRUST_PROXY !== '0' && env.TRUST_PROXY !== '1') fail('TRUST_PROXY_INVALID');
  const trustedPeers = (env.TRUSTED_PROXIES ?? '').split(',').map(item => item.trim()).filter(Boolean);
  if (trustProxy && trustedPeers.length === 0) fail('TRUSTED_PROXIES_REQUIRED');
  const baseURL = env.BETTER_AUTH_URL ?? 'http://127.0.0.1:3000';
  const trustedOrigins = originList(env.TRUSTED_ORIGINS ?? baseURL);
  const issuer = env.AUTH_ISSUER ?? 'better-auth';
  if (issuer.length < 1 || issuer.length > 200 || issuer.includes('@')) fail('AUTH_ISSUER_INVALID');

  if (authMode === 'test') {
    if (nodeEnv === 'production') fail('TEST_AUTH_IN_PRODUCTION');
    if (env.ALLOW_TEST_AUTH !== '1') fail('TEST_AUTH_NOT_ENABLED');
    const secret = env.TEST_AUTH_SECRET ?? '';
    if (secret.length < 16) fail('TEST_AUTH_SECRET_TOO_SHORT');
    return {
      authMode,
      databaseUrl,
      port,
      testAuthSecret: secret,
      betterAuthSecret: null,
      baseURL,
      trustedOrigins,
      issuer,
      trustProxy,
      trustedPeers,
    };
  }

  const secret = env.BETTER_AUTH_SECRET ?? '';
  if (WEAK_SECRETS.has(secret) || secret === env.TEST_AUTH_SECRET) fail('BETTER_AUTH_SECRET_UNSAFE');
  if (secret.length < 32) fail('BETTER_AUTH_SECRET_TOO_SHORT');
  return {
    authMode,
    databaseUrl,
    port,
    testAuthSecret: null,
    betterAuthSecret: secret,
    baseURL,
    trustedOrigins,
    issuer,
    trustProxy,
    trustedPeers,
  };
}
