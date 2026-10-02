import { assertOpaqueContractId, type Contract } from './contract.ts';

export const SIGNING_SANDBOX_PROVIDER = 'documenso-sandbox';

export type SigningSandboxStatus = 'pending' | 'completed';

export type SigningSandboxEnvelope = {
  id: string;
  provider: typeof SIGNING_SANDBOX_PROVIDER;
  contractId: string;
  status: SigningSandboxStatus;
  qesClaimed: false;
  createdAt: string;
  updatedAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;
const FORBIDDEN_KEY = /token|apikey|api_key|pdf|document|qes|secret|qualified/i;

export function assertOpaqueSigningEnvelopeId(value: string): string {
  if (!OPAQUE_ID.test(value)) throw new Error('SIGNING_ENVELOPE_ID_GUESSABLE');
  return value;
}

export function openSigningSandboxEnvelope(
  contract: Contract,
  envelopeId: string,
  at: string,
): SigningSandboxEnvelope {
  if (contract.status !== 'sent') throw new Error('CONTRACT_NOT_READY');
  return {
    id: assertOpaqueSigningEnvelopeId(envelopeId),
    provider: SIGNING_SANDBOX_PROVIDER,
    contractId: assertOpaqueContractId(contract.id),
    status: 'pending',
    qesClaimed: false,
    createdAt: at,
    updatedAt: at,
  };
}

function assertSandboxBody(value: unknown): { envelopeId: string; contractId: string; status: 'completed' } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('SIGNING_WEBHOOK_INVALID');
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_KEY.test(key)) throw new Error('SIGNING_VENDOR_SURFACE_FORBIDDEN');
  }
  const allowed = ['envelopeId', 'contractId', 'status'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw new Error('SIGNING_WEBHOOK_INVALID');
  if (body.status !== 'completed') throw new Error('SIGNING_WEBHOOK_INVALID');
  if (typeof body.envelopeId !== 'string' || typeof body.contractId !== 'string') {
    throw new Error('SIGNING_WEBHOOK_INVALID');
  }
  const text = JSON.stringify(body);
  if (/documenso\.com|https?:\/\//i.test(text)) throw new Error('SIGNING_VENDOR_SURFACE_FORBIDDEN');
  return {
    envelopeId: assertOpaqueSigningEnvelopeId(body.envelopeId),
    contractId: assertOpaqueContractId(body.contractId),
    status: 'completed',
  };
}

/**
 * Complete a local Documenso sandbox envelope. No network call, no API token,
 * and qesClaimed stays false.
 */
export function acceptSigningSandboxWebhook(
  envelope: SigningSandboxEnvelope,
  rawBody: string,
  signature: string,
  signatureMatches: (rawBody: string) => boolean,
  at: string,
): SigningSandboxEnvelope {
  if (envelope.provider !== SIGNING_SANDBOX_PROVIDER) throw new Error('SIGNING_PROVIDER_FORBIDDEN');
  if (!signatureMatches(rawBody) || signature.trim() === '') throw new Error('SIGNING_SIGNATURE_INVALID');
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new Error('SIGNING_WEBHOOK_INVALID');
  }
  const body = assertSandboxBody(parsed);
  if (body.envelopeId !== envelope.id || body.contractId !== envelope.contractId) {
    throw new Error('SIGNING_ENVELOPE_MISMATCH');
  }
  if (envelope.status === 'completed') return envelope;
  return { ...envelope, status: 'completed', qesClaimed: false, updatedAt: at };
}
