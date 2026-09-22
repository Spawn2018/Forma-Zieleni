import type { Route } from './+types/compare';
import { PublicCompare } from '../before-after-view.tsx';
import type { PublicCompareModel } from '../before-after.ts';
import { publicHead, seoEnv } from '../technical-seo.ts';

export async function loader(): Promise<PublicCompareModel> {
  return { state: 'absent' };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const published = loaderData?.state === 'published';
  return publicHead({
    title: 'Porównanie',
    description: published ? 'Porównanie' : 'Nie ma opublikowanego porównania.',
    path: '/porownanie',
    indexable: published,
    env: seoEnv(process.env.FZ_PUBLIC_ENV),
    origin: process.env.FZ_PUBLIC_ORIGIN,
  });
}

export default function CompareRoute({ loaderData }: Route.ComponentProps) {
  if (loaderData.state !== 'published') {
    return (
      <main className="site">
        <h1>Porównanie</h1>
        <p>Nie ma opublikowanego porównania.</p>
      </main>
    );
  }
  return (
    <main className="site">
      <h1>Porównanie</h1>
      <PublicCompare pair={loaderData.pair} />
    </main>
  );
}
