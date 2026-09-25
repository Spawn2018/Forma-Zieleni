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
