import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { ReactNode } from 'react';
import type { Route } from './+types/root';
import { publicErrorMessage } from './shell.ts';
import './tokens.css';

export function meta({ error, matches }: Route.MetaArgs) {
  if (!error || matches.some((match) => match?.id && match.id !== 'root')) return [];
  const status = isRouteErrorResponse(error) ? error.status : null;
  return [{ title: status === 404 ? 'Nie ma takiej strony' : 'Forma Zieleni' }];
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
    <main className="site">
      <h1>Forma Zieleni</h1>
      <p>{publicErrorMessage(status)}</p>
    </main>
  );
}
