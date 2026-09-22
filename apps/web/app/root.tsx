import { isRouteErrorResponse, Links, Meta, Outlet, redirect, Scripts, ScrollRestoration } from 'react-router';
import type { ReactNode } from 'react';
import type { Route } from './+types/root';
import { publicErrorMessage } from './shell.ts';
import { publicHead, resolvePublicRequest, seoEnv } from './technical-seo.ts';
import './tokens.css';

export function loader({ request }: Route.LoaderArgs) {
  const decision = resolvePublicRequest(new URL(request.url));
  if (decision.status === 301) return redirect(decision.location, 301);
  return null;
}

export function meta({ error, matches }: Route.MetaArgs) {
  if (!error || matches.some((match) => match?.id && match.id !== 'root')) return [];
  const status = isRouteErrorResponse(error) ? error.status : null;
  const sentence = publicErrorMessage(status);
  return publicHead({
    title: status === 404 ? 'Nie ma takiej strony' : 'Forma Zieleni',
    description: sentence,
    path: '/',
    indexable: false,
    env: seoEnv(process.env.FZ_PUBLIC_ENV),
    origin: process.env.FZ_PUBLIC_ORIGIN,
  });
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
