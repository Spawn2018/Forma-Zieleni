import { randomBytes } from 'node:crypto';
import { assertOpaqueLeadId } from '@forma-zieleni/domain';

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
