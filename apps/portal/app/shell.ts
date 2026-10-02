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

export type PortalHome =
  | { state: 'signed-out' }
  | { state: 'unauthorized' }
  | {
      state: 'signed-in';
      offers: PortalOfferList;
      contracts: PortalContractList;
      projects: PortalProjectList;
      files: PortalFileList;
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

/**
 * Resolve portal home from optional Core API session probe + projections.
 * Unconfigured probe → signed-out (truthful). Never invents offers, contracts, projects, or files.
 */
export async function resolvePortalHome(input: {
  probe?: () => Promise<PortalSessionActor | null>;
  loadOffers?: () => Promise<PortalOfferList>;
  loadContracts?: () => Promise<PortalContractList>;
  loadProjects?: () => Promise<PortalProjectList>;
  loadFiles?: () => Promise<PortalFileList>;
}): Promise<PortalHome> {
  if (!input.probe) return { state: 'signed-out' };
  try {
    const classified = classifyPortalSession(await input.probe());
    if (classified.state !== 'signed-in') return classified;
    const [offers, contracts, projects, files] = await Promise.all([
      input.loadOffers ? input.loadOffers() : Promise.resolve({ status: 'empty' as const }),
      input.loadContracts ? input.loadContracts() : Promise.resolve({ status: 'empty' as const }),
      input.loadProjects ? input.loadProjects() : Promise.resolve({ status: 'empty' as const }),
      input.loadFiles ? input.loadFiles() : Promise.resolve({ status: 'empty' as const }),
    ]);
    return { state: 'signed-in', offers, contracts, projects, files };
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

function projectListNode(projects: PortalProjectList): ReactNode {
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
    projectListNode(home.projects),
    fileListNode(home.files),
  );
}
