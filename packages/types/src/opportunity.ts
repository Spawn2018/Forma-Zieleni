export type OpportunityRecord = {
  id: string;
  leadId: string;
  status: 'open';
  createdAt: string;
  updatedAt: string;
};

export type OpportunityCreateBody = {
  leadId: string;
};
