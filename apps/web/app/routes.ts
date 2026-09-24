import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('galeria', 'routes/gallery.tsx'),
  route('porownanie', 'routes/compare.tsx'),
  route('atlas', 'routes/atlas.tsx'),
  route('kontakt', 'routes/contact.tsx'),
  route('robots.txt', 'routes/robots.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
] satisfies RouteConfig;
