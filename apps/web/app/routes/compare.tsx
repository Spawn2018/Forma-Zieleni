import type { Route } from './+types/compare';
import { PublicCompare } from '../before-after-view.tsx';
import type { PublicCompareModel } from '../before-after.ts';

export async function loader(): Promise<PublicCompareModel> {
  return { state: 'absent' };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const tags: Array<{ title: string } | { name: string; content: string }> = [{ title: 'Porównanie' }];
  if (loaderData?.state !== 'published') tags.push({ name: 'robots', content: 'noindex' });
  return tags;
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
