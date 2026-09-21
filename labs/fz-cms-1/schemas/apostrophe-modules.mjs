export const apostropheModules = {
  '@apostrophecms/page': { types: ['@apostrophecms/home-page', 'service-page', 'article-page', 'project-case-study-page'] },
  'project-case-study': {
    fields: {
      add: {
        publicLocality: { type: 'string' },
        gallery: { type: 'relationship', withType: '@apostrophecms/image' },
        businessProjectRef: { type: 'string' },
      },
    },
  },
};
