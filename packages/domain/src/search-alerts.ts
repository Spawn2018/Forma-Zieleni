const SIGNALS = [
  'sitemap-down',
  'robots-blocking',
  'important-noindex',
  'error-spike',
  'indexing-drop',
  'traffic-anomaly',
  'structured-data-break',
  'connector-stalled',
  'crawler-policy-mismatch',
  'citation-change',
  'visibility-drop',
] as const;

export type SearchAlertSignal = (typeof SIGNALS)[number];

/** Named rules. No numeric paging threshold and no production channel. */
export const ALERT_RULES = {
  singleRowPages: false,
  baselineRequired: true,
  productionChannel: null,
} as const;

export type SearchAlert = {
  signal: SearchAlertSignal;
  pages: false;
  channel: null;
  reason: 'SINGLE_ROW' | 'NO_BASELINE' | 'UNMEASURABLE' | 'NO_CHANNEL';
};

export function evaluateSearchAlert(input: {
  signal: SearchAlertSignal;
  rows: number;
  baseline: number | null;
  measurable?: boolean;
}): SearchAlert {
  const signal = assertSignal(input.signal);
  if (!Number.isInteger(input.rows) || input.rows < 1) throw new Error('ALERT_ROWS');
  if (input.baseline !== null && (!Number.isFinite(input.baseline) || input.baseline < 0)) throw new Error('ALERT_BASELINE');
  if (input.rows === 1) return quiet(signal, 'SINGLE_ROW');
  if (signal === 'citation-change' && input.measurable === false) return quiet(signal, 'UNMEASURABLE');
  if (input.baseline === null) return quiet(signal, 'NO_BASELINE');
  return quiet(signal, 'NO_CHANNEL');
}

export function pageSearchAlert(): never {
  throw new Error('SEARCH_ALERT_DOES_NOT_PAGE');
}

function quiet(signal: SearchAlertSignal, reason: SearchAlert['reason']): SearchAlert {
  return { signal, pages: false, channel: null, reason };
}

function assertSignal(signal: SearchAlertSignal): SearchAlertSignal {
  switch (signal) {
    case 'sitemap-down':
    case 'robots-blocking':
    case 'important-noindex':
    case 'error-spike':
    case 'indexing-drop':
    case 'traffic-anomaly':
    case 'structured-data-break':
    case 'connector-stalled':
    case 'crawler-policy-mismatch':
    case 'citation-change':
    case 'visibility-drop':
      return signal;
    default: {
      const unknown: never = signal;
      throw new Error(`ALERT_SIGNAL:${unknown}`);
    }
  }
}
