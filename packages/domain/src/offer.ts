import { assertOpaqueOpportunityId, type Opportunity } from './opportunity.ts';

export const OFFER_STATUSES = ['draft'] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** First-class commercial Offer owned by Core API. Distinct from marketing OfferOutcome records. */
export type Offer = {
  id: string;
  opportunityId: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

export function assertOpaqueOfferId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:offer|off|id)\d+$/i.test(id)) {
    throw new Error('OFFER_ID_GUESSABLE');
  }
  return id;
}

export function createOffer(id: string, opportunity: Opportunity, at: string): Offer {
  if (opportunity.status !== 'open') {
    throw new Error('OPPORTUNITY_NOT_OPEN');
  }
  return {
    id: assertOpaqueOfferId(id),
    opportunityId: assertOpaqueOpportunityId(opportunity.id),
    status: 'draft',
    createdAt: at,
    updatedAt: at,
  };
}
