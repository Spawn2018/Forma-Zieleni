import { createElement, type ReactNode } from 'react';

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

export type AdminOfferRow = {
  id: string;
  opportunityId: string;
  status: string;
};

export type AdminOfferList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminOfferRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminContractRow = {
  id: string;
  offerId: string;
  status: string;
};

export type AdminContractList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminContractRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminProjectRow = {
  id: string;
  contractId: string;
  status: string;
};

export type AdminProjectList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminProjectRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminHome =
  | { state: 'signed-out' }
  | { state: 'unauthorized' }
  | {
      state: 'signed-in';
      leads: AdminLeadList;
      offers: AdminOfferList;
      contracts: AdminContractList;
      projects: AdminProjectList;
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

type OfferApiItem = {
  id?: unknown;
  opportunityId?: unknown;
  status?: unknown;
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
    if (typeof offer.status !== 'string') return { status: 'error' };
    if (Object.hasOwn(offer, 'price')) return { status: 'error' };
    rows.push({
      id: offer.id,
      opportunityId: offer.opportunityId,
      status: offer.status,
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
    if (typeof contract.status !== 'string') return { status: 'error' };
    rows.push({
      id: contract.id,
      offerId: contract.offerId,
      status: contract.status,
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

type ProjectApiItem = {
  id?: unknown;
  contractId?: unknown;
  status?: unknown;
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
    if (typeof project.status !== 'string') return { status: 'error' };
    rows.push({
      id: project.id,
      contractId: project.contractId,
      status: project.status,
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

/**
 * Resolve admin home from optional Core API session probe + CRM lists.
 * Unconfigured probe → signed-out (truthful). Never invents CRM rows.
 */
export async function resolveAdminHome(input: {
  probe?: () => Promise<AdminSessionActor | null>;
  loadLeads?: () => Promise<AdminLeadList>;
  loadOffers?: () => Promise<AdminOfferList>;
  loadContracts?: () => Promise<AdminContractList>;
  loadProjects?: () => Promise<AdminProjectList>;
}): Promise<AdminHome> {
  if (!input.probe) return { state: 'signed-out' };
  try {
    const classified = classifyAdminSession(await input.probe());
    if (classified.state !== 'signed-in') return classified;
    const leads = input.loadLeads ? await input.loadLeads() : { status: 'empty' as const };
    const offers = input.loadOffers ? await input.loadOffers() : { status: 'empty' as const };
    const contracts = input.loadContracts ? await input.loadContracts() : { status: 'empty' as const };
    const projects = input.loadProjects ? await input.loadProjects() : { status: 'empty' as const };
    return { state: 'signed-in', leads, offers, contracts, projects };
  } catch {
    return { state: 'signed-out' };
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

function offerListNode(offers: AdminOfferList): ReactNode {
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
            [offer.id, ' · szansa ', offer.opportunityId, ' · ', offer.status].join(''),
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

function contractListNode(contracts: AdminContractList): ReactNode {
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
      ...contracts.items.map((contract) =>
        createElement(
          'li',
          { key: contract.id, className: 'admin-contract' },
          createElement(
            'p',
            { className: 'admin-contract-meta' },
            [contract.id, ' · oferta ', contract.offerId, ' · ', contract.status].join(''),
          ),
        ),
      ),
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

function projectListNode(projects: AdminProjectList): ReactNode {
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
            [project.id, ' · umowa ', project.contractId, ' · ', project.status].join(''),
          ),
        ),
      ),
    ),
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

/**
 * Staff shell. Signed-in shows real Core API CRM states — never invented rows.
 * No signing ceremony and no payment UI.
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
    leadListNode(home.leads),
    offerListNode(home.offers),
    createOfferForm(),
    contractListNode(home.contracts),
    createContractForm(),
    projectListNode(home.projects),
    createProjectForm(),
  );
}
