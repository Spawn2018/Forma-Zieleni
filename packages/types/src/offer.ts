export type OfferRecord = {
  id: string;
  opportunityId: string;
  status: 'draft';
  clientSubject: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OfferCreateBody = {
  opportunityId: string;
  clientSubject?: string;
};

export type PortalOfferProjection = {
  id: string;
  opportunityId: string;
  status: 'draft';
  createdAt: string;
};
