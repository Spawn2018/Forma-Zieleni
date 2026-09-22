import type { Route } from './+types/home';
import { portalShell, type PortalHome } from '../shell.ts';

export function loader(): PortalHome {
  return { state: 'signed-out' };
}

export function meta() {
  return [
    { title: 'Portal klienta — Forma Zieleni' },
    { name: 'robots', content: 'noindex, nofollow' },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return portalShell(loaderData);
}
