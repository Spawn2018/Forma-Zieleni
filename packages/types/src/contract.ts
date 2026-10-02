export type ContractRecord = {
  id: string;
  offerId: string;
  status: 'draft' | 'internal_review' | 'approved' | 'sent';
  createdAt: string;
  updatedAt: string;
};

export type ContractCreateBody = {
  offerId: string;
};

export type ContractLifecycleAdvanceBody = {
  status: ContractRecord['status'];
};

/** Client-safe contract view. No price, signing, payment, or staff timestamps. */
export type PortalContractProjection = {
  id: string;
  offerId: string;
  status: ContractRecord['status'];
  createdAt: string;
};
