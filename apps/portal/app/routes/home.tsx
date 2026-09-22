import type { Route } from './+types/home';
import { portalShell, resolvePortalHome, type PortalHome } from '../shell.ts';

export async function loader(): Promise<PortalHome> {
  // Session probe is wired when CORE_API_URL is configured. Without it the
  // portal stays signed-out — never invents client CRM facts.
  const base = typeof process !== 'undefined' ? process.env.FZ_API_ORIGIN || process.env.CORE_API_URL : undefined;
  if (!base) return resolvePortalHome({});
  return resolvePortalHome({
    async probe() {
      const response = await fetch(new URL('/v1/portal/session', base), {
        credentials: 'include',
        headers: { accept: 'application/json' },
      });
      if (response.status === 401) return null;
      if (!response.ok) return null;
      const body = (await response.json()) as { clientId?: string };
      if (typeof body.clientId !== 'string') return null;
      return { clientId: body.clientId };
    },
  });
}

export function meta() {
  return [
    { title: 'Portal klienta — Forma Zieleni' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return portalShell(loaderData);
}
