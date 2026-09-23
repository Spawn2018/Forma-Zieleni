import { assertOpaqueProjectId, type Project } from './project.ts';
import { assertGardenOsNotTwin } from './product-boundaries.ts';

/**
 * Garden OS domain record (FZ-REQ-GARDENOS-002).
 * Links a delivered Core API project to one garden relation.
 * Not a twin database, sensor feed, or invented live garden.
 */
export type Garden = {
  id: string;
  projectId: string;
  /** Copied from the project owner for BOLA. Null = staff-only. */
  clientSubject: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Fields a portal client may see. No twin, sensor, or live-garden invent. */
export type PortalGardenProjection = {
  id: string;
  projectId: string;
  createdAt: string;
};

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

export function assertOpaqueGardenId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:garden|gdn|id)\d+$/i.test(id)) {
    throw new Error('GARDEN_ID_GUESSABLE');
  }
  return id;
}

export function assertGardenHasNoLiveInvent(claim: {
  twinDatabase?: boolean;
  liveTwinUi?: boolean;
  liveGarden?: boolean;
  sensorFeed?: boolean;
}): void {
  assertGardenOsNotTwin(claim);
  if (claim.liveGarden || claim.sensorFeed) throw new Error('GARDENOS_LIVE_INVENT_FORBIDDEN');
}

export function createGarden(id: string, project: Project, at: string): Garden {
  if (project.status !== 'delivered') throw new Error('PROJECT_NOT_DELIVERED');
  assertGardenHasNoLiveInvent({});
  return {
    id: assertOpaqueGardenId(id),
    projectId: assertOpaqueProjectId(project.id),
    clientSubject: project.clientSubject,
    createdAt: at,
    updatedAt: at,
  };
}

export function projectGardenForPortal(garden: Garden, readerSubject: string): PortalGardenProjection | null {
  if (!garden.clientSubject || garden.clientSubject !== readerSubject) return null;
  return {
    id: garden.id,
    projectId: garden.projectId,
    createdAt: garden.createdAt,
  };
}
