import { randomUUID } from 'node:crypto';
import { createElement } from 'react';
import { data, redirect } from 'react-router';
import type { Route } from './+types/home';
import {
  ADMIN_FILE_BYTES_MAX,
  adminShell,
  advanceAdminContractLifecycle,
  createAdminContract,
  createAdminOffer,
  createAdminOpportunity,
  createAdminFile,
  createAdminPaymentSchedule,
  createAdminProject,
  fetchAdminContracts,
  fetchAdminFiles,
  fetchAdminLeads,
  fetchAdminOffers,
  fetchAdminOpportunities,
  fetchAdminPaymentSchedules,
  fetchAdminSigningSandbox,
  openAdminSigningSandbox,
  fetchAdminProjects,
  putAdminFileBytes,
  qualifyAdminLead,
  resolveAdminHome,
  transitionAdminPaymentInstallment,
  type AdminHome,
} from '../shell.ts';
import { fetchAdminProposals, reviewAdminProposal } from '../approvals.ts';

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
    async loadOpportunities() {
      return fetchAdminOpportunities({ base, cookie });
    },
    async loadOffers() {
      return fetchAdminOffers({ base, cookie });
    },
    async loadContracts() {
      return fetchAdminContracts({ base, cookie });
    },
    async loadProjects() {
      return fetchAdminProjects({ base, cookie });
    },
    async loadFiles() {
      return fetchAdminFiles({ base, cookie });
    },
    async loadPaymentSchedules() {
      return fetchAdminPaymentSchedules({ base, cookie });
    },
    async loadSigningSandbox() {
      const contractId = new URL(request.url).searchParams.get('contractId') ?? '';
      if (!contractId) return { status: 'empty' };
      return fetchAdminSigningSandbox({ base, cookie, contractId });
    },
    async loadProposals() {
      return fetchAdminProposals({ base, cookie });
    },
  });
}

export async function action({ request }: Route.ActionArgs) {
  const base = apiOrigin();
  if (!base) return data({ ok: false as const, reason: 'error' as const }, { status: 503 });
  const form = await request.formData();
  const intent = form.get('intent');
  const cookie = request.headers.get('cookie') ?? '';

  if (
    intent === 'edit-proposal'
    || intent === 'approve-proposal'
    || intent === 'partial-approve-proposal'
    || intent === 'reject-proposal'
    || intent === 'defer-proposal'
  ) {
    const changeSetId = form.get('changeSetId');
    if (typeof changeSetId !== 'string' || !changeSetId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const action =
      intent === 'edit-proposal' ? 'EDIT'
        : intent === 'approve-proposal' ? 'APPROVE_ALL'
          : intent === 'partial-approve-proposal' ? 'PARTIAL_APPROVE'
            : intent === 'reject-proposal' ? 'REJECT'
              : 'DEFER';
    const editChangeId = form.get('editChangeId');
    const editAfter = form.get('editAfter');
    const result = await reviewAdminProposal({
      base,
      changeSetId: changeSetId.trim(),
      action,
      selectedIds: intent === 'partial-approve-proposal' && typeof editChangeId === 'string'
        ? [editChangeId]
        : undefined,
      edits: intent === 'edit-proposal'
        && typeof editChangeId === 'string'
        && typeof editAfter === 'string'
        ? [{ changeId: editChangeId, after: editAfter }]
        : undefined,
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

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

  if (intent === 'create-opportunity') {
    const leadId = form.get('leadId');
    if (typeof leadId !== 'string' || !leadId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminOpportunity({
      base,
      leadId: leadId.trim(),
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

  if (intent === 'advance-contract-lifecycle') {
    const contractId = form.get('contractId');
    const status = form.get('status');
    if (typeof contractId !== 'string' || !contractId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof status !== 'string' || !status.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await advanceAdminContractLifecycle({
      base,
      contractId: contractId.trim(),
      status: status.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'open-signing-sandbox') {
    const contractId = form.get('contractId');
    if (typeof contractId !== 'string' || !contractId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await openAdminSigningSandbox({
      base,
      contractId: contractId.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect(`/?contractId=${encodeURIComponent(contractId.trim())}`);
  }

  if (intent === 'create-payment-schedule') {
    const contractId = form.get('contractId');
    const firstText = form.get('amountMinorFirst');
    const secondText = form.get('amountMinorSecond');
    if (typeof contractId !== 'string' || !contractId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const amountMinorFirst = typeof firstText === 'string' ? Number(firstText) : NaN;
    const amountMinorSecond = typeof secondText === 'string' ? Number(secondText) : NaN;
    if (!Number.isInteger(amountMinorFirst) || amountMinorFirst < 1) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (!Number.isInteger(amountMinorSecond) || amountMinorSecond < 1) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminPaymentSchedule({
      base,
      contractId: contractId.trim(),
      currency: 'PLN',
      amountMinorFirst,
      amountMinorSecond,
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'transition-payment-installment') {
    const scheduleId = form.get('scheduleId');
    const installmentId = form.get('installmentId');
    const status = form.get('status');
    if (typeof scheduleId !== 'string' || !scheduleId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof installmentId !== 'string' || !installmentId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof status !== 'string' || !status.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await transitionAdminPaymentInstallment({
      base,
      scheduleId: scheduleId.trim(),
      installmentId: installmentId.trim(),
      status: status.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'create-project') {
    const contractId = form.get('contractId');
    if (typeof contractId !== 'string' || !contractId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminProject({
      base,
      contractId: contractId.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'create-file') {
    const projectId = form.get('projectId');
    const name = form.get('name');
    const mimeType = form.get('mimeType');
    const sizeText = form.get('sizeBytes');
    if (typeof projectId !== 'string' || !projectId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof name !== 'string' || !name.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof mimeType !== 'string' || !mimeType.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const sizeBytes = typeof sizeText === 'string' ? Number(sizeText) : NaN;
    if (!Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > ADMIN_FILE_BYTES_MAX) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminFile({
      base,
      projectId: projectId.trim(),
      name: name.trim(),
      mimeType: mimeType.trim(),
      sizeBytes,
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'upload-file-bytes') {
    const fileId = form.get('fileId');
    const upload = form.get('bytes');
    if (typeof fileId !== 'string' || !fileId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (!(upload instanceof File)) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (upload.size === 0 || upload.size > ADMIN_FILE_BYTES_MAX) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const bytes = new Uint8Array(await upload.arrayBuffer());
    const result = await putAdminFileBytes({
      base,
      fileId: fileId.trim(),
      bytes,
      // Transport only — Core API keeps metadata mimeType authoritative.
      contentType: 'application/octet-stream',
      cookie,
    });
    if (!result.ok) {
      const status =
        result.reason === 'forbidden' ? 403
          : result.reason === 'not_found' ? 404
            : result.reason === 'conflict' ? 409
              : 502;
      return data(result, { status });
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

function actionFailureMessage(reason: 'forbidden' | 'error' | 'not_found' | 'conflict'): string {
  if (reason === 'forbidden') return 'Nie masz uprawnień do tej operacji personelu.';
  if (reason === 'not_found') return 'Nie znaleziono pliku lub jego bajtów.';
  if (reason === 'conflict') return 'Bajty tego pliku są już zapisane i nie mogą się zmienić.';
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
