export function galleryMarkup(collection, assets) {
  const items = collection.itemIds.map((id, index) => {
    const asset = assets.get(id);
    return `<button type="button" class="thumb" data-asset="${safeToken(id)}" aria-label="${escapeAttr(asset.alt || `Zdjęcie ${index + 1}`)}"><img src="/media/${safeToken(id)}/w400.webp" width="${Math.min(400, asset.width)}" height="${Math.round(Math.min(400, asset.width) * asset.height / asset.width)}" alt="${escapeAttr(asset.alt)}" loading="${index === 0 ? 'eager' : 'lazy'}" /></button>`;
  }).join('');
  return `<section class="gallery" data-variant="${safeToken(collection.variant)}">
<div class="carousel" role="region" aria-roledescription="carousel" aria-label="${escapeAttr(collection.title)}">${items}</div>
<dialog class="lightbox" aria-modal="true" aria-label="Powiększenie zdjęcia">
<button type="button" class="close" aria-label="Zamknij">X</button>
<button type="button" class="prev" aria-label="Poprzednie">Poprzednie</button>
<figure><img alt="" /><figcaption></figcaption></figure>
<button type="button" class="next" aria-label="Następne">Następne</button>
</dialog>
</section>`;
}

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function safeToken(value) {
  return /^[A-Za-z0-9_-]+$/.test(String(value)) ? String(value) : '';
}

export function lightboxContract() {
  return {
    openOnActivate: true,
    close: ['X', 'Escape', 'backdrop'],
    imageClickDoesNotClose: true,
    keyboard: ['ArrowLeft', 'ArrowRight', 'Escape'],
    focusTrap: true,
    restoreFocus: true,
    reducedMotionHonored: true,
    usesDerivativeNotMaster: true,
  };
}
