/**
 * Executable-path coverage for unfinished binding internal requirements.
 * Driven by registry metadata — not a hard-coded capability name list.
 */

const OWNER_GATES = new Set(['OWNER-DECISION', 'OWNER-ONLY', 'DANGEROUS']);
const REAL_BLOCKERS = new Set([
  'OWNER_GATED',
  'EXTERNAL',
  'PRODUCTION_ONLY',
  'VENDOR_ACCEPTANCE',
  'SECURITY_ACCEPTANCE_ONLY',
]);

const UNFINISHED = new Set([
  'BLOCKED_BY_DEPENDENCY',
  'INCOMPLETE_SAFE',
  'OWNER_GATED',
  'PRODUCTION_ONLY',
  'NOT_MEASURABLE_YET',
]);

export function normalizeBlockerClass(row) {
  if (row.blockerClass) return row.blockerClass;
  if (OWNER_GATES.has(row.gate) || row.status === 'OWNER_GATED') return 'OWNER_GATED';
  if (row.status === 'PRODUCTION_ONLY' || row.status === 'NOT_MEASURABLE_YET') return 'PRODUCTION_ONLY';
  if (/^external\b/i.test(row.dependency || '')) return 'EXTERNAL';
  if (/vendor acceptance|CMS-ACCEPT|SEARCH-ACCEPT/i.test(`${row.dependency || ''} ${row.gap || ''}`)) {
    return 'VENDOR_ACCEPTANCE';
  }
  if (/security-accept|ZAP|Dependency-Check/i.test(`${row.dependency || ''} ${row.gap || ''}`)) {
    return 'SECURITY_ACCEPTANCE_ONLY';
  }
  return 'INTERNAL';
}

export function isUnfinishedBinding(row) {
  if (!row || !row.id) return false;
  return UNFINISHED.has(row.status);
}

export function isInternalImplementable(row) {
  const blocker = normalizeBlockerClass(row);
  if (REAL_BLOCKERS.has(blocker)) return false;
  if (OWNER_GATES.has(row.gate)) return false;
  return blocker === 'INTERNAL';
}

/**
 * Every unfinished binding internal requirement must declare an executable
 * slice id (or a real non-internal blocker). Missing declaration is a
 * validation failure — the "documented but no path" seventh state.
 */
export function missingExecutablePathDeclarations(requirements = []) {
  const missing = [];
  for (const row of requirements) {
    if (!isUnfinishedBinding(row)) continue;
    if (!isInternalImplementable(row)) continue;
    if (row.safePreblockerWork === false) continue;
    const slice = String(row.executableSlice || '').trim();
    if (!slice) missing.push(row.id);
  }
  return missing;
}

/**
 * Materialization gap: binding internal work has a declared slice, predecessors
 * on the graph are COMPLETE (or absent from the graph), but the slice row
 * itself is missing. That is never exhaustion and never Owner roadmap refresh.
 */
export function registryMaterializationGap(requirements = [], slices = []) {
  const ids = new Set(slices.map((slice) => slice.id));
  const complete = new Set(
    slices.filter((slice) => slice.status === 'COMPLETE').map((slice) => slice.id),
  );
  for (const row of requirements) {
    if (!isUnfinishedBinding(row) || !isInternalImplementable(row)) continue;
    if (row.safePreblockerWork === false) continue;
    const sliceId = String(row.executableSlice || '').trim();
    if (!sliceId) continue;
    if (ids.has(sliceId)) continue;
    const when = Array.isArray(row.executableWhenComplete) ? row.executableWhenComplete : [];
    const predecessorsMet = when.length === 0 || when.every((id) => complete.has(id));
    if (predecessorsMet) {
      return {
        id: sliceId,
        requirementId: row.id,
        reason: `${row.id} is an unfinished binding internal requirement. Materialize executable slice ${sliceId}; do not treat omission as Owner roadmap refresh or exhaustion.`,
      };
    }
  }
  return null;
}

/**
 * Product capability completeness: foundation-only DONE rows do not make the
 * whole capability complete while sibling unfinished rows remain.
 */
