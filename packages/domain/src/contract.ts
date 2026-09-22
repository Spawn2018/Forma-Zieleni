import { assertOpaqueOfferId, type Offer } from './offer.ts';

export const CONTRACT_STATUSES = ['draft'] as const;

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

export function assertOpaqueContractId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:contract|ctr|id)\d+$/i.test(id)) {
    throw new Error('CONTRACT_ID_GUESSABLE');
  }
  return id;
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
