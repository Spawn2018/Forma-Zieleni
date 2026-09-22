import { assertOpaqueContractId } from '../../domain/src/contract.ts';

export type FieldError = { field: string; reason: string };

export type ProjectCreateRequest = { contractId: string; clientSubject?: string };

export function validateProjectCreateRequest(
  value: unknown,
): { ok: true; value: ProjectCreateRequest } | { ok: false; errors: FieldError[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: [{ field: '', reason: 'BODY_REQUIRED' }] };
  }
  const body = value as Record<string, unknown>;
  if (Object.hasOwn(body, 'status') || Object.hasOwn(body, 'payment') || Object.hasOwn(body, 'provider')) {
    return { ok: false, errors: [{ field: 'status', reason: 'CLIENT_LIFECYCLE_FORBIDDEN' }] };
  }
  const extra = Object.keys(body).filter(key => key !== 'contractId' && key !== 'clientSubject');
  if (extra.length) return { ok: false, errors: extra.map(field => ({ field, reason: 'UNKNOWN_FIELD' })) };
  if (typeof body.contractId !== 'string') {
    return { ok: false, errors: [{ field: 'contractId', reason: 'STRING_REQUIRED' }] };
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
        contractId: assertOpaqueContractId(body.contractId),
        ...(clientSubject ? { clientSubject } : {}),
      },
    };
  } catch {
    return { ok: false, errors: [{ field: 'contractId', reason: 'CONTRACT_ID_INVALID' }] };
  }
}
