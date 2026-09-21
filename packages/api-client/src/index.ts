import type { LeadCaptureBody, LeadQualifyBody, LeadRecord } from '../../types/src/lead.ts';

export const API_PREFIX = '/v1';

export const leadPaths = Object.freeze({
  health: `${API_PREFIX}/health`,
  leads: `${API_PREFIX}/leads`,
  lead: (leadId: string) => `${API_PREFIX}/leads/${leadId}`,
  qualify: (leadId: string) => `${API_PREFIX}/leads/${leadId}/qualify`,
});

export type LeadClientContract = {
  createLead(body: LeadCaptureBody, headers: { 'Idempotency-Key': string; 'X-Request-Id'?: string }): Promise<LeadRecord>;
  listLeads(query: { limit?: number; cursor?: string; sort?: string; status?: LeadRecord['status'] }): Promise<{ items: LeadRecord[]; meta: { limit: number; nextCursor: string | null } }>;
  getLead(leadId: string): Promise<LeadRecord>;
  qualifyLead(leadId: string, body: LeadQualifyBody, headers: { 'Idempotency-Key': string }): Promise<LeadRecord>;
};

export type ClientSurface = 'web' | 'portal' | 'admin' | 'mobile';

export const generatedSurfaces: readonly ClientSurface[] = Object.freeze(['web', 'portal', 'admin', 'mobile']);
