import { robotsTxt, seoEnv } from '../technical-seo.ts';

export function loader() {
  return new Response(robotsTxt(seoEnv(process.env.FZ_PUBLIC_ENV)), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
