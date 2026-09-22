import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('galeria', 'routes/gallery.tsx'),
  route('porownanie', 'routes/compare.tsx'),
  route('robots.txt', 'routes/robots.ts'),
] satisfies RouteConfig;
