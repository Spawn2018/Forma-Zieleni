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

export type PortalHome =
  | { state: 'signed-out' }
  | { state: 'unauthorized' }
  | { state: 'signed-in'; offers: PortalOfferList };

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

export async function fetchPortalOffers(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<PortalOfferList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/portal/offers?limit=50', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapPortalOfferPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

/**
 * Resolve portal home from optional Core API session probe + offer list.
 * Unconfigured probe → signed-out (truthful). Never invents offers/projects/files.
 */
export async function resolvePortalHome(input: {
  probe?: () => Promise<PortalSessionActor | null>;
  loadOffers?: () => Promise<PortalOfferList>;
}): Promise<PortalHome> {
  if (!input.probe) return { state: 'signed-out' };
  try {
    const classified = classifyPortalSession(await input.probe());
    if (classified.state !== 'signed-in') return classified;
    const offers = input.loadOffers ? await input.loadOffers() : { status: 'empty' as const };
    return { state: 'signed-in', offers };
  } catch {
    return { state: 'signed-out' };
  }
}

export function portalErrorMessage(status: number | null): string {
  if (status === 404) return 'Nie ma takiej strony.';
  return 'Tej strony nie udało się wyświetlić. Odśwież stronę.';
}

function offerListNode(offers: PortalOfferList): ReactNode {
  if (offers.status === 'empty') {
    return createElement('p', null, 'Brak pozycji do pokazania.');
  }
  if (offers.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może odczytać listy pozycji.');
  }
  if (offers.status === 'error') {
    return createElement('p', null, 'Listy nie udało się pobrać. Odśwież stronę.');
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

/**
 * Portal gate UI. Signed-in renders client-safe offer projections only —
 * no price, terms, staff mutation, or invented rows.
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
  );
}
