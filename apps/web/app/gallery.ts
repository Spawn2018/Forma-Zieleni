import { createElement, type ReactNode } from 'react';

const ASSET_ID = /^[a-z][a-z0-9]{15,63}$/;
const DERIVATIVE = /^\/media\/[a-z][a-z0-9]{15,63}\/w(?:400|1600)\.webp$/;

export type GalleryPlacement = {
  assetId: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export type GallerySlide = {
  id: string;
  alt: string;
  caption: string;
  thumb: string;
  large: string;
  thumbWidth: number;
  thumbHeight: number;
  largeWidth: number;
  largeHeight: number;
};

export type GalleryState = {
  open: boolean;
  index: number;
  restoreId: string | null;
};

export type GalleryCommand =
  | { type: 'move'; key: 'ArrowLeft' | 'ArrowRight' }
  | { type: 'open'; index: number; triggerId: string }
  | { type: 'escape' }
  | { type: 'backdrop' }
  | { type: 'image' }
  | { type: 'close' };

export type PublicGalleryModel = { state: 'absent' } | { state: 'published'; slides: GallerySlide[] };

export const lightboxContract = Object.freeze({
  close: ['X', 'Escape', 'backdrop'],
  imageClickDoesNotClose: true,
  keyboard: ['ArrowLeft', 'ArrowRight', 'Escape'],
  focusTrap: true,
  restoreFocus: true,
  reducedMotionHonored: true,
  usesDerivativeNotMaster: true,
  library: 'yet-another-react-lightbox@3.32.2',
});

export function createGalleryState(): GalleryState {
  return { open: false, index: 0, restoreId: null };
}

export function derivativeUrl(assetId: string, width: 400 | 1600): string {
  if (!ASSET_ID.test(assetId)) throw new Error('ASSET_ID_INVALID');
  return assertPublicDerivative(`/media/${assetId}/w${width}.webp`);
}

export function assertPublicDerivative(url: string): string {
  if (!DERIVATIVE.test(url) || url.includes('master')) throw new Error('MASTER_URL_REJECTED');
  return url;
}

export function slidesFromPlacements(items: readonly GalleryPlacement[]): GallerySlide[] {
  return items.map((item) => {
    const alt = item.alt.trim();
    const thumb = fittedSize(item.width, item.height, 400);
    const large = fittedSize(item.width, item.height, 1600);
    return {
      id: item.assetId,
      alt,
      caption: item.caption.trim(),
      thumb: derivativeUrl(item.assetId, 400),
      large: derivativeUrl(item.assetId, 1600),
      thumbWidth: thumb.width,
      thumbHeight: thumb.height,
      largeWidth: large.width,
      largeHeight: large.height,
    };
  });
}

export function reduceGallery(state: GalleryState, command: GalleryCommand, count: number): GalleryState {
  if (count < 1) return { open: false, index: 0, restoreId: null };
  switch (command.type) {
    case 'move': {
      const delta = command.key === 'ArrowRight' ? 1 : -1;
      return { ...state, index: (state.index + delta + count) % count };
    }
    case 'open':
      return { open: true, index: command.index, restoreId: command.triggerId };
    case 'escape':
    case 'backdrop':
    case 'close':
      return state.open ? { ...state, open: false } : state;
    case 'image':
      return state;
    default: {
      const unknown: never = command;
      return unknown;
    }
  }
}

export const lightboxLabels = Object.freeze({
  Previous: 'Poprzednie',
  Next: 'Następne',
  Close: 'Zamknij',
  Lightbox: 'Podgląd zdjęcia',
  'Photo gallery': 'Galeria zdjęć',
  '{index} of {total}': '{index} z {total}',
  Caption: 'podpis',
});

export function lightboxAnimation(reducedMotion: boolean): { fade: number; swipe: number } {
  return reducedMotion ? { fade: 0, swipe: 0 } : { fade: 240, swipe: 320 };
}

export type GalleryCard = {
  src: string;
  width: number;
  height: number;
  loading: 'eager' | 'lazy';
  alt: string;
};

export type GalleryPerformanceNotes = {
  lcpCandidate: string;
  cls: 'width-height';
  originalsOnCards: false;
  count: number;
};

export function galleryCards(slides: readonly GallerySlide[]): GalleryCard[] {
  return slides.map((slide, index) => {
    const src = assertPublicDerivative(slide.thumb);
    if (!src.endsWith('/w400.webp')) throw new Error('CARD_WIDTH');
    if (!Number.isInteger(slide.thumbWidth) || !Number.isInteger(slide.thumbHeight) || slide.thumbWidth < 1 || slide.thumbHeight < 1) {
      throw new Error('CLS_DIMENSIONS');
    }
    return {
      src,
      width: slide.thumbWidth,
      height: slide.thumbHeight,
      loading: index === 0 ? 'eager' : 'lazy',
      alt: slide.alt,
    };
  });
}

export function galleryPerformanceNotes(cards: readonly GalleryCard[]): GalleryPerformanceNotes {
  if (cards.length < 1) throw new Error('GALLERY_EMPTY');
  const lcp = cards[0];
  if (!lcp || lcp.loading !== 'eager' || cards.slice(1).some((card) => card.loading !== 'lazy')) throw new Error('THUMB_LOADING');
  return {
    lcpCandidate: lcp.src,
    cls: 'width-height',
    originalsOnCards: false,
    count: cards.length,
  };
}

export function carouselElement(slides: readonly GallerySlide[], index: number, onOpen: (index: number, triggerId: string) => void): ReactNode {
  const cards = galleryCards(slides);
  return createElement(
    'section',
    { className: 'gallery', role: 'region', 'aria-roledescription': 'carousel', 'aria-label': 'Galeria' },
    slides.map((slide, itemIndex) => {
      const card = cards[itemIndex];
      if (!card) throw new Error('CARD_MISSING');
      const triggerId = `thumb-${slide.id}`;
      return createElement(
        'button',
        {
          key: slide.id,
          id: triggerId,
          type: 'button',
          className: 'thumb',
          tabIndex: itemIndex === index ? 0 : -1,
          'aria-label': slide.alt || slide.caption || `Zdjęcie ${itemIndex + 1} z ${slides.length}`,
          'aria-current': itemIndex === index ? 'true' : undefined,
          onClick: () => onOpen(itemIndex, triggerId),
        },
        createElement('img', {
          src: card.src,
          alt: card.alt,
          width: card.width,
          height: card.height,
          loading: card.loading,
        }),
      );
    }),
  );
}

function fittedSize(width: number, height: number, target: number): { width: number; height: number } {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 16000 || height > 16000) {
    throw new Error('FRAME_INVALID');
  }
  const nextWidth = Math.min(target, width);
  return { width: nextWidth, height: Math.max(1, Math.round((nextWidth * height) / width)) };
}
