import { createElement, type ReactNode } from 'react';

export type PortalSessionActor = {
  clientId: string;
};

export type PortalOfferRow = {
  id: string;
  opportunityId: string;
  status: string;
  createdAt: string;
};

export type PortalOfferList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalOfferRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type PortalContractRow = {
  id: string;
  offerId: string;
  status: string;
  createdAt: string;
};

export type PortalContractList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly PortalContractRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type PortalProjectRow = {
  id: string;
  contractId: string;
  status: string;
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

/** Files already loaded for one project, in list order. */
export function portalProjectFiles(
  projectId: string,
  files: readonly PortalFileRow[],
): PortalFileRow[] {
  return files.filter((file) => file.projectId === projectId);
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

/** Earliest open milestone for one project. Done rows and other projects are skipped. */
export function nextOpenPortalMilestone(
  projectId: string,
  milestones: readonly PortalMilestoneRow[],
): PortalMilestoneRow | null {
  const open = milestones.filter((item) => item.projectId === projectId && item.status !== 'done');
  open.sort((left, right) => {
    if (left.dueAt === right.dueAt) {
      if (left.id === right.id) return 0;
      return left.id < right.id ? -1 : 1;
    }
    if (left.dueAt === null) return 1;
    if (right.dueAt === null) return -1;
    return left.dueAt < right.dueAt ? -1 : 1;
  });
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
    if (typeof offer.status !== 'string' || typeof offer.createdAt !== 'string') return { status: 'error' };
    if (Object.hasOwn(offer, 'price') || Object.hasOwn(offer, 'terms') || Object.hasOwn(offer, 'amount')) {
      return { status: 'error' };
    }
    rows.push({
      id: offer.id,
      opportunityId: offer.opportunityId,
      status: offer.status,
      createdAt: offer.createdAt,
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
    if (typeof contract.id !== 'string' || typeof contract.offerId !== 'string') return { status: 'error' };
    if (typeof contract.status !== 'string' || typeof contract.createdAt !== 'string') return { status: 'error' };
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
      createdAt: contract.createdAt,
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
    if (typeof project.id !== 'string' || typeof project.contractId !== 'string') return { status: 'error' };
    if (typeof project.status !== 'string' || typeof project.createdAt !== 'string') return { status: 'error' };
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
      createdAt: project.createdAt,
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
    if (typeof file.id !== 'string' || typeof file.projectId !== 'string') return { status: 'error' };
    if (typeof file.name !== 'string' || typeof file.mimeType !== 'string') return { status: 'error' };
    if (typeof file.sizeBytes !== 'number' || !Number.isFinite(file.sizeBytes)) return { status: 'error' };
    if (typeof file.createdAt !== 'string') return { status: 'error' };
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
      createdAt: file.createdAt,
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
    if (typeof garden.createdAt !== 'string') return { status: 'error' };
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
      createdAt: garden.createdAt,
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
    if (typeof record.createdAt !== 'string' || !Array.isArray(record.observationIds)) return { status: 'error' };
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
      createdAt: record.createdAt,
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
    if (typeof milestone.id !== 'string' || typeof milestone.projectId !== 'string') return { status: 'error' };
    if (typeof milestone.title !== 'string' || typeof milestone.createdAt !== 'string') return { status: 'error' };
    if (!isPortalMilestoneStatus(milestone.status)) return { status: 'error' };
    if (!Object.hasOwn(milestone, 'dueAt')) return { status: 'error' };
    if (milestone.dueAt !== null && typeof milestone.dueAt !== 'string') return { status: 'error' };
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

function offerListNode(offers: PortalOfferList): ReactNode {
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
            [offer.id, ' · ', offer.status, ' · ', offer.createdAt].join(''),
          ),
        ),
      ),
    ),
  );
}

function contractListNode(contracts: PortalContractList): ReactNode {
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
            [contract.id, ' · ', contract.status, ' · ', contract.createdAt].join(''),
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
  return ['Następny: ', next.title, ' · ', milestoneStatusLabel(next.status), ' · ', next.dueAt ?? 'bez terminu'].join('');
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
            [project.id, ' · ', project.status, ' · ', project.createdAt].join(''),
          ),
          createElement(
            'p',
            { className: 'portal-project-next' },
            projectNextMilestoneLine(project.id, milestones),
          ),
          projectFileNodes(project.id, files),
        ),
      ),
    ),
  );
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
      ...gardens.items.map((garden) =>
        createElement(
          'li',
          { key: garden.id, className: 'portal-garden' },
          createElement(
            'p',
            { className: 'portal-garden-meta' },
            [garden.id, ' · ', garden.projectId, ' · ', garden.createdAt].join(''),
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
            [record.id, ' · ', record.projectId, ' · ', record.createdAt].join(''),
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
      ...milestones.items.map((milestone) =>
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
              milestone.dueAt ?? 'bez terminu',
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
      ...files.items.map((file) =>
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
              String(file.sizeBytes),
              ' B · ',
              file.createdAt,
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
    offerListNode(home.offers),
    contractListNode(home.contracts),
    projectListNode(home.projects, home.milestones, home.files),
    fileListNode(home.files),
    gardenListNode(home.gardens),
    siteListNode(home.siteIntelligence),
    milestoneListNode(home.milestones),
  );
}
