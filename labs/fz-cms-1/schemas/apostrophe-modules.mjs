/**
 * Portable Apostrophe module sketch for CMS-ADMIN.
 * Runtime product install stays in the isolated lab until CMS-ACCEPT.
 */
export const apostropheModules = {
  '@apostrophecms/page': {
    types: [
      '@apostrophecms/home-page',
      'service-page',
      'article-page',
      'project-case-study-page',
    ],
  },
  service: {
    extend: '@apostrophecms/piece-type',
    options: {
      label: 'Service',
      pluralLabel: 'Services',
    },
    fields: {
      add: {
        seoTitle: { type: 'string', label: 'SEO title' },
        seoDescription: { type: 'string', label: 'SEO description', textarea: true },
      },
    },
  },
  'project-case-study': {
    extend: '@apostrophecms/piece-type',
    options: {
      label: 'ProjectCaseStudy',
      pluralLabel: 'ProjectCaseStudies',
    },
    fields: {
      add: {
        publicLocality: { type: 'string', label: 'Public locality' },
        businessProjectRef: { type: 'string', label: 'Opaque business project ref' },
        seoTitle: { type: 'string', label: 'SEO title' },
        _gallery: {
          label: 'Gallery',
          type: 'relationship',
          withType: '@apostrophecms/image',
        },
        _hero: {
          label: 'Hero',
          type: 'relationship',
          withType: '@apostrophecms/image',
          max: 1,
        },
      },
    },
  },
};

export const CMS_ADMIN_EDITORIAL_TYPES = ['Service', 'ProjectCaseStudy'];
