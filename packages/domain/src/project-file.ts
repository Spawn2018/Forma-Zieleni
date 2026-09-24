import { assertOpaqueProjectId, type Project } from './project.ts';

const OPAQUE_ID = /^[a-z][a-z0-9]{15,63}$/;

/**
 * Metadata-only project file owned by Core API.
 * Binary bytes and storage providers stay outside this projection slice.
 */
export type ProjectFile = {
  id: string;
  projectId: string;
  /** Portal client subject authorized to read a client-safe projection. Null = staff-only. */
  clientSubject: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
};

/** Fields a portal client may see. No storage keys, paths, or staff machine fields. */
export type PortalProjectFileProjection = {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type CreateProjectFileInput = {
  name: string;
  mimeType: string;
  sizeBytes: number;
  clientSubject?: string | null;
};

export function assertOpaqueProjectFileId(id: string): string {
  if (!OPAQUE_ID.test(id) || /^(?:file|fil|id)\d+$/i.test(id)) {
    throw new Error('PROJECT_FILE_ID_GUESSABLE');
  }
  return id;
}

export function createProjectFile(
  id: string,
  project: Project,
  input: CreateProjectFileInput,
  at: string,
): ProjectFile {
  const name = input.name.trim();
  if (!name || name.length > 255) throw new Error('PROJECT_FILE_NAME_INVALID');
  const mimeType = input.mimeType.trim();
  if (!mimeType || mimeType.length > 200) throw new Error('PROJECT_FILE_MIME_INVALID');
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes < 0 || input.sizeBytes > 5_368_709_120) {
    throw new Error('PROJECT_FILE_SIZE_INVALID');
  }
  let clientSubject = input.clientSubject === undefined ? project.clientSubject : input.clientSubject;
  if (clientSubject !== null && clientSubject !== undefined) {
    const subject = clientSubject.trim();
    if (!subject || subject.length > 128) throw new Error('CLIENT_SUBJECT_INVALID');
    clientSubject = subject;
  } else {
    clientSubject = null;
  }
  return {
    id: assertOpaqueProjectFileId(id),
    projectId: assertOpaqueProjectId(project.id),
    clientSubject,
    name,
    mimeType,
    sizeBytes: input.sizeBytes,
    createdAt: at,
    updatedAt: at,
  };
}

export function projectFileForPortal(
  file: ProjectFile,
  readerSubject: string,
): PortalProjectFileProjection | null {
  if (!file.clientSubject || file.clientSubject !== readerSubject) return null;
  return {
    id: file.id,
    projectId: file.projectId,
    name: file.name,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    createdAt: file.createdAt,
  };
}
