/**
 * Build-time content gate.
 *
 * Everything the founder ruled out is checked here rather than trusted to
 * review: em dashes, hype vocabulary, borrowed credibility, held-certification
 * claims, leftover placeholders, and addresses that are not ours.
 *
 * Runs on source text before the Astro build and on the built HTML afterwards.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

export const TEXT_EXTENSIONS = new Set([
  '.astro',
  '.md',
  '.mdx',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.json',
  '.css',
  '.html',
  '.txt',
  '.xml',
  '.svg',
  '.yml',
  '.yaml',
]);

const BANNED_WORDS = [
  ['revolutionar', /\brevolutionar(y|ily|ies)\b/i],
  ['seamless', /\bseamless(ly)?\b/i],
  ['cutting-edge', /\bcutting[-\s]?edge\b/i],
  ['unlock', /\bunlock(s|ed|ing)?\b/i],
  ['empower', /\bempower(s|ed|ing|ment)?\b/i],
  ['leverage', /\bleverag(e|es|ed|ing)\b/i],
  ['best-in-class', /\bbest[-\s]in[-\s]class\b/i],
  ['world-class', /\bworld[-\s]class\b/i],
  ['game-changing', /\bgame[-\s]chang(er|ing)\b/i],
];

const BANNED_PHRASES = [
  ['trusted by', /\btrusted by\b/i],
  ['testimonial', /\btestimonial(s)?\b/i],
  ['as seen in', /\bas seen in\b/i],
  ['award-winning', /\baward[-\s]winning\b/i],
  ['placeholder', /\b(lorem ipsum|todo:|tbd\b|fixme)\b/i],
];

function isIgnoredFile(rel) {
  return (
    rel.startsWith('node_modules') ||
    rel.startsWith('dist') ||
    rel.startsWith('.astro') ||
    rel.startsWith('.git') ||
    rel.startsWith('api/preview/_app.js') ||
    rel.endsWith('scripts/content-checks.mjs')
  );
}

async function walk(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro' || entry.name === '.git') {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, acc);
    } else if (TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase()) || entry.name === 'security.txt') {
      acc.push(full);
    }
  }
  return acc;
}

export async function checkTree(dir, label) {
  const failures = [];
  const files = await walk(dir);

  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    if (isIgnoredFile(rel)) continue;
    const text = await readFile(file, 'utf8');
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      const where = `${rel}:${index + 1}`;

      if (line.includes('\u2014')) {
        failures.push(`${where}  em dash (U+2014) is not allowed: ${line.trim().slice(0, 90)}`);
      }
      for (const [name, pattern] of BANNED_WORDS) {
        if (pattern.test(line)) {
          failures.push(`${where}  banned word "${name}": ${line.trim().slice(0, 90)}`);
        }
      }
      for (const [name, pattern] of BANNED_PHRASES) {
        if (pattern.test(line)) {
          failures.push(`${where}  banned phrase "${name}": ${line.trim().slice(0, 90)}`);
        }
      }
      if (/\b(ISO\/?IEC ?27001|SOC ?2|Cyber Essentials)\b[^.]{0,60}\bcertified\b/i.test(line)) {
        failures.push(`${where}  certification claimed as held: ${line.trim().slice(0, 90)}`);
      }
      if (/\bcertified\b[^.]{0,60}\b(ISO\/?IEC ?27001|SOC ?2|Cyber Essentials)\b/i.test(line)) {
        failures.push(`${where}  certification claimed as held: ${line.trim().slice(0, 90)}`);
      }
      const emails = line.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
      for (const email of emails) {
        if (!email.toLowerCase().endsWith('@acqi.tech')) {
          failures.push(`${where}  address that is not ours: ${email}`);
        }
      }
      const ipMatch = line.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
      for (const ip of ipMatch) {
        const isPrivate =
          /^10\./.test(ip) ||
          /^127\./.test(ip) ||
          /^0\./.test(ip) ||
          /^192\.168\./.test(ip) ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
        if (!isPrivate) {
          failures.push(`${where}  public IP literal: ${ip}`);
        }
      }
    });
  }

  return { label, failures, files: files.length };
}

export async function checkBuiltHtml(dir) {
  const failures = [];
  const files = await walk(dir);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));

  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    const text = await readFile(file, 'utf8');

    if (text.includes('\u2014')) {
      failures.push(`${rel}  built output contains an em dash`);
    }
    for (const [name, pattern] of BANNED_WORDS) {
      const match = text.match(pattern);
      if (match) {
        failures.push(`${rel}  built output contains banned word "${name}" (${match[0]})`);
      }
    }
    for (const [name, pattern] of BANNED_PHRASES) {
      const match = text.match(pattern);
      if (match) {
        failures.push(`${rel}  built output contains banned phrase "${name}" (${match[0]})`);
      }
    }
    const h1s = text.match(/<h1[\s>]/g) || [];
    if (h1s.length !== 1) {
      failures.push(`${rel}  expected exactly one h1, found ${h1s.length}`);
    }
    if (!/<html lang="[a-z-]+">/i.test(text)) {
      failures.push(`${rel}  html element is missing a lang attribute`);
    }
    if (text.includes('{{') && !text.includes('application/ld+json')) {
      failures.push(`${rel}  unrendered template token in built output`);
    }
  }

  return { label: 'built output', failures, files: htmlFiles.length };
}

async function main() {
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

  console.log(
    `Content gate: clean (${src.files} src, ${preview.files} preview, ${pub.files} public files checked).`
  );
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('content-checks.mjs')) {
  await main();
}
