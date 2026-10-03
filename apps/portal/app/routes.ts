import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('files/:fileId/content', 'routes/file-content.ts'),
] satisfies RouteConfig;
