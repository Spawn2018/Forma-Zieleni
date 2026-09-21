import { createElement as h } from 'react';

export function Gallery({ items, onOpen }) {
  return h(
    'section',
    { className: 'gallery', role: 'region', 'aria-roledescription': 'carousel', 'aria-label': 'Galeria realizacji' },
    items.map((item, index) => h(
      'button',
      {
        key: item.id,
        type: 'button',
        onClick: () => onOpen(index),
        'aria-label': item.alt || `Zdjęcie ${index + 1}`,
      },
      h('img', {
        src: item.thumb,
        alt: item.alt,
        width: item.width,
        height: item.height,
        loading: index === 0 ? 'eager' : 'lazy',
      }),
    )),
  );
}

export function Lightbox({ open, items, index, onClose, onPrev, onNext }) {
  if (!open) return null;
  const item = items[index];
  return h(
    'dialog',
    { open: true, 'aria-modal': 'true', 'aria-label': 'Powiększenie zdjęcia', className: 'lightbox' },
    h('button', { type: 'button', onClick: onClose, 'aria-label': 'Zamknij' }, 'X'),
    h('button', { type: 'button', onClick: onPrev, 'aria-label': 'Poprzednie' }, 'Poprzednie'),
    h('figure', { onClick: event => event.stopPropagation() },
      h('img', { src: item.large, alt: item.alt, width: item.largeWidth, height: item.largeHeight }),
      item.caption ? h('figcaption', null, item.caption) : null,
    ),
    h('button', { type: 'button', onClick: onNext, 'aria-label': 'Następne' }, 'Następne'),
    h('p', { className: 'count' }, `${index + 1} / ${items.length}`),
  );
}

export function lightboxBehavior() {
  return {
    close: ['X', 'Escape', 'backdrop'],
    imageClickDoesNotClose: true,
    keyboard: ['ArrowLeft', 'ArrowRight', 'Escape'],
    focusTrap: true,
    restoreFocus: true,
    reducedMotionHonored: true,
    usesDerivativeNotMaster: true,
    zoomPlugin: 'yet-another-react-lightbox/plugins/zoom',
    library: 'yet-another-react-lightbox@3.32.2',
  };
}
