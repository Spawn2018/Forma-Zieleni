import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [index('routes/home.tsx'), route('galeria', 'routes/gallery.tsx')] satisfies RouteConfig;
