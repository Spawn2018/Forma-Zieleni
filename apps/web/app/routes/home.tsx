import type { Route } from './+types/home';
import { readPublishedHome } from '../published-home.ts';
import { homeShell, type PublicHome } from '../shell.ts';

export async function loader(): Promise<PublicHome> {
  return readPublishedHome({
    origin: process.env.FZ_API_ORIGIN,
    documentId: process.env.FZ_PUBLIC_HOME_ID,
    fetchImpl: globalThis.fetch,
  });
}

export function meta({ loaderData }: Route.MetaArgs) {
  const title = loaderData?.state === 'published' ? loaderData.title : 'Forma Zieleni';
  const tags: Array<{ title: string } | { name: string; content: string }> = [{ title }];
  if (loaderData?.state !== 'published') tags.push({ name: 'robots', content: 'noindex' });
  return tags;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return homeShell(loaderData);
}
