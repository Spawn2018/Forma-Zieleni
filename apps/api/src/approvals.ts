import {
  applyApproved,
  assertAgnieszkaCannotOverride,
  createFabric,
  propose,
  putEntity,
  review,
  type ChangeSet,
  type Fabric,
} from '@forma-zieleni/domain';

const SYNTHETIC_AT = '2026-09-21T12:00:00.000Z';

export type ApprovalAction = 'EDIT' | 'APPROVE_ALL' | 'PARTIAL_APPROVE' | 'REJECT' | 'DEFER';

export type ApprovalProposal = {
  id: string;
  status: string;
  reason: string;
  trigger: string;
  synthetic: true;
  changes: Array<{
    id: string;
    entityId: string;
    field: string;
    before: string;
    after: string;
  }>;
};

let fabric: Fabric | null = null;

function mapProposal(changeSet: ChangeSet): ApprovalProposal {
  return {
    id: changeSet.id,
    status: changeSet.status,
    reason: changeSet.reason,
    trigger: changeSet.trigger,
    synthetic: true,
    changes: changeSet.changes.map((change) => ({
      id: change.id,
      entityId: change.entityId,
      field: change.field,
      before: String(change.before),
      after: String(change.after),
    })),
  };
}

function seedStudio(store: Fabric): void {
  putEntity(store, {
    id: 'plantrecord000001',
    type: 'Plant',
    ownerDomain: 'plant-atlas',
    visibility: 'PUBLIC',
    synthetic: true,
    rightsPublic: true,
    fields: {
      scientificName: {
        value: 'Taxus baccata',
        valueClass: 'AUTHORITATIVE',
        by: 'human',
        at: SYNTHETIC_AT,
      },
    },
  });
  putEntity(store, {
    id: 'projconcept000001',
    type: 'GardenProject',
    ownerDomain: 'project',
    visibility: 'PUBLIC',
    projectClass: 'CONCEPT_PROJECT',
    synthetic: true,
    rightsPublic: true,
    fields: {
      title: {
        value: 'Koncepcja cienistego ogrodu',
        valueClass: 'AUTHORITATIVE',
        by: 'human',
        at: SYNTHETIC_AT,
      },
    },
  });
  putEntity(store, {
    id: 'articlebody000001',
    type: 'Article',
    ownerDomain: 'cms',
    visibility: 'PUBLIC',
    synthetic: true,
    rightsPublic: true,
    fields: {
      body: {
        value: 'Opis roboczy cisa.',
        valueClass: 'AUTHORITATIVE',
        by: 'human',
        at: SYNTHETIC_AT,
      },
    },
  });
  propose(store, {
    id: 'setadminapprove001',
    trigger: 'suggestion',
    reason: 'Syntetyczna propozycja do przeglądu.',
    evidence: 'synthetic-note',
    confidence: 'low',
    changes: [
      {
        id: 'chgadminplant0001',
        entityId: 'plantrecord000001',
        field: 'scientificName',
        before: 'Taxus baccata',
        after: 'Taxus baccata L.',
        sourceVersion: 1,
      },
      {
        id: 'chgadmintitle0001',
        entityId: 'projconcept000001',
        field: 'title',
        before: 'Koncepcja cienistego ogrodu',
        after: 'Koncepcja ogrodu w cieniu',
        sourceVersion: 1,
      },
    ],
  });
}

export function getApprovalFabric(options?: { reset?: boolean }): Fabric {
  if (options?.reset || !fabric) {
    fabric = createFabric();
    seedStudio(fabric);
  }
  return fabric;
}

export function listApprovalProposals(store: Fabric = getApprovalFabric()): ApprovalProposal[] {
  return store.changeSets.map(mapProposal);
}

export function reviewApprovalProposal(input: {
  changeSetId: string;
  action: ApprovalAction;
  selectedIds?: string[];
  edits?: Array<{ changeId: string; after: string }>;
  store?: Fabric;
  at?: string;
  overrideProbe?: string;
}): ApprovalProposal {
  if (input.overrideProbe) {
    assertAgnieszkaCannotOverride(input.overrideProbe);
  }
  const store = input.store ?? getApprovalFabric();
  const changeSet = review(store, {
    changeSetId: input.changeSetId,
    action: input.action,
    reviewer: 'agnieszka',
    selectedIds: input.selectedIds,
    edits: input.edits,
  });
  if (changeSet.status === 'APPROVED' || changeSet.status === 'PARTIAL') {
    const stamp = input.at ?? new Date().toISOString();
    const causationId = `cause${changeSet.id}`.replace(/[^a-z0-9]/gi, '').padEnd(16, '0').slice(0, 32);
    const eventId = `event${changeSet.id}`.replace(/[^a-z0-9]/gi, '').padEnd(16, '0').slice(0, 32);
    applyApproved(store, {
      changeSetId: changeSet.id,
      at: stamp,
      causationId,
      eventId,
    });
  }
  return mapProposal(changeSet);
}
