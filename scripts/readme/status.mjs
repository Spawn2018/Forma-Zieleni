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
