import { createHash } from 'node:crypto';

const MAX_FIELD = 400;
const MAX_SUMMARY = 280;
const SECRETISH = /-----BEGIN |AKIA[0-9A-Z]{16}|Bearer [A-Za-z0-9\-._~+/]{20,}|\b(?:api[_-]?key|secret|password|token)\b\s*[:=]\s*\S+/i;

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
  const sentence = cleaned.split(/[?\n]|\.(?=\s|$)/)[0] || cleaned;
  return sanitizeText(sentence, 120);
}

export function fingerprintFinding(finding = {}) {
  const pathNorm = normalizePath(finding.fileName || finding.path || 'unknown');
  const pathToken = slugPart(pathNorm.split('/').slice(-2).join('-') || pathNorm, 'path');
  // Include summary and codegenInstructions so same-title/different-body findings
  // do not collapse into one fingerprint/disposition.
  const issueClass = extractIssueClass(
    [
      finding.rule,
      finding.category,
      finding.title,
      finding.summary,
      finding.message,
      finding.codegenInstructions,
    ]
      .filter(Boolean)
      .join(' | '),
  );
  const classToken = slugPart(
    finding.rule || finding.category || finding.title || issueClass,
    'finding',
  );
  const digest = createHash('sha256')
    .update(`coderabbit|${pathNorm}|${pathToken}|${classToken}|${issueClass}`)
    .digest('hex')
    .slice(0, 10);
  // Keep ≤3 hyphen segments and short enough for FZ-CIS PATTERN_KEY / slug limits.
  return `cr-${classToken}-${digest}`.replace(/-+/g, '-').slice(0, 48);
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
      const nested = event.finding && typeof event.finding === 'object' ? event.finding : {};
      const fileName = normalizePath(
        event.fileName || event.file || event.path || nested.fileName || nested.file || nested.path,
      );
      const codegenRaw = event.codegenInstructions || nested.codegenInstructions || '';
      const fromCodegen = extractIssueClass(codegenRaw);
      const fromTitle = sanitizeText(
        event.title || event.message || event.summary || nested.title || nested.message || nested.summary || '',
        MAX_SUMMARY,
      );
      // Prefer codegen body; agent titles are often truncated fix prompts.
      const summary = sanitizeText(fromCodegen || fromTitle, MAX_SUMMARY);
      const severity = normalizeSeverity(event.severity || nested.severity);
      const category = sanitizeText(
        event.category || event.rule || nested.category || nested.rule || '',
        80,
      );
      const codegenInstructions = sanitizeText(codegenRaw, MAX_SUMMARY);
      const line = Number.isFinite(event.line)
        ? event.line
        : Number.isFinite(event.startLine)
          ? event.startLine
          : Number.isFinite(nested.line)
            ? nested.line
            : Number.isFinite(nested.startLine)
              ? nested.startLine
              : null;
      const structured = {
        severity,
        category: category || null,
        fileName: fileName || null,
        line,
        summary,
        toolId: sanitizeText(
          event.id || event.findingId || nested.id || nested.findingId || '',
          64,
        ) || null,
      };
      structured.fingerprint = fingerprintFinding({
        ...structured,
        title: fromTitle || null,
        codegenInstructions,
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
