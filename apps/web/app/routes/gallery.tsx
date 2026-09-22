import type { Route } from './+types/gallery';
import { PublicGallery } from '../gallery-view.tsx';
import type { PublicGalleryModel } from '../gallery.ts';
import { publicHead, seoEnv } from '../technical-seo.ts';

export async function loader(): Promise<PublicGalleryModel> {
  return { state: 'absent' };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const published = loaderData?.state === 'published';
  return publicHead({
    title: 'Galeria',
    description: published ? 'Galeria' : 'Nie ma opublikowanej galerii.',
    path: '/galeria',
    indexable: published,
    env: seoEnv(process.env.FZ_PUBLIC_ENV),
    origin: process.env.FZ_PUBLIC_ORIGIN,
  });
}

export default function GalleryRoute({ loaderData }: Route.ComponentProps) {
  if (loaderData.state !== 'published') {
    return (
      <main className="site">
        <h1>Galeria</h1>
        <p>Nie ma opublikowanej galerii.</p>
      </main>
    );
  }
  return (
    <main className="site">
      <h1>Galeria</h1>
      <PublicGallery slides={loaderData.slides} />
    </main>
  );
}
