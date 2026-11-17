/**
 * Gate tests.
 *
 * The point of the gate is that /preview is unreachable without the password.
 * These tests prove three things:
 *   1. the token helpers behave (round trip, expiry, tamper, wrong password);
 *   2. the preview Function refuses unauthenticated requests and serves only
 *      an authenticated one;
 *   3. the assertions actually catch a broken gate. A naive handler that
 *      always serves the shell is run through the same check and must FAIL.
 *      That third part is the red-first record: it shows the test is not a
 *      rubber stamp.
 *
 * Run: node tests/gate.mjs
 */

import { createRequire } from 'node:module';
import { test, assert, equal, includes, run, failure } from './harness.mjs';

const require = createRequire(import.meta.url);

process.env.PREVIEW_PASSWORD = 'test-password-not-the-real-one';
delete process.env.PREVIEW_SECRET;

const gate = require('../api/lib/gate.js');

const BANNER = 'Preview with sample data. Not connected to any environment.';

function request(overrides) {
  return Object.assign({ method: 'GET', headers: {}, query: {} }, overrides || {});
}

async function invoke(handler, req) {
  const context = {};
  await handler(context, req);
  return context.res;
}

/** The core assertion: an unauthenticated request must never receive the shell. */
function assertRefused(response) {
  assert(response, 'the handler produced no response');
  const body = typeof response.body === 'string' ? response.body : '';
  equal(body.indexOf(BANNER) >= 0, false, 'unauthenticated response leaked the preview shell');
  assert(
    response.status === 401 || response.status === 302 || response.status === 403,
    'expected a refusal status, received ' + response.status
  );
  if (response.status === 302) {
    includes(response.headers.Location, '/preview-login', 'refusal must redirect to the gate');
  }
}

test('password comparison accepts the configured password only', () => {
  equal(gate.passwordMatches('test-password-not-the-real-one'), true);
  equal(gate.passwordMatches('test-password-not-the-real-onf'), false);
  equal(gate.passwordMatches(''), false);
  equal(gate.passwordMatches(undefined), false);
});

test('password comparison refuses everything when no password is configured', () => {
  const saved = process.env.PREVIEW_PASSWORD;
  delete process.env.PREVIEW_PASSWORD;
  try {
    equal(gate.passwordMatches(''), false);
    equal(gate.passwordMatches('anything'), false);
  } finally {
    process.env.PREVIEW_PASSWORD = saved;
  }
});

test('issued token validates and a tampered token does not', () => {
  const token = gate.issueToken();
  equal(gate.tokenValid(token), true);
  const parts = token.split('.');
  equal(gate.tokenValid(parts[0] + '.' + 'f'.repeat(parts[1].length)), false);
  equal(gate.tokenValid(parts[0] + '.' + parts[1].slice(0, -1)), false);
  equal(gate.tokenValid('not-a-token'), false);
  equal(gate.tokenValid(''), false);
});

test('expired token and far-future token are refused', () => {
  const now = Date.now();
  const past = gate.issueToken(now - gate.MAX_AGE_SECONDS * 1000 - 5000);
  equal(gate.tokenValid(past, now), false);
  const future = gate.issueToken(now + 60 * 60 * 1000);
  equal(gate.tokenValid(future, now), false);
});

test('isAuthorised reads only the named cookie', () => {
  const token = gate.issueToken();
  equal(gate.isAuthorised({ headers: { cookie: gate.COOKIE_NAME + '=' + encodeURIComponent(token) } }), true);
  equal(gate.isAuthorised({ headers: { cookie: 'other=' + encodeURIComponent(token) } }), false);
  equal(gate.isAuthorised({ headers: {} }), false);
});

test('cookie header is HttpOnly, Secure and path-scoped', () => {
  const header = gate.cookieHeader(gate.issueToken());
  includes(header, 'HttpOnly');
  includes(header, 'Secure');
  includes(header, 'SameSite=Lax');
  includes(header, 'Path=/');
  includes(gate.clearCookieHeader(), 'Max-Age=0');
});

test('throttle blocks repeated attempts from one address', () => {
  const ip = 'test-ip-' + Math.random();
  for (let i = 0; i < 8; i += 1) {
    equal(gate.tooManyAttempts(ip), false, 'attempt ' + (i + 1) + ' should be allowed');
  }
  equal(gate.tooManyAttempts(ip), true, 'the ninth attempt should be blocked');
});

test('clientIp prefers the forwarded header', () => {
  equal(gate.clientIp({ headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' } }), '203.0.113.9');
  equal(gate.clientIp({ headers: {} }), 'unknown');
});

test('preview Function refuses an unauthenticated document request', async () => {
  const handler = require('../api/preview/index.js');
  const res = await invoke(handler, request({ headers: { accept: 'text/html' } }));
  assertRefused(res);
  equal(res.status, 302);
});

test('preview Function returns a hard refusal to a non-document request', async () => {
  const handler = require('../api/preview/index.js');
  const res = await invoke(handler, request({ method: 'HEAD', headers: { accept: '*/*' } }));
  assertRefused(res);
  equal(res.status, 401);
});

test('preview Function refuses a request with only the wrong cookie', async () => {
  const handler = require('../api/preview/index.js');
  const res = await invoke(
    handler,
    request({ headers: { accept: 'text/html', cookie: gate.COOKIE_NAME + '=9999999999.deadbeef' } })
  );
  assertRefused(res);
});

test('preview Function serves the shell to a valid cookie', async () => {
  const handler = require('../api/preview/index.js');
  const res = await invoke(
    handler,
    request({
      headers: { accept: 'text/html', cookie: gate.COOKIE_NAME + '=' + encodeURIComponent(gate.issueToken()) }
    })
  );
  equal(res.status, 200);
  includes(res.body, BANNER);
  includes(res.headers['X-Robots-Tag'], 'noindex');
  equal(res.headers['Cache-Control'].indexOf('no-store'), 0);
});

test('preview-login rejects a wrong password without issuing a cookie', async () => {
  const handler = require('../api/preview-login/index.js');
  const res = await invoke(handler, {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.' + Math.floor(Math.random() * 200) },
    query: {},
    body: { password: 'wrong', next: '/preview/' }
  });
  equal(res.status, 401);
  equal(res.headers['Set-Cookie'].indexOf(gate.COOKIE_NAME + '=;'), 0);
  assert(res.headers['Set-Cookie'].indexOf('Max-Age=0') > 0, 'a refused login must clear the cookie');
});

test('preview-login issues a cookie for the right password and only redirects into /preview', async () => {
  const handler = require('../api/preview-login/index.js');
  const res = await invoke(handler, {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.' + Math.floor(Math.random() * 200) },
    query: {},
    body: { password: 'test-password-not-the-real-one', next: 'https://evil.example/steal' }
  });
  equal(res.status, 302);
  equal(res.headers.Location, '/preview/');
  includes(res.headers['Set-Cookie'], gate.COOKIE_NAME + '=');
});

/* ---------------------------------------------------------------- RED proof */

test('RED: a gate that always serves is caught by these assertions', async () => {
  const app = require('../api/preview/_app.js');
  const naive = async function (context) {
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: app.shell.replace('{{CSS}}', app.css).replace('{{DATA}}', app.data).replace('{{JS}}', app.js)
    };
  };
  const res = await invoke(naive, request({ headers: { accept: 'text/html' } }));
  const leaked = await failure(() => assertRefused(res));
  assert(leaked, 'the leak assertion failed to notice an open gate, so it proves nothing');
  console.log('        RED proof: open gate rejected with "' + leaked + '"');
});

await run('gate');
