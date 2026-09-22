export type OfferRecord = {
  id: string;
  opportunityId: string;
  status: 'draft';
  createdAt: string;
  updatedAt: string;
};

export type OfferCreateBody = {
  opportunityId: string;
};
