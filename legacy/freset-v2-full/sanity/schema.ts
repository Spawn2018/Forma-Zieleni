// Schematy Sanity (v3/v4). Zgodne z 01-SPEC §9, 04-PROMPTS F2, 07-WIEDZA-2026 §6, 08-PORTAL-FUNKCJE M14, M18, M19.
import { defineArrayMember, defineField, defineType } from 'sanity';

const STYLES = ['naturalistic', 'modern', 'forest', 'family', 'classic'];
const SPACES = ['garden', 'balcony_terrace', 'flowerbed', 'small_architecture', 'estate_greenery', 'public_space'];
const alt = defineField({ name: 'alt', title: 'Tekst alternatywny', type: 'string', validation: (r) => r.required().min(5) });
const photo = (name: string, title: string) => defineField({ name, title, type: 'image', options: { hotspot: true }, fields: [alt] });
const photos = (name: string, title: string) => defineField({ name, title, type: 'array', of: [defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [alt] })] });
const slug = defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() });
const seo = [defineField({ name: 'seoTitle', type: 'string', validation: (r) => r.max(60) }), defineField({ name: 'seoDescription', type: 'string', validation: (r) => r.max(155) })];
const body = defineField({ name: 'body', type: 'array', of: [defineArrayMember({ type: 'block' }), defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [alt] })] });
const refs = (name: string, to: string) => defineField({ name, type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: to }] })] });

