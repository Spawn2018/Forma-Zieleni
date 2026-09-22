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
  createdAt: string;
  updatedAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

export function assertOpaqueProjectId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:project|prj|id)\d+$/i.test(id)) {
    throw new Error('PROJECT_ID_GUESSABLE');
  }
  return id;
}

export function createProject(id: string, contract: Contract, at: string): Project {
  if (contract.status !== 'draft') {
    throw new Error('CONTRACT_NOT_READY');
  }
  return {
    id: assertOpaqueProjectId(id),
    contractId: assertOpaqueContractId(contract.id),
    status: 'planned',
    createdAt: at,
    updatedAt: at,
  };
}
