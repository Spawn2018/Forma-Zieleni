import type { Route } from './+types/gallery';
import { PublicGallery } from '../gallery-view.tsx';
import type { PublicGalleryModel } from '../gallery.ts';

export async function loader(): Promise<PublicGalleryModel> {
  return { state: 'absent' };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const tags: Array<{ title: string } | { name: string; content: string }> = [{ title: 'Galeria' }];
  if (loaderData?.state !== 'published') tags.push({ name: 'robots', content: 'noindex' });
  return tags;
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
