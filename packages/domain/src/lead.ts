export const LEAD_SOURCES = ['www', 'portal', 'admin', 'other'] as const;
export const LEAD_STATUSES = ['received', 'site_analysis', 'qualified', 'consultation_ready', 'unqualified'] as const;
export const QUALIFICATION_RESULTS = ['pending', 'qualified', 'unqualified', 'needs_review'] as const;
export const QUALIFICATION_REASONS = [
  'missing_contact',
  'missing_property_context',
  'capacity_hold',
  'ready_for_consultation',
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type QualificationResult = (typeof QUALIFICATION_RESULTS)[number];
export type QualificationReason = (typeof QUALIFICATION_REASONS)[number];

export type LeadCapture = {
  name: string;
  phone: string;
  email?: string;
  locality?: string;
  siteAnalysisRequested: boolean;
};

export type LeadQualification = {
  result: QualificationResult;
  reasons: QualificationReason[];
};

export type Lead = {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  contact: { name: string; phone: string; email?: string };
  property: { locality?: string };
  siteAnalysisRequested: boolean;
  qualification: LeadQualification;
  createdAt: string;
  updatedAt: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

export function digitsOf(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function assertOpaqueLeadId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:lead|id)\d+$/i.test(id)) throw new Error('LEAD_ID_GUESSABLE');
  return id;
}

export function normalizeCapture(input: LeadCapture): LeadCapture {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim().toLowerCase();
  const locality = input.locality?.trim();
  if (!name || name.length > 120) throw new Error('LEAD_NAME_INVALID');
  if (digitsOf(phone).length < 9 || digitsOf(phone).length > 15) throw new Error('LEAD_PHONE_INVALID');
  if (email && (email.length > 254 || !EMAIL.test(email))) throw new Error('LEAD_EMAIL_INVALID');
  if (locality && locality.length > 200) throw new Error('LEAD_LOCALITY_INVALID');
  return { name, phone, email, locality, siteAnalysisRequested: input.siteAnalysisRequested === true };
}

export function evaluateQualification(input: LeadCapture, capacityHold: boolean): LeadQualification {
  const capture = normalizeCapture(input);
  const reasons: QualificationReason[] = [];
  if (!capture.locality) reasons.push('missing_property_context');
  if (capacityHold) reasons.push('capacity_hold');
  if (reasons.length === 0) return { result: 'qualified', reasons: ['ready_for_consultation'] };
  return { result: 'needs_review', reasons };
}

export function createLead(id: string, source: LeadSource, input: LeadCapture, at: string): Lead {
  if (!LEAD_SOURCES.includes(source)) throw new Error('LEAD_SOURCE_INVALID');
  const capture = normalizeCapture(input);
  return {
    id: assertOpaqueLeadId(id),
    source,
    status: capture.siteAnalysisRequested ? 'site_analysis' : 'received',
    contact: { name: capture.name, phone: capture.phone, email: capture.email },
    property: { locality: capture.locality },
    siteAnalysisRequested: capture.siteAnalysisRequested,
    qualification: { result: 'pending', reasons: [] },
    createdAt: at,
    updatedAt: at,
  };
}

export function qualifyLead(lead: Lead, capacityHold: boolean, at: string): Lead {
  const qualification = evaluateQualification({
    name: lead.contact.name,
    phone: lead.contact.phone,
    email: lead.contact.email,
    locality: lead.property.locality,
    siteAnalysisRequested: lead.siteAnalysisRequested,
  }, capacityHold);
  let status: LeadStatus = lead.status;
  if (qualification.result === 'qualified') status = 'qualified';
  else if (lead.status === 'qualified' || lead.status === 'consultation_ready') status = lead.status;
  else if (qualification.reasons.includes('missing_contact')) status = 'unqualified';
  return { ...lead, qualification, status, updatedAt: at };
}
