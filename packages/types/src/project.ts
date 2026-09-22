export type ProjectRecord = {
  id: string;
  contractId: string;
  status: 'planned';
  createdAt: string;
  updatedAt: string;
};

export type ProjectCreateBody = {
  contractId: string;
};
