import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function isLabHost(targetUrl) {
  try {
    const url = new URL(targetUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return host === '127.0.0.1' || host === 'localhost' || host === '::1';
  } catch {
    return false;
  }
}

async function probeTarget(targetUrl, timeoutMs = 2000) {
  if (!targetUrl) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(targetUrl, { method: 'GET', signal: controller.signal, redirect: 'manual' });
    return response.status > 0 && response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

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
  const labHost = targetUrl ? isLabHost(targetUrl) : false;
  const productionLike = Boolean(targetUrl) && !labHost;
  const runtimePresent = Boolean(input.zapBin || env.ZAP_BIN);
  const targetReachable = input.targetReachable === true;
  const syntheticOnly = input.syntheticData === true;

  const activationCondition = {
    require: [
      'tooling/security/zap/automation.yaml present',
      'contracts/openapi.json present',
      'FZ_ZAP_TARGET_URL is loopback lab only (127.0.0.1/localhost)',
      'target readiness probe returns success',
      'ZAP runtime available via ZAP_BIN',
      'syntheticData === true',
      'not production / not Cloudflare production ingress / not CT8',
    ],
    envFlag: 'FZ_ZAP_TARGET_URL',
  };

  if (productionLike) {
    return {
      state: 'BLOCKED_BY_REAL_DEPENDENCY',
      realScanPerformed: false,
      reason: 'non_lab_host_forbidden',
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

export async function evaluateZapReadinessCli(env = process.env) {
  const targetUrl = String(env.FZ_ZAP_TARGET_URL || '').trim();
  const targetReachable = targetUrl ? await probeTarget(targetUrl) : false;
  return evaluateZapReadiness({
    env,
    targetUrl,
    targetReachable,
    zapBin: env.ZAP_BIN,
    syntheticData: env.FZ_ZAP_SYNTHETIC === '1' || env.FZ_ZAP_SYNTHETIC === 'true',
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  evaluateZapReadinessCli().then((result) => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
