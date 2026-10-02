import { createElement, type ReactNode } from 'react';

/** Actions Agnieszka must never receive as UI intents. */
export const BLOCKED_APPROVAL_INTENTS = [
  'spend',
  'price-change',
  'publish-live',
  'owner-decision',
  'dangerous',
] as const;

export type AdminProposalChangeRow = {
  id: string;
  entityId: string;
  field: string;
  before: string;
  after: string;
};

export type AdminProposalRow = {
  id: string;
  status: string;
  reason: string;
  trigger: string;
  synthetic: true;
  changes: readonly AdminProposalChangeRow[];
};

export type AdminProposalList =
  | { status: 'empty' }
  | { status: 'ready'; items: readonly AdminProposalRow[] }
  | { status: 'error' }
  | { status: 'forbidden' };

export type AdminProposalAction =
  | 'EDIT'
  | 'APPROVE_ALL'
  | 'PARTIAL_APPROVE'
  | 'REJECT'
  | 'DEFER';

type ProposalApiItem = {
  id?: unknown;
  status?: unknown;
  reason?: unknown;
  trigger?: unknown;
  synthetic?: unknown;
  changes?: unknown;
};

export function mapAdminProposalPage(body: unknown): AdminProposalList {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { status: 'error' };
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) return { status: 'error' };
  if (items.length === 0) return { status: 'empty' };
  const rows: AdminProposalRow[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { status: 'error' };
    const proposal = item as ProposalApiItem;
    if (typeof proposal.id !== 'string' || typeof proposal.status !== 'string') return { status: 'error' };
    if (typeof proposal.reason !== 'string' || typeof proposal.trigger !== 'string') return { status: 'error' };
    if (proposal.synthetic !== true) return { status: 'error' };
    if (!Array.isArray(proposal.changes)) return { status: 'error' };
    const changes: AdminProposalChangeRow[] = [];
    for (const change of proposal.changes) {
      if (!change || typeof change !== 'object' || Array.isArray(change)) return { status: 'error' };
      const row = change as Record<string, unknown>;
      if (typeof row.id !== 'string' || typeof row.entityId !== 'string') return { status: 'error' };
      if (typeof row.field !== 'string' || typeof row.before !== 'string' || typeof row.after !== 'string') {
        return { status: 'error' };
      }
      changes.push({
        id: row.id,
        entityId: row.entityId,
        field: row.field,
        before: row.before,
        after: row.after,
      });
    }
    rows.push({
      id: proposal.id,
      status: proposal.status,
      reason: proposal.reason,
      trigger: proposal.trigger,
      synthetic: true,
      changes,
    });
  }
  return { status: 'ready', items: rows };
}

export async function fetchAdminProposals(input: {
  base: string;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<AdminProposalList> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(new URL('/v1/approvals/proposals', input.base), {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 || response.status === 403) return { status: 'forbidden' };
    if (!response.ok) return { status: 'error' };
    return mapAdminProposalPage(await response.json());
  } catch {
    return { status: 'error' };
  }
}

export async function reviewAdminProposal(input: {
  base: string;
  changeSetId: string;
  action: AdminProposalAction;
  selectedIds?: readonly string[];
  edits?: ReadonlyArray<{ changeId: string; after: string }>;
  cookie?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true } | { ok: false; reason: 'forbidden' | 'error' }> {
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'content-type': 'application/json',
    };
    if (input.cookie) headers.cookie = input.cookie;
    const response = await fetchImpl(
      new URL(`/v1/approvals/proposals/${encodeURIComponent(input.changeSetId)}/review`, input.base),
      {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          action: input.action,
          selectedIds: input.selectedIds ? [...input.selectedIds] : undefined,
          edits: input.edits ? [...input.edits] : undefined,
        }),
      },
    );
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'forbidden' };
    if (!response.ok) return { ok: false, reason: 'error' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export function proposalListNode(proposals: AdminProposalList): ReactNode {
  if (proposals.status === 'empty') {
    return createElement('p', null, 'Brak propozycji do przeglądu.');
  }
  if (proposals.status === 'forbidden') {
    return createElement('p', null, 'To konto nie może przeglądać propozycji.');
  }
  if (proposals.status === 'error') {
    return createElement('p', null, 'Listy propozycji nie udało się przygotować. Odśwież stronę.');
  }
  return createElement(
    'section',
    { className: 'admin-proposals', 'aria-label': 'Propozycje do przeglądu' },
    createElement('h2', null, 'Propozycje do przeglądu'),
    createElement(
      'ul',
      { className: 'admin-proposal-list' },
      ...proposals.items.map((proposal) =>
        createElement(
          'li',
          { key: proposal.id, className: 'admin-proposal' },
          createElement(
            'p',
            { className: 'admin-proposal-meta' },
            [proposal.id, ' · ', proposal.status, ' · ', proposal.reason].join(''),
          ),
          createElement(
            'ul',
            { className: 'admin-proposal-changes' },
            ...proposal.changes.map((change) =>
              createElement(
                'li',
                { key: change.id },
                [change.field, ': ', change.before, ' → ', change.after].join(''),
              ),
            ),
          ),
          proposalActionForms(proposal),
        ),
      ),
    ),
  );
}

function proposalActionForms(proposal: AdminProposalRow): ReactNode {
  if (proposal.status === 'REJECTED' || proposal.status === 'APPLIED' || proposal.status === 'DEFERRED') {
    return null;
  }
  const firstChange = proposal.changes[0];
  return createElement(
    'div',
    { className: 'admin-proposal-actions' },
    createElement(
      'form',
      { method: 'post', className: 'admin-proposal-form' },
      createElement('input', { type: 'hidden', name: 'changeSetId', value: proposal.id }),
      firstChange
        ? createElement('input', {
          type: 'hidden',
          name: 'editChangeId',
          value: firstChange.id,
        })
        : null,
      firstChange
        ? createElement('input', {
          type: 'text',
          name: 'editAfter',
          defaultValue: firstChange.after,
          'aria-label': 'Nowa wartość pola',
        })
        : null,
      createElement('button', { type: 'submit', name: 'intent', value: 'edit-proposal' }, 'Edytuj'),
      createElement('button', { type: 'submit', name: 'intent', value: 'approve-proposal' }, 'Zatwierdź'),
      firstChange
        ? createElement(
          'button',
          { type: 'submit', name: 'intent', value: 'partial-approve-proposal' },
          'Zatwierdź wybrane',
        )
        : null,
      createElement('button', { type: 'submit', name: 'intent', value: 'reject-proposal' }, 'Odrzuć'),
      createElement('button', { type: 'submit', name: 'intent', value: 'defer-proposal' }, 'Odłóż'),
    ),
  );
}
