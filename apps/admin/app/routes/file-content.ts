import type { Route } from './+types/file-content';
import { fetchAdminFileBytes } from '../shell.ts';

function apiOrigin(): string | undefined {
  return typeof process !== 'undefined' ? process.env.FZ_API_ORIGIN || process.env.CORE_API_URL : undefined;
}

/**
 * Staff download proxy for Core API GET /v1/files/{fileId}/content.
 * Forwards the session cookie; never invents bytes or storage keys.
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const base = apiOrigin();
  if (!base) {
    return new Response('Core API nie jest skonfigurowane.', { status: 503, headers: { 'cache-control': 'private, no-store' } });
  }
  const fileId = params.fileId;
  if (typeof fileId !== 'string' || !fileId.trim()) {
    return new Response('Id pliku jest nieprawidłowe.', { status: 400, headers: { 'cache-control': 'private, no-store' } });
  }
  const cookie = request.headers.get('cookie') ?? '';
  const result = await fetchAdminFileBytes({ base, fileId: fileId.trim(), cookie });
  if (!result.ok) {
    if (result.reason === 'forbidden') {
      return new Response('To konto nie może pobrać bajtów pliku.', {
        status: 403,
        headers: { 'cache-control': 'private, no-store' },
      });
    }
    if (result.reason === 'not_found') {
      return new Response('Bajtów pliku nie znaleziono. Najpierw wgraj plik.', {
        status: 404,
        headers: { 'cache-control': 'private, no-store' },
      });
    }
    return new Response('Pobranie bajtów nie powiodło się. Odśwież stronę.', {
      status: 502,
      headers: { 'cache-control': 'private, no-store' },
    });
  }
  const headers: Record<string, string> = {
    'content-type': result.mimeType,
    'content-length': String(result.sizeBytes),
    'content-disposition': `attachment; filename="${result.fileName.replace(/["\\]/g, '_')}"`,
    'x-content-type-options': 'nosniff',
    'cache-control': 'private, no-store',
  };
  if (result.checksum) headers['x-content-checksum-sha256'] = result.checksum;
  return new Response(Buffer.from(result.bytes), { status: 200, headers });
}
