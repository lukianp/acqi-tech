/**
 * Contact form tests.
 *
 * Rules being proved:
 *   - a 2xx is only ever returned when a transport actually accepted the
 *     message;
 *   - an unconfigured mail path returns a clear error with a mailto fallback,
 *     never a fake success;
 *   - a honeypot submission is rejected, and the transport is not called;
 *   - invalid input is refused before any transport is touched.
 *
 * The last test is the red-first record: a handler that always says "ok" is
 * run through the same assertions and must be caught.
 *
 * Run: node tests/contact.mjs
 */

import { createRequire } from 'node:module';
import { test, assert, equal, includes, excludes, run, failure } from './harness.mjs';

const require = createRequire(import.meta.url);
const contact = require('../api/contact/index.js');

const GOOD = {
  name: 'Alex Morley',
  email: 'alex@example-organisation.co.uk',
  organisation: 'Example Organisation',
  topic: 'deployment',
  message: 'We are buying a 400 seat manufacturer with two sites and need a scoping call.',
  website: ''
};

function request(overrides) {
  return Object.assign({ method: 'POST', headers: {}, query: {}, body: Object.assign({}, GOOD) }, overrides || {});
}

async function invoke(handler, req) {
  const context = {};
  await handler(context, req);
  return context.res;
}

function stub(outcome) {
  const calls = [];
  const fn = async function (message) {
    calls.push(message);
    return outcome;
  };
  fn.calls = calls;
  return fn;
}

test('validation accepts a complete enquiry', () => {
  const result = contact.validate(GOOD);
  equal(result.errors.length, 0);
  equal(result.data.topic, 'deployment');
});

test('validation rejects a missing name, a bad address and a one-line message', () => {
  equal(contact.validate({ name: 'A', email: 'a@b.co', message: 'long enough message' }).errors.indexOf('name') >= 0, true);
  equal(contact.validate({ name: 'Alex', email: 'not-an-address', message: 'long enough message' }).errors.indexOf('email') >= 0, true);
  equal(contact.validate({ name: 'Alex', email: 'a@b.co', message: 'short' }).errors.indexOf('message') >= 0, true);
});

test('validation normalises an unknown topic to other', () => {
  const result = contact.validate(Object.assign({}, GOOD, { topic: 'anything-else' }));
  equal(result.data.topic, 'other');
});

test('a delivered message returns 200 ok:true', async () => {
  const deliver = stub({ ok: true });
  const handler = contact.createHandler({ deliver });
  const res = await invoke(handler, request());
  equal(res.status, 200);
  equal(res.body.ok, true);
  equal(deliver.calls.length, 1, 'the transport should be called exactly once');
  equal(deliver.calls[0].email, GOOD.email);
});

test('an unconfigured mail path returns 503 with a mailto fallback, never ok', async () => {
  const deliver = stub({ ok: false, reason: 'mail_unconfigured' });
  const handler = contact.createHandler({ deliver });
  const res = await invoke(handler, request());
  equal(res.status, 503);
  equal(res.body.ok, false);
  equal(res.body.error, 'mail_unconfigured');
  includes(res.body.mailto, 'mailto:');
});

test('a transport failure returns 502, never ok', async () => {
  const deliver = stub({ ok: false, reason: 'mail_failed', status: 500 });
  const handler = contact.createHandler({ deliver });
  const res = await invoke(handler, request());
  equal(res.status, 502);
  equal(res.body.ok, false);
  equal(res.body.error, 'mail_failed');
});

test('a honeypot submission is rejected and nothing is delivered', async () => {
  const deliver = stub({ ok: true });
  const handler = contact.createHandler({ deliver });
  const res = await invoke(handler, request({ body: Object.assign({}, GOOD, { website: 'http://spam.example' }) }));
  equal(res.status, 400);
  equal(res.body.ok, false);
  equal(res.body.error, 'rejected');
  equal(deliver.calls.length, 0, 'a honeypot submission must not reach the transport');
});

test('invalid input is refused before the transport is touched', async () => {
  const deliver = stub({ ok: true });
  const handler = contact.createHandler({ deliver });
  const res = await invoke(handler, request({ body: { name: '', email: 'x', message: '' } }));
  equal(res.status, 400);
  equal(res.body.error, 'invalid');
  equal(deliver.calls.length, 0);
});

test('a GET is refused', async () => {
  const handler = contact.createHandler({ deliver: stub({ ok: true }) });
  const res = await invoke(handler, request({ method: 'GET' }));
  equal(res.status, 405);
});

test('the shipped handler reports mail_unconfigured while D3 is unanswered', async () => {
  const saved = {
    endpoint: process.env.ACQI_MAIL_ENDPOINT,
    to: process.env.ACQI_MAIL_TO,
    from: process.env.ACQI_MAIL_FROM
  };
  delete process.env.ACQI_MAIL_ENDPOINT;
  delete process.env.ACQI_MAIL_TO;
  delete process.env.ACQI_MAIL_FROM;
  try {
    const res = await invoke(contact, request());
    equal(res.status, 503);
    equal(res.body.ok, false);
    equal(res.body.error, 'mail_unconfigured');
    assert(res.headers['Cache-Control'] === 'no-store', 'an error response must not be cached');
  } finally {
    if (saved.endpoint !== undefined) process.env.ACQI_MAIL_ENDPOINT = saved.endpoint;
    if (saved.to !== undefined) process.env.ACQI_MAIL_TO = saved.to;
    if (saved.from !== undefined) process.env.ACQI_MAIL_FROM = saved.from;
  }
});

test('rejected input never echoes the submission back', async () => {
  const handler = contact.createHandler({ deliver: stub({ ok: false, reason: 'mail_unconfigured' }) });
  const res = await invoke(handler, request());
  const serialised = JSON.stringify(res.body);
  excludes(serialised, GOOD.message, 'the response must not carry the message body');
  excludes(serialised, GOOD.email, 'the response must not carry the sender address');
});

/* ---------------------------------------------------------------- RED proof */

test('RED: a handler that always answers ok is caught by these assertions', async () => {
  const naive = async function (context) {
    context.res = { status: 200, headers: {}, body: { ok: true } };
  };
  const honeypot = await invoke(naive, request({ body: Object.assign({}, GOOD, { website: 'x' }) }));
  const caught = await failure(() => {
    equal(honeypot.status, 400, 'honeypot must not be accepted');
  });
  assert(caught, 'the honeypot assertion failed to notice a handler that accepts everything');
  console.log('        RED proof: always-ok handler rejected with "' + caught + '"');

  const deliver = stub({ ok: false, reason: 'mail_unconfigured' });
  const truthful = contact.createHandler({ deliver });
  const res = await invoke(truthful, request());
  const second = await failure(() => {
    equal(res.status, 200, 'undelivered mail must not look delivered');
  });
  assert(second, 'the delivery assertion failed to notice an undelivered message');
  console.log('        RED proof: undelivered message rejected with "' + second + '"');
});

await run('contact');
