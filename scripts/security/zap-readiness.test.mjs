import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateZapReadiness } from './zap-readiness.mjs';
import { evaluateDependencyCheck } from './dependency-check-policy.mjs';

test('ZAP stays armed until a lab target and runtime exist', () => {
  const armed = evaluateZapReadiness({ env: {}, dockerAvailable: false, targetReachable: false });
  assert.equal(armed.state, 'ARMED_WAITING_FOR_TARGET');
  assert.equal(armed.realScanPerformed, false);
  assert.ok(armed.activationCondition.envFlag === 'FZ_ZAP_TARGET_URL');
  assert.equal(armed.hasPlan, true);
});

test('ZAP refuses non-lab hosts', () => {
  const blocked = evaluateZapReadiness({
    env: { FZ_ZAP_TARGET_URL: 'https://customer.example.com' },
    targetReachable: true,
    zapBin: 'zap.sh',
    syntheticData: true,
  });
  assert.equal(blocked.state, 'BLOCKED_BY_REAL_DEPENDENCY');
});

test('ZAP reports ACTIVE_REAL_TARGET only when lab conditions are met', () => {
  const ready = evaluateZapReadiness({
    env: { FZ_ZAP_TARGET_URL: 'http://127.0.0.1:3000' },
    targetReachable: true,
    zapBin: 'zap.sh',
    syntheticData: true,
  });
  assert.equal(ready.state, 'ACTIVE_REAL_TARGET');
  assert.equal(ready.realScanPerformed, false);
  const missingSynthetic = evaluateZapReadiness({
    env: { FZ_ZAP_TARGET_URL: 'http://127.0.0.1:3000' },
    targetReachable: true,
    zapBin: 'zap.sh',
  });
  assert.equal(missingSynthetic.state, 'ARMED_WAITING_FOR_TARGET');
});

test('Dependency-Check is not justified while pnpm audit covers the npm graph', () => {
  const decision = evaluateDependencyCheck({ pnpmAuditActive: true, javaPresent: false });
  assert.equal(decision.state, 'NOT_JUSTIFIED');
  assert.equal(decision.realExecutionPerformed, false);
  assert.equal(decision.productionSecurityAcceptance, 'OPEN');
});
