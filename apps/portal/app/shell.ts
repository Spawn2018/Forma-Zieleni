import { createElement, type ReactNode } from 'react';

export type PortalSessionActor = {
  clientId: string;
};

export type PortalOfferStatus = 'draft';

export type PortalOfferRow = {
  id: string;
  opportunityId: string;
  status: PortalOfferStatus;
  createdAt: string;
};

export type PortalOfferList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalOfferRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type PortalContractStatus = 'draft' | 'internal_review' | 'approved' | 'sent';

export type PortalContractRow = {
  id: string;
  offerId: string;
  status: PortalContractStatus;
  createdAt: string;
};

export type PortalContractList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalContractRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type PortalProjectStatus = 'planned' | 'delivered';

export type PortalProjectRow = {
  id: string;
  contractId: string;
  status: PortalProjectStatus;
  createdAt: string;
};

export type PortalProjectList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalProjectRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type PortalFileRow = {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type PortalFileList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalFileRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

/** Name order, Polish collation, numbers in numeric order. Same name stays in id order. */
export function comparePortalFiles(
  left: Pick<PortalFileRow, 'id' | 'name'>,
  right: Pick<PortalFileRow, 'id' | 'name'>,
): number {
  const byName = left.name.localeCompare(right.name, 'pl', { numeric: true, sensitivity: 'variant' });
  if (byName !== 0) return byName;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

/** Files already loaded for one project, in name order. */
export function portalProjectFiles(
  projectId: string,
  files: readonly PortalFileRow[],
): PortalFileRow[] {
  return files.filter((file) => file.projectId === projectId).sort(comparePortalFiles);
}

export type PortalGardenRow = {
  id: string;
  projectId: string;
  createdAt: string;
};

export type PortalGardenList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalGardenRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

/** The garden already loaded for one project, or null. */
export function portalProjectGarden(
  projectId: string,
  gardens: readonly PortalGardenRow[],
): PortalGardenRow | null {
  return gardens.find((garden) => garden.projectId === projectId) ?? null;
}

/** The site record already loaded for one project, or null. */
export function portalProjectSite(
  projectId: string,
  records: readonly PortalSiteRow[],
): PortalSiteRow | null {
  return records.find((record) => record.projectId === projectId) ?? null;
}

export type PortalSiteFinding = {
  id: string;
  code: string;
};

export type PortalSiteRow = {
  id: string;
  projectId: string;
  observationIds: readonly string[];
  constraints: readonly PortalSiteFinding[];
  opportunities: readonly PortalSiteFinding[];
  createdAt: string;
};

export type PortalSiteList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalSiteRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type PortalMilestoneStatus = 'planned' | 'active' | 'done';

export type PortalMilestoneRow = {
  id: string;
  projectId: string;
  title: string;
  status: PortalMilestoneStatus;
  dueAt: string | null;
  createdAt: string;
};

export type PortalMilestoneList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalMilestoneRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

/** Earlier due first. No due last. Same due stays in id order. Done rows are not removed. */
export function comparePortalMilestones(
  left: Pick<PortalMilestoneRow, 'id' | 'dueAt'>,
  right: Pick<PortalMilestoneRow, 'id' | 'dueAt'>,
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

/** Earliest open milestone for one project. Done rows and other projects are skipped. */
export function nextOpenPortalMilestone(
  projectId: string,
  milestones: readonly PortalMilestoneRow[],
): PortalMilestoneRow | null {
  const open = milestones.filter((item) => item.projectId === projectId && item.status !== 'done');
  open.sort(comparePortalMilestones);
  return open[0] ?? null;
}

export type PortalHome =
  | { state: 'signed-out' }
  | { state: 'unauthorized' }
  | {
      state: 'signed-in';
      offers: PortalOfferList;
      contracts: PortalContractList;
      projects: PortalProjectList;
      files: PortalFileList;
      gardens: PortalGardenList;
      siteIntelligence: PortalSiteList;
      milestones: PortalMilestoneList;
    };

/**
 * Portal trust-zone session classification.
 * Core API remains the identity authority; Portal never invents client CRM facts.
 */
export function classifyPortalSession(
  actor: PortalSessionActor | null,
): Exclude<PortalHome, { state: 'signed-in' }> | { state: 'signed-in' } {
  if (!actor) return { state: 'signed-out' };
  if (actor.clientId !== 'portal') return { state: 'unauthorized' };
  return { state: 'signed-in' };
}

/** Cookie / Origin rules for the portal trust zone (Better Auth session cookie). */
export function portalOriginAllowed(
  origin: string | null | undefined,
  trustedOrigins: readonly string[],
): boolean {
  if (!origin) return false;
  return trustedOrigins.includes(origin);
}

export function portalSessionCookiePresent(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(';').some((part) => part.trim().startsWith('better-auth.session_token='));
}

type OfferApiItem = {
  id?: unknown;
  opportunityId?: unknown;
  status?: unknown;
  createdAt?: unknown;
  price?: unknown;
  terms?: unknown;
  amount?: unknown;
};

export function mapPortalOfferPage(body: unknown): PortalOfferList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: PortalOfferRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const offer = item as OfferApiItem;
    if (typeof offer.id !== 'string' || typeof offer.opportunityId !== 'string') return { status: 'error' };
    const createdAt = requirePortalCreatedAt(offer.createdAt);
    if (typeof offer.status !== 'string' || !isPortalOfferStatus(offer.status) || createdAt === null) {
      return { status: 'error' };
    }
    if (Object.hasOwn(offer, 'price') || Object.hasOwn(offer, 'terms') || Object.hasOwn(offer, 'amount')) {
      return { status: 'error' };
    }
    rows.push({
      id: offer.id,
      opportunityId: offer.opportunityId,
      status: offer.status,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

type ContractApiItem = {
  id?: unknown;
  offerId?: unknown;
  status?: unknown;
  createdAt?: unknown;
  amount?: unknown;
  payment?: unknown;
  signing?: unknown;
  qes?: unknown;
  provider?: unknown;
  clientSubject?: unknown;
  updatedAt?: unknown;
};

export function mapPortalContractPage(body: unknown): PortalContractList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: PortalContractRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const contract = item as ContractApiItem;
    if (typeof contract.id !== 'string' || typeof contract.offerId !== 'string' || !contract.offerId.trim()) {
      return { status: 'error' };
    }
    const createdAt = requirePortalCreatedAt(contract.createdAt);
    if (typeof contract.status !== 'string' || !isPortalContractStatus(contract.status) || createdAt === null) {
      return { status: 'error' };
    }
    if (
      Object.hasOwn(contract, 'amount')
      || Object.hasOwn(contract, 'payment')
      || Object.hasOwn(contract, 'signing')
      || Object.hasOwn(contract, 'qes')
      || Object.hasOwn(contract, 'provider')
      || Object.hasOwn(contract, 'clientSubject')
      || Object.hasOwn(contract, 'updatedAt')
    ) {
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

type ProjectApiItem = {
  id?: unknown;
  contractId?: unknown;
  status?: unknown;
  createdAt?: unknown;
  payment?: unknown;
  clientSubject?: unknown;
  provider?: unknown;
};

export function mapPortalProjectPage(body: unknown): PortalProjectList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: PortalProjectRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const project = item as ProjectApiItem;
    if (typeof project.id !== 'string' || typeof project.contractId !== 'string' || !project.contractId.trim()) {
      return { status: 'error' };
    }
    const createdAt = requirePortalCreatedAt(project.createdAt);
    if (typeof project.status !== 'string' || !isPortalProjectStatus(project.status) || createdAt === null) {
      return { status: 'error' };
    }
    if (
      Object.hasOwn(project, 'payment')
      || Object.hasOwn(project, 'clientSubject')
      || Object.hasOwn(project, 'provider')
    ) {
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

type FileApiItem = {
  id?: unknown;
  projectId?: unknown;
  name?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
  createdAt?: unknown;
  storageKey?: unknown;
  bytes?: unknown;
  downloadUrl?: unknown;
  clientSubject?: unknown;
};

export function mapPortalFilePage(body: unknown): PortalFileList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: PortalFileRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const file = item as FileApiItem;
    if (typeof file.id !== 'string' || typeof file.projectId !== 'string' || !file.projectId.trim()) {
      return { status: 'error' };
    }
    if (typeof file.name !== 'string' || typeof file.mimeType !== 'string') return { status: 'error' };
    if (typeof file.sizeBytes !== 'number' || !Number.isFinite(file.sizeBytes)) return { status: 'error' };
    const createdAt = requirePortalCreatedAt(file.createdAt);
    if (createdAt === null) return { status: 'error' };
    if (
      Object.hasOwn(file, 'storageKey')
      || Object.hasOwn(file, 'bytes')
      || Object.hasOwn(file, 'downloadUrl')
      || Object.hasOwn(file, 'clientSubject')
    ) {
      return { status: 'error' };
    }
    rows.push({
      id: file.id,
      projectId: file.projectId,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

type GardenApiItem = {
  id?: unknown;
  projectId?: unknown;
  createdAt?: unknown;
  clientSubject?: unknown;
  updatedAt?: unknown;
  twinDatabase?: unknown;
  liveGarden?: unknown;
  sensorFeed?: unknown;
  plants?: unknown;
  xr?: unknown;
  advice?: unknown;
};

export function mapPortalGardenPage(body: unknown): PortalGardenList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: PortalGardenRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const garden = item as GardenApiItem;
    if (typeof garden.id !== 'string' || typeof garden.projectId !== 'string') return { status: 'error' };
    const createdAt = requirePortalCreatedAt(garden.createdAt);
    if (createdAt === null) return { status: 'error' };
    if (
      Object.hasOwn(garden, 'clientSubject')
      || Object.hasOwn(garden, 'updatedAt')
      || Object.hasOwn(garden, 'twinDatabase')
      || Object.hasOwn(garden, 'liveGarden')
      || Object.hasOwn(garden, 'sensorFeed')
      || Object.hasOwn(garden, 'plants')
      || Object.hasOwn(garden, 'xr')
      || Object.hasOwn(garden, 'advice')
    ) {
      return { status: 'error' };
    }
    rows.push({
      id: garden.id,
      projectId: garden.projectId,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

const SITE_FORBIDDEN = [
  'clientSubject',
  'updatedAt',
  'twinDatabase',
  'aiConclusion',
  'thirdPartyCredentials',
  'geoportal',
  'inventedSiteFacts',
] as const;

function mapSiteFindings(value: unknown): PortalSiteFinding[] | null {
  if (!Array.isArray(value)) return null;
  const rows: PortalSiteFinding[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const finding = item as { id?: unknown; code?: unknown };
    if (typeof finding.id !== 'string' || typeof finding.code !== 'string') return null;
    if (Object.keys(finding).some((key) => key !== 'id' && key !== 'code')) return null;
    rows.push({ id: finding.id, code: finding.code });
  }
  return rows;
}

export function mapPortalSitePage(body: unknown): PortalSiteList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: PortalSiteRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const record = item as {
      id?: unknown;
      projectId?: unknown;
      observationIds?: unknown;
      constraints?: unknown;
      opportunities?: unknown;
      createdAt?: unknown;
    };
    if (typeof record.id !== 'string' || typeof record.projectId !== 'string') return { status: 'error' };
    const createdAt = requirePortalCreatedAt(record.createdAt);
    if (createdAt === null || !Array.isArray(record.observationIds)) return { status: 'error' };
    if (!record.observationIds.every((entry) => typeof entry === 'string')) return { status: 'error' };
    if (SITE_FORBIDDEN.some((key) => Object.hasOwn(record, key))) return { status: 'error' };
    const constraints = mapSiteFindings(record.constraints);
    const opportunities = mapSiteFindings(record.opportunities);
    if (!constraints || !opportunities) return { status: 'error' };
    rows.push({
      id: record.id,
      projectId: record.projectId,
      observationIds: record.observationIds,
      constraints,
      opportunities,
      createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

const MILESTONE_FORBIDDEN = [
  'clientSubject',
  'updatedAt',
  'payment',
  'signing',
  'price',
  'provider',
] as const;

function isPortalMilestoneStatus(value: unknown): value is PortalMilestoneStatus {
  return value === 'planned' || value === 'active' || value === 'done';
}

export function mapPortalMilestonePage(body: unknown): PortalMilestoneList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: PortalMilestoneRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const milestone = item as {
      id?: unknown;
      projectId?: unknown;
      title?: unknown;
      status?: unknown;
      dueAt?: unknown;
      createdAt?: unknown;
    };
    if (typeof milestone.id !== 'string' || typeof milestone.projectId !== 'string' || !milestone.projectId.trim()) {
      return { status: 'error' };
    }
    if (typeof milestone.title !== 'string' || typeof milestone.createdAt !== 'string') return { status: 'error' };
    if (!isPortalMilestoneStatus(milestone.status)) return { status: 'error' };
    if (!Object.hasOwn(milestone, 'dueAt')) return { status: 'error' };
    if (milestone.dueAt !== null && (typeof milestone.dueAt !== 'string' || formatUtcInstantPl(milestone.dueAt) === null)) {
      return { status: 'error' };
    }
    if (MILESTONE_FORBIDDEN.some((key) => Object.hasOwn(milestone, key))) return { status: 'error' };
    rows.push({
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      status: milestone.status,
      dueAt: milestone.dueAt,
      createdAt: milestone.createdAt,
    });
  }
  return { status: 'ready', items: rows };
}

const PORTAL_OFFER_STATUSES = ['draft'] as const;
const PORTAL_CONTRACT_STATUSES = ['draft', 'internal_review', 'approved', 'sent'] as const;
const PORTAL_PROJECT_STATUSES = ['planned', 'delivered'] as const;

function isPortalOfferStatus(status: string): status is PortalOfferStatus {
  return (PORTAL_OFFER_STATUSES as readonly string[]).includes(status);
}

function isPortalContractStatus(status: string): status is PortalContractStatus {
  return (PORTAL_CONTRACT_STATUSES as readonly string[]).includes(status);
}

function isPortalProjectStatus(status: string): status is PortalProjectStatus {
  return (PORTAL_PROJECT_STATUSES as readonly string[]).includes(status);
}

export function portalOfferStatusLabel(status: PortalOfferStatus): string {
  switch (status) {
    case 'draft':
      return 'szkic';
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export function portalContractStatusLabel(status: PortalContractStatus): string {
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

export function portalProjectStatusLabel(status: PortalProjectStatus): string {
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

/** A recorded instant the portal can read. An unreadable value is not stored on the row. */
export function requirePortalCreatedAt(value: unknown): string | null {
  if (typeof value !== 'string' || formatUtcInstantPl(value) === null) return null;
  return value;
}

/** Polish UTC words for a recorded instant. An unreadable value is not printed raw. */
export function portalCreatedAtLabel(value: string): string {
  return formatUtcInstantPl(value) ?? 'data nieczytelna';
}

/** Null means no due instant. An unreadable instant stays null and is not printed raw. */
export function portalMilestoneDueLabel(dueAt: string | null): string | null {
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

function milestoneStatusLabel(status: PortalMilestoneStatus): string {
  switch (status) {
    case 'planned':
      return 'zaplanowany';
    case 'active':
      return 'w toku';
    case 'done':
      return 'zrobiony';
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

async function portalGetJsonList<T>(input: {
  base: string;
  path: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
  map: (body: unknown) => T;
  forbidden: T;
  error: T;
}): Promise<T> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL(input.path, input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return input.forbidden;
    if (!response.ok) return input.error;
    return input.map(await response.json());
  } catch {
    return input.error;
  }
}

export async function fetchPortalOffers(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalOfferList> {
  return portalGetJsonList({
    ...input,
    path: '/v1/portal/offers?limit=50',
    map: mapPortalOfferPage,
    forbidden: { status: 'forbidden' },
    error: { status: 'error' },
  });
}

export async function fetchPortalContracts(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalContractList> {
  return portalGetJsonList({
    ...input,
    path: '/v1/portal/contracts?limit=50',
    map: mapPortalContractPage,
    forbidden: { status: 'forbidden' },
    error: { status: 'error' },
  });
}

export async function fetchPortalProjects(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalProjectList> {
  return portalGetJsonList({
    ...input,
    path: '/v1/portal/projects?limit=50',
    map: mapPortalProjectPage,
    forbidden: { status: 'forbidden' },
    error: { status: 'error' },
  });
}

export async function fetchPortalGardens(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalGardenList> {
  return portalGetJsonList({
    ...input,
    path: '/v1/portal/gardens?limit=50',
    map: mapPortalGardenPage,
    forbidden: { status: 'forbidden' },
    error: { status: 'error' },
  });
}

export async function fetchPortalSiteIntelligence(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalSiteList> {
  return portalGetJsonList({
    ...input,
    path: '/v1/portal/site-intelligence?limit=50',
    map: mapPortalSitePage,
    forbidden: { status: 'forbidden' },
    error: { status: 'error' },
  });
}

export async function fetchPortalMilestones(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalMilestoneList> {
  return portalGetJsonList({
    ...input,
    path: '/v1/portal/milestones?limit=50',
    map: mapPortalMilestonePage,
    forbidden: { status: 'forbidden' },
    error: { status: 'error' },
  });
}

export async function fetchPortalFiles(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalFileList> {
  return portalGetJsonList({
    ...input,
    path: '/v1/portal/files?limit=50',
    map: mapPortalFilePage,
    forbidden: { status: 'forbidden' },
    error: { status: 'error' },
  });
}

export type PortalFileBytesResult =
  | {
      ok: true;
      bytes: Uint8Array;
      mimeType: string;
      fileName: string;
      checksum: string | null;
      sizeBytes: number;
    }
  | { ok: false; reason: 'forbidden' | 'not_found' | 'error' };

function portalFileIdOk(fileId: string): boolean {
  return /^[a-z][a-z0-9]{15,63}$/.test(fileId);
}

function portalDispositionFileName(header: string | null, fallback: string): string {
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

/** GET the client's own file bytes. A missing file and a foreign file are not_found. */
export async function fetchPortalFileBytes(input: {
  base: string;
  fileId: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalFileBytesResult> {
  if (!portalFileIdOk(input.fileId)) return { ok: false, reason: 'error' };
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: '*/*' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/portal/files/${encodeURIComponent(input.fileId)}/content`, input.base),
      { credentials: 'include', headers },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (response.status === 404) return { ok: false, reason: 'not_found' };
    if (!response.ok) return { ok: false, reason: 'error' };
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.length === 0) return { ok: false, reason: 'error' };
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
    const checksum = response.headers.get('x-content-checksum-sha256');
    return {
      ok: true,
      bytes: buffer,
      mimeType,
      fileName: portalDispositionFileName(response.headers.get('content-disposition'), input.fileId),
      checksum: checksum && /^[0-9a-f]{64}$/i.test(checksum) ? checksum.toLowerCase() : null,
      sizeBytes: buffer.length,
    };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/**
 * Resolve portal home from optional Core API session probe + projections.
 * Unconfigured probe → signed-out (truthful). Never invents offers, contracts, projects, files, gardens, site findings, or milestones.
 */
export async function resolvePortalHome(input: {
  probe?: () => Promise<PortalSessionActor | null>;
  loadOffers?: () => Promise<PortalOfferList>;
  loadContracts?: () => Promise<PortalContractList>;
  loadProjects?: () => Promise<PortalProjectList>;
  loadFiles?: () => Promise<PortalFileList>;
  loadGardens?: () => Promise<PortalGardenList>;
  loadSiteIntelligence?: () => Promise<PortalSiteList>;
  loadMilestones?: () => Promise<PortalMilestoneList>;
}): Promise<PortalHome> {
  if (!input.probe) return { state: 'signed-out' };
  try {
    const classified = classifyPortalSession(await input.probe());
    if (classified.state !== 'signed-in') return classified;
    const [offers, contracts, projects, files, gardens, siteIntelligence, milestones] = await Promise.all([
      input.loadOffers ? input.loadOffers() : Promise.resolve({ status: 'empty' as const }),
      input.loadContracts ? input.loadContracts() : Promise.resolve({ status: 'empty' as const }),
      input.loadProjects ? input.loadProjects() : Promise.resolve({ status: 'empty' as const }),
      input.loadFiles ? input.loadFiles() : Promise.resolve({ status: 'empty' as const }),
      input.loadGardens ? input.loadGardens() : Promise.resolve({ status: 'empty' as const }),
      input.loadSiteIntelligence ? input.loadSiteIntelligence() : Promise.resolve({ status: 'empty' as const }),
      input.loadMilestones ? input.loadMilestones() : Promise.resolve({ status: 'empty' as const }),
    ]);
    return { state: 'signed-in', offers, contracts, projects, files, gardens, siteIntelligence, milestones };
  } catch {
    return { state: 'signed-out' };
  }
}

export function portalErrorMessage(status: number | null): string {
  if (status === 404) return 'Nie ma takiej strony.';
  return 'Tej strony nie udało się wyświetlić. Odśwież stronę.';
}

function listStateNode(
  list: { status: 'empty' | 'ready' | 'error' | 'forbidden' },
  emptyText: string,
  forbiddenText: string,
  errorText: string,
  ready: () => ReactNode,
): ReactNode {
  if (list.status === 'empty') return createElement('p', null, emptyText);
  if (list.status === 'forbidden') return createElement('p', null, forbiddenText);
  if (list.status === 'error') return createElement('p', null, errorText);
  return ready();
}

/** Contracts already loaded for this offer. A failed contract read is not “no contract”. */
export function portalOfferContractLine(offerId: string, contracts: PortalContractList): string {
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

function offerListNode(offers: PortalOfferList, contracts: PortalContractList): ReactNode {
  if (offers.status !== 'ready') {
    return listStateNode(
      offers,
      'Brak pozycji do pokazania.',
      'To konto nie może odczytać listy pozycji.',
      'Listy nie udało się pobrać. Odśwież stronę.',
      () => null,
    );
  }
  return createElement(
    'section',
    { className: 'portal-offers', 'aria-label': 'Twoje pozycje' },
    createElement('h2', null, 'Twoje pozycje'),
    createElement(
      'ul',
      { className: 'portal-offer-list' },
      ...offers.items.map((offer) =>
        createElement(
          'li',
          { key: offer.id, className: 'portal-offer' },
          createElement(
            'p',
            { className: 'portal-offer-meta' },
            [offer.id, ' · ', portalOfferStatusLabel(offer.status), ' · ', portalCreatedAtLabel(offer.createdAt)].join(''),
          ),
          createElement(
            'p',
            { className: 'portal-offer-contract' },
            portalOfferContractLine(offer.id, contracts),
          ),
        ),
      ),
    ),
  );
}

/** Projects already loaded for this contract. A failed project read is not “no project”. */
export function portalContractProjectLine(contractId: string, projects: PortalProjectList): string {
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

function contractListNode(contracts: PortalContractList, projects: PortalProjectList): ReactNode {
  if (contracts.status !== 'ready') {
    return listStateNode(
      contracts,
      'Brak umów do pokazania.',
      'To konto nie może odczytać listy umów.',
      'Listy umów nie udało się pobrać. Odśwież stronę.',
      () => null,
    );
  }
  return createElement(
    'section',
    { className: 'portal-contracts', 'aria-label': 'Twoje umowy' },
    createElement('h2', null, 'Twoje umowy'),
    createElement(
      'ul',
      { className: 'portal-contract-list' },
      ...contracts.items.map((contract) =>
        createElement(
          'li',
          { key: contract.id, className: 'portal-contract' },
          createElement(
            'p',
            { className: 'portal-contract-meta' },
            [contract.id, ' · ', portalContractStatusLabel(contract.status), ' · ', portalCreatedAtLabel(contract.createdAt)].join(''),
          ),
          createElement(
            'p',
            { className: 'portal-contract-project' },
            portalContractProjectLine(contract.id, projects),
          ),
        ),
      ),
    ),
  );
}

function projectNextMilestoneLine(projectId: string, milestones: PortalMilestoneList): string {
  if (milestones.status === 'error') return 'Kamieni milowych nie udało się odczytać.';
  if (milestones.status === 'forbidden') return 'To konto nie może odczytać kamieni milowych.';
  if (milestones.status !== 'ready') return 'Otwarte kamienie milowe: brak';
  const next = nextOpenPortalMilestone(projectId, milestones.items);
  if (!next) return 'Otwarte kamienie milowe: brak';
  return ['Następny: ', next.title, ' · ', milestoneStatusLabel(next.status), ' · ', portalMilestoneDueLabel(next.dueAt) ?? 'termin nieczytelny'].join('');
}

function projectGardenLine(projectId: string, gardens: PortalGardenList): string {
  if (gardens.status === 'error') return 'Ogrodu nie udało się odczytać.';
  if (gardens.status === 'forbidden') return 'To konto nie może odczytać ogrodu.';
  if (gardens.status !== 'ready') return 'Ogród: brak';
  const garden = portalProjectGarden(projectId, gardens.items);
  if (!garden) return 'Ogród: brak';
  return `Ogród: ${garden.id}`;
}

function polishCount(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return `1 ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`;
  return `${count} ${many}`;
}

function projectSiteLine(projectId: string, sites: PortalSiteList): string {
  if (sites.status === 'error') return 'Ustaleń o terenie nie udało się odczytać.';
  if (sites.status === 'forbidden') return 'To konto nie może odczytać ustaleń o terenie.';
  if (sites.status !== 'ready') return 'Teren: brak';
  const record = portalProjectSite(projectId, sites.items);
  if (!record) return 'Teren: brak';
  return [
    'Teren: ',
    polishCount(record.constraints.length, 'ograniczenie', 'ograniczenia', 'ograniczeń'),
    ' · ',
    polishCount(record.opportunities.length, 'możliwość', 'możliwości', 'możliwości'),
  ].join('');
}

function projectFileNodes(projectId: string, files: PortalFileList): ReactNode {
  if (files.status === 'error') {
    return createElement('p', { className: 'portal-project-files' }, 'Listy plików nie udało się pobrać.');
  }
  if (files.status === 'forbidden') {
    return createElement('p', { className: 'portal-project-files' }, 'To konto nie może odczytać listy plików.');
  }
  const matched = files.status === 'ready' ? portalProjectFiles(projectId, files.items) : [];
  if (matched.length === 0) {
    return createElement('p', { className: 'portal-project-files' }, 'Pliki: brak');
  }
  return createElement(
    'ul',
    { className: 'portal-project-files' },
    ...matched.map((file) =>
      createElement(
        'li',
        { key: file.id },
        createElement(
          'a',
          { href: `/files/${encodeURIComponent(file.id)}/content` },
          `Pobierz «${file.name}»`,
        ),
      ),
    ),
  );
}

function projectListNode(
  projects: PortalProjectList,
  milestones: PortalMilestoneList,
  files: PortalFileList,
  gardens: PortalGardenList,
  sites: PortalSiteList,
): ReactNode {
  if (projects.status !== 'ready') {
    return listStateNode(
      projects,
      'Brak projektów do pokazania.',
      'To konto nie może odczytać listy projektów.',
      'Listy projektów nie udało się pobrać. Odśwież stronę.',
      () => null,
    );
  }
  return createElement(
    'section',
    { className: 'portal-projects', 'aria-label': 'Twoje projekty' },
    createElement('h2', null, 'Twoje projekty'),
    createElement(
      'ul',
      { className: 'portal-project-list' },
      ...projects.items.map((project) =>
        createElement(
          'li',
          { key: project.id, className: 'portal-project' },
          createElement(
            'p',
            { className: 'portal-project-meta' },
            [project.id, ' · ', portalProjectStatusLabel(project.status), ' · ', portalCreatedAtLabel(project.createdAt)].join(''),
          ),
          createElement(
            'p',
            { className: 'portal-project-contract' },
            `Umowa: ${project.contractId}`,
          ),
          createElement(
            'p',
            { className: 'portal-project-next' },
            projectNextMilestoneLine(project.id, milestones),
          ),
          createElement(
            'p',
            { className: 'portal-project-garden' },
            projectGardenLine(project.id, gardens),
          ),
          createElement(
            'p',
            { className: 'portal-project-site' },
            projectSiteLine(project.id, sites),
          ),
          projectFileNodes(project.id, files),
        ),
      ),
    ),
  );
}

/** Earlier recorded instant first. The same instant stays in id order. Every garden stays. */
export function comparePortalGardens(
  left: Pick<PortalGardenRow, 'id' | 'createdAt'>,
  right: Pick<PortalGardenRow, 'id' | 'createdAt'>,
): number {
  if (left.createdAt !== right.createdAt) return left.createdAt < right.createdAt ? -1 : 1;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

function gardenListNode(gardens: PortalGardenList): ReactNode {
  if (gardens.status !== 'ready') {
    return listStateNode(
      gardens,
      'Brak ogrodów do pokazania.',
      'To konto nie może odczytać listy ogrodów.',
      'Listy ogrodów nie udało się pobrać. Odśwież stronę.',
      () => null,
    );
  }
  return createElement(
    'section',
    { className: 'portal-gardens', 'aria-label': 'Twoje ogrody' },
    createElement('h2', null, 'Twoje ogrody'),
    createElement(
      'ul',
      { className: 'portal-garden-list' },
      ...[...gardens.items].sort(comparePortalGardens).map((garden) =>
        createElement(
          'li',
          { key: garden.id, className: 'portal-garden' },
          createElement(
            'p',
            { className: 'portal-garden-meta' },
            [garden.id, ' · ', garden.projectId, ' · ', portalCreatedAtLabel(garden.createdAt)].join(''),
          ),
        ),
      ),
    ),
  );
}

function siteListNode(sites: PortalSiteList): ReactNode {
  if (sites.status !== 'ready') {
    return listStateNode(
      sites,
      'Brak ustaleń o terenie do pokazania.',
      'To konto nie może odczytać ustaleń o terenie.',
      'Ustaleń o terenie nie udało się pobrać. Odśwież stronę.',
      () => null,
    );
  }
  return createElement(
    'section',
    { className: 'portal-site', 'aria-label': 'Ustalenia o terenie' },
    createElement('h2', null, 'Teren'),
    createElement(
      'ul',
      { className: 'portal-site-list' },
      ...sites.items.map((record) =>
        createElement(
          'li',
          { key: record.id, className: 'portal-site-record' },
          createElement(
            'p',
            { className: 'portal-site-meta' },
            [record.id, ' · ', record.projectId, ' · ', portalCreatedAtLabel(record.createdAt)].join(''),
          ),
          createElement(
            'p',
            { className: 'portal-site-constraints' },
            record.constraints.length === 0
              ? 'Ograniczenia: brak'
              : ['Ograniczenia: ', record.constraints.map((item) => item.code).join(', ')].join(''),
          ),
          createElement(
            'p',
            { className: 'portal-site-opportunities' },
            record.opportunities.length === 0
              ? 'Możliwości: brak'
              : ['Możliwości: ', record.opportunities.map((item) => item.code).join(', ')].join(''),
          ),
        ),
      ),
    ),
  );
}

function milestoneListNode(milestones: PortalMilestoneList): ReactNode {
  if (milestones.status !== 'ready') {
    return listStateNode(
      milestones,
      'Brak kamieni milowych do pokazania.',
      'To konto nie może odczytać kamieni milowych.',
      'Listy kamieni milowych nie udało się pobrać. Odśwież stronę.',
      () => null,
    );
  }
  return createElement(
    'section',
    { className: 'portal-milestones', 'aria-label': 'Kamienie milowe' },
    createElement('h2', null, 'Kamienie milowe'),
    createElement(
      'ul',
      { className: 'portal-milestone-list' },
      ...[...milestones.items].sort(comparePortalMilestones).map((milestone) =>
        createElement(
          'li',
          { key: milestone.id, className: 'portal-milestone' },
          createElement(
            'p',
            { className: 'portal-milestone-meta' },
            [
              milestone.title,
              ' · ',
              milestoneStatusLabel(milestone.status),
              ' · ',
              portalMilestoneDueLabel(milestone.dueAt) ?? 'termin nieczytelny',
              ' · projekt ',
              milestone.projectId,
            ].join(''),
          ),
        ),
      ),
    ),
  );
}

function fileListNode(files: PortalFileList): ReactNode {
  if (files.status !== 'ready') {
    return listStateNode(
      files,
      'Brak plików do pokazania.',
      'To konto nie może odczytać listy plików.',
      'Listy plików nie udało się pobrać. Odśwież stronę.',
      () => null,
    );
  }
  return createElement(
    'section',
    { className: 'portal-files', 'aria-label': 'Twoje pliki' },
    createElement('h2', null, 'Twoje pliki'),
    createElement(
      'ul',
      { className: 'portal-file-list' },
      ...[...files.items].sort(comparePortalFiles).map((file) =>
        createElement(
          'li',
          { key: file.id, className: 'portal-file' },
          createElement(
            'p',
            { className: 'portal-file-meta' },
            [
              file.name,
              ' · ',
              file.mimeType,
              ' · ',
              byteCountLabel(file.sizeBytes),
              ' · ',
              portalCreatedAtLabel(file.createdAt),
              ' · projekt ',
              file.projectId,
            ].join(''),
          ),
          createElement(
            'p',
            { className: 'portal-download-file' },
            createElement(
              'a',
              { href: `/files/${encodeURIComponent(file.id)}/content` },
              `Pobierz «${file.name}»`,
            ),
          ),
        ),
      ),
    ),
  );
}

/**
 * Portal gate UI. Signed-in renders client-safe offer, contract, project, and file
 * projections — no price, terms, payment, signing, binary write path, staff mutation, or invented rows.
 */
export function portalShell(home: PortalHome): ReactNode {
  if (home.state === 'signed-out') {
    return createElement(
      'main',
      { className: 'portal' },
      createElement('p', { className: 'portal-brand' }, 'Forma Zieleni'),
      createElement('h1', null, 'Portal klienta'),
      createElement('p', null, 'Zaloguj się, aby zobaczyć swoje projekty.'),
    );
  }
  if (home.state === 'unauthorized') {
    return createElement(
      'main',
      { className: 'portal' },
      createElement('p', { className: 'portal-brand' }, 'Forma Zieleni'),
      createElement('h1', null, 'Portal klienta'),
      createElement('p', null, 'To konto nie ma dostępu do portalu klienta.'),
    );
  }
  return createElement(
    'main',
    { className: 'portal' },
    createElement('p', { className: 'portal-brand' }, 'Forma Zieleni'),
    createElement('h1', null, 'Portal klienta'),
    createElement('p', null, 'Jesteś zalogowany.'),
    offerListNode(home.offers, home.contracts),
    contractListNode(home.contracts, home.projects),
    projectListNode(home.projects, home.milestones, home.files, home.gardens, home.siteIntelligence),
    fileListNode(home.files),
    gardenListNode(home.gardens),
    siteListNode(home.siteIntelligence),
    milestoneListNode(home.milestones),
  );
}
