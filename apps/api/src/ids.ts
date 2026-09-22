import { randomBytes } from 'node:crypto';
import {
  assertOpaqueLeadId,
  assertOpaqueContractId,
  assertOpaqueOfferId,
  assertOpaqueOpportunityId,
  assertOpaqueProjectId,
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
