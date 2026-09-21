const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export type CaptureKeyInput = {
  peer: string | null;
  forwardedFor: string | null;
  trustProxy: boolean;
  trustedPeers: readonly string[];
};

function isIp(value: string): boolean {
  if (value.length === 0 || value.length > 64) return false;
  if (IPV4.test(value)) return value.split('.').every(part => Number(part) <= 255);
  return value.includes(':') && /^[0-9a-fA-F:]+$/.test(value);
}

export function captureKey(input: CaptureKeyInput): string | null {
  if (!input.peer) return null;
  if (input.trustProxy && input.trustedPeers.includes(input.peer)) {
    const hops = (input.forwardedFor ?? '').split(',').map(item => item.trim()).filter(Boolean);
    const client = hops.at(-1);
    return client && isIp(client) ? `fwd:${client}` : null;
  }
  return `peer:${input.peer}`;
}

export class WindowLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  constructor(limit: number, windowMs: number, maxKeys = 4096) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  size(now: number): number {
    this.sweep(now);
    return this.hits.size;
  }

  allow(key: string, now: number): boolean {
    this.sweep(now);
    const current = this.hits.get(key);
    if (!current) {
      if (this.hits.size >= this.maxKeys) return false;
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (current.count >= this.limit) return false;
    current.count += 1;
    return true;
  }

  private sweep(now: number): void {
    for (const [key, value] of this.hits) {
      if (now >= value.resetAt) this.hits.delete(key);
    }
  }
}
