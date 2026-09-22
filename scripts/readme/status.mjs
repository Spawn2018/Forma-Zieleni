import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SURFACES = ['api', 'web', 'portal', 'admin'];

export function loadPublicSnapshot(root) {
  const coverage = JSON.parse(readFileSync(path.join(root, 'docs/engineering/requirements/FZ-DIRECTIVE-COVERAGE.json'), 'utf8'));
  const catalog = JSON.parse(readFileSync(path.join(root, 'docs/engineering/documentation-catalog.json'), 'utf8'));
  let normativeSections = 0;
  let unmappedNormativeSections = 0;
  for (const section of coverage.sections) {
    if (section.normative !== true) continue;
    normativeSections += 1;
    if (section.coverageStatus !== 'MAPPED') unmappedNormativeSections += 1;
  }
  const surfaces = {};
  for (const name of SURFACES) {
    surfaces[name] = existsSync(path.join(root, 'apps', name, 'package.json')) ? 'package-present' : 'not-built';
  }
  return {
    classification: 'UPDATED_AT_CHECKPOINT',
    normativeSections,
    unmappedNormativeSections,
    documentationRecords: catalog.documents.length,
    surfaces,
  };
}

export function renderProgress(snapshot) {
  if (snapshot.classification !== 'UPDATED_AT_CHECKPOINT') {
    throw new Error('progress classification must be UPDATED_AT_CHECKPOINT');
  }
  for (const name of SURFACES) {
    const value = snapshot.surfaces[name];
    if (value !== 'package-present' && value !== 'not-built') {
      throw new Error(`surface ${name} is not a known state`);
    }
  }
  const lines = [
    `classification: ${snapshot.classification}`,
    `normative-sections: ${snapshot.normativeSections}`,
    `unmapped-normative-sections: ${snapshot.unmappedNormativeSections}`,
    `documentation-records: ${snapshot.documentationRecords}`,
    `surface.api: ${snapshot.surfaces.api}`,
    `surface.web: ${snapshot.surfaces.web}`,
    `surface.portal: ${snapshot.surfaces.portal}`,
    `surface.admin: ${snapshot.surfaces.admin}`,
  ];
  const body = `\n${lines.join('\n')}\n`;
  if (/\d+(?:\.\d+)?\s*%/.test(body) || /@/.test(body) || /PRIVATE KEY/.test(body) || /AKIA/.test(body)) {
    throw new Error('progress output is not public-safe');
  }
  return body;
}

const DOC_TYPES = ['CANON', 'GUIDE', 'REFERENCE', 'EXPLANATION', 'RUNBOOK', 'EVIDENCE'];
const DOC_TYPE_LABEL = {
  CANON: 'Kanon',
  GUIDE: 'Przewodnik',
  REFERENCE: 'Odnośnik',
  EXPLANATION: 'Wyjaśnienie',
  RUNBOOK: 'Runbook',
  EVIDENCE: 'Dowód',
};
const DOC_AUDIENCE = {
  developer: 'developer',
  owner: 'właściciel',
  agnieszka: 'Agnieszka',
  operator: 'operator',
};

export function documentationRows(documents, fileExists = () => true) {
  const typeIndex = new Map(DOC_TYPES.map((type, index) => [type, index]));
  const audienceIndex = new Map(['owner', 'agnieszka', 'developer', 'operator'].map((audience, index) => [audience, index]));
  const sorted = [...documents].sort((a, b) => {
    const typeDelta = (typeIndex.get(a.type) ?? 99) - (typeIndex.get(b.type) ?? 99);
    if (typeDelta !== 0) return typeDelta;
    const audienceDelta = (audienceIndex.get(a.audience) ?? 99) - (audienceIndex.get(b.audience) ?? 99);
    if (audienceDelta !== 0) return audienceDelta;
    return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
  });
  const rows = ['| Typ | Czytelnik | Dokument |', '| --- | --- | --- |'];
  for (const doc of sorted) {
    if (!DOC_TYPES.includes(doc.type)) throw new Error(`documentation type ${doc.type} is not in the OS set`);
    if (!Object.hasOwn(DOC_AUDIENCE, doc.audience)) throw new Error(`documentation audience ${doc.audience} is not in the OS set`);
    if (typeof doc.path !== 'string' || doc.path.includes('..') || doc.path.startsWith('/') || doc.path.includes('legacy/')) {
      throw new Error(`documentation path ${doc.path} is not a catalog path`);
    }
    if (!fileExists(doc.path)) throw new Error(`documentation path missing ${doc.path}`);
    const title = String(doc.title).replaceAll('|', '\\|');
    rows.push(`| ${DOC_TYPE_LABEL[doc.type]} | ${DOC_AUDIENCE[doc.audience]} | [${title}](${doc.path}) |`);
  }
  return rows;
}

export function renderDocumentationCatalog(root) {
  const catalog = JSON.parse(readFileSync(path.join(root, 'docs/engineering/documentation-catalog.json'), 'utf8'));
  const rows = documentationRows(catalog.documents, (rel) => existsSync(path.join(root, rel)));
  const body = `\n${rows.join('\n')}\n`;
  if (/\d+(?:\.\d+)?\s*%/.test(body) || /PRIVATE KEY/.test(body) || /AKIA/.test(body)) {
    throw new Error('documentation catalog is not public-safe');
  }
  return body;
}
