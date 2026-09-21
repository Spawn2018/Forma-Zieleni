export const WIDTHS = [400, 800, 1200, 1600, 2400];

export function cropWindow({ width, height, targetRatio, focal = { x: 0.5, y: 0.5 }, mode, safeRegion }) {
  const sourceRatio = width / height;
  if (mode === 'CONTAIN' || Math.abs(sourceRatio - targetRatio) < 0.01) {
    return { x: 0, y: 0, width, height, cropped: false, shown: 1 };
  }
  if (mode === 'ADAPTIVE_LAYOUT' && Math.abs(sourceRatio - targetRatio) > 0.35) {
    return { x: 0, y: 0, width, height, cropped: false, shown: 1, layoutAdapts: true };
  }
  let crop;
  if (sourceRatio > targetRatio) {
    const cropW = Math.round(height * targetRatio);
    const x = Math.max(0, Math.min(width - cropW, Math.round(focal.x * width - cropW / 2)));
    crop = { x, y: 0, width: cropW, height, cropped: true, shown: cropW / width };
  } else {
    const cropH = Math.round(width / targetRatio);
    const y = Math.max(0, Math.min(height - cropH, Math.round(focal.y * height - cropH / 2)));
    crop = { x: 0, y, width, height: cropH, cropped: true, shown: cropH / height };
  }
  if (!safeRegion) return crop;
  const safeX = Math.round(safeRegion.x * width);
  const safeW = Math.round(safeRegion.w * width);
  if (crop.width >= safeW) {
    if (safeX < crop.x) crop.x = Math.max(0, safeX);
    if (safeX + safeW > crop.x + crop.width) crop.x = Math.min(width - crop.width, safeX + safeW - crop.width);
    crop.safeRegionHonored = true;
  }
  return crop;
}

export function planDerivatives(asset, placements) {
  return placements.map(placement => {
    const crop = cropWindow({
      width: asset.width,
      height: asset.height,
      targetRatio: placement.ratio,
      focal: asset.focal,
      mode: placement.mode,
    });
    const targetWidth = WIDTHS.find(width => width >= placement.displayWidth) ?? WIDTHS.at(-1);
    return {
      placement: placement.name,
      format: 'image/webp',
      fallback: 'image/jpeg',
      width: Math.min(targetWidth, crop.width),
      crop,
      masterPreserved: true,
      gpsStripped: true,
    };
  });
}

export function validateUpload({ mime, bytes, width, height }) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(mime)) return { ok: false, reason: 'MIME_DENIED' };
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return { ok: false, reason: 'DIMENSIONS' };
  }
  if (bytes > 20 * 1024 * 1024) return { ok: false, reason: 'TOO_LARGE' };
  if (width * height > 40_000_000) return { ok: false, reason: 'PIXEL_BOMB' };
  return { ok: true };
}
