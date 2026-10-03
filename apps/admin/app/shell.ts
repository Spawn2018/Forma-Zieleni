import { createElement, type ReactNode } from 'react';
import {
  proposalListNode,
  type AdminProposalList,
} from './approvals.ts';

export type AdminSessionActor = {
  clientId: string;
};

export type AdminLeadRow = {
  id: string;
  status: string;
  contactName: string;
  locality: string | null;
  qualificationResult: string;
};

export type AdminLeadList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminLeadRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminOpportunityRow = {
  id: string;
  leadId: string;
  status: string;
};

export type AdminOpportunityList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminOpportunityRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export const ADMIN_OFFER_STATUSES = ['draft'] as const;
export type AdminOfferStatus = (typeof ADMIN_OFFER_STATUSES)[number];

export type AdminOfferRow = {
  id: string;
  opportunityId: string;
  status: AdminOfferStatus;
  createdAt: string;
};

export type AdminOfferList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminOfferRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export const ADMIN_CONTRACT_STATUSES = ['draft', 'internal_review', 'approved', 'sent'] as const;
export type AdminContractStatus = (typeof ADMIN_CONTRACT_STATUSES)[number];

export type AdminContractRow = {
  id: string;
  offerId: string;
  status: AdminContractStatus;
  createdAt: string;
};

export type AdminContractList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminContractRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export const ADMIN_PROJECT_STATUSES = ['planned', 'delivered'] as const;
export type AdminProjectStatus = (typeof ADMIN_PROJECT_STATUSES)[number];

export type AdminProjectRow = {
  id: string;
  contractId: string;
  status: AdminProjectStatus;
  createdAt: string;
};

export type AdminProjectList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminProjectRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminFileRow = {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  visibleToClient: boolean;
  createdAt: string;
};

export type AdminFileList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminFileRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

/** Name order, Polish collation, numbers in numeric order. Same name stays in id order. Hidden files stay. */
export function compareAdminFiles(
  left: Pick<AdminFileRow, 'id' | 'name'>,
  right: Pick<AdminFileRow, 'id' | 'name'>,
): number {
  const byName = left.name.localeCompare(right.name, 'pl', { numeric: true, sensitivity: 'variant' });
  if (byName !== 0) return byName;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

export type AdminPaymentInstallmentRow = {
  id: string;
  sequence: number;
  amountMinor: number;
  status: string;
};

export type AdminPaymentScheduleRow = {
  id: string;
  contractId: string;
  currency: string;
  installments: readonly AdminPaymentInstallmentRow[];
};

export type AdminPaymentScheduleList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminPaymentScheduleRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminCapacityWindowRow = {
  id: string;
  actorId: string;
  kind: 'consultation' | 'start';
  startsAt: string;
  endsAt: string;
  closedAt: string | null;
};

export type AdminCapacityWindowList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminCapacityWindowRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminCapacityDecision =
  | { ok: true; windowId: string }
  | { ok: false; reason: 'CAPACITY_EMPTY' | 'CAPACITY_OUTSIDE' | 'CAPACITY_KIND_MISMATCH' };

export type AdminMilestoneRow = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  dueAt: string | null;
};

export type AdminMilestoneList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminMilestoneRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminGardenRow = {
  id: string;
  projectId: string;
  createdAt: string;
};

export type AdminGardenList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminGardenRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export const SITE_OBSERVATION_KINDS = [
  'slope',
  'topography',
  'soil',
  'sun',
  'aspect',
  'surroundings',
  'climate',
] as const;

export type SiteObservationKind = (typeof SITE_OBSERVATION_KINDS)[number];

