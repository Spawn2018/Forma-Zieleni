/**
 * iOS client foundation for MOBILE-IOS-FOUNDATION / FZ-REQ-MOBILE-003.
 * Calls Core API only. Does not own commercial state. No App Store credentials.
 */

import { leadPaths } from '../../packages/api-client/src/index.ts';
import {
  assertMobileUsesCoreApiOnly,
  mobileClientBoundary,
} from '../../packages/domain/src/product-boundaries.ts';

export const IOS_SURFACE = 'ios';

export function iosClientFoundation() {
  const boundary = mobileClientBoundary();
  assertMobileUsesCoreApiOnly({ separateDomain: false, secondAuthz: false });
  return {
    requirementId: 'FZ-REQ-MOBILE-003',
    surface: IOS_SURFACE,
    businessTruth: boundary.businessTruth,
    ownsCommercialState: false,
    storeUpload: false,
    appStoreCredentialsInTree: false,
    clientPaths: Object.freeze({
      health: leadPaths.health,
      ready: leadPaths.ready,
    }),
  };
}

export function assertIosDoesNotOwnCommercialState(claim = {}) {
  if (claim.localLeadStore || claim.localOpportunityStore || claim.deviceIsBusinessTruth) {
    throw new Error('IOS_COMMERCIAL_STATE_FORBIDDEN');
  }
  if (claim.appStoreSigningKeyInRepo || claim.appStoreCredentialsInTree) {
    throw new Error('IOS_APP_STORE_CREDENTIALS_FORBIDDEN');
  }
}

export const IOS_PROBE_TIMEOUT_MS = 8000;

/**
 * Probe Core API liveness for the iOS surface.
 * Injectable fetch keeps contract tests free of a live network.
 */
export async function fetchIosCoreHealth({
  baseUrl,
  fetchImpl = globalThis.fetch,
  timeoutMs = IOS_PROBE_TIMEOUT_MS,
} = {}) {
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new Error('IOS_BASE_URL_REQUIRED');
  }
  const root = baseUrl.replace(/\/$/, '');
  try {
    const response = await fetchImpl(`${root}${leadPaths.health}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
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

export async function fetchIosCoreReady({
  baseUrl,
  fetchImpl = globalThis.fetch,
  timeoutMs = IOS_PROBE_TIMEOUT_MS,
} = {}) {
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new Error('IOS_BASE_URL_REQUIRED');
  }
  const root = baseUrl.replace(/\/$/, '');
  try {
    const response = await fetchImpl(`${root}${leadPaths.ready}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
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
