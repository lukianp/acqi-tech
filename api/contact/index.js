'use strict';

const mail = require('../lib/mail');

const MAX = { name: 120, email: 200, organisation: 160, message: 6000 };
const TOPICS = ['deployment', 'preview', 'security', 'support', 'other'];
const FALLBACK_MAIL = 'hello@acqi.tech';

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[A-Za-z]{2,}$/;

function clean(value, limit) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, limit);
}

function readBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function validate(input) {
  const data = {
    name: clean(input.name, MAX.name),
    email: clean(input.email, MAX.email),
    organisation: clean(input.organisation, MAX.organisation),
    topic: TOPICS.indexOf(String(input.topic)) >= 0 ? String(input.topic) : 'other',
    message: clean(input.message, MAX.message)
  };

  const errors = [];
  if (data.name.length < 2) errors.push('name');
  if (!EMAIL.test(data.email)) errors.push('email');
  if (data.message.length < 10) errors.push('message');

  return { data: data, errors: errors };
}

function respond(context, status, payload, extraHeaders) {
  context.res = {
    status: status,
    headers: Object.assign(
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow'
      },
      extraHeaders || {}
    ),
    body: payload
  };
}

/**
 * The transport is injectable so the test suite can prove both the delivered
 * and undelivered paths without a mail provider.
 */
function createHandler(options) {
  const settings = options || {};
  const deliver = typeof settings.deliver === 'function' ? settings.deliver : mail.deliver;
  const fallback = settings.fallbackMail || FALLBACK_MAIL;

  return async function handler(context, req) {
    const method = String(req.method || 'GET').toUpperCase();
    if (method !== 'POST') {
      respond(context, 405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });
      return;
    }

    const body = readBody(req);

    // Honeypot. A real person never sees this field. Never answer 2xx: an
    // undelivered message must not look delivered.
    if (String(body.website || '').trim() !== '') {
      respond(context, 400, { ok: false, error: 'rejected' });
      return;
    }

    const result = validate(body);
    if (result.errors.length > 0) {
      respond(context, 400, { ok: false, error: 'invalid', fields: result.errors });
      return;
    }

    const outcome = await deliver(result.data);

    if (outcome && outcome.ok === true) {
      respond(context, 200, { ok: true });
      return;
    }

    if (outcome && outcome.reason === 'mail_unconfigured') {
      respond(context, 503, {
        ok: false,
        error: 'mail_unconfigured',
        mailto: 'mailto:' + fallback,
        detail: 'The form has no mail transport configured. Use the mail link and the enquiry reaches the same place.'
      });
      return;
    }

    respond(context, 502, {
      ok: false,
      error: 'mail_failed',
      mailto: 'mailto:' + fallback,
      status: outcome && outcome.status ? outcome.status : undefined
    });
  };
}

const handler = createHandler();
module.exports = handler;
module.exports.createHandler = createHandler;
module.exports.validate = validate;