/** Polish words for the closed observation kinds. The posted value stays the machine kind. */
export function adminSiteObservationKindLabel(kind: SiteObservationKind): string {
  switch (kind) {
    case 'slope':
      return 'spadek';
    case 'topography':
      return 'ukształtowanie';
    case 'soil':
      return 'gleba';
    case 'sun':
      return 'nasłonecznienie';
    case 'aspect':
      return 'wystawa';
    case 'surroundings':
      return 'otoczenie';
    case 'climate':
      return 'klimat';
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

/** The only stored site stage is RULES. An unknown stage never becomes a label. */
export function adminSiteSourceStageLabel(stage: AdminSiteRow['sourceStage']): string {
  switch (stage) {
    case 'RULES':
      return 'reguły';
    default: {
      const unreachable: never = stage;
      return unreachable;
    }
  }
}

export type AdminSiteFinding = {
  id: string;
  code: string;
};

export type AdminSiteRow = {
  id: string;
  projectId: string;
  sourceStage: 'RULES';
  constraints: readonly AdminSiteFinding[];
  opportunities: readonly AdminSiteFinding[];
  createdAt: string;
};

export type AdminSiteList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminSiteRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export const DECISION_LOG_KINDS = ['decision', 'change_order'] as const;

export type DecisionLogKind = (typeof DECISION_LOG_KINDS)[number];

export type AdminDecisionLogRow = {
  id: string;
  projectId: string;
  kind: DecisionLogKind;
  summary: string;
  relatedMilestoneId: string | null;
  createdAt: string;
};

export type AdminDecisionLogList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminDecisionLogRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminSigningSandbox =
  | { status: 'empty' }
  | { status: 'ready'; contractId: string; envelopeStatus: 'pending' | 'completed' }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminHome =
  | { state: 'signed-out' }
  | { state: 'unauthorized' }
  | {
      state: 'signed-in';
      leads: AdminLeadList;
      opportunities: AdminOpportunityList;
      offers: AdminOfferList;
      contracts: AdminContractList;
      projects: AdminProjectList;
      files: AdminFileList;
      paymentSchedules: AdminPaymentScheduleList;
      capacityWindows: AdminCapacityWindowList;
      signingSandbox: AdminSigningSandbox;
      milestones: AdminMilestoneList;
      gardens: AdminGardenList;
      siteIntelligence: AdminSiteList;
      decisionLog: AdminDecisionLogList;
      proposals: AdminProposalList;
      milestoneProjectQuery?: string;
      milestoneProjectId?: string | null;
      milestoneFilterInvalid?: boolean;
      decisionProjectQuery?: string;
      decisionProjectId?: string | null;
      decisionFilterInvalid?: boolean;
      fileProjectQuery?: string;
      fileProjectId?: string | null;
      fileFilterInvalid?: boolean;
      gardenProjectQuery?: string;
      gardenProjectId?: string | null;
      gardenFilterInvalid?: boolean;
      siteProjectQuery?: string;
      siteProjectId?: string | null;
      siteFilterInvalid?: boolean;
    };

/**
 * Admin trust-zone session classification.
 * Core API remains the identity authority; Admin never invents CRM writes or client facts.
 */
export function classifyAdminSession(actor: AdminSessionActor | null): Exclude<AdminHome, { state: 'signed-in' }> | { state: 'signed-in' } {
  if (!actor) return { state: 'signed-out' };
  if (actor.clientId !== 'admin') return { state: 'unauthorized' };
  return { state: 'signed-in' };
}

/** Cookie / Origin rules for the admin trust zone (Better Auth session cookie). */
export function adminOriginAllowed(
  origin: string | null | undefined,
  trustedOrigins: readonly string[],
): boolean {
  if (!origin) return false;
  return trustedOrigins.includes(origin);
}

export function adminSessionCookiePresent(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(';').some((part) => part.trim().startsWith('better-auth.session_token='));
}

type LeadApiItem = {
  id?: unknown;
  status?: unknown;
  contact?: { name?: unknown };
  property?: { locality?: unknown };
  qualification?: { result?: unknown };
};

export function mapLeadPage(body: unknown): AdminLeadList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminLeadRow[] = [];
  for (const item of items) {
    const lead = item as LeadApiItem;
    if (typeof lead.id !== 'string' || typeof lead.status !== 'string') return { status: 'error' };
    if (!lead.contact || typeof lead.contact.name !== 'string') return { status: 'error' };
    const locality = lead.property && typeof lead.property.locality === 'string' ? lead.property.locality : null;
    const qualificationResult =
      lead.qualification && typeof lead.qualification.result === 'string' ? lead.qualification.result : 'pending';
    rows.push({
      id: lead.id,
      status: lead.status,
      contactName: lead.contact.name,
      locality,
      qualificationResult,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminLeads(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminLeadList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/leads?limit=50', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapLeadPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

type OpportunityApiItem = {
  id?: unknown;
  leadId?: unknown;
  status?: unknown;
  stage?: unknown;
  price?: unknown;
  probability?: unknown;
};

export function mapOpportunityPage(body: unknown): AdminOpportunityList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminOpportunityRow[] = [];
  for (const item of items) {
    const opportunity = item as OpportunityApiItem;
    if (typeof opportunity.id !== 'string' || typeof opportunity.leadId !== 'string') return { status: 'error' };
    if (typeof opportunity.status !== 'string') return { status: 'error' };
    if (Object.hasOwn(opportunity, 'stage') || Object.hasOwn(opportunity, 'price') || Object.hasOwn(opportunity, 'probability')) {
      return { status: 'error' };
    }
    rows.push({
      id: opportunity.id,
      leadId: opportunity.leadId,
      status: opportunity.status,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminOpportunities(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminOpportunityList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/opportunities?limit=50', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapOpportunityPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function createAdminOpportunity(input: {
  base: string;
  leadId: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/opportunities', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ leadId: input.leadId }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

type OfferApiItem = {
  id?: unknown;
  opportunityId?: unknown;
  status?: unknown;
  createdAt?: unknown;
  price?: unknown;
};

export function mapOfferPage(body: unknown): AdminOfferList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminOfferRow[] = [];
  for (const item of items) {
    const offer = item as OfferApiItem;
    if (typeof offer.id !== 'string' || typeof offer.opportunityId !== 'string') return { status: 'error' };
    const createdAt = requireAdminCreatedAt(offer.createdAt);
    if (typeof offer.status !== 'string' || !isAdminOfferStatus(offer.status) || createdAt === null) {
      return { status: 'error' };
    }
    if (Object.hasOwn(offer, 'price')) return { status: 'error' };
    rows.push({
      id: offer.id,
      opportunityId: offer.opportunityId,
      status: offer.status,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminOffers(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminOfferList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/offers?limit=50', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapOfferPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function createAdminOffer(input: {
  base: string;
  opportunityId: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/offers', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ opportunityId: input.opportunityId }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

type ContractApiItem = {
  id?: unknown;
  offerId?: unknown;
  status?: unknown;
  createdAt?: unknown;
};

export function mapContractPage(body: unknown): AdminContractList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminContractRow[] = [];
  for (const item of items) {
    const contract = item as ContractApiItem;
    if (typeof contract.id !== 'string' || typeof contract.offerId !== 'string') return { status: 'error' };
    const createdAt = requireAdminCreatedAt(contract.createdAt);
    if (typeof contract.status !== 'string' || !isAdminContractStatus(contract.status) || createdAt === null) {
      return { status: 'error' };
    }
    rows.push({
      id: contract.id,
      offerId: contract.offerId,
      status: contract.status,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminContracts(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminContractList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/contracts?limit=50', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapContractPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function createAdminContract(input: {
  base: string;
  offerId: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/contracts', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ offerId: input.offerId }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

function isAdminOfferStatus(status: string): status is AdminOfferStatus {
  return (ADMIN_OFFER_STATUSES as readonly string[]).includes(status);
}

function isAdminContractStatus(status: string): status is AdminContractStatus {
  return (ADMIN_CONTRACT_STATUSES as readonly string[]).includes(status);
}

function isAdminProjectStatus(status: string): status is AdminProjectStatus {
  return (ADMIN_PROJECT_STATUSES as readonly string[]).includes(status);
}

/** Same words the portal shows. An unknown token is not a label. */
export function adminOfferStatusLabel(status: AdminOfferStatus): string {
  switch (status) {
    case 'draft':
      return 'szkic';
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function adminContractStatusLabel(status: AdminContractStatus): string {
  switch (status) {
    case 'draft':
      return 'szkic';
    case 'internal_review':
      return 'w przeglądzie';
    case 'approved':
      return 'zatwierdzona';
    case 'sent':
      return 'wysłana';
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function adminProjectStatusLabel(status: AdminProjectStatus): string {
  switch (status) {
    case 'planned':
      return 'zaplanowany';
    case 'delivered':
      return 'dostarczony';
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

/** Next allowed provider-neutral lifecycle status, or null when terminal. */
export function nextAdminContractLifecycleStatus(status: string): string | null {
  if (status === 'draft') return 'internal_review';
  if (status === 'internal_review') return 'approved';
  if (status === 'approved') return 'sent';
  return null;
}

function lifecycleAdvanceLabel(nextStatus: string): string {
  if (nextStatus === 'internal_review') return 'Do przeglądu';
  if (nextStatus === 'approved') return 'Zatwierdź';
  if (nextStatus === 'sent') return 'Oznacz jako wysłaną';
  return 'Dalej';
}

export async function advanceAdminContractLifecycle(input: {
  base: string;
  contractId: string;
  status: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/contracts/${encodeURIComponent(input.contractId)}/lifecycle`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ status: input.status }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

type PaymentScheduleApiItem = {
  id?: unknown;
  contractId?: unknown;
  currency?: unknown;
  installments?: unknown;
};

export function mapPaymentSchedulePage(body: unknown): AdminPaymentScheduleList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminPaymentScheduleRow[] = [];
  for (const item of items) {
    const schedule = item as PaymentScheduleApiItem;
    if (typeof schedule.id !== 'string' || typeof schedule.contractId !== 'string') return { status: 'error' };
    if (typeof schedule.currency !== 'string' || !Array.isArray(schedule.installments)) return { status: 'error' };
    const installments: AdminPaymentInstallmentRow[] = [];
    for (const raw of schedule.installments) {
      if (!raw || typeof raw !== 'object') return { status: 'error' };
      const line = raw as Record<string, unknown>;
      if (typeof line.id !== 'string' || typeof line.status !== 'string') return { status: 'error' };
      if (!Number.isInteger(line.sequence) || !Number.isInteger(line.amountMinor)) return { status: 'error' };
      installments.push({
        id: line.id,
        sequence: line.sequence as number,
        amountMinor: line.amountMinor as number,
        status: line.status,
      });
    }
    rows.push({
      id: schedule.id,
      contractId: schedule.contractId,
      currency: schedule.currency,
      installments,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminPaymentSchedules(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminPaymentScheduleList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/payment-schedules?limit=50', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapPaymentSchedulePage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function createAdminPaymentSchedule(input: {
  base: string;
  contractId: string;
  currency: string;
  amountMinorFirst: number;
  amountMinorSecond: number;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/payment-schedules', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        contractId: input.contractId,
        currency: input.currency,
        installments: [
          { sequence: 1, amountMinor: input.amountMinorFirst },
          { sequence: 2, amountMinor: input.amountMinorSecond },
        ],
      }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function transitionAdminPaymentInstallment(input: {
  base: string;
  scheduleId: string;
  installmentId: string;
  status: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(
        `/v1/payment-schedules/${encodeURIComponent(input.scheduleId)}/installments/${encodeURIComponent(input.installmentId)}/transition`,
        input.base,
      ),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ status: input.status }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

type ProjectApiItem = {
  id?: unknown;
  contractId?: unknown;
  status?: unknown;
  createdAt?: unknown;
};

export function mapProjectPage(body: unknown): AdminProjectList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminProjectRow[] = [];
  for (const item of items) {
    const project = item as ProjectApiItem;
    if (typeof project.id !== 'string' || typeof project.contractId !== 'string') return { status: 'error' };
    const createdAt = requireAdminCreatedAt(project.createdAt);
    if (typeof project.status !== 'string' || !isAdminProjectStatus(project.status) || createdAt === null) {
      return { status: 'error' };
    }
    rows.push({
      id: project.id,
      contractId: project.contractId,
      status: project.status,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminProjects(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminProjectList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/projects?limit=50', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapProjectPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

type MilestoneApiItem = {
  id?: unknown;
  projectId?: unknown;
  title?: unknown;
  status?: unknown;
  dueAt?: unknown;
  payment?: unknown;
  signing?: unknown;
  price?: unknown;
  provider?: unknown;
};

export function mapMilestonePage(body: unknown): AdminMilestoneList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminMilestoneRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const milestone = item as MilestoneApiItem;
    if (typeof milestone.id !== 'string' || typeof milestone.projectId !== 'string') return { status: 'error' };
    if (typeof milestone.title !== 'string' || typeof milestone.status !== 'string') return { status: 'error' };
    if (milestone.dueAt !== null && (typeof milestone.dueAt !== 'string' || formatUtcInstantPl(milestone.dueAt) === null)) {
      return { status: 'error' };
    }
    if (
      Object.hasOwn(milestone, 'payment')
      || Object.hasOwn(milestone, 'signing')
      || Object.hasOwn(milestone, 'price')
      || Object.hasOwn(milestone, 'provider')
    ) {
      return { status: 'error' };
    }
    rows.push({
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      status: milestone.status,
      dueAt: milestone.dueAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminMilestones(input: {
  base: string;
  cookie?: string;
  projectId?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminMilestoneList> {
  const filter = adminMilestoneProjectFilter(input.projectId);
  if (filter.state === 'invalid') return { status: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const url = new URL('/v1/milestones?limit=50', input.base);
    if (filter.state === 'project') url.searchParams.set('projectId', filter.projectId);
    const response = await fetchImpl(url, {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapMilestonePage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

const MILESTONE_DUE_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/** Empty stays omitted. A filled term must already be a UTC instant. */
export function parseAdminMilestoneDueAt(
  value: string,
): { ok: true; dueAt?: string } | { ok: false } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true };
  if (!MILESTONE_DUE_INSTANT.test(trimmed)) return { ok: false };
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return { ok: false };
  const fraction = trimmed.match(/\.(\d+)Z$/)?.[1];
  const milliseconds = fraction ? fraction.padEnd(3, '0') : '000';
  const canonical = `${parsed.toISOString().slice(0, 19)}.${milliseconds}Z`;
  if (trimmed !== canonical && trimmed !== parsed.toISOString()) return { ok: false };
  return { ok: true, dueAt: trimmed };
}

/** A revision needs a filled UTC instant. Empty does not clear the term. */
export function parseAdminMilestoneDueRevision(
  value: string,
): { ok: true; dueAt: string } | { ok: false } {
  const parsed = parseAdminMilestoneDueAt(value);
  if (!parsed.ok || !parsed.dueAt) return { ok: false };
  return { ok: true, dueAt: parsed.dueAt };
}

export async function createAdminMilestone(input: {
  base: string;
  projectId: string;
  title: string;
  dueAt?: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/milestones', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        projectId: input.projectId,
        title: input.title,
        ...(input.dueAt ? { dueAt: input.dueAt } : {}),
      }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/** Next staff milestone status, or null when the milestone is done. */
export function nextAdminMilestoneStatus(status: string): string | null {
  if (status === 'planned') return 'active';
  if (status === 'active') return 'done';
  return null;
}

function milestoneAdvanceLabel(nextStatus: string): string {
  if (nextStatus === 'active') return 'Rozpocznij';
  if (nextStatus === 'done') return 'Oznacz jako zrobiony';
  return 'Dalej';
}

const UTC_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;
const POLISH_MONTHS = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
] as const;

/** UTC calendar words. The stored instant is not shifted into a local zone. */
export function formatUtcInstantPl(value: string): string | null {
  const match = UTC_INSTANT.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return null;
  const fraction = (match[7] ?? '').padEnd(3, '0');
  const normalized = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${fraction}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== normalized) return null;
  const monthName = POLISH_MONTHS[month - 1];
  if (!monthName) return null;
  return `${day} ${monthName} ${year}, ${match[4]}:${match[5]} UTC`;
}

/** A recorded garden instant staff can read. An unreadable value is not stored on the row. */
export function requireAdminCreatedAt(value: unknown): string | null {
  if (typeof value !== 'string' || formatUtcInstantPl(value) === null) return null;
  return value;
}

/** Polish UTC words for a recorded instant. An unreadable value is not printed raw. */
export function adminCreatedAtLabel(value: string): string {
  return formatUtcInstantPl(value) ?? 'data nieczytelna';
}

/** Null means no due instant. An unreadable instant stays null and is not printed raw. */
export function adminMilestoneDueLabel(dueAt: string | null): string | null {
  if (dueAt === null) return 'bez terminu';
  return formatUtcInstantPl(dueAt);
}

/** Exact byte count. A space separates each group of three digits. Never rounds into KB. */
export function formatByteCount(value: number): string | null {
  if (!Number.isSafeInteger(value) || value < 0) return null;
  const digits = String(value);
  let grouped = '';
  for (let index = 0; index < digits.length; index += 1) {
    const remaining = digits.length - index;
    if (index > 0 && remaining % 3 === 0) grouped += ' ';
    grouped += digits[index];
  }
  return `${grouped} B`;
}

function byteCountLabel(value: number): string {
  return formatByteCount(value) ?? 'rozmiar nieczytelny';
}

function milestoneStatusLabel(status: string): string {
  if (status === 'planned') return 'zaplanowany';
  if (status === 'active') return 'w toku';
  if (status === 'done') return 'zrobiony';
  return status;
}

export async function advanceAdminMilestoneStatus(input: {
  base: string;
  milestoneId: string;
  status: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/milestones/${encodeURIComponent(input.milestoneId)}/status`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ status: input.status }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function reviseAdminMilestoneDue(input: {
  base: string;
  milestoneId: string;
  dueAt: string | null;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/milestones/${encodeURIComponent(input.milestoneId)}/due`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ dueAt: input.dueAt }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function reviseAdminMilestoneTitle(input: {
  base: string;
  milestoneId: string;
  title: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const title = input.title.trim();
  if (!title || title.length > 200) return { ok: false, reason: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/milestones/${encodeURIComponent(input.milestoneId)}/title`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ title }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function reviseAdminDecisionLogSummary(input: {
  base: string;
  entryId: string;
  summary: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const summary = input.summary.trim();
  if (!summary || summary.length > 2000) return { ok: false, reason: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/decision-log/${encodeURIComponent(input.entryId)}/summary`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ summary }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

const GARDEN_FORBIDDEN = [
  'twinDatabase',
  'liveTwinUi',
  'liveGarden',
  'sensorFeed',
  'plants',
  'advice',
  'xr',
] as const;

type GardenApiItem = {
  id?: unknown;
  projectId?: unknown;
  clientSubject?: unknown;
  createdAt?: unknown;
  twinDatabase?: unknown;
  liveTwinUi?: unknown;
  liveGarden?: unknown;
  sensorFeed?: unknown;
  plants?: unknown;
  advice?: unknown;
  xr?: unknown;
};

export function mapGardenPage(body: unknown): AdminGardenList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminGardenRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const garden = item as GardenApiItem;
    if (typeof garden.id !== 'string' || typeof garden.projectId !== 'string') return { status: 'error' };
    const createdAt = requireAdminCreatedAt(garden.createdAt);
    if (createdAt === null) return { status: 'error' };
    if (garden.clientSubject !== null && typeof garden.clientSubject !== 'string') return { status: 'error' };
    if (GARDEN_FORBIDDEN.some((key) => Object.hasOwn(garden, key))) return { status: 'error' };
    rows.push({
      id: garden.id,
      projectId: garden.projectId,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminGardens(input: {
  base: string;
  cookie?: string;
  projectId?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminGardenList> {
  const filter = adminGardenProjectFilter(input.projectId);
  if (filter.state === 'invalid') return { status: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const url = new URL('/v1/gardens?limit=50', input.base);
    if (filter.state === 'project') url.searchParams.set('projectId', filter.projectId);
    const response = await fetchImpl(url, {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapGardenPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function createAdminGarden(input: {
  base: string;
  projectId: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/gardens', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ projectId: input.projectId }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

const SITE_FORBIDDEN = [
  'twinDatabase',
  'aiConclusion',
  'thirdPartyCredentials',
  'geoportal',
  'inventedSiteFacts',
  'credentials',
] as const;

function mapSiteFindings(value: unknown): AdminSiteFinding[] | null {
  if (!Array.isArray(value)) return null;
  const rows: AdminSiteFinding[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const finding = item as { id?: unknown; code?: unknown; clientSubject?: unknown };
    if (typeof finding.id !== 'string' || typeof finding.code !== 'string') return null;
    if (finding.clientSubject !== undefined && finding.clientSubject !== null && typeof finding.clientSubject !== 'string') {
      return null;
    }
    if (SITE_FORBIDDEN.some((key) => Object.hasOwn(finding, key))) return null;
    rows.push({ id: finding.id, code: finding.code });
  }
  return rows;
}

export function mapAdminSitePage(body: unknown): AdminSiteList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminSiteRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const record = item as {
      id?: unknown;
      projectId?: unknown;
      clientSubject?: unknown;
      sourceStage?: unknown;
      constraints?: unknown;
      opportunities?: unknown;
      createdAt?: unknown;
    };
    if (typeof record.id !== 'string' || typeof record.projectId !== 'string') return { status: 'error' };
    if (record.sourceStage !== 'RULES') return { status: 'error' };
    const createdAt = requireAdminCreatedAt(record.createdAt);
    if (createdAt === null) return { status: 'error' };
    if (record.clientSubject !== null && typeof record.clientSubject !== 'string') return { status: 'error' };
    if (SITE_FORBIDDEN.some((key) => Object.hasOwn(record, key))) return { status: 'error' };
    const constraints = mapSiteFindings(record.constraints);
    const opportunities = mapSiteFindings(record.opportunities);
    if (!constraints || !opportunities) return { status: 'error' };
    rows.push({
      id: record.id,
      projectId: record.projectId,
      sourceStage: 'RULES',
      constraints,
      opportunities,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminSiteIntelligence(input: {
  base: string;
  cookie?: string;
  projectId?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminSiteList> {
  const filter = adminSiteProjectFilter(input.projectId);
  if (filter.state === 'invalid') return { status: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const url = new URL('/v1/site-intelligence?limit=50', input.base);
    if (filter.state === 'project') url.searchParams.set('projectId', filter.projectId);
    const response = await fetchImpl(url, {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapAdminSitePage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function createAdminSiteObservation(input: {
  base: string;
  projectId: string;
  observationId: string;
  kind: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  if (!(SITE_OBSERVATION_KINDS as readonly string[]).includes(input.kind)) {
    return { ok: false, reason: 'error' };
  }
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/site-intelligence', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        projectId: input.projectId,
        observations: [{
          observationId: input.observationId,
          kind: input.kind,
          normalized: true,
          source: 'normalized',
          synthetic: true,
        }],
      }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

const DECISION_LOG_FORBIDDEN = ['payment', 'provider', 'signing', 'price', 'email', 'phone'] as const;

function decisionLogKind(value: unknown): DecisionLogKind | null {
  if (value === 'decision' || value === 'change_order') return value;
  return null;
}

export function mapDecisionLogPage(body: unknown): AdminDecisionLogList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminDecisionLogRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const entry = item as {
      id?: unknown;
      projectId?: unknown;
      kind?: unknown;
      summary?: unknown;
      recordedByActorId?: unknown;
      relatedMilestoneId?: unknown;
      createdAt?: unknown;
    };
    const kind = decisionLogKind(entry.kind);
    const createdAt = requireAdminCreatedAt(entry.createdAt);
    if (typeof entry.id !== 'string' || typeof entry.projectId !== 'string' || !kind || createdAt === null) {
      return { status: 'error' };
    }
    if (typeof entry.summary !== 'string' || entry.summary.trim().length === 0) return { status: 'error' };
    if (typeof entry.recordedByActorId !== 'string') return { status: 'error' };
    if (entry.relatedMilestoneId !== null && typeof entry.relatedMilestoneId !== 'string') return { status: 'error' };
    if (DECISION_LOG_FORBIDDEN.some((key) => Object.hasOwn(entry, key))) return { status: 'error' };
    rows.push({
      id: entry.id,
      projectId: entry.projectId,
      kind,
      summary: entry.summary,
      relatedMilestoneId: entry.relatedMilestoneId,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminDecisionLog(input: {
  base: string;
  cookie?: string;
  projectId?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminDecisionLogList> {
  const filter = adminDecisionLogProjectFilter(input.projectId);
  if (filter.state === 'invalid') return { status: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const url = new URL('/v1/decision-log?limit=50', input.base);
    if (filter.state === 'project') url.searchParams.set('projectId', filter.projectId);
    const response = await fetchImpl(url, {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapDecisionLogPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function createAdminDecisionLogEntry(input: {
  base: string;
  projectId: string;
  kind: string;
  summary: string;
  relatedMilestoneId?: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  if (!decisionLogKind(input.kind)) return { ok: false, reason: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const body: {
      projectId: string;
      kind: string;
      summary: string;
      relatedMilestoneId?: string;
    } = {
      projectId: input.projectId,
      kind: input.kind,
      summary: input.summary,
    };
    if (input.relatedMilestoneId) body.relatedMilestoneId = input.relatedMilestoneId;
    const response = await fetchImpl(new URL('/v1/decision-log', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function deliverAdminProject(input: {
  base: string;
  projectId: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/projects/${encodeURIComponent(input.projectId)}/deliver`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({}),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function createAdminProject(input: {
  base: string;
  contractId: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/projects', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ contractId: input.contractId }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

type FileApiItem = {
  id?: unknown;
  projectId?: unknown;
  name?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
  clientSubject?: unknown;
  createdAt?: unknown;
  storageKey?: unknown;
  url?: unknown;
  bytes?: unknown;
  price?: unknown;
};

export function mapFilePage(body: unknown): AdminFileList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminFileRow[] = [];
  for (const item of items) {
    const file = item as FileApiItem;
    if (typeof file.id !== 'string' || typeof file.projectId !== 'string') return { status: 'error' };
    if (typeof file.name !== 'string' || typeof file.mimeType !== 'string') return { status: 'error' };
    if (typeof file.sizeBytes !== 'number' || !Number.isInteger(file.sizeBytes) || file.sizeBytes < 0) return { status: 'error' };
    if (!Object.hasOwn(file, 'clientSubject')) return { status: 'error' };
    if (file.clientSubject !== null && (typeof file.clientSubject !== 'string' || !file.clientSubject.trim())) {
      return { status: 'error' };
    }
    if (Object.hasOwn(file, 'storageKey') || Object.hasOwn(file, 'url') || Object.hasOwn(file, 'bytes') || Object.hasOwn(file, 'price')) {
      return { status: 'error' };
    }
    const createdAt = requireAdminCreatedAt(file.createdAt);
    if (createdAt === null) return { status: 'error' };
    rows.push({
      id: file.id,
      projectId: file.projectId,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      visibleToClient: file.clientSubject !== null,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminFiles(input: {
  base: string;
  cookie?: string;
  projectId?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminFileList> {
  const filter = adminFileProjectFilter(input.projectId);
  if (filter.state === 'invalid') return { status: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const url = new URL('/v1/files?limit=50', input.base);
    if (filter.state === 'project') url.searchParams.set('projectId', filter.projectId);
    const response = await fetchImpl(url, {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapFilePage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

/** Mirrors Core API FILE_BYTES_MAX. Admin does not import API modules. */
export const ADMIN_FILE_BYTES_MAX = 25 * 1024 * 1024;

export async function createAdminFile(input: {
  base: string;
  projectId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > ADMIN_FILE_BYTES_MAX) {
    return { ok: false, reason: 'error' };
  }
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/files', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        projectId: input.projectId,
        name: input.name,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function reviseAdminFileName(input: {
  base: string;
  fileId: string;
  name: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const name = input.name.trim();
  if (!name || name.length > 255) return { ok: false, reason: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/files/${encodeURIComponent(input.fileId)}/name`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ name }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function reviseAdminFileVisibility(input: {
  base: string;
  fileId: string;
  visible: boolean;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/files/${encodeURIComponent(input.fileId)}/visibility`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ visible: input.visible }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export type AdminFileBytesPutResult =
  | { ok: true; checksum: string; sizeBytes: number }
  | { ok: false; reason: 'forbidden' | 'error' | 'not_found' | 'conflict' };

export type AdminFileBytesGetResult =
  | {
      ok: true;
      bytes: Uint8Array;
      mimeType: string;
      fileName: string;
      checksum: string | null;
      sizeBytes: number;
    }
  | { ok: false; reason: 'forbidden' | 'error' | 'not_found' };

function staffFileIdOk(fileId: string): boolean {
  return /^[A-Za-z0-9_-]{8,64}$/.test(fileId);
}

function dispositionFileName(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1]).replace(/["\\]/g, '_') || fallback;
    } catch {
      return fallback;
    }
  }
  const plain = /filename="([^"]+)"/i.exec(header) || /filename=([^;]+)/i.exec(header);
  if (plain?.[1]) return plain[1].trim().replace(/["\\]/g, '_') || fallback;
  return fallback;
}

/**
 * PUT project-file bytes through Core API only. Bytes must match metadata sizeBytes.
 * No second store; no public URL; no client MIME trust beyond transport.
 */
export async function putAdminFileBytes(input: {
  base: string;
  fileId: string;
  bytes: Uint8Array | ArrayBuffer | Buffer;
  contentType?: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminFileBytesPutResult> {
  if (!staffFileIdOk(input.fileId)) return { ok: false, reason: 'error' };
  const body = Buffer.isBuffer(input.bytes)
    ? new Uint8Array(input.bytes)
    : input.bytes instanceof ArrayBuffer
      ? new Uint8Array(input.bytes)
      : input.bytes;
  if (body.byteLength === 0 || body.byteLength > ADMIN_FILE_BYTES_MAX) return { ok: false, reason: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': input.contentType?.trim() || 'application/octet-stream',
      'content-length': String(body.byteLength),
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL(`/v1/files/${encodeURIComponent(input.fileId)}/content`, input.base), {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: Buffer.from(body),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (response.status === 404) return { ok: false, reason: 'not_found' };
    if (response.status === 409) return { ok: false, reason: 'conflict' };
    if (!response.ok) return { ok: false, reason: 'error' };
    const receipt = await response.json() as {
      id?: unknown;
      checksum?: unknown;
      sizeBytes?: unknown;
      publicUrl?: unknown;
      storageKey?: unknown;
      relativePath?: unknown;
    };
    if (typeof receipt.checksum !== 'string' || typeof receipt.sizeBytes !== 'number') {
      return { ok: false, reason: 'error' };
    }
    if (!Number.isInteger(receipt.sizeBytes) || receipt.sizeBytes !== body.byteLength) {
      return { ok: false, reason: 'error' };
    }
    if (receipt.publicUrl !== null && receipt.publicUrl !== undefined) return { ok: false, reason: 'error' };
    if (Object.hasOwn(receipt, 'storageKey') || Object.hasOwn(receipt, 'relativePath')) {
      return { ok: false, reason: 'error' };
    }
    return { ok: true, checksum: receipt.checksum, sizeBytes: receipt.sizeBytes };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/** GET project-file bytes through Core API only. Empty store → not_found. */
export async function fetchAdminFileBytes(input: {
  base: string;
  fileId: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminFileBytesGetResult> {
  if (!staffFileIdOk(input.fileId)) return { ok: false, reason: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: '*/*' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL(`/v1/files/${encodeURIComponent(input.fileId)}/content`, input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (response.status === 404) return { ok: false, reason: 'not_found' };
    if (!response.ok) return { ok: false, reason: 'error' };
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > ADMIN_FILE_BYTES_MAX) return { ok: false, reason: 'error' };
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
    const checksum = response.headers.get('x-content-checksum-sha256');
    return {
      ok: true,
      bytes: buffer,
      mimeType,
      fileName: dispositionFileName(response.headers.get('content-disposition'), input.fileId),
      checksum: checksum && /^[0-9a-f]{64}$/i.test(checksum) ? checksum.toLowerCase() : null,
      sizeBytes: buffer.length,
    };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/**
 * Resolve admin home from optional Core API session probe + CRM lists.
 * Unconfigured probe → signed-out (truthful). Never invents CRM rows.
 */
export async function resolveAdminHome(input: {
  probe?: () => Promise<AdminSessionActor | null>;
  loadLeads?: () => Promise<AdminLeadList>;
  loadOpportunities?: () => Promise<AdminOpportunityList>;
  loadOffers?: () => Promise<AdminOfferList>;
  loadContracts?: () => Promise<AdminContractList>;
  loadProjects?: () => Promise<AdminProjectList>;
  loadFiles?: () => Promise<AdminFileList>;
  loadPaymentSchedules?: () => Promise<AdminPaymentScheduleList>;
  loadCapacityWindows?: () => Promise<AdminCapacityWindowList>;
  loadSigningSandbox?: () => Promise<AdminSigningSandbox>;
  loadMilestones?: () => Promise<AdminMilestoneList>;
  loadGardens?: () => Promise<AdminGardenList>;
  loadSiteIntelligence?: () => Promise<AdminSiteList>;
  loadDecisionLog?: () => Promise<AdminDecisionLogList>;
  loadProposals?: () => Promise<AdminProposalList>;
}): Promise<AdminHome> {
  if (!input.probe) return { state: 'signed-out' };
  try {
    const classified = classifyAdminSession(await input.probe());
    if (classified.state !== 'signed-in') return classified;
    const leads = input.loadLeads ? await input.loadLeads() : { status: 'empty' as const };
    const opportunities = input.loadOpportunities ? await input.loadOpportunities() : { status: 'empty' as const };
    const offers = input.loadOffers ? await input.loadOffers() : { status: 'empty' as const };
    const contracts = input.loadContracts ? await input.loadContracts() : { status: 'empty' as const };
    const projects = input.loadProjects ? await input.loadProjects() : { status: 'empty' as const };
    const files = input.loadFiles ? await input.loadFiles() : { status: 'empty' as const };
    const paymentSchedules = input.loadPaymentSchedules
      ? await input.loadPaymentSchedules()
      : { status: 'empty' as const };
    const capacityWindows = input.loadCapacityWindows
      ? await input.loadCapacityWindows()
      : { status: 'empty' as const };
    const signingSandbox = input.loadSigningSandbox
      ? await input.loadSigningSandbox()
      : { status: 'empty' as const };
    const milestones = input.loadMilestones
      ? await input.loadMilestones()
      : { status: 'empty' as const };
    const gardens = input.loadGardens
      ? await input.loadGardens()
      : { status: 'empty' as const };
    const siteIntelligence = input.loadSiteIntelligence
      ? await input.loadSiteIntelligence()
      : { status: 'empty' as const };
    const decisionLog = input.loadDecisionLog
      ? await input.loadDecisionLog()
      : { status: 'empty' as const };
    const proposals = input.loadProposals
      ? await input.loadProposals()
      : { status: 'empty' as const };
    return {
      state: 'signed-in',
      leads,
      opportunities,
      offers,
      contracts,
      projects,
      files,
      paymentSchedules,
      capacityWindows,
      signingSandbox,
      milestones,
      gardens,
      siteIntelligence,
      decisionLog,
      proposals,
    };
  } catch {
    return { state: 'signed-out' };
  }
}

export async function fetchAdminSigningSandbox(input: {
  base: string;
  contractId: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminSigningSandbox> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/contracts/${encodeURIComponent(input.contractId)}/signing-sandbox-envelope`, input.base),
      { credentials: 'include', headers },
    );
    if (response.status === 404) return { status: 'empty' };
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    const body = await response.json() as { contractId?: unknown; status?: unknown; qesClaimed?: unknown };
    if (body.contractId !== input.contractId) return { status: 'error' };
    if (body.status !== 'pending' && body.status !== 'completed') return { status: 'error' };
    if (body.qesClaimed !== false) return { status: 'error' };
    return { status: 'ready', contractId: input.contractId, envelopeStatus: body.status };
  } catch {
    return { status: 'error' };
  }
}

export async function openAdminSigningSandbox(input: {
  base: string;
  contractId: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; envelopeStatus: 'pending' | 'completed' } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/contracts/${encodeURIComponent(input.contractId)}/signing-sandbox-envelope`, input.base),
      { method: 'POST', credentials: 'include', headers, body: '{}' },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    const body = await response.json() as { status?: unknown; qesClaimed?: unknown };
    if (body.qesClaimed !== false) return { ok: false, reason: 'error' };
    if (body.status !== 'pending' && body.status !== 'completed') return { ok: false, reason: 'error' };
    return { ok: true, envelopeStatus: body.status };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function qualifyAdminLead(input: {
  base: string;
  leadId: string;
  capacityHold: boolean;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL(`/v1/leads/${encodeURIComponent(input.leadId)}/qualify`, input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ capacityHold: input.capacityHold }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export function adminErrorMessage(status: number | null): string {
  if (status === 404) return 'Nie ma takiej strony.';
  return 'Tej strony nie udało się wyświetlić. Odśwież stronę.';
}

function leadListNode(leads: AdminLeadList): ReactNode {
  if (leads.status === 'empty') {
    return createElement('p', null, 'Brak leadów do pokazania.');
  }
  if (leads.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może odczytać listy leadów.');
  }
  if (leads.status === 'error') {
    return createElement('p', null, 'Listy leadów nie udało się pobrać. Odśwież stronę.');
  }
  return createElement(
    'section',
    { className: 'admin-leads', 'aria-label': 'Leady' },
    createElement('h2', null, 'Leady'),
    createElement(
      'ul',
      { className: 'admin-lead-list' },
      ...leads.items.map((lead) =>
        createElement(
          'li',
          { key: lead.id, className: 'admin-lead' },
          createElement('p', { className: 'admin-lead-name' }, lead.contactName),
          createElement(
            'p',
            { className: 'admin-lead-meta' },
            [
              lead.locality ?? 'bez miejscowości',
              lead.status,
              lead.qualificationResult,
            ].join(' · '),
          ),
          lead.qualificationResult === 'pending' || lead.qualificationResult === 'needs_review'
            ? createElement(
                'form',
                { method: 'post', className: 'admin-qualify' },
                createElement('input', { type: 'hidden', name: 'leadId', value: lead.id }),
                createElement(
                  'label',
                  { className: 'admin-qualify-hold' },
                  createElement('input', { type: 'checkbox', name: 'capacityHold', value: 'true' }),
                  ' Wstrzymaj przez pojemność',
                ),
                createElement('button', { type: 'submit', name: 'intent', value: 'qualify' }, 'Kwalifikuj'),
              )
            : null,
        ),
      ),
    ),
  );
}

function opportunityListNode(opportunities: AdminOpportunityList): ReactNode {
  if (opportunities.status === 'empty') {
    return createElement('p', null, 'Brak szans do pokazania.');
  }
  if (opportunities.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może odczytać listy szans.');
  }
  if (opportunities.status === 'error') {
    return createElement('p', null, 'Listy szans nie udało się pobrać. Odśwież stronę.');
  }
  return createElement(
    'section',
    { className: 'admin-opportunities', 'aria-label': 'Szanse' },
    createElement('h2', null, 'Szanse'),
    createElement(
      'ul',
      { className: 'admin-opportunity-list' },
      ...opportunities.items.map((opportunity) =>
        createElement(
          'li',
          { key: opportunity.id, className: 'admin-opportunity' },
          createElement(
            'p',
            { className: 'admin-opportunity-meta' },
            [opportunity.id, ' · lead ', opportunity.leadId, ' · ', opportunity.status].join(''),
          ),
        ),
      ),
    ),
  );
}

function createOpportunityForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-opportunity' },
    createElement('h2', null, 'Nowa szansa'),
    createElement(
      'label',
      { className: 'admin-create-opportunity-id' },
      'Id leada',
      createElement('input', {
        type: 'text',
        name: 'leadId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-opportunity' }, 'Utwórz szansę'),
  );
}

/** Contracts already loaded for this offer. A failed contract read is not “no contract”. */
export function adminOfferContractLine(offerId: string, contracts: AdminContractList): string {
  if (contracts.status === 'error') return 'Umowy nie udało się odczytać.';
  if (contracts.status === 'forbidden') return 'To konto nie może odczytać listy umów.';
  if (contracts.status !== 'ready') return 'Umowa: brak';
  const matched = contracts.items
    .filter((item) => item.offerId === offerId)
    .map((item) => item.id)
    .sort();
  if (matched.length === 0) return 'Umowa: brak';
  if (matched.length === 1) return `Umowa: ${matched[0]}`;
  return `Umowy: ${matched.join(', ')}`;
}

function offerListNode(offers: AdminOfferList, contracts: AdminContractList): ReactNode {
  if (offers.status === 'empty') {
    return createElement('p', null, 'Brak ofert do pokazania.');
  }
  if (offers.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może odczytać listy ofert.');
  }
  if (offers.status === 'error') {
    return createElement('p', null, 'Listy ofert nie udało się pobrać. Odśwież stronę.');
  }
  return createElement(
    'section',
    { className: 'admin-offers', 'aria-label': 'Oferty' },
    createElement('h2', null, 'Oferty'),
    createElement(
      'ul',
      { className: 'admin-offer-list' },
      ...offers.items.map((offer) =>
        createElement(
          'li',
          { key: offer.id, className: 'admin-offer' },
          createElement(
            'p',
            { className: 'admin-offer-meta' },
            [
              offer.id,
              ' · szansa ',
              offer.opportunityId,
              ' · ',
              adminOfferStatusLabel(offer.status),
              ' · ',
              adminCreatedAtLabel(offer.createdAt),
            ].join(''),
          ),
          createElement(
            'p',
            { className: 'admin-offer-contract' },
            adminOfferContractLine(offer.id, contracts),
          ),
        ),
      ),
    ),
  );
}

function createOfferForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-offer' },
    createElement('h2', null, 'Nowa oferta'),
    createElement(
      'label',
      { className: 'admin-create-offer-id' },
      'Id szansy',
      createElement('input', {
        type: 'text',
        name: 'opportunityId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-offer' }, 'Utwórz ofertę'),
  );
}

/** Projects already loaded for this contract. A failed project read is not “no project”. */
export function adminContractProjectLine(contractId: string, projects: AdminProjectList): string {
  if (projects.status === 'error') return 'Projektu nie udało się odczytać.';
  if (projects.status === 'forbidden') return 'To konto nie może odczytać listy projektów.';
  if (projects.status !== 'ready') return 'Projekt: brak';
  const matched = projects.items
    .filter((item) => item.contractId === contractId)
    .map((item) => item.id)
    .sort();
  if (matched.length === 0) return 'Projekt: brak';
  if (matched.length === 1) return `Projekt: ${matched[0]}`;
  return `Projekty: ${matched.join(', ')}`;
}

function contractListNode(contracts: AdminContractList, projects: AdminProjectList): ReactNode {
  if (contracts.status === 'empty') {
    return createElement('p', null, 'Brak umów do pokazania.');
  }
  if (contracts.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może odczytać listy umów.');
  }
  if (contracts.status === 'error') {
    return createElement('p', null, 'Listy umów nie udało się pobrać. Odśwież stronę.');
  }
  return createElement(
    'section',
    { className: 'admin-contracts', 'aria-label': 'Umowy' },
    createElement('h2', null, 'Umowy'),
    createElement(
      'ul',
      { className: 'admin-contract-list' },
      ...contracts.items.map((contract) => {
        const nextStatus = nextAdminContractLifecycleStatus(contract.status);
        return createElement(
          'li',
          { key: contract.id, className: 'admin-contract' },
          createElement(
            'p',
            { className: 'admin-contract-meta' },
            [
              contract.id,
              ' · oferta ',
              contract.offerId,
              ' · ',
              adminContractStatusLabel(contract.status),
              ' · ',
              adminCreatedAtLabel(contract.createdAt),
            ].join(''),
          ),
          createElement(
            'p',
            { className: 'admin-contract-project' },
            adminContractProjectLine(contract.id, projects),
          ),
          nextStatus
            ? createElement(
                'form',
                { method: 'post', className: 'admin-contract-lifecycle' },
                createElement('input', { type: 'hidden', name: 'contractId', value: contract.id }),
                createElement('input', { type: 'hidden', name: 'status', value: nextStatus }),
                createElement(
                  'button',
                  { type: 'submit', name: 'intent', value: 'advance-contract-lifecycle' },
                  lifecycleAdvanceLabel(nextStatus),
                ),
              )
            : null,
        );
      }),
    ),
  );
}

function createContractForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-contract' },
    createElement('h2', null, 'Nowa umowa'),
    createElement(
      'label',
      { className: 'admin-create-contract-id' },
      'Id oferty',
      createElement('input', {
        type: 'text',
        name: 'offerId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-contract' }, 'Utwórz umowę'),
  );
}

/** Earliest open milestone for one project. Done rows and other projects are skipped. */
export function nextOpenAdminMilestone(
  projectId: string,
  milestones: readonly AdminMilestoneRow[],
): AdminMilestoneRow | null {
  const open = milestones.filter((item) => item.projectId === projectId && item.status !== 'done');
  open.sort(compareAdminMilestones);
  return open[0] ?? null;
}

/** Milestones already loaded for this project. A failed milestone read is not “no milestone”. */
export function adminProjectNextMilestoneLine(projectId: string, milestones: AdminMilestoneList): string {
  if (milestones.status === 'error') return 'Kamieni milowych nie udało się odczytać.';
  if (milestones.status === 'forbidden') return 'To konto nie może odczytać kamieni milowych.';
  if (milestones.status !== 'ready') return 'Otwarte kamienie milowe: brak';
  const next = nextOpenAdminMilestone(projectId, milestones.items);
  if (!next) return 'Otwarte kamienie milowe: brak';
  const due = adminMilestoneDueLabel(next.dueAt) ?? 'termin nieczytelny';
  return `Następny: ${next.title} · ${milestoneStatusLabel(next.status)} · ${due}`;
}

function polishCount(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return `1 ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`;
  return `${count} ${many}`;
}

/** Site findings already loaded for this project. A failed site read is not “no findings”. */
export function adminProjectSiteLine(projectId: string, sites: AdminSiteList): string {
  if (sites.status === 'error') return 'Ustaleń o terenie nie udało się odczytać.';
  if (sites.status === 'forbidden') return 'To konto nie może odczytać ustaleń o terenie.';
  if (sites.status !== 'ready') return 'Teren: brak';
  const matched = sites.items.filter((item) => item.projectId === projectId);
  if (matched.length === 0) return 'Teren: brak';
  const constraints = matched.reduce((sum, item) => sum + item.constraints.length, 0);
  const opportunities = matched.reduce((sum, item) => sum + item.opportunities.length, 0);
  return [
    'Teren: ',
    polishCount(constraints, 'ograniczenie', 'ograniczenia', 'ograniczeń'),
    ' · ',
    polishCount(opportunities, 'możliwość', 'możliwości', 'możliwości'),
  ].join('');
}

/** Gardens already loaded for this project. A failed garden read is not “no garden”. */
export function adminProjectGardenLine(projectId: string, gardens: AdminGardenList): string {
  if (gardens.status === 'error') return 'Ogrodu nie udało się odczytać.';
  if (gardens.status === 'forbidden') return 'To konto nie może odczytać ogrodu.';
  if (gardens.status !== 'ready') return 'Ogród: brak';
  const matched = gardens.items
    .filter((item) => item.projectId === projectId)
    .map((item) => item.id)
    .sort();
  if (matched.length === 0) return 'Ogród: brak';
  if (matched.length === 1) return `Ogród: ${matched[0]}`;
  return `Ogrody: ${matched.join(', ')}`;
}

function projectListNode(
  projects: AdminProjectList,
  milestones: AdminMilestoneList,
  gardens: AdminGardenList,
  sites: AdminSiteList,
): ReactNode {
  if (projects.status === 'empty') {
    return createElement('p', null, 'Brak projektów do pokazania.');
  }
  if (projects.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może odczytać listy projektów.');
  }
  if (projects.status === 'error') {
    return createElement('p', null, 'Listy projektów nie udało się pobrać. Odśwież stronę.');
  }
  return createElement(
    'section',
    { className: 'admin-projects', 'aria-label': 'Projekty' },
    createElement('h2', null, 'Projekty'),
    createElement(
      'ul',
      { className: 'admin-project-list' },
      ...projects.items.map((project) =>
        createElement(
          'li',
          { key: project.id, className: 'admin-project' },
          createElement(
            'p',
            { className: 'admin-project-meta' },
            [
              project.id,
              ' · umowa ',
              project.contractId,
              ' · ',
              adminProjectStatusLabel(project.status),
              ' · ',
              adminCreatedAtLabel(project.createdAt),
            ].join(''),
          ),
          createElement(
            'p',
            { className: 'admin-project-next' },
            adminProjectNextMilestoneLine(project.id, milestones),
          ),
          createElement(
            'p',
            { className: 'admin-project-garden' },
            adminProjectGardenLine(project.id, gardens),
          ),
          createElement(
            'p',
            { className: 'admin-project-site' },
            adminProjectSiteLine(project.id, sites),
          ),
          project.status === 'planned'
            ? createElement(
                'form',
                { method: 'post', className: 'admin-deliver-project' },
                createElement('input', { type: 'hidden', name: 'projectId', value: project.id }),
                createElement(
                  'button',
                  { type: 'submit', name: 'intent', value: 'deliver-project' },
                  'Oznacz jako dostarczony',
                ),
              )
            : null,
        ),
      ),
    ),
  );
}

const OPAQUE_PROJECT_ID = /^[a-z][a-z0-9]{15,63}$/;

export type AdminMilestoneProjectFilter =
  | { state: 'all' }
  | { state: 'project'; projectId: string }
  | { state: 'invalid' };

/** Empty means the full list. A filled id must already be an opaque project id. */
export function adminDecisionLogProjectFilter(value: string | null | undefined): AdminMilestoneProjectFilter {
  return adminMilestoneProjectFilter(value);
}

/** Empty means the full list. A filled id must already be an opaque project id. */
export function adminFileProjectFilter(value: string | null | undefined): AdminMilestoneProjectFilter {
  return adminMilestoneProjectFilter(value);
}

/** Empty means the full list. A filled id must already be an opaque project id. */
export function adminGardenProjectFilter(value: string | null | undefined): AdminMilestoneProjectFilter {
  return adminMilestoneProjectFilter(value);
}

/** Empty means the full list. A filled id must already be an opaque project id. */
export function adminSiteProjectFilter(value: string | null | undefined): AdminMilestoneProjectFilter {
  return adminMilestoneProjectFilter(value);
}

/** Empty means the full list. A filled id must already be an opaque project id. */
export function adminMilestoneProjectFilter(value: string | null | undefined): AdminMilestoneProjectFilter {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return { state: 'all' };
  if (!OPAQUE_PROJECT_ID.test(trimmed) || /^(?:project|prj|id)\d+$/i.test(trimmed)) {
    return { state: 'invalid' };
  }
  return { state: 'project', projectId: trimmed };
}

function milestoneProjectFilterForm(query: string, projectId: string | null): ReactNode {
  return createElement(
    'form',
    { method: 'get', className: 'admin-milestone-filter' },
    createElement(
      'label',
      { className: 'admin-milestone-filter-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'milestoneProject',
        autoComplete: 'off',
        spellCheck: false,
        defaultValue: query,
      }),
    ),
    createElement('button', { type: 'submit' }, 'Pokaż kamienie projektu'),
    projectId ? createElement('a', { href: '/' }, 'Pokaż wszystkie') : null,
  );
}

/** Earlier due first. No due last. Same due stays in id order. Done rows are not removed. */
export function compareAdminMilestones(
  left: { id: string; dueAt: string | null },
  right: { id: string; dueAt: string | null },
): number {
  if (left.dueAt !== right.dueAt) {
    if (left.dueAt === null) return 1;
    if (right.dueAt === null) return -1;
    if (left.dueAt < right.dueAt) return -1;
    return 1;
  }
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

function milestoneListNode(
  milestones: AdminMilestoneList,
  filter: { query: string; projectId: string | null; invalid: boolean },
): ReactNode {
  let body: ReactNode;
  if (filter.invalid) {
    body = createElement(
      'p',
      { className: 'admin-milestone-filter-invalid' },
      'Id projektu jest niepoprawne. Kamienie milowe nie zostały pobrane.',
    );
  } else if (milestones.status === 'empty') {
    body = createElement('p', null, 'Brak kamieni milowych do pokazania.');
  } else if (milestones.status === 'forbidden') {
    body = createElement('p', null, 'To konto nie może odczytać listy kamieni milowych.');
  } else if (milestones.status === 'error') {
    body = createElement('p', null, 'Listy kamieni milowych nie udało się pobrać. Odśwież stronę.');
  } else {
    body = createElement(
      'ul',
      { className: 'admin-milestone-list' },
      ...[...milestones.items].sort(compareAdminMilestones).map((milestone) => {
        const nextStatus = nextAdminMilestoneStatus(milestone.status);
        return createElement(
          'li',
          { key: milestone.id, className: 'admin-milestone' },
          createElement(
            'p',
            { className: 'admin-milestone-meta' },
            [
              milestone.title,
              ' · ',
              milestoneStatusLabel(milestone.status),
              ' · ',
              adminMilestoneDueLabel(milestone.dueAt) ?? 'termin nieczytelny',
              ' · ',
              milestone.projectId,
            ].join(''),
          ),
          createElement(
            'form',
            { method: 'post', className: 'admin-milestone-title' },
            createElement('input', { type: 'hidden', name: 'milestoneId', value: milestone.id }),
            createElement(
              'label',
              { className: 'admin-milestone-title-field' },
              'Nowy tytuł',
              createElement('input', {
                type: 'text',
                name: 'title',
                required: true,
                maxLength: 200,
                autoComplete: 'off',
                defaultValue: milestone.title,
              }),
            ),
            createElement(
              'button',
              { type: 'submit', name: 'intent', value: 'revise-milestone-title' },
              'Popraw tytuł',
            ),
          ),
          nextStatus
            ? createElement(
                'form',
                { method: 'post', className: 'admin-milestone-status' },
                createElement('input', { type: 'hidden', name: 'milestoneId', value: milestone.id }),
                createElement('input', { type: 'hidden', name: 'status', value: nextStatus }),
                createElement(
                  'button',
                  { type: 'submit', name: 'intent', value: 'advance-milestone-status' },
                  milestoneAdvanceLabel(nextStatus),
                ),
              )
            : null,
          createElement(
            'form',
            { method: 'post', className: 'admin-milestone-due' },
            createElement('input', { type: 'hidden', name: 'milestoneId', value: milestone.id }),
            createElement(
              'label',
              { className: 'admin-milestone-due-field' },
              'Nowy termin (UTC)',
              createElement('input', {
                type: 'text',
                name: 'dueAt',
                autoComplete: 'off',
                spellCheck: false,
                placeholder: '2026-10-03T08:00:00.000Z',
              }),
            ),
            createElement(
              'button',
              { type: 'submit', name: 'intent', value: 'revise-milestone-due' },
              'Zapisz termin',
            ),
            milestone.dueAt
              ? createElement(
                  'button',
                  { type: 'submit', name: 'intent', value: 'clear-milestone-due' },
                  'Usuń termin',
                )
              : null,
          ),
        );
      }),
    );
  }
  return createElement(
    'section',
    { className: 'admin-milestones', 'aria-label': 'Kamienie milowe' },
    createElement('h2', null, 'Kamienie milowe'),
    milestoneProjectFilterForm(filter.query, filter.projectId),
    filter.projectId
      ? createElement('p', { className: 'admin-milestone-filter-active' }, `Filtr projektu: ${filter.projectId}`)
      : null,
    body,
  );
}

function createMilestoneForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-milestone' },
    createElement('h2', null, 'Nowy kamień milowy'),
    createElement(
      'label',
      { className: 'admin-create-milestone-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'projectId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-milestone-title' },
      'Tytuł',
      createElement('input', {
        type: 'text',
        name: 'title',
        required: true,
        maxLength: 200,
        autoComplete: 'off',
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-milestone-due' },
      'Termin (UTC)',
      createElement('input', {
        type: 'text',
        name: 'dueAt',
        autoComplete: 'off',
        spellCheck: false,
        placeholder: '2026-10-03T08:00:00.000Z',
      }),
    ),
    createElement('p', { className: 'admin-create-milestone-due-note' }, 'Puste pole zostawia kamień bez terminu.'),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-milestone' }, 'Zapisz kamień milowy'),
  );
}

function gardenProjectFilterForm(query: string, projectId: string | null): ReactNode {
  return createElement(
    'form',
    { method: 'get', className: 'admin-garden-filter' },
    createElement(
      'label',
      { className: 'admin-garden-filter-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'gardenProject',
        autoComplete: 'off',
        spellCheck: false,
        defaultValue: query,
      }),
    ),
    createElement('button', { type: 'submit' }, 'Pokaż ogród projektu'),
    projectId ? createElement('a', { href: '/' }, 'Pokaż wszystkie') : null,
  );
}

/** Earlier recorded instant first. The same instant stays in id order. Every garden stays. */
export function compareAdminGardens(
  left: Pick<AdminGardenRow, 'id' | 'createdAt'>,
  right: Pick<AdminGardenRow, 'id' | 'createdAt'>,
): number {
  if (left.createdAt !== right.createdAt) return left.createdAt < right.createdAt ? -1 : 1;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

function gardenListNode(
  gardens: AdminGardenList,
  filter: { query: string; projectId: string | null; invalid: boolean },
): ReactNode {
  let body: ReactNode;
  if (filter.invalid) {
    body = createElement(
      'p',
      { className: 'admin-garden-filter-invalid' },
      'Id projektu jest niepoprawne. Lista ogrodów nie została pobrana.',
    );
  } else if (gardens.status === 'empty') {
    body = createElement('p', null, 'Brak ogrodów do pokazania.');
  } else if (gardens.status === 'forbidden') {
    body = createElement('p', null, 'To konto nie może odczytać listy ogrodów.');
  } else if (gardens.status === 'error') {
    body = createElement('p', null, 'Listy ogrodów nie udało się pobrać. Odśwież stronę.');
  } else {
    body = createElement(
      'ul',
      { className: 'admin-garden-list' },
      ...[...gardens.items].sort(compareAdminGardens).map((garden) =>
        createElement(
          'li',
          { key: garden.id, className: 'admin-garden' },
          createElement(
            'p',
            { className: 'admin-garden-meta' },
            [garden.id, ' · projekt ', garden.projectId, ' · ', adminCreatedAtLabel(garden.createdAt)].join(''),
          ),
        ),
      ),
    );
  }
  return createElement(
    'section',
    { className: 'admin-gardens', 'aria-label': 'Ogrody' },
    createElement('h2', null, 'Ogrody'),
    gardenProjectFilterForm(filter.query, filter.projectId),
    filter.projectId
      ? createElement('p', { className: 'admin-garden-filter-active' }, `Filtr projektu: ${filter.projectId}`)
      : null,
    body,
  );
}

function createGardenForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-garden' },
    createElement('h2', null, 'Nowy ogród'),
    createElement(
      'label',
      { className: 'admin-create-garden-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'projectId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-garden' }, 'Utwórz ogród'),
  );
}

function siteCodes(label: string, findings: readonly AdminSiteFinding[]): string {
  if (findings.length === 0) return `${label}: brak`;
  return `${label}: ${findings.map((item) => item.code).join(', ')}`;
}

function siteProjectFilterForm(query: string, projectId: string | null): ReactNode {
  return createElement(
    'form',
    { method: 'get', className: 'admin-site-filter' },
    createElement(
      'label',
      { className: 'admin-site-filter-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'siteProject',
        autoComplete: 'off',
        spellCheck: false,
        defaultValue: query,
      }),
    ),
    createElement('button', { type: 'submit' }, 'Pokaż teren projektu'),
    projectId ? createElement('a', { href: '/' }, 'Pokaż wszystkie') : null,
  );
}

function siteListNode(
  records: AdminSiteList,
  filter: { query: string; projectId: string | null; invalid: boolean },
): ReactNode {
  let body: ReactNode;
  if (filter.invalid) {
    body = createElement(
      'p',
      { className: 'admin-site-filter-invalid' },
      'Id projektu jest niepoprawne. Lista ustaleń o terenie nie została pobrana.',
    );
  } else if (records.status === 'empty') {
    body = createElement('p', null, 'Brak ustaleń o terenie do pokazania.');
  } else if (records.status === 'forbidden') {
    body = createElement('p', null, 'To konto nie może odczytać ustaleń o terenie.');
  } else if (records.status === 'error') {
    body = createElement('p', null, 'Ustaleń o terenie nie udało się pobrać. Odśwież stronę.');
  } else {
    body = createElement(
      'ul',
      { className: 'admin-site-list' },
      ...records.items.map((record) =>
        createElement(
          'li',
          { key: record.id, className: 'admin-site-record' },
          createElement(
            'p',
            { className: 'admin-site-meta' },
            [
              record.id,
              ' · projekt ',
              record.projectId,
              ' · ',
              adminSiteSourceStageLabel(record.sourceStage),
              ' · ',
              adminCreatedAtLabel(record.createdAt),
            ].join(''),
          ),
          createElement('p', { className: 'admin-site-constraints' }, siteCodes('Ograniczenia', record.constraints)),
          createElement('p', { className: 'admin-site-opportunities' }, siteCodes('Możliwości', record.opportunities)),
        ),
      ),
    );
  }
  return createElement(
    'section',
    { className: 'admin-site', 'aria-label': 'Ustalenia o terenie' },
    createElement('h2', null, 'Ustalenia o terenie'),
    siteProjectFilterForm(filter.query, filter.projectId),
    filter.projectId
      ? createElement('p', { className: 'admin-site-filter-active' }, `Filtr projektu: ${filter.projectId}`)
      : null,
    body,
  );
}

function createSiteObservationForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-site' },
    createElement('h2', null, 'Syntetyczna obserwacja'),
    createElement(
      'p',
      null,
      'Zapisuje jedną znormalizowaną obserwację syntetyczną. Kody liczy Core API. Nie zapisuje wniosku, bliźniaka ani danych logowania.',
    ),
    createElement(
      'label',
      { className: 'admin-create-site-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'projectId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-site-observation' },
      'Id obserwacji',
      createElement('input', {
        type: 'text',
        name: 'observationId',
        required: true,
        minLength: 8,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-site-kind' },
      'Rodzaj',
      createElement(
        'select',
        { name: 'kind', required: true, defaultValue: 'slope' },
        ...SITE_OBSERVATION_KINDS.map((kind) =>
          createElement('option', { key: kind, value: kind }, adminSiteObservationKindLabel(kind)),
        ),
      ),
    ),
    createElement(
      'button',
      { type: 'submit', name: 'intent', value: 'create-site-observation' },
      'Zapisz obserwację',
    ),
  );
}

function decisionKindLabel(kind: DecisionLogKind): string {
  if (kind === 'decision') return 'decyzja';
  if (kind === 'change_order') return 'zmiana zakresu';
  const unreachable: never = kind;
  return unreachable;
}

/** Title only when that milestone is already in the loaded list. A failed read is not “no milestone”. */
export function adminDecisionMilestoneLine(
  relatedMilestoneId: string | null,
  milestones: AdminMilestoneList,
): string {
  if (relatedMilestoneId === null) return 'bez kamienia milowego';
  if (milestones.status === 'error') return 'kamienia milowego nie udało się odczytać';
  if (milestones.status === 'forbidden') return 'to konto nie może odczytać kamieni milowych';
  if (milestones.status !== 'ready') return `kamień poza wczytaną listą: ${relatedMilestoneId}`;
  const match = milestones.items.find((item) => item.id === relatedMilestoneId);
  if (!match) return `kamień poza wczytaną listą: ${relatedMilestoneId}`;
  return `kamień «${match.title}»`;
}

function decisionLogProjectFilterForm(query: string, projectId: string | null): ReactNode {
  return createElement(
    'form',
    { method: 'get', className: 'admin-decision-filter' },
    createElement(
      'label',
      { className: 'admin-decision-filter-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'decisionProject',
        autoComplete: 'off',
        spellCheck: false,
        defaultValue: query,
      }),
    ),
    createElement('button', { type: 'submit' }, 'Pokaż wpisy projektu'),
    projectId ? createElement('a', { href: '/' }, 'Pokaż wszystkie') : null,
  );
}

/** Earlier recorded instant first. The same instant stays in id order. Every entry stays. */
export function compareAdminDecisionLog(
  left: Pick<AdminDecisionLogRow, 'id' | 'createdAt'>,
  right: Pick<AdminDecisionLogRow, 'id' | 'createdAt'>,
): number {
  if (left.createdAt !== right.createdAt) return left.createdAt < right.createdAt ? -1 : 1;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

function decisionLogNode(
  entries: AdminDecisionLogList,
  milestones: AdminMilestoneList,
  filter: { query: string; projectId: string | null; invalid: boolean },
): ReactNode {
  let body: ReactNode;
  if (filter.invalid) {
    body = createElement(
      'p',
      { className: 'admin-decision-filter-invalid' },
      'Id projektu jest niepoprawne. Dziennik decyzji nie został pobrany.',
    );
  } else if (entries.status === 'empty') {
    body = createElement('p', null, 'Brak wpisów w dzienniku decyzji.');
  } else if (entries.status === 'forbidden') {
    body = createElement('p', null, 'To konto nie może odczytać dziennika decyzji.');
  } else if (entries.status === 'error') {
    body = createElement('p', null, 'Dziennika decyzji nie udało się pobrać. Odśwież stronę.');
  } else {
    body = createElement(
      'ul',
      { className: 'admin-decision-log-list' },
      ...[...entries.items].sort(compareAdminDecisionLog).map((entry) =>
        createElement(
          'li',
          { key: entry.id, className: 'admin-decision-log-entry' },
          createElement('p', { className: 'admin-decision-log-summary' }, entry.summary),
          createElement(
            'p',
            { className: 'admin-decision-log-meta' },
            [
              decisionKindLabel(entry.kind),
              ' · projekt ',
              entry.projectId,
              ' · ',
              adminDecisionMilestoneLine(entry.relatedMilestoneId, milestones),
              ' · ',
              adminCreatedAtLabel(entry.createdAt),
            ].join(''),
          ),
          createElement(
            'form',
            { method: 'post', className: 'admin-decision-log-revise' },
            createElement('input', { type: 'hidden', name: 'entryId', value: entry.id }),
            createElement(
              'label',
              { className: 'admin-decision-log-revise-summary' },
              'Poprawiona treść',
              createElement('textarea', {
                name: 'summary',
                required: true,
                maxLength: 2000,
                rows: 3,
                defaultValue: entry.summary,
              }),
            ),
            createElement(
              'button',
              { type: 'submit', name: 'intent', value: 'revise-decision-summary' },
              'Popraw treść',
            ),
          ),
        ),
      ),
    );
  }
  return createElement(
    'section',
    { className: 'admin-decision-log', 'aria-label': 'Dziennik decyzji' },
    createElement('h2', null, 'Dziennik decyzji'),
    decisionLogProjectFilterForm(filter.query, filter.projectId),
    filter.projectId
      ? createElement('p', { className: 'admin-decision-filter-active' }, `Filtr projektu: ${filter.projectId}`)
      : null,
    body,
  );
}

function createDecisionLogForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-decision' },
    createElement('h2', null, 'Nowy wpis'),
    createElement(
      'label',
      { className: 'admin-create-decision-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'projectId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-decision-kind' },
      'Rodzaj',
      createElement(
        'select',
        { name: 'kind', required: true, defaultValue: 'decision' },
        createElement('option', { value: 'decision' }, 'decyzja'),
        createElement('option', { value: 'change_order' }, 'zmiana zakresu'),
      ),
    ),
    createElement(
      'label',
      { className: 'admin-create-decision-summary' },
      'Treść',
      createElement('textarea', {
        name: 'summary',
        required: true,
        maxLength: 2000,
        rows: 3,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-decision-milestone' },
      'Id kamienia milowego',
      createElement('input', {
        type: 'text',
        name: 'relatedMilestoneId',
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-decision-log' }, 'Zapisz wpis'),
  );
}

function createProjectForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-project' },
    createElement('h2', null, 'Nowy projekt'),
    createElement(
      'label',
      { className: 'admin-create-project-id' },
      'Id umowy',
      createElement('input', {
        type: 'text',
        name: 'contractId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-project' }, 'Utwórz projekt'),
  );
}

function fileBytesControls(file: AdminFileRow): ReactNode {
  const hintId = `admin-file-bytes-hint-${file.id}`;
  return createElement(
    'div',
    { className: 'admin-file-bytes' },
    createElement(
      'p',
      { className: 'admin-download-file-bytes' },
      createElement(
        'a',
        { href: `/files/${encodeURIComponent(file.id)}/content` },
        `Pobierz «${file.name}»`,
      ),
    ),
    createElement(
      'form',
      {
        method: 'post',
        encType: 'multipart/form-data',
        className: 'admin-upload-file-bytes',
      },
      createElement('input', { type: 'hidden', name: 'fileId', value: file.id }),
      createElement(
        'label',
        { className: 'admin-upload-file-bytes-input' },
        `Bajty pliku «${file.name}»`,
        createElement('input', {
          type: 'file',
          name: 'bytes',
          required: true,
          'aria-describedby': hintId,
        }),
      ),
      createElement(
        'p',
        { id: hintId, className: 'admin-upload-file-bytes-hint' },
        `Wgrywany plik musi mieć dokładnie ${byteCountLabel(file.sizeBytes)}.`,
      ),
      createElement(
        'button',
        { type: 'submit', name: 'intent', value: 'upload-file-bytes' },
        `Wgraj bajty «${file.name}»`,
      ),
    ),
  );
}

function fileProjectFilterForm(query: string, projectId: string | null): ReactNode {
  return createElement(
    'form',
    { method: 'get', className: 'admin-file-filter' },
    createElement(
      'label',
      { className: 'admin-file-filter-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'fileProject',
        autoComplete: 'off',
        spellCheck: false,
        defaultValue: query,
      }),
    ),
    createElement('button', { type: 'submit' }, 'Pokaż pliki projektu'),
    projectId ? createElement('a', { href: '/' }, 'Pokaż wszystkie') : null,
  );
}

function fileListNode(
  files: AdminFileList,
  filter: { query: string; projectId: string | null; invalid: boolean },
): ReactNode {
  let body: ReactNode;
  if (filter.invalid) {
    body = createElement(
      'p',
      { className: 'admin-file-filter-invalid' },
      'Id projektu jest niepoprawne. Lista plików nie została pobrana.',
    );
  } else if (files.status === 'empty') {
    body = createElement('p', null, 'Brak plików do pokazania.');
  } else if (files.status === 'forbidden') {
    body = createElement('p', null, 'To konto nie może odczytać listy plików.');
  } else if (files.status === 'error') {
    body = createElement('p', null, 'Listy plików nie udało się pobrać. Odśwież stronę.');
  } else {
    body = createElement(
      'ul',
      { className: 'admin-file-list' },
      ...[...files.items].sort(compareAdminFiles).map((file) =>
        createElement(
          'li',
          { key: file.id, className: 'admin-file' },
          createElement(
            'p',
            { className: 'admin-file-meta' },
            [
              file.name,
              ' · projekt ',
              file.projectId,
              ' · ',
              file.mimeType,
              ' · ',
              byteCountLabel(file.sizeBytes),
              ' · ',
              file.visibleToClient ? 'widoczny dla klienta' : 'tylko personel',
              ' · ',
              adminCreatedAtLabel(file.createdAt),
            ].join(''),
          ),
          createElement(
            'form',
            { method: 'post', className: 'admin-file-visibility' },
            createElement('input', { type: 'hidden', name: 'fileId', value: file.id }),
            createElement('input', {
              type: 'hidden',
              name: 'visible',
              value: file.visibleToClient ? 'false' : 'true',
            }),
            createElement(
              'button',
              { type: 'submit', name: 'intent', value: 'set-file-visibility' },
              file.visibleToClient ? 'Ukryj przed klientem' : 'Pokaż klientowi',
            ),
          ),
          createElement(
            'form',
            { method: 'post', className: 'admin-file-name' },
            createElement('input', { type: 'hidden', name: 'fileId', value: file.id }),
            createElement(
              'label',
              { className: 'admin-file-name-field' },
              'Nowa nazwa',
              createElement('input', {
                type: 'text',
                name: 'name',
                required: true,
                maxLength: 255,
                autoComplete: 'off',
                defaultValue: file.name,
              }),
            ),
            createElement(
              'button',
              { type: 'submit', name: 'intent', value: 'revise-file-name' },
              'Popraw nazwę',
            ),
          ),
          fileBytesControls(file),
        ),
      ),
    );
  }
  return createElement(
    'section',
    { className: 'admin-files', 'aria-label': 'Pliki' },
    createElement('h2', null, 'Pliki'),
    fileProjectFilterForm(filter.query, filter.projectId),
    filter.projectId
      ? createElement('p', { className: 'admin-file-filter-active' }, `Filtr projektu: ${filter.projectId}`)
      : null,
    body,
  );
}

function createFileForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-file' },
    createElement('h2', null, 'Utwórz plik'),
    createElement(
      'label',
      { className: 'admin-create-file-project' },
      'Id projektu',
      createElement('input', {
        type: 'text',
        name: 'projectId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-file-name' },
      'Nazwa',
      createElement('input', {
        type: 'text',
        name: 'name',
        required: true,
        autoComplete: 'off',
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-file-mime' },
      'Typ MIME',
      createElement('input', {
        type: 'text',
        name: 'mimeType',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-file-size' },
      'Rozmiar (bajty)',
      createElement('input', {
        type: 'number',
        name: 'sizeBytes',
        required: true,
        min: 1,
        step: 1,
      }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-file' }, 'Utwórz plik'),
  );
}

export function mapCapacityWindowPage(body: unknown): AdminCapacityWindowList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminCapacityWindowRow[] = [];
  for (const item of items) {
    const window = item as {
      id?: unknown;
      actorId?: unknown;
      kind?: unknown;
      startsAt?: unknown;
      endsAt?: unknown;
      closedAt?: unknown;
    };
    if (typeof window.id !== 'string' || typeof window.actorId !== 'string') return { status: 'error' };
    if (window.kind !== 'consultation' && window.kind !== 'start') return { status: 'error' };
    if (typeof window.startsAt !== 'string' || formatUtcInstantPl(window.startsAt) === null) return { status: 'error' };
    if (typeof window.endsAt !== 'string' || formatUtcInstantPl(window.endsAt) === null) return { status: 'error' };
    if (window.closedAt !== null && (typeof window.closedAt !== 'string' || formatUtcInstantPl(window.closedAt) === null)) {
      return { status: 'error' };
    }
    if ('email' in (item as object) || 'name' in (item as object) || 'phone' in (item as object)) {
      return { status: 'error' };
    }
    rows.push({
      id: window.id,
      actorId: window.actorId,
      kind: window.kind,
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      closedAt: window.closedAt,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminCapacityWindows(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminCapacityWindowList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/capacity-windows', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapCapacityWindowPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function createAdminCapacityWindow(input: {
  base: string;
  actorId: string;
  kind: 'consultation' | 'start';
  startsAt: string;
  endsAt: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/capacity-windows', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        actorId: input.actorId,
        kind: input.kind,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      }),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function closeAdminCapacityWindow(input: {
  base: string;
  windowId: string;
  idempotencyKey: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL(`/v1/capacity-windows/${input.windowId}/close`, input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: '{}',
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function decideAdminCapacity(input: {
  base: string;
  kind: 'consultation' | 'start';
  promisedAt: string;
  actorId?: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; decision: AdminCapacityDecision } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
    };
    if (input.cookie) headers.cookie = input.cookie;
    const body: { kind: string; promisedAt: string; actorId?: string } = {
      kind: input.kind,
      promisedAt: input.promisedAt,
    };
    if (input.actorId) body.actorId = input.actorId;
    const response = await fetchImpl(new URL('/v1/capacity-decisions', input.base), {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
    });
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    const decision = await response.json() as { ok?: unknown; reason?: unknown; windowId?: unknown };
    if (decision.ok === true && typeof decision.windowId === 'string') {
      return { ok: true, decision: { ok: true, windowId: decision.windowId } };
    }
    if (
      decision.ok === false
      && (decision.reason === 'CAPACITY_EMPTY' || decision.reason === 'CAPACITY_OUTSIDE' || decision.reason === 'CAPACITY_KIND_MISMATCH')
    ) {
      return { ok: true, decision: { ok: false, reason: decision.reason } };
    }
    return { ok: false, reason: 'error' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export function capacityDecisionMessage(decision: AdminCapacityDecision): string {
  if (decision.ok) return 'Termin mieści się w oknie dyspozycyjności.';
  if (decision.reason === 'CAPACITY_EMPTY') return 'Brak okna dyspozycyjności. Termin nie może być obiecany.';
  if (decision.reason === 'CAPACITY_OUTSIDE') return 'Termin wypada poza dyspozycyjnością.';
  return 'Rodzaj terminu nie pasuje do zapisanych okien.';
}

/** Earlier start first. Same start stays in id order. Closed windows stay. */
export function compareAdminCapacityWindows(
  left: Pick<AdminCapacityWindowRow, 'id' | 'startsAt'>,
  right: Pick<AdminCapacityWindowRow, 'id' | 'startsAt'>,
): number {
  if (left.startsAt !== right.startsAt) return left.startsAt < right.startsAt ? -1 : 1;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

function capacityWindowListNode(windows: AdminCapacityWindowList): ReactNode {
  if (windows.status === 'empty') {
    return createElement('p', null, 'Brak okien dyspozycyjności do pokazania.');
  }
  if (windows.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może odczytać okien dyspozycyjności.');
  }
  if (windows.status === 'error') {
    return createElement('p', null, 'Okien dyspozycyjności nie udało się pobrać. Odśwież stronę.');
  }
  return createElement(
    'section',
    { className: 'admin-capacity-windows', 'aria-label': 'Okna dyspozycyjności' },
    createElement('h2', null, 'Dyspozycyjność'),
    createElement(
      'ul',
      { className: 'admin-capacity-window-list' },
      ...[...windows.items].sort(compareAdminCapacityWindows).map((window) =>
        createElement(
          'li',
          { key: window.id, className: 'admin-capacity-window' },
          createElement(
            'p',
            { className: 'admin-capacity-window-meta' },
            [
              window.kind === 'consultation' ? 'konsultacja' : 'start prac',
              ' · ',
              window.actorId,
              ' · ',
              formatUtcInstantPl(window.startsAt) ?? 'termin nieczytelny',
              ' – ',
              formatUtcInstantPl(window.endsAt) ?? 'termin nieczytelny',
              window.closedAt
                ? ` · zamknięte ${formatUtcInstantPl(window.closedAt) ?? 'termin nieczytelny'}`
                : '',
            ].join(''),
          ),
          window.closedAt
            ? null
            : createElement(
                'form',
                { method: 'post', className: 'admin-close-capacity-window' },
                createElement('input', { type: 'hidden', name: 'capacityWindowId', value: window.id }),
                createElement('button', { type: 'submit', name: 'intent', value: 'close-capacity-window' }, 'Zamknij okno'),
              ),
        ),
      ),
    ),
  );
}

function createCapacityWindowForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-capacity-window' },
    createElement('h2', null, 'Nowe okno dyspozycyjności'),
    createElement('p', null, 'Bez kalendarza zewnętrznego. Identyfikator osoby, nie imię.'),
    createElement('label', null, 'Identyfikator osoby personelu',
      createElement('input', { name: 'capacityActorId', required: true, autoComplete: 'off' }),
    ),
    createElement('label', null, 'Rodzaj',
      createElement('select', { name: 'capacityKind', defaultValue: 'consultation' },
        createElement('option', { value: 'consultation' }, 'konsultacja'),
        createElement('option', { value: 'start' }, 'start prac'),
      ),
    ),
    createElement('label', null, 'Początek (UTC)',
      createElement('input', { name: 'capacityStartsAt', required: true, autoComplete: 'off' }),
    ),
    createElement('label', null, 'Koniec (UTC)',
      createElement('input', { name: 'capacityEndsAt', required: true, autoComplete: 'off' }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'create-capacity-window' }, 'Zapisz okno'),
  );
}

function decideCapacityForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-decide-capacity' },
    createElement('h2', null, 'Sprawdź obiecany termin'),
    createElement('label', null, 'Identyfikator osoby personelu',
      createElement('input', { name: 'capacityActorId', autoComplete: 'off' }),
    ),
    createElement('label', null, 'Rodzaj',
      createElement('select', { name: 'capacityKind', defaultValue: 'consultation' },
        createElement('option', { value: 'consultation' }, 'konsultacja'),
        createElement('option', { value: 'start' }, 'start prac'),
      ),
    ),
    createElement('label', null, 'Termin (UTC)',
      createElement('input', { name: 'capacityPromisedAt', required: true, autoComplete: 'off' }),
    ),
    createElement('button', { type: 'submit', name: 'intent', value: 'decide-capacity' }, 'Sprawdź'),
  );
}

function paymentScheduleListNode(schedules: AdminPaymentScheduleList): ReactNode {
  if (schedules.status === 'empty') {
    return createElement('p', null, 'Brak harmonogramów płatności do pokazania.');
  }
  if (schedules.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może odczytać harmonogramów płatności.');
  }
  if (schedules.status === 'error') {
    return createElement('p', null, 'Harmonogramów płatności nie udało się pobrać. Odśwież stronę.');
  }
  return createElement(
    'section',
    { className: 'admin-payment-schedules', 'aria-label': 'Harmonogramy płatności' },
    createElement('h2', null, 'Harmonogramy płatności'),
    createElement(
      'ul',
      { className: 'admin-payment-schedule-list' },
      ...schedules.items.map((schedule) =>
        createElement(
          'li',
          { key: schedule.id, className: 'admin-payment-schedule' },
          createElement(
            'p',
            { className: 'admin-payment-schedule-meta' },
            [schedule.id, ' · umowa ', schedule.contractId, ' · ', schedule.currency].join(''),
          ),
          createElement(
            'ul',
            { className: 'admin-payment-installment-list' },
            ...schedule.installments.map((line) =>
              createElement(
                'li',
                { key: line.id, className: 'admin-payment-installment' },
                createElement(
                  'p',
                  { className: 'admin-payment-installment-meta' },
                  ['#', String(line.sequence), ' · ', String(line.amountMinor), ' · ', line.status].join(''),
                ),
                line.status === 'scheduled'
                  ? createElement(
                      'form',
                      { method: 'post', className: 'admin-payment-installment-transition' },
                      createElement('input', { type: 'hidden', name: 'scheduleId', value: schedule.id }),
                      createElement('input', { type: 'hidden', name: 'installmentId', value: line.id }),
                      createElement('input', { type: 'hidden', name: 'status', value: 'due' }),
                      createElement(
                        'button',
                        { type: 'submit', name: 'intent', value: 'transition-payment-installment' },
                        'Oznacz jako należną',
                      ),
                    )
                  : null,
                line.status === 'due'
                  ? createElement(
                      'form',
                      { method: 'post', className: 'admin-payment-installment-transition' },
                      createElement('input', { type: 'hidden', name: 'scheduleId', value: schedule.id }),
                      createElement('input', { type: 'hidden', name: 'installmentId', value: line.id }),
                      createElement('input', { type: 'hidden', name: 'status', value: 'waived' }),
                      createElement(
                        'button',
                        { type: 'submit', name: 'intent', value: 'transition-payment-installment' },
                        'Zwolnij',
                      ),
                    )
                  : null,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function createPaymentScheduleForm(): ReactNode {
  return createElement(
    'form',
    { method: 'post', className: 'admin-create-payment-schedule' },
    createElement('h2', null, 'Nowy harmonogram płatności'),
    createElement(
      'label',
      { className: 'admin-create-payment-contract' },
      'Id umowy',
      createElement('input', {
        type: 'text',
        name: 'contractId',
        required: true,
        autoComplete: 'off',
        spellCheck: false,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-payment-first' },
      'Kwota 1 (grosze)',
      createElement('input', {
        type: 'number',
        name: 'amountMinorFirst',
        required: true,
        min: 1,
        step: 1,
      }),
    ),
    createElement(
      'label',
      { className: 'admin-create-payment-second' },
      'Kwota 2 (grosze)',
      createElement('input', {
        type: 'number',
        name: 'amountMinorSecond',
        required: true,
        min: 1,
        step: 1,
      }),
    ),
    createElement(
      'button',
      { type: 'submit', name: 'intent', value: 'create-payment-schedule' },
      'Utwórz harmonogram',
    ),
  );
}

function signingSandboxNode(sandbox: AdminSigningSandbox): ReactNode {
  const statusText = sandbox.status === 'ready'
    ? (sandbox.envelopeStatus === 'completed' ? 'Koperta sandbox zakończona' : 'Koperta sandbox oczekuje')
    : sandbox.status === 'empty'
      ? 'Brak koperty sandbox dla tej umowy.'
      : sandbox.status === 'forbidden'
        ? 'To konto nie może odczytać koperty sandbox.'
        : 'Koperty sandbox nie udało się pobrać. Odśwież stronę.';
  return createElement(
    'section',
    { className: 'admin-signing-sandbox', 'aria-label': 'Koperta sandbox' },
    createElement('h2', null, 'Koperta sandbox'),
    createElement('p', { className: 'admin-signing-sandbox-status' }, statusText),
    createElement(
      'form',
      { method: 'post', className: 'admin-open-signing-sandbox' },
      createElement(
        'label',
        { className: 'admin-signing-contract' },
        'Id umowy wysłanej',
        createElement('input', {
          type: 'text',
          name: 'contractId',
          required: true,
          autoComplete: 'off',
          spellCheck: false,
        }),
      ),
      createElement('button', { type: 'submit', name: 'intent', value: 'open-signing-sandbox' }, 'Otwórz kopertę sandbox'),
    ),
  );
}

/**
 * Staff shell. Signed-in shows real Core API CRM states — never invented rows.
 * Payment schedule is provider-neutral. Signing sandbox is local Documenso only.
 * Proposals are synthetic Agnieszka review actions over the domain Fabric.
 */
export function adminShell(home: AdminHome): ReactNode {
  if (home.state === 'signed-out') {
    return createElement(
      'main',
      { className: 'admin' },
      createElement('p', { className: 'admin-brand' }, 'Forma Zieleni'),
      createElement('h1', null, 'Panel personelu'),
      createElement('p', null, 'Zaloguj się, aby kontynuować pracę operacyjną.'),
    );
  }
  if (home.state === 'unauthorized') {
    return createElement(
      'main',
      { className: 'admin' },
      createElement('p', { className: 'admin-brand' }, 'Forma Zieleni'),
      createElement('h1', null, 'Panel personelu'),
      createElement('p', null, 'To konto nie ma dostępu do panelu personelu.'),
    );
  }
  return createElement(
    'main',
    { className: 'admin' },
    createElement('p', { className: 'admin-brand' }, 'Forma Zieleni'),
    createElement('h1', null, 'Panel personelu'),
    createElement('p', null, 'Jesteś zalogowany.'),
    proposalListNode(home.proposals),
    leadListNode(home.leads),
    opportunityListNode(home.opportunities),
    createOpportunityForm(),
    offerListNode(home.offers, home.contracts),
    createOfferForm(),
    contractListNode(home.contracts, home.projects),
    createContractForm(),
    paymentScheduleListNode(home.paymentSchedules),
    createPaymentScheduleForm(),
    capacityWindowListNode(home.capacityWindows),
    createCapacityWindowForm(),
    decideCapacityForm(),
    signingSandboxNode(home.signingSandbox),
    projectListNode(home.projects, home.milestones, home.gardens, home.siteIntelligence),
    createProjectForm(),
    milestoneListNode(home.milestones, {
      query: home.milestoneProjectQuery ?? '',
      projectId: home.milestoneProjectId ?? null,
      invalid: home.milestoneFilterInvalid === true,
    }),
    createMilestoneForm(),
    gardenListNode(home.gardens, {
      query: home.gardenProjectQuery ?? '',
      projectId: home.gardenProjectId ?? null,
      invalid: home.gardenFilterInvalid === true,
    }),
    createGardenForm(),
    siteListNode(home.siteIntelligence, {
      query: home.siteProjectQuery ?? '',
      projectId: home.siteProjectId ?? null,
      invalid: home.siteFilterInvalid === true,
    }),
    createSiteObservationForm(),
    decisionLogNode(home.decisionLog, home.milestones, {
      query: home.decisionProjectQuery ?? '',
      projectId: home.decisionProjectId ?? null,
      invalid: home.decisionFilterInvalid === true,
    }),
    createDecisionLogForm(),
    fileListNode(home.files, {
      query: home.fileProjectQuery ?? '',
      projectId: home.fileProjectId ?? null,
      invalid: home.fileFilterInvalid === true,
    }),
    createFileForm(),
  );
}
