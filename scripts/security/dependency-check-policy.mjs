/**
 * OWASP Dependency-Check policy for the current JS/Node monorepo.
 * Does not install Java and does not claim production security acceptance.
 */
export function evaluateDependencyCheck(input = {}) {
  const pnpmAuditActive = input.pnpmAuditActive !== false;
  const javaPresent = input.javaPresent === true;
  const hasNativeNonNpm = input.hasNativeNonNpm === true;
  const nvdFeedAuthorized = input.nvdFeedAuthorized === true;

  if (pnpmAuditActive && !hasNativeNonNpm) {
    return {
      state: 'NOT_JUSTIFIED',
      realExecutionPerformed: false,
      reason: 'pnpm_audit_covers_npm_graph',
      activeProtection: 'pnpm audit --audit-level=moderate (local pre-push + GitHub Actions Verify)',
      deferUntil: 'non-npm native artifacts or Owner-authorized NVD/CI budget',
      productionSecurityAcceptance: 'OPEN',
    };
  }

  if (!javaPresent && !input.ciImageProvidesDc) {
    return {
      state: 'DEFERRED',
      realExecutionPerformed: false,
      reason: 'java_or_authorized_ci_image_required',
      productionSecurityAcceptance: 'OPEN',
    };
  }

  if (!nvdFeedAuthorized) {
    return {
      state: 'DEFERRED',
      realExecutionPerformed: false,
      reason: 'nvd_feed_or_ci_cost_not_authorized',
      productionSecurityAcceptance: 'OPEN',
    };
  }

  return {
    state: 'ACTIVE',
    realExecutionPerformed: false,
    reason: 'authorized_but_not_run_in_this_evaluation',
    productionSecurityAcceptance: 'OPEN',
  };
}
