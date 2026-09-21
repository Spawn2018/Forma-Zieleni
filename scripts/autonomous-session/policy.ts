export type Classification = 'AUTO' | 'REVIEW' | 'OWNER-DECISION' | 'OWNER-ONLY' | 'DANGEROUS';
export type Capability = 'repo-audit' | 'canon-audit' | 'choose-audit';
export type Slice = {
  id: string;
  capability: string;
  classification: string;
  dependsOn: string[];
};

// Authority comes from compiled capabilities, never from model or plan labels.
const capabilities: Readonly<Record<string, Classification>> = Object.freeze({
  'repo-audit': 'AUTO',
  'canon-audit': 'REVIEW',
  'choose-audit': 'OWNER-DECISION',
});
const dangerous = /production|deploy|dns|cloudflare|secret|payment|cutover|delete|migration|destruct|git[ -](push|reset|clean|checkout|switch)|shell|command/i;

export function classify(slice: Slice): Classification {
  if (slice.classification === 'DANGEROUS' || dangerous.test(slice.capability)) return 'DANGEROUS';
  if (slice.classification === 'OWNER-ONLY') return 'OWNER-ONLY';
  const floor = Object.hasOwn(capabilities, slice.capability) ? capabilities[slice.capability] : undefined;
  if (!floor || !['AUTO', 'REVIEW', 'OWNER-DECISION'].includes(slice.classification)) return 'OWNER-ONLY';
  if (floor === 'OWNER-DECISION' || slice.classification === 'OWNER-DECISION') return 'OWNER-DECISION';
  return floor === 'REVIEW' || slice.classification === 'REVIEW' ? 'REVIEW' : 'AUTO';
}

export function validateSlices(value: unknown): Slice[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 32) throw new Error('INVALID_PLAN');
  const ids = new Set<string>();
  const slices: Slice[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Object.keys(item).some(k => !['id', 'capability', 'classification', 'dependsOn'].includes(k)) ||
        typeof item.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(item.id) || ids.has(item.id) ||
        typeof item.capability !== 'string' || item.capability.length > 100 || typeof item.classification !== 'string' ||
        !Array.isArray(item.dependsOn) || item.dependsOn.some((id: unknown) => typeof id !== 'string' || !ids.has(id))) {
      throw new Error('INVALID_PLAN');
    }
    ids.add(item.id);
    slices.push({ id: item.id, capability: item.capability, classification: item.classification, dependsOn: [...item.dependsOn] });
  }
  return slices;
}

export function limits(maxIterations: number, retryBudget: number, deadline: string | null): void {
  if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > 100 ||
      !Number.isInteger(retryBudget) || retryBudget < 0 || retryBudget > 3 ||
      (deadline !== null && (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(deadline) || !Number.isFinite(Date.parse(deadline))))) {
    throw new Error('INVALID_LIMITS');
  }
}
