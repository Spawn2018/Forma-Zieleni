import { randomUUID } from 'node:crypto';
import { createElement } from 'react';
import { data, redirect } from 'react-router';
import type { Route } from './+types/home';
import {
  ADMIN_FILE_BYTES_MAX,
  adminDecisionLogProjectFilter,
  adminFileProjectFilter,
  adminMilestoneProjectFilter,
  adminShell,
  advanceAdminContractLifecycle,
  createAdminContract,
  createAdminOffer,
  createAdminOpportunity,
  createAdminFile,
  reviseAdminFileName,
  reviseAdminFileVisibility,
  capacityDecisionMessage,
  closeAdminCapacityWindow,
  createAdminCapacityWindow,
  createAdminGarden,
  createAdminDecisionLogEntry,
  reviseAdminDecisionLogSummary,
  createAdminSiteObservation,
  advanceAdminMilestoneStatus,
  createAdminMilestone,
  parseAdminMilestoneDueAt,
  parseAdminMilestoneDueRevision,
  reviseAdminMilestoneDue,
  reviseAdminMilestoneTitle,
  createAdminPaymentSchedule,
  createAdminProject,
  deliverAdminProject,
  decideAdminCapacity,
  fetchAdminCapacityWindows,
  fetchAdminContracts,
  fetchAdminFiles,
  fetchAdminGardens,
  DECISION_LOG_KINDS,
  fetchAdminDecisionLog,
  fetchAdminSiteIntelligence,
  fetchAdminLeads,
  fetchAdminMilestones,
  fetchAdminOffers,
  fetchAdminOpportunities,
  fetchAdminPaymentSchedules,
  fetchAdminSigningSandbox,
  openAdminSigningSandbox,
  fetchAdminProjects,
  putAdminFileBytes,
  qualifyAdminLead,
  SITE_OBSERVATION_KINDS,
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
  const searchParams = new URL(request.url).searchParams;
  const milestoneFilter = adminMilestoneProjectFilter(searchParams.get('milestoneProject'));
  const decisionFilter = adminDecisionLogProjectFilter(searchParams.get('decisionProject'));
  const fileFilter = adminFileProjectFilter(searchParams.get('fileProject'));
  const home = await resolveAdminHome({
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
      if (fileFilter.state === 'invalid') return { status: 'empty' };
      return fetchAdminFiles({
        base,
        cookie,
        projectId: fileFilter.state === 'project' ? fileFilter.projectId : undefined,
      });
    },
    async loadPaymentSchedules() {
      return fetchAdminPaymentSchedules({ base, cookie });
    },
    async loadCapacityWindows() {
      return fetchAdminCapacityWindows({ base, cookie });
    },
    async loadSigningSandbox() {
      const contractId = new URL(request.url).searchParams.get('contractId') ?? '';
      if (!contractId) return { status: 'empty' };
      return fetchAdminSigningSandbox({ base, cookie, contractId });
    },
    async loadMilestones() {
      if (milestoneFilter.state === 'invalid') return { status: 'empty' };
      return fetchAdminMilestones({
        base,
        cookie,
        projectId: milestoneFilter.state === 'project' ? milestoneFilter.projectId : undefined,
      });
    },
    async loadGardens() {
      return fetchAdminGardens({ base, cookie });
    },
    async loadSiteIntelligence() {
      return fetchAdminSiteIntelligence({ base, cookie });
    },
    async loadDecisionLog() {
      if (decisionFilter.state === 'invalid') return { status: 'empty' };
      return fetchAdminDecisionLog({
        base,
        cookie,
        projectId: decisionFilter.state === 'project' ? decisionFilter.projectId : undefined,
      });
    },
    async loadProposals() {
      return fetchAdminProposals({ base, cookie });
    },
  });
  if (home.state !== 'signed-in') return home;
  return {
    ...home,
    milestoneProjectQuery: milestoneFilter.state === 'all' ? '' : searchParams.get('milestoneProject')?.trim() ?? '',
    milestoneProjectId: milestoneFilter.state === 'project' ? milestoneFilter.projectId : null,
    milestoneFilterInvalid: milestoneFilter.state === 'invalid',
    decisionProjectQuery: decisionFilter.state === 'all' ? '' : searchParams.get('decisionProject')?.trim() ?? '',
    decisionProjectId: decisionFilter.state === 'project' ? decisionFilter.projectId : null,
    decisionFilterInvalid: decisionFilter.state === 'invalid',
    fileProjectQuery: fileFilter.state === 'all' ? '' : searchParams.get('fileProject')?.trim() ?? '',
    fileProjectId: fileFilter.state === 'project' ? fileFilter.projectId : null,
    fileFilterInvalid: fileFilter.state === 'invalid',
  };
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

  if (intent === 'create-decision-log') {
    const projectId = form.get('projectId');
    const kind = form.get('kind');
    const summary = form.get('summary');
    const relatedMilestoneId = form.get('relatedMilestoneId');
    if (typeof projectId !== 'string' || !projectId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof kind !== 'string' || !(DECISION_LOG_KINDS as readonly string[]).includes(kind)) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof summary !== 'string' || !summary.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const milestone = typeof relatedMilestoneId === 'string' ? relatedMilestoneId.trim() : '';
    const result = await createAdminDecisionLogEntry({
      base,
      projectId: projectId.trim(),
      kind,
      summary: summary.trim(),
      ...(milestone ? { relatedMilestoneId: milestone } : {}),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'revise-decision-summary') {
    const entryId = form.get('entryId');
    const summary = form.get('summary');
    if (typeof entryId !== 'string' || !entryId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof summary !== 'string' || !summary.trim() || summary.trim().length > 2000) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await reviseAdminDecisionLogSummary({
      base,
      entryId: entryId.trim(),
      summary: summary.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'create-site-observation') {
    const projectId = form.get('projectId');
    const observationId = form.get('observationId');
    const kind = form.get('kind');
    if (typeof projectId !== 'string' || !projectId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof observationId !== 'string' || observationId.trim().length < 8) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof kind !== 'string' || !(SITE_OBSERVATION_KINDS as readonly string[]).includes(kind)) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminSiteObservation({
      base,
      projectId: projectId.trim(),
      observationId: observationId.trim(),
      kind,
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'create-garden') {
    const projectId = form.get('projectId');
    if (typeof projectId !== 'string' || !projectId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminGarden({
      base,
      projectId: projectId.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'create-milestone') {
    const projectId = form.get('projectId');
    const title = form.get('title');
    if (typeof projectId !== 'string' || !projectId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof title !== 'string' || !title.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const dueAt = form.get('dueAt');
    if (typeof dueAt !== 'string') {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const parsedDue = parseAdminMilestoneDueAt(dueAt);
    if (!parsedDue.ok) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminMilestone({
      base,
      projectId: projectId.trim(),
      title: title.trim(),
      ...(parsedDue.dueAt ? { dueAt: parsedDue.dueAt } : {}),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'advance-milestone-status') {
    const milestoneId = form.get('milestoneId');
    const status = form.get('status');
    if (typeof milestoneId !== 'string' || !milestoneId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (status !== 'active' && status !== 'done') {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await advanceAdminMilestoneStatus({
      base,
      milestoneId: milestoneId.trim(),
      status,
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'revise-milestone-due' || intent === 'clear-milestone-due') {
    const milestoneId = form.get('milestoneId');
    if (typeof milestoneId !== 'string' || !milestoneId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    let dueAt: string | null = null;
    if (intent === 'revise-milestone-due') {
      const rawDue = form.get('dueAt');
      if (typeof rawDue !== 'string') {
        return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
      }
      const parsedDue = parseAdminMilestoneDueRevision(rawDue);
      if (!parsedDue.ok) {
        return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
      }
      dueAt = parsedDue.dueAt;
    }
    const result = await reviseAdminMilestoneDue({
      base,
      milestoneId: milestoneId.trim(),
      dueAt,
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'revise-milestone-title') {
    const milestoneId = form.get('milestoneId');
    const title = form.get('title');
    if (typeof milestoneId !== 'string' || !milestoneId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await reviseAdminMilestoneTitle({
      base,
      milestoneId: milestoneId.trim(),
      title: title.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'deliver-project') {
    const projectId = form.get('projectId');
    if (typeof projectId !== 'string' || !projectId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await deliverAdminProject({
      base,
      projectId: projectId.trim(),
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

  if (intent === 'revise-file-name') {
    const fileId = form.get('fileId');
    const name = form.get('name');
    if (typeof fileId !== 'string' || !fileId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 255) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await reviseAdminFileName({
      base,
      fileId: fileId.trim(),
      name: name.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'set-file-visibility') {
    const fileId = form.get('fileId');
    const visible = form.get('visible');
    if (typeof fileId !== 'string' || !fileId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (visible !== 'true' && visible !== 'false') {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await reviseAdminFileVisibility({
      base,
      fileId: fileId.trim(),
      visible: visible === 'true',
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'create-capacity-window') {
    const actorId = form.get('capacityActorId');
    const kind = form.get('capacityKind');
    const startsAt = form.get('capacityStartsAt');
    const endsAt = form.get('capacityEndsAt');
    if (typeof actorId !== 'string' || !actorId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (kind !== 'consultation' && kind !== 'start') {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof startsAt !== 'string' || !startsAt.trim() || typeof endsAt !== 'string' || !endsAt.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await createAdminCapacityWindow({
      base,
      actorId: actorId.trim(),
      kind,
      startsAt: startsAt.trim(),
      endsAt: endsAt.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'close-capacity-window') {
    const windowId = form.get('capacityWindowId');
    if (typeof windowId !== 'string' || !windowId.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await closeAdminCapacityWindow({
      base,
      windowId: windowId.trim(),
      idempotencyKey: randomUUID(),
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return redirect('/');
  }

  if (intent === 'decide-capacity') {
    const actorId = form.get('capacityActorId');
    const kind = form.get('capacityKind');
    const promisedAt = form.get('capacityPromisedAt');
    if (kind !== 'consultation' && kind !== 'start') {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    if (typeof promisedAt !== 'string' || !promisedAt.trim()) {
      return data({ ok: false as const, reason: 'error' as const }, { status: 400 });
    }
    const result = await decideAdminCapacity({
      base,
      kind,
      promisedAt: promisedAt.trim(),
      actorId: typeof actorId === 'string' && actorId.trim() ? actorId.trim() : undefined,
      cookie,
    });
    if (!result.ok) {
      return data(result, { status: result.reason === 'forbidden' ? 403 : 502 });
    }
    return data({ ok: true as const, decision: result.decision });
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
  const decision =
    actionData && actionData.ok === true && 'decision' in actionData
      ? createElement('p', { className: 'admin-capacity-decision', role: 'status' }, capacityDecisionMessage(actionData.decision))
      : null;
  return createElement(
    'div',
    { className: 'admin-home' },
    failure,
    decision,
    adminShell(loaderData),
  );
}
