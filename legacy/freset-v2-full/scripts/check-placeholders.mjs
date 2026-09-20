// Przerywa build produkcyjny, jeśli w wygenerowanych plikach zostały placeholdery {{…}}.
// Użycie: node scripts/check-placeholders.mjs dist
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const root = process.argv[2] ?? 'dist';
const scanned = new Set(['.html', '.txt', '.xml', '.json', '.js', '.css', '.webmanifest']);
// Placeholder: {{…}} bez nawiasów i nowych linii w środku, nie zaczyna się od cudzysłowu ani nawiasu (ogranicza fałszywe trafienia w minifikowanym JS).
const pattern = /\{\{(?!\s*["'{\[])[^{}\n]{1,200}\}\}/g;
const hits = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
    } else if (scanned.has(extname(entry.name))) {
      const content = await readFile(path, 'utf8');
      const found = content.match(pattern);
      if (found) hits.push({ path, found: [...new Set(found)] });
    }
  }
}

await walk(root);

if (hits.length > 0) {
  console.error(`Znaleziono placeholdery w ${hits.length} plikach:`);
  for (const { path, found } of hits) console.error(`  ${path}: ${found.join(', ')}`);
  process.exit(1);
}

console.log('Brak placeholderów. Można wdrażać.');
