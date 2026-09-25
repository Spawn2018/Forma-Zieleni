import { randomBytes } from 'node:crypto';
import {
  assertOpaqueLeadId,
  assertOpaqueContractId,
  assertOpaqueOfferId,
  assertOpaqueOpportunityId,
  assertOpaqueProjectFileId,
  assertOpaqueProjectId,
  assertOpaqueMilestoneId,
  assertOpaqueDecisionLogId,
  assertOpaquePaymentScheduleId,
  assertOpaquePaymentInstallmentId,
} from '@forma-zieleni/domain';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function newOpaqueId(prefix: string): string {
  const bytes = randomBytes(20);
  let id = prefix;
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
  return id;
}

export function newLeadId(): string {
  return assertOpaqueLeadId(newOpaqueId('l'));
}

export function newOpportunityId(): string {
  return assertOpaqueOpportunityId(newOpaqueId('p'));
}

export function newOfferId(): string {
  return assertOpaqueOfferId(newOpaqueId('f'));
}

export function newContractId(): string {
  return assertOpaqueContractId(newOpaqueId('c'));
}

export function newProjectId(): string {
  return assertOpaqueProjectId(newOpaqueId('j'));
}

export function newProjectFileId(): string {
  return assertOpaqueProjectFileId(newOpaqueId('u'));
}

export function newMilestoneId(): string {
  return assertOpaqueMilestoneId(newOpaqueId('m'));
}

export function newDecisionLogId(): string {
  return assertOpaqueDecisionLogId(newOpaqueId('d'));
}

export function newPaymentScheduleId(): string {
  return assertOpaquePaymentScheduleId(newOpaqueId('s'));
}

export function newPaymentInstallmentId(): string {
  return assertOpaquePaymentInstallmentId(newOpaqueId('i'));
}
