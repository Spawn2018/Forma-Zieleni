import { createElement, type ReactNode } from 'react';

export type PortalSessionActor = {
  clientId: string;
};

export type PortalHome =
  | { state: 'signed-out' }
  | { state: 'unauthorized' }
  | { state: 'signed-in' };

/**
 * Portal trust-zone session classification.
 * Core API remains the identity authority; Portal never invents client CRM facts.
 */
export function classifyPortalSession(actor: PortalSessionActor | null): PortalHome {
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

/**
 * Resolve portal home from optional Core API session probe.
 * Unconfigured probe → signed-out (truthful). Never invents offers/projects/files.
 */
export async function resolvePortalHome(input: {
  probe?: () => Promise<PortalSessionActor | null>;
}): Promise<PortalHome> {
  if (!input.probe) return { state: 'signed-out' };
  try {
    return classifyPortalSession(await input.probe());
  } catch {
    return { state: 'signed-out' };
  }
}

export function portalErrorMessage(status: number | null): string {
  if (status === 404) return 'Nie ma takiej strony.';
  return 'Tej strony nie udało się wyświetlić. Odśwież stronę.';
}

/**
 * Portal gate UI. Signed-in is an empty authenticated shell — no offers/projects/files.
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
    createElement('p', null, 'Jesteś zalogowany. Projekty i oferty pojawią się tutaj, gdy będą dostępne.'),
  );
}
