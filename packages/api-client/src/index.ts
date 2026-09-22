import type { LeadCaptureBody, LeadQualifyBody, LeadRecord, OpportunityCreateBody, OpportunityRecord } from '../../types/src/index.ts';

export const API_PREFIX = '/v1';

export const leadPaths = Object.freeze({
  health: `${API_PREFIX}/health`,
  ready: `${API_PREFIX}/ready`,
  leads: `${API_PREFIX}/leads`,
  lead: (leadId: string) => `${API_PREFIX}/leads/${leadId}`,
  qualify: (leadId: string) => `${API_PREFIX}/leads/${leadId}/qualify`,
});

export const opportunityPaths = Object.freeze({
  opportunities: `${API_PREFIX}/opportunities`,
  opportunity: (opportunityId: string) => `${API_PREFIX}/opportunities/${opportunityId}`,
});

export const contentPaths = Object.freeze({
  document: (contentId: string) => `${API_PREFIX}/content/${contentId}`,
});

export type LeadClientContract = {
  createLead(body: LeadCaptureBody, headers: { 'Idempotency-Key': string; 'X-Request-Id'?: string }): Promise<LeadRecord>;
  listLeads(query: { limit?: number; cursor?: string; sort?: string; status?: LeadRecord['status'] }): Promise<{ items: LeadRecord[]; meta: { limit: number; nextCursor: string | null } }>;
  getLead(leadId: string): Promise<LeadRecord>;
  qualifyLead(leadId: string, body: LeadQualifyBody, headers: { 'Idempotency-Key': string }): Promise<LeadRecord>;
};

export type OpportunityClientContract = {
  createOpportunity(body: OpportunityCreateBody, headers: { 'Idempotency-Key': string; 'X-Request-Id'?: string }): Promise<OpportunityRecord>;
  listOpportunities(query: { limit?: number; cursor?: string; sort?: string; status?: OpportunityRecord['status'] }): Promise<{ items: OpportunityRecord[]; meta: { limit: number; nextCursor: string | null } }>;
  getOpportunity(opportunityId: string): Promise<OpportunityRecord>;
};

export type ClientSurface = 'web' | 'portal' | 'admin' | 'mobile';

export const generatedSurfaces: readonly ClientSurface[] = Object.freeze(['web', 'portal', 'admin', 'mobile']);
