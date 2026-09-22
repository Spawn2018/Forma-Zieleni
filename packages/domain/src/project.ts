import { assertOpaqueContractId, type Contract } from './contract.ts';

export const PROJECT_STATUSES = ['planned'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/**
 * Commercial Project owned by Core API after Contract.
 * Payment provider and live activation stay Owner-gated outside this foundation.
 */
export type Project = {
  id: string;
  contractId: string;
  status: ProjectStatus;
  /** Portal client subject authorized to read a client-safe projection. Null = staff-only. */
  clientSubject: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Fields a portal client may see. No payment, provider, or staff commercial machine. */
export type PortalProjectProjection = {
  id: string;
  contractId: string;
  status: ProjectStatus;
  createdAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

export function assertOpaqueProjectId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:project|prj|id)\d+$/i.test(id)) {
    throw new Error('PROJECT_ID_GUESSABLE');
  }
  return id;
}

export function createProject(
  id: string,
  contract: Contract,
  at: string,
  clientSubject: string | null = null,
): Project {
  if (contract.status !== 'draft') {
    throw new Error('CONTRACT_NOT_READY');
  }
  if (clientSubject !== null) {
    const subject = clientSubject.trim();
    if (!subject || subject.length > 128) throw new Error('CLIENT_SUBJECT_INVALID');
    clientSubject = subject;
  }
  return {
    id: assertOpaqueProjectId(id),
    contractId: assertOpaqueContractId(contract.id),
    status: 'planned',
    clientSubject,
    createdAt: at,
    updatedAt: at,
  };
}

export function projectProjectForPortal(project: Project, readerSubject: string): PortalProjectProjection | null {
  if (!project.clientSubject || project.clientSubject !== readerSubject) return null;
  return {
    id: project.id,
    contractId: project.contractId,
    status: project.status,
    createdAt: project.createdAt,
  };
}