export function productCapabilityStatus(requirements = [], capability) {
  const rows = requirements.filter(
    (row) => row.productCapability === capability || String(row.id).startsWith(`FZ-REQ-${capability}-`),
  );
  if (rows.length === 0) {
    return {
      capability,
      complete: false,
      foundationComplete: false,
      unfinishedRequirementIds: [],
      reason: 'NO_ROWS',
    };
  }
  const unfinished = rows.filter((row) => isUnfinishedBinding(row));
  const foundationDone = rows.some((row) => row.foundationOnly === true && row.status === 'DONE_AT_MAX_DEPTH');
  const productRows = rows.filter((row) => row.foundationOnly !== true);
  if (unfinished.length > 0) {
    return {
      capability,
      complete: false,
      foundationComplete: foundationDone,
      unfinishedRequirementIds: unfinished.map((row) => row.id),
      reason: foundationDone ? 'SHELL_OR_FOUNDATION_NOT_PRODUCT' : 'UNFINISHED',
    };
  }
  if (productRows.length === 0) {
    return {
      capability,
      complete: false,
      foundationComplete: foundationDone,
      unfinishedRequirementIds: [],
      reason: 'FOUNDATION_ONLY',
    };
  }
  return {
    capability,
    complete: productRows.every((row) => row.status === 'DONE_AT_MAX_DEPTH'),
    foundationComplete: foundationDone,
    unfinishedRequirementIds: [],
    reason: 'COMPLETE',
  };
}

/** Portal shell/foundation ≠ authenticated product with projections. */
export function portalCapabilityIsProductComplete(requirements = []) {
  const status = productCapabilityStatus(requirements, 'PORTAL');
  return status.complete === true;
}

export function exhaustionAllowedFor(requirements = [], slices = [], selected = null) {
  if (selected) return false;
  if (missingExecutablePathDeclarations(requirements).length > 0) return false;
  if (registryMaterializationGap(requirements, slices)) return false;
  return true;
}

export function scopeCoverageGaps(scope = [], requirements = []) {
  const ids = new Set(requirements.map((row) => row.id));
  const gaps = [];
  for (const item of scope) {
    if (!item || item.normative === false) continue;
    if (item.coverageStatus && item.coverageStatus !== 'COVERED_BY_REQUIREMENT') continue;
    const linked = Array.isArray(item.requirementIds) ? item.requirementIds : [];
    if (linked.length === 0 || linked.some((id) => !ids.has(id))) gaps.push(item.id);
  }
  return gaps;
}

export function missingRequiredDepths(requirements = [], models = []) {
  const missing = [];
  for (const model of models) {
    for (const depth of model.requiredDepths || []) {
      const found = requirements.some((row) => row.productCapability === model.capability && row.depth === depth);
      if (!found) missing.push(`${model.capability}:${depth}`);
    }
  }
  return missing;
}

function depthRows(requirements, capability, depth) {
  return requirements.filter((row) => row.productCapability === capability && row.depth === depth);
}

function depthSettled(rows) {
  return rows.length > 0 && rows.every((row) => row.status === 'DONE_AT_MAX_DEPTH' || !isInternalImplementable(row) || row.safePreblockerWork === false);
}

export function parentProductReport(requirements = [], model) {
  const missing = (model.requiredDepths || []).filter((depth) => depthRows(requirements, model.capability, depth).length === 0);
  const open = [];
  for (const depth of model.requiredDepths || []) {
    const rows = depthRows(requirements, model.capability, depth);
    if (rows.length === 0) continue;
    if (!depthSettled(rows)) open.push(depth);
  }
  return {
    capability: model.capability,
    complete: missing.length === 0 && open.length === 0,
    missingDepths: missing,
    openDepths: open,
  };
}

export function proseOnlyFutureDepths(requirements = [], models = []) {
  const hits = [];
  for (const model of models) {
    const siblings = requirements.filter((row) => row.productCapability === model.capability);
    const later = siblings.some((row) => /\blater\b/i.test(`${row.gap || ''} ${row.description || ''}`));
    for (const depth of model.requiredDepths || []) {
      if (depthRows(requirements, model.capability, depth).length === 0 && later) {
        hits.push(`${model.capability}:${depth}`);
      }
    }
  }
  return hits;
}

export function currentBindingDepthExhausted(requirements = [], slices = []) {
  if (missingExecutablePathDeclarations(requirements).length > 0) return false;
  if (registryMaterializationGap(requirements, slices)) return false;
  return !requirements.some((row) => isUnfinishedBinding(row) && isInternalImplementable(row) && row.safePreblockerWork !== false);
}

export function masterProductScopeExhausted(requirements = [], slices = [], scope = [], models = []) {
  if (!currentBindingDepthExhausted(requirements, slices)) return false;
  if (scopeCoverageGaps(scope, requirements).length > 0) return false;
  if (missingRequiredDepths(requirements, models).length > 0) return false;
  if (proseOnlyFutureDepths(requirements, models).length > 0) return false;
  return models.every((model) => parentProductReport(requirements, model).complete);
}
