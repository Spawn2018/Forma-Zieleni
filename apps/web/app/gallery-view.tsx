import { useEffect, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/styles.css';
import {
  carouselElement,
  createGalleryState,
  lightboxAnimation,
  lightboxLabels,
  reduceGallery,
  type GallerySlide,
} from './gallery.ts';
import './gallery.css';

export function PublicGallery({ slides }: { slides: readonly GallerySlide[] }) {
  const [state, setState] = useState(createGalleryState);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (state.open || !state.restoreId || typeof document === 'undefined') return;
    document.getElementById(state.restoreId)?.focus();
  }, [state.open, state.restoreId]);
  if (slides.length === 0) return null;
  return (
    <div
      onKeyDown={(event) => {
        const key = event.key;
        if (key === 'Escape') {
          setState((current) => reduceGallery(current, { type: 'escape' }, slides.length));
          return;
        }
        if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
        event.preventDefault();
        setState((current) => {
          const next = reduceGallery(current, { type: 'move', key }, slides.length);
          if (!current.open && typeof document !== 'undefined') {
            const thumb = document.getElementById(`thumb-${slides[next.index].id}`);
            thumb?.focus();
            thumb?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          }
          return next;
        });
      }}
    >
      {carouselElement(slides, state.index, (index, triggerId) => {
        setState((current) => reduceGallery(current, { type: 'open', index, triggerId }, slides.length));
      })}
      <Lightbox
        open={state.open}
        close={() => setState((current) => reduceGallery(current, { type: 'close' }, slides.length))}
        index={state.index}
        slides={slides.map((slide) => ({
          src: slide.large,
          alt: slide.alt,
          description: slide.caption || undefined,
          width: slide.largeWidth,
          height: slide.largeHeight,
        }))}
        labels={lightboxLabels}
        plugins={[Captions]}
        captions={{ showToggle: false }}
        animation={lightboxAnimation(reducedMotion)}
        controller={{ closeOnBackdropClick: true }}
        on={{
          view: ({ index }) => setState((current) => ({ ...current, index })),
        }}
      />
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);
  return reduced;
}
