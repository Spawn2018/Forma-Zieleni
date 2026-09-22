import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Machine-detectable ZAP readiness.
 * Never claims PASS without a real scan against a meaningful lab target.
 */
export function evaluateZapReadiness(input = {}) {
  const env = input.env || process.env;
  const openapi = input.openapiPath || path.join(root, 'contracts', 'openapi.json');
  const automation = input.automationPath || path.join(root, 'tooling', 'security', 'zap', 'automation.yaml');
  const hasPlan = existsSync(openapi) && existsSync(automation);
  const targetUrl = String(env.FZ_ZAP_TARGET_URL || input.targetUrl || '').trim();
  const productionLike = /forma-zieleni\.|cloudflare|ct8\.|production/i.test(targetUrl);
  const runtimePresent = Boolean(input.zapBin || env.ZAP_BIN || input.dockerAvailable);
  const targetReachable = input.targetReachable === true;
  const syntheticOnly = input.syntheticData !== false;

  const activationCondition = {
    require: [
      'tooling/security/zap/automation.yaml present',
      'contracts/openapi.json present',
      'FZ_ZAP_TARGET_URL points at isolated lab localhost/CI service',
      'target readiness probe returns success',
      'ZAP runtime available (ZAP_BIN or authorized CI image)',
      'synthetic/non-sensitive data only',
      'not production / not Cloudflare production ingress / not CT8',
    ],
    envFlag: 'FZ_ZAP_TARGET_URL',
  };

  if (productionLike) {
    return {
      state: 'BLOCKED_BY_REAL_DEPENDENCY',
      realScanPerformed: false,
      reason: 'production_or_customer_target_forbidden',
      activationCondition,
      hasPlan,
    };
  }

  if (!hasPlan) {
    return {
      state: 'BLOCKED_BY_REAL_DEPENDENCY',
      realScanPerformed: false,
      reason: 'automation_or_openapi_missing',
      activationCondition,
      hasPlan,
    };
  }

  // apps/api currently requires PostgreSQL + secrets to listen; no durable free-standing lab listen.
  if (!targetUrl || !targetReachable || !runtimePresent || !syntheticOnly) {
    return {
      state: 'ARMED_WAITING_FOR_TARGET',
      realScanPerformed: false,
      reason: !targetUrl
        ? 'no_lab_target_url'
        : !targetReachable
          ? 'lab_target_not_reachable'
          : !runtimePresent
            ? 'zap_runtime_unavailable'
            : 'synthetic_data_required',
      activationCondition,
      hasPlan,
      notes: 'Do not fabricate an app solely for ZAP. Activate when a real WWW/API/Admin/Portal lab target listens.',
    };
  }

  return {
    state: 'ACTIVE_REAL_TARGET',
    realScanPerformed: false,
    reason: 'ready_to_scan',
    activationCondition,
    hasPlan,
    targetUrl,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  console.log(JSON.stringify(evaluateZapReadiness(), null, 2));
}
