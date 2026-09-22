import { createElement, type ReactNode } from 'react';

export type PublicHome =
  | { state: 'unconfigured' }
  | { state: 'absent' }
  | { state: 'published'; title: string };

export function publicErrorMessage(status: number | null): string {
  if (status === 404) return 'Nie ma takiej strony.';
  return 'Tej strony nie udało się wyświetlić. Odśwież stronę.';
}

export function homeShell(home: PublicHome): ReactNode {
  const title = home.state === 'published' ? home.title : 'Forma Zieleni';
  const detail =
    home.state === 'published'
      ? null
      : home.state === 'unconfigured'
        ? 'Opublikowana strona nie jest podłączona.'
        : 'Nie ma opublikowanej strony.';
  return createElement('main', { className: 'site' }, createElement('h1', null, title), detail ? createElement('p', null, detail) : null);
}
