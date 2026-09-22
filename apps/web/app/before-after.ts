import { createElement, type ReactNode } from 'react';

const ASSET_ID = /^[a-z][a-z0-9]{15,63}$/;
const DERIVATIVE = /^\/media\/[a-z][a-z0-9]{15,63}\/w800\.webp$/;
const MODES = ['CONTAIN', 'ADAPTIVE_LAYOUT', 'SMART_FILL'] as const;

export type FitMode = (typeof MODES)[number];

export type CompareFrame = {
  assetId: string;
  alt: string;
  width: number;
  height: number;
  mode: FitMode;
};

export type CompareSide = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ComparePair = {
  before: CompareSide;
  after: CompareSide;
  mode: FitMode;
};

export type PublicCompareModel = { state: 'absent' } | { state: 'published'; pair: ComparePair };

export function comparePair(before: CompareFrame, after: CompareFrame): ComparePair {
  if (before.mode !== after.mode || !MODES.includes(before.mode)) throw new Error('CROP_MODE_MISMATCH');
  if (before.width !== after.width || before.height !== after.height) throw new Error('FRAME_MISMATCH');
  if (before.assetId === after.assetId) throw new Error('PAIR_IDENTICAL');
  return {
    mode: before.mode,
    before: side('Przed', before),
    after: side('Po', after),
  };
}

export function comparePosition(value: number): number {
  if (!Number.isFinite(value)) throw new Error('POSITION_INVALID');
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function compareControl(position: number, onPosition?: (value: number) => void): ReactNode {
  const current = comparePosition(position);
  return createElement(
    'div',
    { className: 'compare' },
    createElement('p', { className: 'compare-labels' }, createElement('span', null, 'Przed'), createElement('span', null, 'Po')),
    createElement('input', {
      type: 'range',
      min: 0,
      max: 100,
      value: current,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': current,
      'aria-label': 'Porównanie przed i po',
      onChange: (event: { currentTarget: { value: string } }) => onPosition?.(comparePosition(Number(event.currentTarget.value))),
    }),
  );
}

function side(label: 'Przed' | 'Po', frame: CompareFrame): CompareSide {
  return {
    src: derivativeUrl(frame.assetId),
    alt: frame.alt.trim() ? `${label}. ${frame.alt.trim()}` : label,
    width: frame.width,
    height: frame.height,
  };
}

function derivativeUrl(assetId: string): string {
  if (!ASSET_ID.test(assetId)) throw new Error('ASSET_ID_INVALID');
  const url = `/media/${assetId}/w800.webp`;
  if (!DERIVATIVE.test(url) || url.includes('master')) throw new Error('MASTER_URL_REJECTED');
  return url;
}
