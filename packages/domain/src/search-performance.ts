const DERIVATIVE_WIDTHS = [400, 800, 1200, 1600, 2400] as const;
const ASSET_ID = /^[a-z][a-z0-9]{15,63}$/;

export type FieldCwv = {
  source: 'field';
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
};

export type LabMediaNote = {
  source: 'lab';
  lcpCandidate: string;
  width: number;
  height: number;
  loading: 'eager';
};

export type PerformanceNotes = {
  field: FieldCwv | null;
  lab: LabMediaNote | null;
};

export function notePerformance(input: {
  field?: { lcpMs?: number | null; inpMs?: number | null; cls?: number | null } | null;
  lab?: { assetId: string; displayWidth: number; height: number } | null;
}): PerformanceNotes {
  return {
    field: input.field ? fieldCwv(input.field) : null,
    lab: input.lab ? labNote(input.lab) : null,
  };
}

function fieldCwv(value: { lcpMs?: number | null; inpMs?: number | null; cls?: number | null }): FieldCwv {
  return {
    source: 'field',
    lcpMs: metric(value.lcpMs),
    inpMs: metric(value.inpMs),
    cls: metric(value.cls),
  };
}

function labNote(value: { assetId: string; displayWidth: number; height: number }): LabMediaNote {
  if (!ASSET_ID.test(value.assetId)) throw new Error('ASSET_ID_INVALID');
  if (!Number.isInteger(value.height) || value.height < 1 || value.height > 16000) throw new Error('CLS_DIMENSIONS_REQUIRED');
  const width = derivativeWidth(value.displayWidth);
  const src = `/media/${value.assetId}/w${width}.webp`;
  if (src.includes('master')) throw new Error('MASTER_URL_REJECTED');
  return { source: 'lab', lcpCandidate: src, width, height: value.height, loading: 'eager' };
}

function derivativeWidth(displayWidth: number): number {
  if (!Number.isInteger(displayWidth) || displayWidth < 1) throw new Error('DERIVATIVE_WIDTH_UNAVAILABLE');
  const width = DERIVATIVE_WIDTHS.find((item) => item >= displayWidth);
  if (!width) throw new Error('DERIVATIVE_WIDTH_UNAVAILABLE');
  return width;
}

function metric(value: number | null | undefined): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) throw new Error('FIELD_METRIC_INVALID');
  return value;
}
