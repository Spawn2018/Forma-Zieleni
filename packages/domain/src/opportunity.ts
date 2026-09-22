import { assertOpaqueLeadId, type Lead } from './lead.ts';

export const OPPORTUNITY_STATUSES = ['open'] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export type Opportunity = {
  id: string;
  leadId: string;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

export function assertOpaqueOpportunityId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:opportunity|opp|id)\d+$/i.test(id)) {
    throw new Error('OPPORTUNITY_ID_GUESSABLE');
  }
  return id;
}

export function createOpportunity(id: string, lead: Lead, at: string): Opportunity {
  if (lead.status !== 'qualified' || lead.qualification.result !== 'qualified') {
    throw new Error('LEAD_NOT_QUALIFIED');
  }
  return {
    id: assertOpaqueOpportunityId(id),
    leadId: assertOpaqueLeadId(lead.id),
    status: 'open',
    createdAt: at,
    updatedAt: at,
  };
}
