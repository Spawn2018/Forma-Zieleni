import { createElement, type ReactNode } from 'react';

export type PortalHome = { state: 'signed-out' };

export function portalErrorMessage(status: number | null): string {
  if (status === 404) return 'Nie ma takiej strony.';
  return 'Tej strony nie udało się wyświetlić. Odśwież stronę.';
}

/**
 * Signed-out portal gate. Never lists projects, offers, files, or payments.
 * Loaders must not invent client data.
 */
export function portalShell(home: PortalHome): ReactNode {
  void home;
  return createElement(
    'main',
    { className: 'portal' },
    createElement('p', { className: 'portal-brand' }, 'Forma Zieleni'),
    createElement('h1', null, 'Portal klienta'),
    createElement('p', null, 'Zaloguj się, aby zobaczyć swoje projekty.'),
  );
}
