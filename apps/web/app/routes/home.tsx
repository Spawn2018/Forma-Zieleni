import type { Route } from './+types/home';
import { readPublishedHome, retainPublishedHome, type PublishedSnapshot } from '../published-home.ts';
import { homeShell } from '../shell.ts';
import { publicHead, seoEnv } from '../technical-seo.ts';

let retainedHome: PublishedSnapshot | null = null;

export async function loader(): Promise<Awaited<ReturnType<typeof readPublishedHome>>> {
  const result = await retainPublishedHome(retainedHome, () => readPublishedHome({
    origin: process.env.FZ_API_ORIGIN,
    documentId: process.env.FZ_PUBLIC_HOME_ID,
    fetchImpl: globalThis.fetch,
  }));
  retainedHome = result.snapshot;
  return result.home;
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
