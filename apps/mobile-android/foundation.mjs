/**
 * Android client foundation for MOBILE-ANDROID-FOUNDATION / FZ-REQ-MOBILE-002.
 * Calls Core API only. Does not own commercial state. No Play credentials.
 */

import { leadPaths } from '../../packages/api-client/src/index.ts';
import {
  assertMobileUsesCoreApiOnly,
  mobileClientBoundary,
} from '../../packages/domain/src/product-boundaries.ts';

export const ANDROID_SURFACE = 'android';

export function androidClientFoundation() {
  const boundary = mobileClientBoundary();
  assertMobileUsesCoreApiOnly({ separateDomain: false, secondAuthz: false });
  return {
    requirementId: 'FZ-REQ-MOBILE-002',
    surface: ANDROID_SURFACE,
    businessTruth: boundary.businessTruth,
    ownsCommercialState: false,
    storeUpload: false,
    playCredentialsInTree: false,
    clientPaths: Object.freeze({
      health: leadPaths.health,
      ready: leadPaths.ready,
    }),
  };
}

export function assertAndroidDoesNotOwnCommercialState(claim = {}) {
  if (claim.localLeadStore || claim.localOpportunityStore || claim.deviceIsBusinessTruth) {
    throw new Error('ANDROID_COMMERCIAL_STATE_FORBIDDEN');
  }
  if (claim.playSigningKeyInRepo || claim.playCredentialsInTree) {
    throw new Error('ANDROID_PLAY_CREDENTIALS_FORBIDDEN');
  }
}

/**
 * Probe Core API liveness for the Android surface.
 * Injectable fetch keeps contract tests free of a live network.
 */
export async function fetchAndroidCoreHealth({
  baseUrl,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new Error('ANDROID_BASE_URL_REQUIRED');
  }
  const root = baseUrl.replace(/\/$/, '');
  try {
    const response = await fetchImpl(`${root}${leadPaths.health}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (response.status === 403 || response.status === 401) {
      return { status: 'forbidden' };
    }
    if (!response.ok) {
      return { status: 'error' };
    }
    const body = await response.json();
    if (!body || body.ok !== true) {
      return { status: 'error' };
    }
    return { status: 'ready', ok: true };
  } catch {
    return { status: 'error' };
  }
}

export async function fetchAndroidCoreReady({
  baseUrl,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new Error('ANDROID_BASE_URL_REQUIRED');
  }
  const root = baseUrl.replace(/\/$/, '');
  try {
    const response = await fetchImpl(`${root}${leadPaths.ready}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (response.status === 503) {
      return { status: 'not-ready' };
    }
    if (response.status === 403 || response.status === 401) {
      return { status: 'forbidden' };
    }
    if (!response.ok) {
      return { status: 'error' };
    }
    return { status: 'ready' };
  } catch {
    return { status: 'error' };
  }
}
