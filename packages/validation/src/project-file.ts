import { assertOpaqueProjectId } from '../../domain/src/project.ts';

export type FieldError = { field: string; reason: string };

export type ProjectFileCreateRequest = {
  projectId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  clientSubject?: string;
};

export function validateProjectFileCreateRequest(
  value: unknown,
): { ok: true; value: ProjectFileCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  if (Object.hasOwn(body, 'storageKey') || Object.hasOwn(body, 'bytes') || Object.hasOwn(body, 'url')) {
    return { ok: false, errors: [{ field: 'storageKey', reason: 'BINARY_PAYLOAD_FORBIDDEN' }] };
  }
  const allowed = new Set(['projectId', 'name', 'mimeType', 'sizeBytes', 'clientSubject']);
  const extra = Object.keys(body).filter(key => !allowed.has(key));
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.projectId !== 'string') {
    return { ok: false, errors: [{ field: 'projectId', reason: 'STRING_REQUIRED' }] };
  }
  if (typeof body.name !== 'string') {
    return { ok: false, errors: [{ field: 'name', reason: 'STRING_REQUIRED' }] };
  }
  if (typeof body.mimeType !== 'string') {
    return { ok: false, errors: [{ field: 'mimeType', reason: 'STRING_REQUIRED' }] };
  }
  if (typeof body.sizeBytes !== 'number' || !Number.isInteger(body.sizeBytes)) {
    return { ok: false, errors: [{ field: 'sizeBytes', reason: 'INTEGER_REQUIRED' }] };
  }
  let clientSubject: string | undefined;
  if (Object.hasOwn(body, 'clientSubject')) {
    if (typeof body.clientSubject !== 'string') {
      return { ok: false, errors: [{ field: 'clientSubject', reason: 'STRING_REQUIRED' }] };
    }
    const trimmed = body.clientSubject.trim();
    if (!trimmed || trimmed.length > 128) {
      return { ok: false, errors: [{ field: 'clientSubject', reason: 'CLIENT_SUBJECT_INVALID' }] };
    }
    clientSubject = trimmed;
  }
  try {
    return {
      ok: true,
      value: {
        projectId: assertOpaqueProjectId(body.projectId),
        name: body.name,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        ...(clientSubject ? { clientSubject } : {}),
      },
    };
  } catch {
    return { ok: false, errors: [{ field: 'projectId', reason: 'PROJECT_ID_INVALID' }] };
  }
}
