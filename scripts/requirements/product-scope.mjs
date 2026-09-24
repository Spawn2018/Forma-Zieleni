/**
 * Normative product scope mapped onto requirement ids.
 * Absence of a requirement id is a coverage gap, not proof the capability is out of scope.
 */

export const PRODUCT_SCOPE = Object.freeze([
  { id: 'WWW', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-WWW-001', 'FZ-REQ-WWW-002', 'FZ-REQ-WWW-003'] },
  { id: 'PORTAL', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-PORTAL-001', 'FZ-REQ-PORTAL-002', 'FZ-REQ-PORTAL-003', 'FZ-REQ-PORTAL-004', 'FZ-REQ-PORTAL-005', 'FZ-REQ-PORTAL-006', 'FZ-REQ-PORTAL-007'] },
  { id: 'ADMIN', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-ADMIN-001', 'FZ-REQ-ADMIN-002', 'FZ-REQ-ADMIN-006', 'FZ-REQ-ADMIN-003', 'FZ-REQ-ADMIN-004', 'FZ-REQ-ADMIN-005', 'FZ-REQ-ADMIN-007', 'FZ-REQ-ADMIN-008', 'FZ-REQ-ADMIN-011'] },
  { id: 'LEAD', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-SEC-001'] },
  { id: 'OPPORTUNITY', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-CRM-OPP-001'] },
  { id: 'OFFER', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-CRM-OFFER-001'] },
  { id: 'CONTRACT', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-CRM-CONTRACT-001'] },
  { id: 'SIGNING', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-GOV-002', 'FZ-REQ-SIGN-001', 'FZ-REQ-ADMIN-009'] },
  { id: 'PAYMENT', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-PAY-001', 'FZ-REQ-PAY-002', 'FZ-REQ-ADMIN-010'] },
  { id: 'PROJECT', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-PROJECT-001', 'FZ-REQ-PROJECT-002', 'FZ-REQ-PROJECT-003'] },
  { id: 'FILES', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-DATA-002'] },
  { id: 'CAPACITY', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-CRM-CAPACITY-001'] },
  { id: 'MOBILE', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-MOBILE-001', 'FZ-REQ-MOBILE-002', 'FZ-REQ-MOBILE-003'] },
  { id: 'GARDENOS', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-GARDENOS-001', 'FZ-REQ-GARDENOS-002', 'FZ-REQ-GARDENOS-003'] },
  { id: 'SITEINTEL', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-SITEINTEL-001', 'FZ-REQ-SITEINTEL-002', 'FZ-REQ-SITEINTEL-003', 'FZ-REQ-SITEINTEL-004'] },
  { id: 'ATLAS', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-ATLAS-001', 'FZ-REQ-ATLAS-002', 'FZ-REQ-ATLAS-003', 'FZ-REQ-ATLAS-004', 'FZ-REQ-ATLAS-005'] },
  { id: 'SKETCHUP', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-SKETCHUP-001', 'FZ-REQ-SKETCHUP-002'] },
  { id: 'PXI', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-PXI-001'] },
  { id: 'GROWTH', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-GROWTH-001', 'FZ-REQ-GROWTH-003'] },
  { id: 'CONNECTED', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-CONNECT-001'] },
  { id: 'CMS', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-CMS-001', 'FZ-REQ-CMS-002'] },
  { id: 'SEARCH', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-SEARCH-001', 'FZ-REQ-SEARCH-002'] },
  { id: 'MEDIA', normative: true, coverageStatus: 'COVERED_BY_REQUIREMENT', requirementIds: ['FZ-REQ-MEDIA-001'] },
  { id: 'HOSTING', normative: true, coverageStatus: 'OWNER_DECISION', requirementIds: ['FZ-REQ-HOST-001'] },
]);

export const PARENT_MODELS = Object.freeze([
  { capability: 'MOBILE', requiredDepths: ['BOUNDARY', 'ANDROID_RUNTIME', 'IOS_RUNTIME'] },
  { capability: 'GARDENOS', requiredDepths: ['BOUNDARY', 'DOMAIN', 'HTTP'] },
  { capability: 'SITEINTEL', requiredDepths: ['BOUNDARY', 'RULES', 'DOMAIN', 'HTTP'] },
  { capability: 'ATLAS', requiredDepths: ['FOUNDATION', 'BOUNDARY', 'DOMAIN', 'CLIENT_PROJECTION', 'RUNTIME'] },
  { capability: 'SKETCHUP', requiredDepths: ['BOUNDARY', 'INTEGRATION'] },
  { capability: 'ADMIN', requiredDepths: ['FOUNDATION', 'WORKFLOW', 'OPPORTUNITY_WORKFLOW', 'OFFER_WORKFLOW', 'CONTRACT_WORKFLOW', 'PROJECT_WORKFLOW', 'FILE_WORKFLOW', 'FILE_BYTES_WORKFLOW', 'APPROVAL_WORKFLOW'] },
  { capability: 'PAYMENT', requiredDepths: ['OWNER_DECISION', 'DOMAIN', 'STAFF_WORKFLOW'] },
  { capability: 'SIGNING', requiredDepths: ['OWNER_DECISION', 'DOMAIN', 'STAFF_WORKFLOW'] },
  { capability: 'PXI', requiredDepths: ['CONTRACT'] },
  { capability: 'WWW', requiredDepths: ['FOUNDATION', 'CLIENT_PROJECTION', 'LEAD_CAPTURE'] },
  { capability: 'PORTAL', requiredDepths: ['FOUNDATION', 'RUNTIME', 'CLIENT_PROJECTION', 'CLIENT_UI'] },
  { capability: 'PROJECT', requiredDepths: ['DOMAIN', 'MILESTONE'] },
  { capability: 'FILES', requiredDepths: ['BYTES'] },
  { capability: 'CAPACITY', requiredDepths: ['DOMAIN'] },
]);

export function loadProductScope() {
  return PRODUCT_SCOPE.map((item) => ({ ...item, requirementIds: [...item.requirementIds] }));
}

export function loadParentModels() {
  return PARENT_MODELS.map((item) => ({ ...item, requiredDepths: [...item.requiredDepths] }));
}
