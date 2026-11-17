'use strict';

const {
  passwordMatches,
  issueToken,
  cookieHeader,
  clearCookieHeader,
  tooManyAttempts,
  clientIp
} = require('../lib/gate');

const STYLE = `
:root{--paper:#fbfaf5;--ink:#14213d;--red:#c1121f;--rule:rgba(20,33,61,.16);--ghost:#6b7590;
--serif:"Baskerville","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;
--sans:"Gill Sans","Gill Sans MT","Trebuchet MS","Segoe UI",system-ui,sans-serif}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--paper);color:var(--ink);
font-family:var(--serif);font-size:16px;line-height:1.6;padding:2rem 1.25rem}
body::after{content:"";position:fixed;inset:0;pointer-events:none;opacity:.035;
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
.card{position:relative;width:100%;max-width:460px;border-top:2px solid var(--ink);padding-top:1.4rem}
.brand{display:flex;align-items:baseline;gap:.55rem;margin-bottom:1.6rem}
.mark{font-size:1.35rem;letter-spacing:.16em;border-right:1px solid var(--rule);padding-right:.6rem}
.sub{font-family:var(--sans);font-size:.58rem;letter-spacing:.3em;text-transform:uppercase;color:var(--ghost)}
.kicker{font-family:var(--sans);font-size:.64rem;letter-spacing:.2em;text-transform:uppercase;color:var(--red);margin:0 0 .7rem}
h1{font-weight:400;font-size:1.9rem;line-height:1.12;margin:0 0 .8rem;letter-spacing:-.012em}
p{margin:0 0 1rem;color:#414d6b;font-size:.94rem;max-width:42ch}
label{display:block;font-family:var(--sans);font-size:.64rem;letter-spacing:.16em;text-transform:uppercase;
color:var(--ghost);margin-bottom:.35rem}
input{width:100%;font-family:var(--serif);font-size:1rem;padding:.7rem .8rem;border:1px solid rgba(20,33,61,.45);
background:#fdfcf8;border-radius:0;color:var(--ink)}
input:focus-visible{outline:2px solid var(--red);outline-offset:0}
button{margin-top:1.1rem;width:100%;font-family:var(--sans);font-size:.7rem;letter-spacing:.17em;
text-transform:uppercase;background:var(--ink);color:var(--paper);border:1px solid var(--ink);padding:.85rem 1rem;cursor:pointer}
button:hover{background:var(--red);border-color:var(--red)}
.error{border-left:2px solid var(--red);background:rgba(193,18,31,.05);padding:.7rem .85rem;font-size:.85rem;
color:var(--ink);margin:0 0 1.1rem}
.note{font-family:var(--sans);font-size:.7rem;color:var(--ghost);margin-top:1.4rem;line-height:1.6}
a{color:var(--ink);text-decoration-color:var(--red)}
footer{margin-top:2.4rem;border-top:1px solid var(--rule);padding-top:.8rem;font-family:var(--sans);
font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ghost);display:flex;
justify-content:space-between;gap:1rem;flex-wrap:wrap}
`;

function page(options) {
  const error = options.error
    ? '<p class="error" role="alert">' + options.error + '</p>'
    : '';
  return (
    '<!doctype html><html lang="en-GB"><head><meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
    '<meta name="robots" content="noindex, nofollow, noarchive" />' +
    '<title>Preview access · ACQI</title><style>' +
    STYLE +
    '</style></head><body><main class="card">' +
    '<div class="brand"><span class="mark">ACQI</span><span class="sub">Technologies</span></div>' +
    '<p class="kicker">Gated preview</p>' +
    '<h1>The app shell, with a sample deal loaded.</h1>' +
    '<p>This preview is issued to named individuals. The password travels through the fund application channel or from a named ACQI contact. It is not published on the public site.</p>' +
    error +
    '<form method="post" action="/preview-login" autocomplete="off">' +
    '<input type="hidden" name="next" value="' +
    options.next +
    '" />' +
    '<label for="password">Preview password</label>' +
    '<input id="password" name="password" type="password" required autofocus />' +
    '<button type="submit">Enter the preview</button>' +
    '</form>' +
    '<p class="note">The preview contains sample data only. Nothing in it connects to an environment, saves a record or runs a collector.</p>' +
    '<footer><span>Preview with sample data</span><a href="https://acqi.tech/">acqi.tech</a></footer>' +
    '</main></body></html>'
  );
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      const params = new URLSearchParams(body);
      const out = {};
      params.forEach(function (value, key) {
        out[key] = value;
      });
      return out;
    }
  }
  return body;
}

function safeNext(value) {
  const next = String(value || '/preview/');
  if (next.indexOf('/preview') !== 0 || next.indexOf('//') === 0) return '/preview/';
  return next;
}

module.exports = async function (context, req) {
  const method = (req.method || 'GET').toUpperCase();
  const query = req.query || {};

  if (method !== 'POST') {
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; img-src data:; base-uri 'none'; frame-ancestors 'none'"
      },
      body: page({ next: escapeHtml(safeNext(query.next)) })
    };
    return;
  }

  const ip = clientIp(req);
  if (tooManyAttempts(ip)) {
    context.res = {
      status: 429,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '900',
        'X-Robots-Tag': 'noindex, nofollow'
      },
      body: page({
        next: '/preview/',
        error: 'Too many attempts from this address. Try again later, or ask for the password again.'
      })
    };
    return;
  }

  const body = readBody(req);
  const next = safeNext(body.next || query.next);

  if (!passwordMatches(body.password)) {
    await new Promise(function (resolve) {
      setTimeout(resolve, 400);
    });
    context.res = {
      status: 401,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'Set-Cookie': clearCookieHeader()
      },
      body: page({
        next: escapeHtml(next),
        error: 'That password was not accepted. Nothing was granted.'
      })
    };
    return;
  }

  context.res = {
    status: 302,
    headers: {
      Location: next,
      'Set-Cookie': cookieHeader(issueToken()),
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    },
    body: ''
  };
};
