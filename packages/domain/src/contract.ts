import { assertOpaqueOfferId, type Offer } from './offer.ts';

export const CONTRACT_STATUSES = ['draft', 'internal_review', 'approved', 'sent'] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/** Domain Contract owned by Core API. No signing-provider adapter in this slice. */
export type Contract = {
  id: string;
  offerId: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

const LIFECYCLE_TRANSITIONS: Readonly<Partial<Record<ContractStatus, ContractStatus>>> = {
  draft: 'internal_review',
  internal_review: 'approved',
  approved: 'sent',
};

const FORBIDDEN_SURFACE_KEYS = new Set([
  'payment',
  'provider',
  'providerRef',
  'provider_ref',
  'signing',
  'signature',
  'qes',
  'qualified',
  'webhook',
  'document',
  'pdf',
  'secret',
  'amount',
  'amountPln',
  'blik',
  'card',
]);

export function assertOpaqueContractId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:contract|ctr|id)\d+$/i.test(id)) {
    throw new Error('CONTRACT_ID_GUESSABLE');
  }
  return id;
}

function assertNoForbiddenSurface(input: object): void {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_SURFACE_KEYS.has(key)) {
      throw new Error('CONTRACT_SURFACE_FORBIDDEN');
    }
  }
}

export function createContract(id: string, offer: Offer, at: string): Contract {
  if (offer.status !== 'draft') {
    throw new Error('OFFER_NOT_READY');
  }
  return {
    id: assertOpaqueContractId(id),
    offerId: assertOpaqueOfferId(offer.id),
    status: 'draft',
    createdAt: at,
    updatedAt: at,
  };
}

/** Next allowed lifecycle status, or null when the contract is terminal (`sent`). */
export function nextContractLifecycleStatus(status: ContractStatus): ContractStatus | null {
  return LIFECYCLE_TRANSITIONS[status] ?? null;
}

/**
 * Staff advance of provider-neutral contract lifecycle.
 * Only draft → internal_review → approved → sent. No signing vendor, payment, or QES.
 */
export function advanceContractLifecycle(
  contract: Contract,
  nextStatus: ContractStatus,
  at: string,
  surface: Record<string, unknown> = {},
): Contract {
  assertNoForbiddenSurface({ status: nextStatus, ...surface });
  if (!CONTRACT_STATUSES.includes(nextStatus)) {
    throw new Error('CONTRACT_STATUS_INVALID');
  }
  const allowed = nextContractLifecycleStatus(contract.status);
  if (allowed !== nextStatus) {
    throw new Error('CONTRACT_TRANSITION_FORBIDDEN');
  }
  return {
    ...contract,
    status: nextStatus,
    updatedAt: at,
  };
}
