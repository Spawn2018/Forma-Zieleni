export type ProjectRecord = {
  id: string;
  contractId: string;
  status: 'planned' | 'delivered';
  clientSubject: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCreateBody = {
  contractId: string;
  clientSubject?: string;
};
