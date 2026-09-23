import { randomUUID } from 'node:crypto';
import { data, redirect } from 'react-router';
import type { Route } from './+types/home';
import {
  adminShell,
  fetchAdminLeads,
  qualifyAdminLead,
  resolveAdminHome,
  type AdminHome,
} from '../shell.ts';

function apiOrigin(): string | undefined {
  return typeof process !== 'undefined' ? process.env.FZ_API_ORIGIN || process.env.CORE_API_URL : undefined;
}

export async function loader(): Promise<AdminHome> {
  // Session + leads come from Core API when configured. Without it the admin
  // stays signed-out — never invents CRM writes or client facts.
  const base = apiOrigin();
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
    async loadLeads() {
      return fetchAdminLeads({ base });
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  const base = apiOrigin();
  if (!base) return data({ ok: false as const, reason: 'error' as const }, { status: 503 });
  const form = await request.formData();
  if (form.get('intent') !== 'qualify') {
    return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
  }
  const leadId = form.get('leadId');
  if (typeof leadId !== 'string' || !leadId) {
    return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
  }
  const capacityHold = form.get('capacityHold') === 'true';
  const result = await qualifyAdminLead({
    base,
    leadId,
    capacityHold,
    idempotencyKey: randomUUID(),
  });
  if (!result.ok) {
    return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
  }
  return redirect('/');
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
