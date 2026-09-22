import type { Route } from './+types/home';
import { adminShell, resolveAdminHome, type AdminHome } from '../shell.ts';

export async function loader(): Promise<AdminHome> {
  // Session probe is wired when CORE_API_URL is configured. Without it the
  // admin stays signed-out — never invents CRM writes or client facts.
  const base = typeof process !== 'undefined' ? process.env.FZ_API_ORIGIN || process.env.CORE_API_URL : undefined;
  if (!base) return resolveAdminHome({});
  return resolveAdminHome({
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
    { title: 'Panel personelu — Forma Zieleni' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return adminShell(loaderData);
}
