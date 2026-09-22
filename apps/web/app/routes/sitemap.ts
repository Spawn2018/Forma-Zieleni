import { seoEnv, sitemapXml } from '../technical-seo.ts';

export function loader() {
  return new Response(sitemapXml(seoEnv(process.env.FZ_PUBLIC_ENV), process.env.FZ_PUBLIC_ORIGIN, []), {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
