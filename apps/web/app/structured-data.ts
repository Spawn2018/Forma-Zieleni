const OMITTED = new Set([
  'aggregateRating',
  'review',
  'reviewRating',
  'ratingValue',
  'offers',
  'price',
  'priceCurrency',
  'award',
  'awards',
  'address',
  'streetAddress',
  'postalCode',
  'addressLocality',
  'telephone',
]);

export function webPageJsonLd(supplied: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const name = requiredText(supplied.name);
  const description = requiredText(supplied.description);
  const document: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
  };
  if (typeof supplied.url === 'string' && /^https?:\/\//.test(supplied.url)) document.url = supplied.url;
  if ([...OMITTED].some((key) => Object.hasOwn(document, key))) throw new Error('UNVERIFIED_FIELD');
  return document;
}

function requiredText(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error('VISIBLE_FACT_REQUIRED');
  return value;
}

export function jsonLdScript(document: Record<string, unknown>): string {
  const json = JSON.stringify(document).replaceAll('<', '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}
