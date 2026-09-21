export {
  LEAD_SOURCES,
  PUBLIC_LEAD_SOURCES,
  LEAD_STATUSES,
  QUALIFICATION_RESULTS,
  QUALIFICATION_REASONS,
  assertOpaqueLeadId,
  createLead,
  digitsOf,
  evaluateQualification,
  normalizeCapture,
  qualifyLead,
} from './lead.ts';
export type {
  Lead,
  LeadCapture,
  LeadQualification,
  LeadSource,
  PublicLeadSource,
  LeadStatus,
  QualificationReason,
  QualificationResult,
} from './lead.ts';
