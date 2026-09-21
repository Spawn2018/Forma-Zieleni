export const CONTENT_ROLES = ['editor', 'reviewer', 'publisher', 'admin'] as const;
export const CONTENT_CAPABILITIES = [
  'content:read-draft',
  'content:edit',
  'content:review',
  'content:publish',
  'content:admin',
] as const;

export type ContentRole = (typeof CONTENT_ROLES)[number];
export type ContentCapability = (typeof CONTENT_CAPABILITIES)[number];
export type ContentVisibility = 'draft' | 'published';

const ROLE_CAPABILITIES: Record<ContentRole, readonly ContentCapability[]> = {
  editor: ['content:read-draft', 'content:edit'],
  reviewer: ['content:read-draft', 'content:review'],
  publisher: ['content:read-draft', 'content:edit', 'content:review', 'content:publish'],
  admin: ['content:read-draft', 'content:edit', 'content:review', 'content:publish', 'content:admin'],
};

const ACTOR_ID = /^[a-z][a-z0-9]{15,63}$/;

export function isContentRole(value: string): value is ContentRole {
  return CONTENT_ROLES.includes(value as ContentRole);
}

export function isContentCapability(value: string): value is ContentCapability {
  return CONTENT_CAPABILITIES.includes(value as ContentCapability);
}

export function capabilitiesForContentRole(role: ContentRole): readonly ContentCapability[] {
  return ROLE_CAPABILITIES[role];
}

export function bindContentRole(actorId: string, role: ContentRole): { actorId: string; capabilities: readonly ContentCapability[] } {
  if (!ACTOR_ID.test(actorId)) throw new Error('ACTOR_ID_INVALID');
  return { actorId, capabilities: capabilitiesForContentRole(role) };
}

export function assertNoClientSuppliedAuthority(input: Readonly<Record<string, unknown>>): void {
  if ('role' in input || 'capabilities' in input || 'actorId' in input) {
    throw new Error('CLIENT_AUTHORITY_REJECTED');
  }
}

export function decideDraftRead(
  actor: { capabilities: readonly string[] } | null,
  visibility: ContentVisibility,
): 'allow' | 'unauthenticated' | 'forbidden' {
  if (visibility === 'published') return 'allow';
  if (!actor) return 'unauthenticated';
  if (!actor.capabilities.includes('content:read-draft')) return 'forbidden';
  return 'allow';
}
