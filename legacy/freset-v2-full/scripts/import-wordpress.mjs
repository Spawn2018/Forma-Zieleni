// Import artykułów z eksportu WordPressa (WXR) do Sanity + lista przekierowań 301.
// Użycie: npm i -D fast-xml-parser && node scripts/import-wordpress.mjs eksport.xml
// Potem: npx sanity dataset import import/articles.ndjson production
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';

const file = process.argv[2];
if (!file) { console.error('Podaj ścieżkę do pliku eksportu WXR.'); process.exit(1); }

const data = new XMLParser({ ignoreAttributes: false }).parse(await readFile(file, 'utf8'));
const arr = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);
const txt = (v) => (v == null ? '' : typeof v === 'object' ? String(v['#text'] ?? '') : String(v));
const slugify = (s) => s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const iso = (d) => (d && !d.startsWith('0000') ? new Date(d.replace(' ', 'T') + 'Z').toISOString() : undefined);
const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const items = arr(data?.rss?.channel?.item);
const attachments = new Map(items.filter((i) => txt(i['wp:post_type']) === 'attachment')
  .map((i) => [txt(i['wp:post_id']), txt(i['wp:attachment_url'])]));

const docs = []; const redirects = []; const pages = []; const warnings = [];
for (const i of items) {
  const type = txt(i['wp:post_type']); const status = txt(i['wp:status']);
  const title = txt(i.title).trim(); const link = txt(i.link);
  const oldPath = link ? new URL(link).pathname : '';
  if (type === 'page' && status === 'publish') { pages.push(`${oldPath}\t${title}`); continue; }
  if (type !== 'post' || status !== 'publish') continue;
  let slug = slugify(decode(txt(i['wp:post_name'])));
  if (!slug || /^elementor-\d+$/.test(slug)) slug = slugify(title);
  const html = txt(i['content:encoded']);
  if (!strip(html)) warnings.push(`Pusta treść (Elementor zapisuje układ w metadanych): ${oldPath}`);
  const thumbId = arr(i['wp:postmeta']).find((m) => txt(m['wp:meta_key']) === '_thumbnail_id');
  const thumbUrl = thumbId ? attachments.get(txt(thumbId['wp:meta_value'])) : undefined;
  const newPath = `/artykuly/${slug}/`;
  docs.push({
    _id: `wp-post-${txt(i['wp:post_id'])}`, _type: 'article', title,
    slug: { _type: 'slug', current: slug },
    publishedAt: iso(txt(i['wp:post_date_gmt'])) ?? iso(txt(i['wp:post_date'])),
    lead: (strip(txt(i['excerpt:encoded'])) || strip(html)).slice(0, 200),
    legacyHtml: html, legacyUrl: oldPath,
    ...(thumbUrl ? { mainImage: { _type: 'image', _sanityAsset: `image@${thumbUrl}`, alt: '' } } : {}),
  });
  if (oldPath && oldPath !== newPath) redirects.push(`formazieleni.pl${oldPath},https://formazieleni.pl${newPath},301,false,true,false,false`);
}

await mkdir('import', { recursive: true });
await writeFile('import/articles.ndjson', docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
await writeFile('import/redirects.csv', redirects.join('\n') + '\n');
await writeFile('import/pages.txt', pages.join('\n') + '\n');
console.log(`Artykuły: ${docs.length}, przekierowania: ${redirects.length}, strony do ręcznego zmapowania: ${pages.length}`);
for (const wmsg of warnings) console.warn('UWAGA:', wmsg);
console.log('Alt obrazów jest pusty celowo: Studio nie opublikuje artykułu bez uzupełnienia.');
