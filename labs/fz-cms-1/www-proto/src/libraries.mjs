export async function loadLightboxModule() {
  const module = await import('yet-another-react-lightbox');
  return {
    hasDefault: typeof module.default === 'function',
    name: 'yet-another-react-lightbox',
    version: '3.32.2',
    license: 'MIT',
  };
}

export async function loadBeforeAfterModule() {
  const module = await import('react-compare-slider');
  return {
    hasCompare: typeof module.ReactCompareSlider === 'function',
    hasImage: typeof module.ReactCompareSliderImage === 'function',
    name: 'react-compare-slider',
    version: '4.0.0',
    license: 'MIT',
  };
}
