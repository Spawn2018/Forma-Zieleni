export type ApiError = {
  error: {
    code: string;
    message: string;
    requestId: string;
    details: { field: string; reason: string }[];
  };
};

export type CursorPage<T> = {
  items: T[];
  meta: { limit: number; nextCursor: string | null };
};

export type LeadRecord = {
  id: string;
  source: 'www' | 'portal' | 'admin' | 'other';
  status: 'received' | 'site_analysis' | 'qualified' | 'consultation_ready' | 'unqualified';
  contact: { name: string; phone: string; email?: string };
  property: { locality?: string };
  siteAnalysisRequested: boolean;
  qualification: {
    result: 'pending' | 'qualified' | 'unqualified' | 'needs_review';
    reasons: Array<'missing_contact' | 'missing_property_context' | 'capacity_hold' | 'ready_for_consultation'>;
  };
  createdAt: string;
  updatedAt: string;
};

export type PublicLeadSource = 'www' | 'other';

export type LeadCaptureBody = {
  source: PublicLeadSource;
  name: string;
  phone: string;
  email?: string;
  locality?: string;
  siteAnalysisRequested: boolean;
};

export type LeadQualifyBody = {
  capacityHold: boolean;
};