export const schemaTypes = [
  defineType({ name: 'settings', title: 'Ustawienia', type: 'document', fields: [
    defineField({ name: 'companyName', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'legalName', type: 'string' }), defineField({ name: 'nip', type: 'string' }),
    defineField({ name: 'address', type: 'text' }), defineField({ name: 'serviceArea', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'phone', type: 'string' }), defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'contactHours', type: 'string' }), defineField({ name: 'experienceText', type: 'string', description: 'np. „od prawie 10 lat”' }),
    defineField({ name: 'projectsCount', type: 'number' }), defineField({ name: 'googleRating', type: 'number' }),
    defineField({ name: 'googleReviewCount', type: 'number' }), defineField({ name: 'googleReviewLink', type: 'url' }),
    defineField({ name: 'sameAs', type: 'array', of: [{ type: 'url' }] }),
    defineField({ name: 'leadDesigner', type: 'object', fields: [defineField({ name: 'name', type: 'string' }), defineField({ name: 'title', type: 'string' }), photo('portrait', 'Portret'), defineField({ name: 'bio', type: 'text' }), defineField({ name: 'imageConsent', type: 'boolean' })] }),
  ] }),
  defineType({ name: 'service', title: 'Usługa', type: 'document', fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }), slug,
    defineField({ name: 'lead', type: 'text' }), body, defineField({ name: 'priceFrom', type: 'number' }),
    refs('realizations', 'realization'), refs('faqs', 'faq'), ...seo,
  ] }),
  defineType({ name: 'package', title: 'Pakiet', type: 'document', fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required().custom((s) => !s?.current || ['consultation', 'concept', 'comprehensive', 'balcony_terrace'].includes(s.current) || 'Slug musi być jednym z: consultation, concept, comprehensive, balcony_terrace (quiz.json)') }),
    defineField({ name: 'priceFrom', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({ name: 'forWhom', type: 'string' }), defineField({ name: 'includes', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'duration', type: 'string' }), defineField({ name: 'revisions', type: 'number' }),
    defineField({ name: 'recommended', type: 'boolean', validation: (r) => r.custom(async (value, ctx) => {
      if (!value) return true;
      const id = (ctx.document?._id ?? '').replace(/^drafts\./, '');
      const n = await ctx.getClient({ apiVersion: '2025-01-01' }).fetch('count(*[_type=="package" && recommended==true && !(_id in [$id, $d])])', { id, d: `drafts.${id}` });
      return n === 0 || 'Tylko jeden pakiet może być polecany.';
    }) }),
    defineField({ name: 'ctaLabel', type: 'string' }),
  ] }),
  defineType({ name: 'realization', title: 'Realizacja', type: 'document', fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }), slug,
    defineField({ name: 'municipality', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'areaM2', type: 'number' }), defineField({ name: 'type', type: 'string', options: { list: SPACES } }),
    defineField({ name: 'style', type: 'string', options: { list: STYLES } }), defineField({ name: 'projectDuration', type: 'string' }),
    defineField({ name: 'challenge', type: 'text' }), photos('concept', 'Szkic lub plan'), photos('visualizations', 'Wizualizacje'), photos('photos', 'Zdjęcia realizacji'),
    photo('before', 'Przed'), photo('after', 'Po'), refs('plants', 'plant'),
    defineField({ name: 'clientQuote', type: 'text' }),
    defineField({ name: 'ownerConsent', title: 'Zgoda właściciela posesji', type: 'boolean', validation: (r) => r.custom((v) => v === true || 'Bez zgody właściciela posesji nie publikujemy realizacji.') }),
    ...seo,
  ] }),
  defineType({ name: 'plant', title: 'Roślina', type: 'document', fields: [
    defineField({ name: 'latinName', type: 'string', validation: (r) => r.required() }), defineField({ name: 'polishName', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'polishName' }, validation: (r) => r.required() }), photos('photos', 'Zdjęcia własne'),
    defineField({ name: 'light', type: 'array', of: [{ type: 'string' }], options: { list: ['sun', 'partial_shade', 'shade'] } }),
    defineField({ name: 'soil', type: 'string' }), defineField({ name: 'moisture', type: 'string', options: { list: ['dry', 'moderate', 'moist'] } }),
    defineField({ name: 'droughtTolerance', type: 'string', options: { list: ['low', 'medium', 'high'] } }),
    defineField({ name: 'hardiness', type: 'string' }), defineField({ name: 'heightCm', type: 'number' }), defineField({ name: 'widthCm', type: 'number' }),
    defineField({ name: 'bloomMonths', type: 'array', of: [{ type: 'number' }], options: { list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } }),
    defineField({ name: 'pollinatorFriendly', type: 'boolean' }), defineField({ name: 'toxicityNote', type: 'text', description: 'Tylko potwierdzone informacje' }),
    defineField({ name: 'notes', type: 'text' }),
  ] }),
  defineType({ name: 'review', title: 'Opinia', type: 'document', fields: [
    defineField({ name: 'authorDisplay', type: 'string', description: 'Imię i inicjał', validation: (r) => r.required() }),
    defineField({ name: 'rating', type: 'number', validation: (r) => r.required().min(1).max(5).integer() }),
    defineField({ name: 'text', type: 'text', validation: (r) => r.required() }), defineField({ name: 'date', type: 'date', validation: (r) => r.required() }),
    defineField({ name: 'sourceUrl', type: 'url', validation: (r) => r.required() }),
  ] }),
  defineType({ name: 'faq', title: 'FAQ', type: 'document', fields: [defineField({ name: 'question', type: 'string', validation: (r) => r.required() }), defineField({ name: 'answer', type: 'text', validation: (r) => r.required() }), defineField({ name: 'category', type: 'string' })] }),
  defineType({ name: 'article', title: 'Artykuł', type: 'document', fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }), slug, defineField({ name: 'lead', type: 'text' }),
    photo('mainImage', 'Zdjęcie główne'), body, defineField({ name: 'publishedAt', type: 'datetime' }),
    defineField({ name: 'keyword', type: 'string' }), defineField({ name: 'ctaVariant', type: 'string', options: { list: ['quiz', 'form', 'scope_builder', 'realizations', 'microretention'] } }),
    defineField({ name: 'legacyHtml', type: 'text', description: 'Treść z WordPressa (import). Renderuj po sanityzacji, potem przepisz do body.' }),
    defineField({ name: 'legacyUrl', type: 'string', readOnly: true }), ...seo,
  ] }),
  defineType({ name: 'award', title: 'Wyróżnienie', type: 'document', fields: [defineField({ name: 'name', type: 'string', validation: (r) => r.required() }), defineField({ name: 'year', type: 'number' }), defineField({ name: 'organizer', type: 'string' }), defineField({ name: 'url', type: 'url' })] }),
  defineType({ name: 'partner', title: 'Partner (publiczny)', type: 'document', fields: [defineField({ name: 'name', type: 'string', validation: (r) => r.required() }), defineField({ name: 'description', type: 'text' }), defineField({ name: 'url', type: 'url' }), defineField({ name: 'discountNote', type: 'string' }), photo('logo', 'Logo'), defineField({ name: 'consentToPublish', type: 'boolean' })] }),
  defineType({ name: 'landingPage', title: 'Strona docelowa', type: 'document', fields: [defineField({ name: 'title', type: 'string', validation: (r) => r.required() }), slug, defineField({ name: 'headline', type: 'string' }), defineField({ name: 'subheadline', type: 'string' }), refs('realizations', 'realization'), defineField({ name: 'package', type: 'reference', to: [{ type: 'package' }] }), refs('faqs', 'faq'), defineField({ name: 'utmCampaign', type: 'string' })] }),
  defineType({ name: 'programInfo', title: 'Program dofinansowania', type: 'document', fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }), slug, defineField({ name: 'summary', type: 'text' }),
    defineField({ name: 'conditions', type: 'array', of: [{ type: 'string' }] }), defineField({ name: 'maxGrantPln', type: 'number' }),
    defineField({ name: 'applicationStart', type: 'date' }), defineField({ name: 'eligibleCostsFrom', type: 'date' }), defineField({ name: 'eligibleCostsTo', type: 'date' }),
    defineField({ name: 'sourceLinks', type: 'array', of: [{ type: 'url' }], validation: (r) => r.required().min(1) }),
    defineField({ name: 'verifiedAt', type: 'date', validation: (r) => r.required() }),
  ] }),
  defineType({ name: 'careTask', title: 'Prace pielęgnacyjne', type: 'document', fields: [defineField({ name: 'month', type: 'number', validation: (r) => r.required().min(1).max(12).integer() }), defineField({ name: 'title', type: 'string', validation: (r) => r.required() }), defineField({ name: 'description', type: 'text' }), refs('plants', 'plant')] }),
];
