import { readFileSync } from 'node:fs';
import path from 'node:path';
import { evaluateEffect } from './effect.mjs';
import { checkLearningCoverage } from './learning-coverage.mjs';
import { checkExperienceContracts } from '../requirements/experience-contract.mjs';
import { checkQualityCoverage } from '../requirements/quality-coverage.mjs';
import { pushBlockers, TRACKED_PROMOTION_TARGETS, validateRecord } from './policy.mjs';

export const FITNESS = [
  {
    id: 'single-cis-canon',
    property: 'FZ-CIS has one binding architecture document',
    reason: 'Learning rules must not fork into competing Canon',
    mechanism: 'Exactly one Markdown file starts with the FZ-CIS title',
    failure: 'Agents can follow two improvement policies',
    owner: 'repository integrity',
  },
  {
    id: 'learning-store-safe',
    property: 'Tracked learning records validate and do not erode Owner gates',
    reason: 'Evidence must stay data, without secrets or authority changes',
    mechanism: 'records.json parses, each record validates, critical security blockers stay visible',
    failure: 'A poisoned or secret-bearing record is treated as repository evidence',
    owner: 'FZ orchestrator',
  },
  {
    id: 'execution-loop-unchanged',
    property: 'CURSOR-OS remains the only binding execution loop',
    reason: 'FZ-CIS learns around execution and must not replace it',
    mechanism: 'CURSOR-OS still names itself the sole binding definition',
    failure: 'A second loop can select or skip work',
    owner: 'FZ orchestrator',
  },
  {
    id: 'proven-requires-effect',
    property: 'PROVEN records must carry a supported VERIFY EFFECT result',
    reason: 'Agents must not declare PROVEN without effect evidence',
    mechanism: 'Every tracked PROVEN/PROMOTED row evaluates to effectState SUPPORTED with a plan',
    failure: 'A status forge can skip VERIFY EFFECT',
    owner: 'FZ orchestrator',
  },
  {
    id: 'promoted-requires-control',
    property: 'PROMOTED records reference a real durable control',
    reason: 'Promotion means standardization into an enforceable artifact',
    mechanism: 'Every tracked PROMOTED row has controlRef (and controlCommit when tracked)',
    failure: 'A learning row can claim promotion without a durable control',
    owner: 'FZ orchestrator',
  },
  {
    id: 'learning-coverage-closed',
    property: 'Every binding capability has one FZ-CIS learning classification',
    reason: 'A capability without a learning class is an unknown, and a second learning store would split evidence',
    mechanism: 'Product scope and the required matrix resolve through checkLearningCoverage',
    failure: 'A binding capability is unclassified, operational without a repository signal, or missing effect and counter-evidence',
    owner: 'FZ orchestrator',
  },
  {
    id: 'experience-contract-closed',
    property: 'User-facing capabilities have a purpose, workflow, and visual gate',
    reason: 'A screen that only matches a mockup, or a workflow with no surface, is not complete',
    mechanism: 'checkExperienceContracts against product scope and the approved reference paths',
    failure: 'An orphan screen, missing downstream path, or unreviewed visual acceptance can pass',
    owner: 'FZ orchestrator',
  },
  {
    id: 'quality-coverage-closed',
    property: 'Every binding capability has one quality classification and safe-now gates',
    reason: 'A green unit suite is not a classified journey, and a second quality system would split the factory',
    mechanism: 'checkQualityCoverage over product scope, journeys, architecture imports, and code health',
    failure: 'An unclassified capability, fake production pass, semantic duplicate, or untracked debt can ship',
    owner: 'FZ orchestrator',
  },
];

function titleCount(files, root) {
  const header = '# FZ Continuous Improvement System\n';
  return files.filter((file) => {
    if (!file.endsWith('.md')) return false;
    const text = readFileSync(path.join(root, file), 'utf8');
    return text.startsWith(header) || text.startsWith(header.replace('\n', '\r\n'));
  });
}

export function checkFitness(root, files) {
  const errors = [];
  const titles = titleCount(files, root);
  if (titles.length !== 1 || titles[0] !== 'docs/architecture/FZ-CONTINUOUS-IMPROVEMENT.md') {
    errors.push(`single-cis-canon failed: ${titles.join(', ') || 'none'}`);
  }
  const loop = readFileSync(path.join(root, 'docs/cursor-os/CURSOR-OS-2026.md'), 'utf8');
  if (!loop.includes('sole binding definition')) errors.push('execution-loop-unchanged failed');
  const storePath = path.join(root, 'docs/engineering/learning/records.json');
  let store;
  try {
    store = JSON.parse(readFileSync(storePath, 'utf8'));
  } catch {
    errors.push('learning-store-safe failed: records.json is not JSON');
    return errors;
  }
  if (!store || store.version !== 1 || !Array.isArray(store.records)) {
    errors.push('learning-store-safe failed: invalid store');
    return errors;
  }
  for (const record of store.records) {
    const checked = validateRecord(record, 'stored');
    if (!checked.ok) errors.push(`learning-store-safe failed: ${record.id || 'record'} ${checked.errors.join(',')}`);
    if (['PROVEN', 'PROMOTED'].includes(record.status)) {
      const effect = evaluateEffect(record);
      if (!record.effectPlan || effect.effectState !== 'SUPPORTED' || !effect.supported) {
        errors.push(`proven-requires-effect failed: ${record.id}`);
      }
    }
    if (record.status === 'PROMOTED') {
      if (!record.controlRef) errors.push(`promoted-requires-control failed: ${record.id} missing controlRef`);
      else if (
        TRACKED_PROMOTION_TARGETS.has(record.promotionTarget)
        && !String(record.controlRef).startsWith('ext:')
        && !record.controlCommit
      ) {
        errors.push(`promoted-requires-control failed: ${record.id} missing controlCommit`);
      }
    }
  }
  const coverage = checkLearningCoverage();
  if (!coverage.ok) {
    errors.push(`learning-coverage-closed failed: ${coverage.errors.slice(0, 8).join('; ')}`);
  }
  const experience = checkExperienceContracts();
  if (!experience.ok) {
    errors.push(`experience-contract-closed failed: ${experience.errors.slice(0, 8).join('; ')}`);
  }
  const quality = checkQualityCoverage({ root });
  if (!quality.ok) {
    errors.push(`quality-coverage-closed failed: ${quality.errors.slice(0, 8).join('; ')}`);
  }
  for (const blocker of pushBlockers(store.records)) {
    if (!blocker.id) errors.push('learning-store-safe failed: critical blocker without id');
  }
  return errors;
}
