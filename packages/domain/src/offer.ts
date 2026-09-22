import { assertOpaqueOpportunityId, type Opportunity } from './opportunity.ts';

export const OFFER_STATUSES = ['draft'] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** First-class commercial Offer owned by Core API. Distinct from marketing OfferOutcome records. */
export type Offer = {
  id: string;
  opportunityId: string;
  status: OfferStatus;
  /** Portal client subject authorized to read a client-safe projection. Null = staff-only. */
  clientSubject: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Fields a portal client may see. No price, terms, or staff commercial machine. */
export type PortalOfferProjection = {
  id: string;
  opportunityId: string;
  status: OfferStatus;
  createdAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

export function assertOpaqueOfferId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:offer|off|id)\d+$/i.test(id)) {
    throw new Error('OFFER_ID_GUESSABLE');
  }
  return id;
}

export function createOffer(
  id: string,
  opportunity: Opportunity,
  at: string,
  clientSubject: string | null = null,
): Offer {
  if (opportunity.status !== 'open') {
    throw new Error('OPPORTUNITY_NOT_OPEN');
  }
  if (clientSubject !== null) {
    const subject = clientSubject.trim();
    if (!subject || subject.length > 128) throw new Error('CLIENT_SUBJECT_INVALID');
    clientSubject = subject;
  }
  return {
    id: assertOpaqueOfferId(id),
    opportunityId: assertOpaqueOpportunityId(opportunity.id),
    status: 'draft',
    clientSubject,
    createdAt: at,
    updatedAt: at,
  };
}

export function projectOfferForPortal(offer: Offer, readerSubject: string): PortalOfferProjection | null {
  if (!offer.clientSubject || offer.clientSubject !== readerSubject) return null;
  return {
    id: offer.id,
    opportunityId: offer.opportunityId,
    status: offer.status,
    createdAt: offer.createdAt,
  };
}
