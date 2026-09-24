import type { Route } from './+types/atlas';
import { projectAtlasCatalog, type AtlasCatalogModel } from '../atlas-projection.ts';
import { publicHead, seoEnv } from '../technical-seo.ts';

export async function loader(): Promise<AtlasCatalogModel> {
  // Synthetic empty catalog until Core API feeds approved public plants.
  return projectAtlasCatalog([]);
}

export function meta({ loaderData }: Route.MetaArgs) {
  const published = loaderData?.state === 'published';
  return publicHead({
    title: 'Atlas roślin',
    description: published
      ? 'Publiczny atlas zatwierdzonych tożsamości roślin z cytacjami taksonomicznymi.'
      : 'Atlas roślin jest na razie pusty.',
    path: '/atlas',
    indexable: published,
    env: seoEnv(process.env.FZ_PUBLIC_ENV),
    origin: process.env.FZ_PUBLIC_ORIGIN,
  });
}

export default function AtlasRoute({ loaderData }: Route.ComponentProps) {
  if (loaderData.state !== 'published') {
    return (
      <main className="site">
        <h1>Atlas roślin</h1>
        <p>Nie ma jeszcze zatwierdzonych tożsamości roślin w atlasie publicznym.</p>
      </main>
    );
  }

  return (
    <main className="site">
      <h1>Atlas roślin</h1>
      <p>Zatwierdzone tożsamości roślin z cytacjami taksonomicznymi. To nie jest poradnik uprawy.</p>
      <ul>
        {loaderData.plants.map((plant) => (
          <li key={plant.id}>
            <h2>{plant.scientificName}</h2>
            <ul>
              {plant.citations.map((citation) => (
                <li key={`${plant.id}-${citation.sourceId}-${citation.accession ?? 'none'}`}>
                  <a href={citation.url} rel="noopener noreferrer">
                    {citation.note}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
