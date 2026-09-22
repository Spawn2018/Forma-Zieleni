export type ContractRecord = {
  id: string;
  offerId: string;
  status: 'draft';
  createdAt: string;
  updatedAt: string;
};

export type ContractCreateBody = {
  offerId: string;
};
