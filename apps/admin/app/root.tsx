import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { ReactNode } from 'react';
import type { Route } from './+types/root';
import { adminErrorMessage } from './shell.ts';
import './tokens.css';

export function meta() {
  return [
    { title: 'Panel personelu — Forma Zieleni' },
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: 'Panel personelu Forma Zieleni.' },
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
    <main className="admin">
      <p className="admin-brand">Forma Zieleni</p>
      <h1>Panel personelu</h1>
      <p>{adminErrorMessage(status)}</p>
    </main>
  );
}
