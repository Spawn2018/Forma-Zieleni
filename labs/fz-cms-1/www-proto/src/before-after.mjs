import { createElement as h } from 'react';

export function BeforeAfter({ before, after, position = 50, onPosition }) {
  return h(
    'div',
    { className: 'before-after' },
    h('img', { src: before.src, alt: before.alt, width: before.width, height: before.height }),
    h('img', { src: after.src, alt: after.alt, width: after.width, height: after.height }),
    h('input', {
      type: 'range',
      min: 0,
      max: 100,
      value: position,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': position,
      'aria-label': 'Porównanie przed i po',
      onChange: event => onPosition(Number(event.target.value)),
    }),
  );
}

export function beforeAfterLibrary() {
  return {
    name: 'react-compare-slider',
    version: '4.0.0',
    license: 'MIT',
    keyboard: true,
    pointer: true,
    touch: true,
  };
}
