/**
 * Content and structure tests.
 *
 * The build already fails on a content violation (scripts/prebuild.mjs and
 * scripts/postbuild.mjs). This file re-runs the same checks so the rule is
 * also proved by the test suite, and adds the structural promises the founder
 * asked for: enough real support articles, a robots file that keeps /preview
 * out of search, a security.txt that names a real address, and no preview
 * file sitting in the built output as a static asset.
 *
 * It also proves the checker itself works, by feeding it a deliberately bad
 * file. That is the red-first record: a checker that cannot fail is not a
 * checker.
 *
 * Run: node tests/content.mjs
 */

import { readFile, readdir, writeFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test, assert, equal, includes, excludes, run, failure } from './harness.mjs';

const { checkTree, checkBuiltHtml } = await import('../scripts/content-checks.mjs');

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DIST = join(ROOT, 'dist');
const BANNER = 'Preview with sample data. Not connected to any environment.';

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function read(path) {
  return readFile(path, 'utf8');
}

test('source content gate is clean across src, preview, public, api and scripts', async () => {
  const parts = [];
  for (const dir of ['src', 'preview', 'public', 'api', 'scripts']) {
    parts.push(await checkTree(join(ROOT, dir), dir));
  }
  const failures = parts.flatMap((part) => part.failures);
  assert(failures.length === 0, 'content gate found:\n' + failures.join('\n'));
  const files = parts.reduce((total, part) => total + part.files, 0);
  console.log('        checked ' + files + ' files');
});

test('at least eight support articles exist and are indexed', async () => {
  const dir = join(ROOT, 'src', 'content', 'support');
  const entries = (await readdir(dir)).filter((name) => name.endsWith('.md'));
  assert(entries.length >= 8, 'expected at least 8 support articles, found ' + entries.length);
  const index = await read(join(ROOT, 'src', 'pages', 'support', 'index.astro'));
  includes(index, 'getCollection', 'the support index must read the collection rather than hard-code links');
  console.log('        ' + entries.length + ' articles');
});

test('robots.txt disallows the preview and names the sitemap', async () => {
  const robots = await read(join(ROOT, 'public', 'robots.txt'));
  includes(robots, 'Disallow: /preview', 'the preview must be disallowed');
  includes(robots, 'Sitemap:', 'robots.txt should point at the sitemap');
});

test('security.txt names a security address and an expiry', async () => {
  const text = await read(join(ROOT, 'public', '.well-known', 'security.txt'));
  assert(/^Contact: mailto:security@acqi\.tech/m.test(text), 'security.txt must name security@acqi.tech');
  const expires = text.match(/^Expires:\s*(.+)$/m);
  assert(expires, 'security.txt must carry an expiry');
  const when = Date.parse(expires[1]);
  assert(Number.isFinite(when), 'the expiry must be a date');
  assert(when > Date.now(), 'the expiry must be in the future');
});

test('every gated response carries noindex, and the preview is not a static asset', async () => {
  const fn = await read(join(ROOT, 'api', 'preview', 'index.js'));
  includes(fn, 'noindex', 'the preview Function must send X-Robots-Tag: noindex');
  equal(await exists(join(ROOT, 'public', 'preview')), false, 'preview source must not sit under public/');
  equal(await exists(join(ROOT, 'public', 'preview-login')), false, 'nothing under /preview may be a static file');
  const config = JSON.parse(await read(join(ROOT, 'staticwebapp.config.json')));
  const routes = JSON.stringify(config.routes);
  includes(routes, '/preview/*', 'the config must rewrite nested preview paths');
  includes(routes, '/api/preview', 'the rewrite target must be the Function, not a static file');
  includes(routes, '/preview-login', 'the login page must reach the Function, not a static file');
});

test('the fixture carries the exact banner and all three data states', async () => {
  const fixture = JSON.parse(await read(join(ROOT, 'preview', 'fixture.json')));
  equal(fixture.meta.banner, BANNER, 'the banner must match the founder ruling word for word');
  const text = JSON.stringify(fixture);
  includes(text, 'collected', 'the fixture must show collected data');
  includes(text, 'not-collected', 'the fixture must show data that was not collected');
  includes(text, 'unreadable', 'the fixture must show data that could not be read');
});

test('the preview is fictional and carries no customer name', async () => {
  const fixture = await read(join(ROOT, 'preview', 'fixture.json'));
  includes(fixture, 'Northwind Holdings');
  includes(fixture, 'Contoso Manufacturing');
});

test('the footer still says the entity is in formation', async () => {
  const site = await read(join(ROOT, 'src', 'site.ts'));
  includes(site, "legalName: 'ACQI Technologies (in formation)'");
});

test('the home page states that the software is installed, not hosted', async () => {
  const home = await read(join(ROOT, 'src', 'pages', 'index.astro'));
  const text = home.toLowerCase();
  assert(text.indexOf('installed') >= 0, 'the home page must say the software is installed');
  assert(text.indexOf('hosted') >= 0 || text.indexOf('not a hosted') >= 0, 'the home page must address hosting');
});

test('built output passes the content gate, one h1 per page, lang on every page', async () => {
  if (!(await exists(DIST))) {
    console.log('        SKIPPED: dist not built. npm run build runs this gate in postbuild.');
    return;
  }
  const result = await checkBuiltHtml(DIST);
  assert(result.failures.length === 0, 'built output gate found:\n' + result.failures.join('\n'));
  assert(result.files >= 14, 'expected at least 14 built pages, found ' + result.files);
  console.log('        ' + result.files + ' built pages');
});

test('no built file leaks the gated shell to the static asset tree', async () => {
  if (!(await exists(DIST))) {
    console.log('        SKIPPED: dist not built.');
    return;
  }
  const entries = await readdir(DIST, { recursive: true });
  const leaked = entries.filter((entry) => {
    const normalised = String(entry).replace(/\\/g, '/').toLowerCase();
    return normalised.startsWith('preview') || normalised.indexOf('/preview/') >= 0;
  });
  assert(leaked.length === 0, 'preview files found in dist: ' + leaked.join(', '));

  const htmlFiles = entries.filter((entry) => String(entry).endsWith('.html'));
  for (const file of htmlFiles) {
    const text = await read(join(DIST, String(file)));
    excludes(text, BANNER, 'a built static page carries the preview banner: ' + file);
  }
});

/* ---------------------------------------------------------------- RED proof */

test('RED: the content checker catches an em dash and a hyped adjective', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'acqi-gate-'));
  try {
    const emDash = String.fromCharCode(0x2014);
    const hype = 'sea' + 'mless';
    await writeFile(join(dir, 'bad.astro'), '<h1>Our ' + hype + ' platform ' + emDash + ' now</h1>\n', 'utf8');
    const result = await checkTree(dir, 'red-proof');
    const caught = await failure(() => {
      assert(result.failures.length === 0, 'the checker accepted a bad file');
    });
    assert(caught, 'the checker found no violation in a file that has two');
    const joined = result.failures.join('\n');
    includes(joined, 'em dash');
    includes(joined, 'banned word');
    console.log('        RED proof: checker caught ' + result.failures.length + ' violations');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

await run('content');
