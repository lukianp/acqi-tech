'use strict';

const { isAuthorised } = require('../lib/gate');
const app = require('./_app');

function originalPath(req) {
  const raw = req.headers['x-ms-original-url'];
  if (!raw) return '/preview/';
  try {
    return new URL(raw).pathname + (new URL(raw).search || '');
  } catch {
    return '/preview/';
  }
}

module.exports = async function (context, req) {
  const wantsHtml = /text\/html/i.test((req.headers && req.headers.accept) || '');

  if (!isAuthorised(req)) {
    const target = '/preview-login?next=' + encodeURIComponent(originalPath(req));
    if (wantsHtml) {
      context.res = {
        status: 302,
        headers: {
          Location: target,
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow'
        },
        body: ''
      };
      return;
    }

    context.res = {
      status: 401,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'WWW-Authenticate': 'Preview'
      },
      body:
        'Preview access requires the shared password issued with your application.\n' +
        'Open https://acqi.tech/preview-login in a browser.\n'
    };
    return;
  }

  const html = app.shell
    .replace('{{CSS}}', app.css)
    .replace('{{DATA}}', app.data)
    .replace('{{JS}}', app.js);

  context.res = {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy':
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    },
    body: html
  };
};
