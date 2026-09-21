const AI_HOSTS = new Set(['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai']);
const TOKEN = /^[a-z0-9_-]{1,80}$/;

export type AttributionTouch = {
  referrerDomain: string | null;
  searchSourceClass: 'UNKNOWN' | 'REFERRAL' | 'AI_REFERRAL';
  aiReferralProvider: string | null;
  landingPage: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

export function sanitizeAttribution(input: {
  referrer?: string | null;
  landingPage?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}): AttributionTouch {
  const host = referrerHost(input.referrer);
  const ai = host !== null && AI_HOSTS.has(host) ? host : null;
  return {
    referrerDomain: host,
    searchSourceClass: ai ? 'AI_REFERRAL' : host ? 'REFERRAL' : 'UNKNOWN',
    aiReferralProvider: ai,
    landingPage: landingPath(input.landingPage),
    utmSource: token(input.utmSource),
    utmMedium: token(input.utmMedium),
    utmCampaign: token(input.utmCampaign),
    utmContent: token(input.utmContent),
    utmTerm: token(input.utmTerm),
  };
}

function referrerHost(value: string | null | undefined): string | null {
  if (value == null || value.trim() === '') return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host.length > 253) return null;
  return host;
}

function landingPath(value: string | null | undefined): string | null {
  if (value == null || value.trim() === '') return null;
  const pathOnly = value.split('?')[0]?.split('#')[0] ?? '';
  if (!pathOnly.startsWith('/') || pathOnly.startsWith('//') || pathOnly.length > 200) return null;
  return pathOnly;
}

function token(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim().toLowerCase();
  if (!TOKEN.test(trimmed)) return null;
  return trimmed;
}
