import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  acceptSigningSandboxWebhook,
  assertOpaqueSigningEnvelopeId,
  openSigningSandboxEnvelope,
  type SigningSandboxEnvelope,
} from '@forma-zieleni/domain';
import type { Actor } from './auth.ts';
import { ApiFailure, badRequest } from './errors.ts';
import { newOpaqueId } from './ids.ts';
import { requestHash } from './leads.ts';
import type { LeadStore } from './store.ts';

function signatureMatches(rawBody: string, signature: string, secret: string): boolean {
  if (secret.length < 16) throw new Error('SIGNING_SECRET_UNCONFIGURED');
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const left = Buffer.from(expected);
  const right = Buffer.from(signature.trim().toLowerCase());
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function mapDomainError(error: unknown): never {
  if (!(error instanceof Error)) throw error;
  switch (error.message) {
    case 'CONTRACT_NOT_READY':
      throw new ApiFailure(409, 'CONTRACT_NOT_READY', 'A sandbox envelope requires a sent contract.');
    case 'SIGNING_SIGNATURE_INVALID':
      throw new ApiFailure(401, 'SIGNING_SIGNATURE_INVALID', 'Signing sandbox webhook signature is not valid.');
    case 'SIGNING_SECRET_UNCONFIGURED':
      throw new ApiFailure(503, 'SIGNING_SECRET_UNCONFIGURED', 'Signing sandbox secret is not configured.');
    case 'SIGNING_ENVELOPE_MISMATCH':
      throw new ApiFailure(409, 'SIGNING_ENVELOPE_MISMATCH', 'Signing sandbox webhook does not match the envelope.');
    case 'SIGNING_WEBHOOK_INVALID':
      throw badRequest('SIGNING_WEBHOOK_INVALID', 'Signing sandbox webhook body is not valid.');
    case 'SIGNING_VENDOR_SURFACE_FORBIDDEN':
      throw badRequest('SIGNING_VENDOR_SURFACE_FORBIDDEN', 'Vendor signing fields are forbidden.');
    case 'SIGNING_PROVIDER_FORBIDDEN':
      throw badRequest('SIGNING_PROVIDER_FORBIDDEN', 'Only the Documenso sandbox provider is accepted.');
    case 'SIGNING_ENVELOPE_ID_GUESSABLE':
      throw badRequest('SIGNING_ENVELOPE_ID_INVALID', 'Signing envelope id is not valid.');
    default:
      throw error;
  }
}

export async function createSigningSandboxEnvelopeRecord(
  store: LeadStore,
  contractId: string,
  actor: Actor,
  idempotencyKey: string,
  at: string,
): Promise<SigningSandboxEnvelope> {
  const hash = requestHash({ scope: 'signing.sandbox-envelope', contractId });
  return store.transaction(async tx => {
    const existingKey = await tx.findIdempotency('signing.sandbox-envelope', idempotencyKey);
    if (existingKey) {
      if (existingKey.requestHash !== hash) {
        throw new ApiFailure(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key was already used with a different request.');
      }
      return existingKey.responseBody as SigningSandboxEnvelope;
    }
    const contract = await tx.findContract(contractId);
    if (!contract) throw new ApiFailure(404, 'CONTRACT_NOT_FOUND', 'Contract was not found.');
    const existing = await tx.findSigningEnvelopeByContract(contractId);
    if (existing) throw new ApiFailure(409, 'SIGNING_ENVELOPE_EXISTS', 'A sandbox envelope already exists for this contract.');
    const offer = await tx.findOffer(contract.offerId);
    if (!offer) throw new ApiFailure(404, 'OFFER_NOT_FOUND', 'Offer was not found.');
    const opportunity = await tx.findOpportunity(offer.opportunityId);
    if (!opportunity) throw new ApiFailure(404, 'OPPORTUNITY_NOT_FOUND', 'Opportunity was not found.');
    let envelope: SigningSandboxEnvelope;
    try {
      envelope = openSigningSandboxEnvelope(contract, assertOpaqueSigningEnvelopeId(newOpaqueId('e')), at);
    } catch (error) {
      mapDomainError(error);
    }
    await tx.insertSigningEnvelope(envelope);
    await tx.insertAudit({
      id: newOpaqueId('a'),
      action: 'signing.sandbox_envelope_created',
      actorId: actor.actorId,
      leadId: opportunity.leadId,
      at,
      metadata: { status: envelope.status, contractId: contract.id },
    });
    await tx.saveIdempotency(
      'signing.sandbox-envelope',
      idempotencyKey,
      { requestHash: hash, responseStatus: 201, responseBody: envelope },
      at,
    );
    return envelope;
  });
}

export async function acceptSigningSandboxWebhookRecord(
  store: LeadStore,
  rawBody: string,
  signature: string,
  secret: string,
  at: string,
): Promise<SigningSandboxEnvelope> {
  let envelopeId = '';
  try {
    const parsed = JSON.parse(rawBody) as { envelopeId?: unknown };
    if (typeof parsed.envelopeId !== 'string') throw new Error('SIGNING_WEBHOOK_INVALID');
    envelopeId = parsed.envelopeId;
  } catch (error) {
    if (error instanceof Error && error.message === 'SIGNING_WEBHOOK_INVALID') mapDomainError(error);
    throw badRequest('SIGNING_WEBHOOK_INVALID', 'Signing sandbox webhook body is not valid.');
  }
  return store.transaction(async tx => {
    const envelope = await tx.findSigningEnvelope(envelopeId);
    if (!envelope) throw new ApiFailure(404, 'SIGNING_ENVELOPE_NOT_FOUND', 'Signing sandbox envelope was not found.');
    let next: SigningSandboxEnvelope;
    try {
      next = acceptSigningSandboxWebhook(
        envelope,
        rawBody,
        signature,
        (body) => signatureMatches(body, signature, secret),
        at,
      );
    } catch (error) {
      mapDomainError(error);
    }
    if (next.status === 'completed' && envelope.status === 'pending') {
      await tx.saveSigningEnvelope(next);
      const contract = await tx.findContract(next.contractId);
      const offer = contract ? await tx.findOffer(contract.offerId) : null;
      const opportunity = offer ? await tx.findOpportunity(offer.opportunityId) : null;
      if (opportunity) {
        await tx.insertAudit({
          id: newOpaqueId('a'),
          action: 'signing.sandbox_webhook_completed',
          actorId: null,
          leadId: opportunity.leadId,
          at,
          metadata: { status: 'completed', contractId: next.contractId },
        });
      }
    }
    return next;
  });
}
