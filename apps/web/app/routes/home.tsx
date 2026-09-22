import type { Route } from './+types/home';
import { readPublishedHome } from '../published-home.ts';
import { homeShell } from '../shell.ts';
import { publicHead, seoEnv } from '../technical-seo.ts';

export async function loader(): Promise<Awaited<ReturnType<typeof readPublishedHome>>> {
  return readPublishedHome({
    origin: process.env.FZ_API_ORIGIN,
    documentId: process.env.FZ_PUBLIC_HOME_ID,
    fetchImpl: globalThis.fetch,
  });
}

export function meta({ loaderData }: Route.MetaArgs) {
  const published = loaderData?.state === 'published';
  return publicHead({
    title: published ? loaderData.title : 'Forma Zieleni',
    description: published ? loaderData.title : 'Opublikowana strona nie jest podłączona.',
    path: '/',
    indexable: published,
    env: seoEnv(process.env.FZ_PUBLIC_ENV),
    origin: process.env.FZ_PUBLIC_ORIGIN,
  });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return homeShell(loaderData);
}
