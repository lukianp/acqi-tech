/**
 * Pre-build:
 *  1. Run the source content gate (fails the build on any violation).
 *  2. Bundle the gated preview into the function that serves it.
 *
 * The preview lives in its own folder so that no file in it can ever be
 * served as a static asset. The function gets a single generated module.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { checkTree } from './content-checks.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const read = (p) => readFile(join(ROOT, p), 'utf8');

async function bundlePreview() {
  const shell = await read('preview/shell.html');
  const css = await read('preview/preview.css');
  const js = await read('preview/app.js');
  const fixture = JSON.parse(await read('preview/fixture.json'));

  for (const token of ['{{CSS}}', '{{DATA}}', '{{JS}}']) {
    if (!shell.includes(token)) throw new Error(`preview/shell.html is missing ${token}`);
  }
  if (/<\/script/i.test(js)) throw new Error('preview/app.js contains a closing script tag');
  if (/<\/style/i.test(css)) throw new Error('preview/preview.css contains a closing style tag');

  const banner = 'Preview with sample data. Not connected to any environment.';
  if (!shell.includes(banner)) throw new Error('shell banner text drifted from the required wording');
  if (!JSON.stringify(fixture).includes(banner)) {
    throw new Error('fixture meta.banner drifted from the required wording');
  }

  // JSON.stringify then escape any closing tag sequence so the payload cannot
  // break out of its <script type="application/json"> element.
  const data = JSON.stringify(fixture).replace(/<\//g, '<\\/');

  const module =
    '// GENERATED FILE. Do not edit. Source: preview/. Regenerate with npm run build.\n' +
    "'use strict';\n" +
    'module.exports = {\n' +
    '  shell: ' + JSON.stringify(shell) + ',\n' +
    '  css: ' + JSON.stringify(css) + ',\n' +
    '  js: ' + JSON.stringify(js) + ',\n' +
    '  data: ' + JSON.stringify(data) + '\n' +
    '};\n';

  await mkdir(join(ROOT, 'api/preview'), { recursive: true });
  await writeFile(join(ROOT, 'api/preview/_app.js'), module, 'utf8');
  console.log(`Preview bundle: ${Math.round(module.length / 1024)} kB written to api/preview/_app.js`);
}

const src = await checkTree(join(ROOT, 'src'), 'src');
const preview = await checkTree(join(ROOT, 'preview'), 'preview');
const pub = await checkTree(join(ROOT, 'public'), 'public');
const failures = [...src.failures, ...preview.failures, ...pub.failures];

if (failures.length) {
  console.error('\nContent gate failed:\n');
  for (const failure of failures) console.error('  ' + failure);
  console.error(`\n${failures.length} violation(s). Build stopped.\n`);
  process.exit(1);
}

console.log(`Content gate (source): clean. ${src.files + preview.files + pub.files} files checked.`);

await bundlePreview();
