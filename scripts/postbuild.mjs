/**
 * Post-build:
 *  1. Copy the Static Web Apps configuration into dist.
 *  2. Emit sitemap.xml from the pages that were actually built.
 *  3. Run the built-output content gate.
 *  4. Check every internal link resolves to a file on disk.
 *  5. Prove no preview asset escaped into dist.
 */

import { readdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { checkBuiltHtml } from './content-checks.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://acqi.tech';

const failures = [];

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const files = await walk(DIST);
const html = files.filter((f) => f.endsWith('.html'));

/* 1. SWA config */
await copyFile(join(ROOT, 'staticwebapp.config.json'), join(DIST, 'staticwebapp.config.json'));
console.log('Copied staticwebapp.config.json into dist.');

/* 2. sitemap */
const pages = html
  .map((f) => '/' + relative(DIST, f).split(sep).join('/'))
  .map((p) => (p.endsWith('/index.html') ? p.slice(0, -'index.html'.length) : p))
  .filter((p) => p !== '/404.html' && p !== '/404/')
  .sort();

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages
    .map((p) => `  <url><loc>${ORIGIN}${p}</loc></url>`)
    .join('\n') +
  '\n</urlset>\n';
await writeFile(join(DIST, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Sitemap: ${pages.length} URLs.`);

/* 3. built-output gate */
const built = await checkBuiltHtml(DIST);
failures.push(...built.failures);
console.log(`Content gate (built): ${built.files} pages checked.`);

/* 4. internal links */
const ALLOWED_MISSING = new Set(['/preview', '/preview/', '/api/contact']);

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function resolveInternal(pathname) {
  const clean = decodeURIComponent(pathname.split('#')[0].split('?')[0]);
  if (ALLOWED_MISSING.has(clean) || clean.startsWith('/api/')) return true;
  const candidates = [
    join(DIST, clean),
    join(DIST, clean + '.html'),
    join(DIST, clean, 'index.html'),
    join(DIST, clean.replace(/\/$/, ''), 'index.html'),
  ];
  return candidates.some(isFile);
}

let linkCount = 0;
for (const file of html) {
  const rel = relative(DIST, file).split(sep).join('/');
  const text = await readFile(file, 'utf8');
  const hrefs = [...text.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('data:') || href.startsWith('#')) {
      continue;
    }
    if (!href.startsWith('/')) {
      failures.push(`${rel}  relative link not checked: ${href}`);
      continue;
    }
    linkCount += 1;
    if (!resolveInternal(href)) {
      failures.push(`${rel}  broken internal link: ${href}`);
    }
  }
}
console.log(`Links: ${linkCount} internal references checked across ${html.length} pages.`);

/* 5. preview must not be a static asset */
const leaked = files.filter((f) => {
  const rel = relative(DIST, f).split(sep).join('/');
  return /preview/i.test(rel) && !rel.endsWith('.html');
});
if (leaked.length) {
  for (const f of leaked) failures.push(`preview asset escaped into dist: ${relative(DIST, f)}`);
}
for (const f of files) {
  const rel = relative(DIST, f).split(sep).join('/');
  if (rel.startsWith('preview') && rel.endsWith('.html')) {
    failures.push(`preview page built as a static file: ${rel}`);
  }
}
console.log('Preview isolation: no preview file in dist.');

if (failures.length) {
  console.error('\nPost-build checks failed:\n');
  for (const failure of failures) console.error('  ' + failure);
  console.error(`\n${failures.length} problem(s).\n`);
  process.exit(1);
}

console.log('\nPost-build checks: clean.');
