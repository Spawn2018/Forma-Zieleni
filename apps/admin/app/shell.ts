import { createElement, type ReactNode } from 'react';

export type AdminSessionActor = {
  clientId: string;
};

export type AdminHome =
  | { state: 'signed-out' }
  | { state: 'unauthorized' }
  | { state: 'signed-in' };

/**
 * Admin trust-zone session classification.
 * Core API remains the identity authority; Admin never invents CRM writes or client facts.
 */
export function classifyAdminSession(actor: AdminSessionActor | null): AdminHome {
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

/**
 * Resolve admin home from optional Core API session probe.
 * Unconfigured probe → signed-out (truthful). Never invents leads/offers/projects.
 */
export async function resolveAdminHome(input: {
  probe?: () => Promise<AdminSessionActor | null>;
}): Promise<AdminHome> {
  if (!input.probe) return { state: 'signed-out' };
  try {
    return classifyAdminSession(await input.probe());
  } catch {
    return { state: 'signed-out' };
  }
}

export function adminErrorMessage(status: number | null): string {
  if (status === 404) return 'Nie ma takiej strony.';
  return 'Tej strony nie udało się wyświetlić. Odśwież stronę.';
}

/**
 * Staff shell only. Signed-in is an empty authenticated shell — no CRM mutations or invented rows.
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
    createElement('p', null, 'Jesteś zalogowany. Operacje CRM pojawią się tutaj, gdy będą dostępne.'),
  );
}
