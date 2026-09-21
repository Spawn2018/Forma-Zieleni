export const payloadCollections = [
  {
    slug: 'pages',
    versions: { drafts: true },
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'seo', type: 'group' },
      { name: 'blocks', type: 'blocks' },
    ],
    access: { read: 'published-or-editor' },
  },
  { slug: 'articles', versions: { drafts: true } },
  { slug: 'services', versions: { drafts: true } },
  {
    slug: 'project-case-studies',
    versions: { drafts: true },
    fields: [
      { name: 'title', type: 'text' },
      { name: 'publicLocality', type: 'text' },
      { name: 'gallery', type: 'relationship', relationTo: 'media-collections' },
      { name: 'businessProjectRef', type: 'text', admin: { description: 'Opaque Core API id. Not an ACL.' } },
    ],
  },
  { slug: 'media-assets' },
  { slug: 'media-collections' },
];
