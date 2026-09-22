import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { ReactNode } from 'react';
import type { Route } from './+types/root';
import { portalErrorMessage } from './shell.ts';
import './tokens.css';

export function meta() {
  return [
    { title: 'Portal klienta — Forma Zieleni' },
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: 'Portal klienta Forma Zieleni.' },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : null;
  return (
    <main className="portal">
      <p className="portal-brand">Forma Zieleni</p>
      <h1>Portal klienta</h1>
      <p>{portalErrorMessage(status)}</p>
    </main>
  );
}
