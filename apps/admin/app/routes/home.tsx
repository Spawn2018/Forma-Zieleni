import { randomUUID } from 'node:crypto';
import { createElement } from 'react';
import { data, redirect } from 'react-router';
import type { Route } from './+types/home';
import {
  adminShell,
  createAdminContract,
  createAdminOffer,
  fetchAdminContracts,
  fetchAdminLeads,
  fetchAdminOffers,
  qualifyAdminLead,
  resolveAdminHome,
  type AdminHome,
} from '../shell.ts';

function apiOrigin(): string | undefined {
  return typeof process !== 'undefined' ? process.env.FZ_API_ORIGIN || process.env.CORE_API_URL : undefined;
}

export async function loader({ request }: Route.LoaderArgs): Promise<AdminHome> {
  // Session + CRM lists come from Core API when configured. Forward the browser
  // session cookie on the SSR hop — credentials alone do not. Never invents
  // CRM writes or client facts.
  const base = apiOrigin();
  if (!base) return resolveAdminHome({});
  const cookie = request.headers.get('cookie') ?? '';
  return resolveAdminHome({
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
    async loadLeads() {
      return fetchAdminLeads({ base, cookie });
    },
    async loadOffers() {
      return fetchAdminOffers({ base, cookie });
    },
    async loadContracts() {
      return fetchAdminContracts({ base, cookie });
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  const base = apiOrigin();
  if (!base) return data({ ok: false as const, reason: 'error' as const }, { status: 503 });
  const form = await request.formData();
  const intent = form.get('intent');
  const cookie = request.headers.get('cookie') ?? '';

  if (intent === 'qualify') {
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
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'create-offer') {
    const opportunityId = form.get('opportunityId');
    if (typeof opportunityId !== 'string' || !opportunityId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminOffer({
      base,
      opportunityId: opportunityId.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'create-contract') {
    const offerId = form.get('offerId');
    if (typeof offerId !== 'string' || !offerId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminContract({
      base,
      offerId: offerId.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
}

export function meta() {
  return [
    { title: 'Panel personelu — Forma Zieleni' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

function actionFailureMessage(reason: 'forbidden' | 'error'): string {
  if (reason === 'forbidden') return 'Nie masz uprawnień do tej operacji personelu.';
  return 'Operacji nie udało się zapisać. Odśwież stronę i spróbuj ponownie.';
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const failure =
    actionData && actionData.ok === false
      ? createElement('p', { className: 'admin-action-error', role: 'alert' }, actionFailureMessage(actionData.reason))
      : null;
  return createElement(
    'div',
    { className: 'admin-home' },
    failure,
    adminShell(loaderData),
  );
}
