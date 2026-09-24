import { assertOpaqueContractId, type Contract } from './contract.ts';

export const SIGNATURE_REQUEST_STATUSES = ['requested', 'cancelled'] as const;

export type SignatureRequestStatus = (typeof SIGNATURE_REQUEST_STATUSES)[number];

/** Provider-neutral signature request. Signer is an opaque actor id, not a vendor document. */
export type SignatureRequest = {
  id: string;
  contractId: string;
  contractVersion: string;
  signerActorId: string;
  status: SignatureRequestStatus;
  qesClaimed: false;
  createdAt: string;
  updatedAt: string;
};

/** Locked contract content version. No signing vendor fields. */
export type ContractVersionLock = {
  contractId: string;
  version: string;
  lockedAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const FORBIDDEN_KEYS = new Set([
  'provider',
  'providerRef',
  'provider_ref',
  'vendor',
  'qes',
  'qualified',
  'webhook',
  'document',
  'pdf',
  'secret',
]);

export function assertOpaqueSignatureRequestId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:sign|sig|request|id)\d+$/i.test(id)) {
    throw new Error('SIGNATURE_REQUEST_ID_GUESSABLE');
  }
  return id;
}

export function assertOpaqueSignerActorId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:signer|user|actor|id)\d+$/i.test(id)) {
    throw new Error('SIGNER_ACTOR_ID_GUESSABLE');
  }
  return id;
}

function assertNoVendorSurface(input: object): void {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error('SIGNING_VENDOR_SURFACE_FORBIDDEN');
    }
  }
}

export function lockContractVersion(
  contract: Contract,
  version: string,
  at: string,
): ContractVersionLock {
  assertNoVendorSurface({ version });
  if (contract.status !== 'draft') {
    throw new Error('CONTRACT_NOT_READY');
  }
  if (typeof version !== 'string' || !/^[a-f0-9]{32,128}$/i.test(version)) {
    throw new Error('CONTRACT_VERSION_INVALID');
  }
  return {
    contractId: assertOpaqueContractId(contract.id),
    version: version.toLowerCase(),
    lockedAt: at,
  };
}

export function createSignatureRequest(
  id: string,
  contract: Contract,
  lock: ContractVersionLock,
  signerActorId: string,
  at: string,
): SignatureRequest {
  assertNoVendorSurface({ signerActorId });
  if (contract.status !== 'draft') {
    throw new Error('CONTRACT_NOT_READY');
  }
  if (lock.contractId !== contract.id) {
    throw new Error('CONTRACT_VERSION_MISMATCH');
  }
  return {
    id: assertOpaqueSignatureRequestId(id),
    contractId: assertOpaqueContractId(contract.id),
    contractVersion: lock.version,
    signerActorId: assertOpaqueSignerActorId(signerActorId),
    status: 'requested',
    qesClaimed: false,
    createdAt: at,
    updatedAt: at,
  };
}

export function cancelSignatureRequest(
  request: SignatureRequest,
  at: string,
): SignatureRequest {
  if (request.status !== 'requested') {
    throw new Error('SIGNATURE_TRANSITION_FORBIDDEN');
  }
  return {
    ...request,
    status: 'cancelled',
    updatedAt: at,
    qesClaimed: false,
  };
}
