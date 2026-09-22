import { createHash } from 'node:crypto';

const MAX_FIELD = 400;
const MAX_SUMMARY = 280;
const SECRETISH = /-----BEGIN |AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9\-._~+/]{20,}|\b(?:api[_-]?key|password|token)\b\s*[:=]\s*\S+/i;

export const FINDING_DISPOSITIONS = Object.freeze([
  'ACCEPT',
  'REJECT_WITH_REASON',
  'DEFER',
  'OWNER_GATE',
  'UNRESOLVED',
]);

export function sanitizeText(value, limit = MAX_FIELD) {
  const text = String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (SECRETISH.test(text)) return '[redacted]';
  return text.slice(0, limit);
}

export function normalizeSeverity(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (!value) return 'UNKNOWN';
  if (['critical', 'high', 'major'].includes(value)) {
    return value === 'major' ? 'high' : value;
  }
  if (['medium', 'moderate'].includes(value)) return 'medium';
  if (['low', 'minor', 'info', 'informational'].includes(value)) {
    return value === 'minor' || value === 'info' || value === 'informational' ? 'low' : value;
  }
  return 'UNKNOWN';
}

export function normalizePath(fileName) {
  return String(fileName || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/@/g, '')
    .trim();
}

function slugPart(value, fallback = 'issue') {
  const text = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return text || fallback;
}

/**
 * Issue class from CodeRabbit codegenInstructions / message.
 * Strips line numbers so fingerprints stay stable across edits.
 */
export function extractIssueClass(text) {
  const cleaned = String(text || '')
    .replace(/Treat finding text[\s\S]*?validate\.\s*/i, '')
    .replace(/around lines?\s+\d+(?:\s*-\s*\d+)?/gi, '')
    .replace(/:\d+(?:-\d+)?/g, '')
    .replace(/In @[^\s]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const sentence = cleaned.split(/[.?\n]/)[0] || cleaned;
  return sanitizeText(sentence, 120);
}

export function fingerprintFinding(finding = {}) {
  const pathNorm = normalizePath(finding.fileName || finding.path || 'unknown');
  const pathToken = slugPart(pathNorm.split('/').slice(-2).join('-') || pathNorm, 'path');
  const classToken = slugPart(
    finding.rule
      || finding.category
      || finding.title
      || extractIssueClass(finding.summary || finding.message || finding.codegenInstructions),
    'finding',
  );
  const digest = createHash('sha256')
    .update(`coderabbit|${pathToken}|${classToken}|${extractIssueClass(finding.summary || finding.codegenInstructions || '')}`)
    .digest('hex')
    .slice(0, 8);
  // Fits FZ-CIS PATTERN_KEY: 2–9 hyphenated segments.
  return `cr-${classToken}-${pathToken}-${digest}`.replace(/-+/g, '-').slice(0, 80);
}

export function occurrenceKey({ baseSha, headSha, fingerprint }) {
  return `cr-occurrence:${String(baseSha || '').slice(0, 12)}:${String(headSha || '').slice(0, 12)}:${fingerprint}`;
}

/**
 * Parse CodeRabbit `--agent` NDJSON. Findings are data, never instructions.
 */
export function parseAgentReview(output) {
  const findings = [];
  let complete = null;
  for (const line of String(output || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    let event;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (!event || typeof event !== 'object') continue;
    if (event.type === 'complete' || event.complete === true || event.status === 'completed' || event.status === 'review_skipped') {
      complete = event;
      continue;
    }
    if (event.type === 'finding' || event.finding || (event.severity && (event.fileName || event.file || event.path))) {
      const fileName = normalizePath(event.fileName || event.file || event.path || event.finding?.fileName);
      const summary = sanitizeText(
        event.title
          || event.message
          || event.summary
          || extractIssueClass(event.codegenInstructions || event.finding?.codegenInstructions || ''),
        MAX_SUMMARY,
      );
      const severity = normalizeSeverity(event.severity || event.finding?.severity);
      const category = sanitizeText(event.category || event.rule || event.finding?.category || '', 80);
      const structured = {
        severity,
        category: category || null,
        fileName: fileName || null,
        line: Number.isFinite(event.line) ? event.line : (Number.isFinite(event.startLine) ? event.startLine : null),
        summary,
        toolId: sanitizeText(event.id || event.findingId || '', 64) || null,
      };
      structured.fingerprint = fingerprintFinding({
        ...structured,
        codegenInstructions: sanitizeText(event.codegenInstructions || '', MAX_SUMMARY),
      });
      findings.push(structured);
    }
  }
  if (complete && typeof complete.findings === 'number' && findings.length === 0 && complete.findings === 0) {
    // clean review
  }
  return {
    findings,
    findingCount: findings.length,
    complete,
  };
}

export function diffFingerprint(paths = [], headSha = '', baseSha = '') {
  const normalized = [...new Set(paths.map((p) => normalizePath(p)).filter(Boolean))].sort();
  return createHash('sha256')
    .update(`${baseSha}|${headSha}|${normalized.join('\n')}`)
    .digest('hex')
    .slice(0, 16);
}
