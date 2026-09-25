import type { Route } from './+types/home';
import {
  fetchPortalOffers,
  portalShell,
  resolvePortalHome,
  type PortalHome,
} from '../shell.ts';

export async function loader({ request }: Route.LoaderArgs): Promise<PortalHome> {
  // Session + offer projection come from Core API when configured. Forward the
  // browser session cookie on the SSR hop. Never invents client CRM facts.
  const base = typeof process !== 'undefined' ? process.env.FZ_API_ORIGIN || process.env.CORE_API_URL : undefined;
  if (!base) return resolvePortalHome({});
  const cookie = request.headers.get('cookie') ?? '';
  return resolvePortalHome({
    async probe() {
      const headers: Record<string, string> = { accept: 'application/json' };
      if (cookie) headers.cookie = cookie;
      const response = await fetch(new URL('/v1/portal/session', base), {
        credentials: 'include',
        headers,
      });
      if (response.status === 401) return null;
      if (!response.ok) return null;
      const body = (await response.json()) as { clientId?: string };
      if (typeof body.clientId !== 'string') return null;
      return { clientId: body.clientId };
    },
    async loadOffers() {
      return fetchPortalOffers({ base, cookie });
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
