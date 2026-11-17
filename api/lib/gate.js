'use strict';

const crypto = require('crypto');

const COOKIE_NAME = 'acqi_preview';
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret() {
  const explicit = process.env.PREVIEW_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  const password = process.env.PREVIEW_PASSWORD || '';
  return crypto.createHash('sha256').update('acqi-preview-gate|' + password).digest('hex');
}

function passwordMatches(candidate) {
  const expected = process.env.PREVIEW_PASSWORD || '';
  if (!expected) return false;
  const a = crypto.createHash('sha256').update(String(candidate || '')).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function sign(expiresAt) {
  return crypto.createHmac('sha256', secret()).update(String(expiresAt)).digest('hex');
}

function issueToken(now) {
  const expiresAt = Math.floor((now || Date.now()) / 1000) + MAX_AGE_SECONDS;
  return expiresAt + '.' + sign(expiresAt);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  String(header)
    .split(';')
    .forEach(function (part) {
      const index = part.indexOf('=');
      if (index < 0) return;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      if (key) out[key] = decodeURIComponent(value);
    });
  return out;
}

function tokenValid(token, now) {
  if (!token) return false;
  const parts = String(token).split('.');
  if (parts.length !== 2) return false;
  const expiresAt = Number(parts[0]);
  if (!Number.isFinite(expiresAt)) return false;
  const current = Math.floor((now || Date.now()) / 1000);
  if (expiresAt <= current) return false;
  if (expiresAt > current + MAX_AGE_SECONDS + 60) return false;

  const expected = sign(expiresAt);
  const given = String(parts[1] || '');
  if (given.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(given, 'hex'));
  } catch {
    return false;
  }
}

function isAuthorised(req, now) {
  const cookies = parseCookies(req.headers && req.headers.cookie);
  return tokenValid(cookies[COOKIE_NAME], now);
}

function cookieHeader(token) {
  return (
    COOKIE_NAME +
    '=' +
    encodeURIComponent(token) +
    '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' +
    MAX_AGE_SECONDS
  );
}

function clearCookieHeader() {
  return COOKIE_NAME + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

/* A crude per-instance throttle. Cold starts reset it, so it is a speed bump
   for automated guessing rather than a durable counter. */
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function tooManyAttempts(ip, now) {
  const key = String(ip || 'unknown');
  const current = now || Date.now();
  const entry = attempts.get(key);
  if (!entry || current - entry.first > WINDOW_MS) {
    attempts.set(key, { first: current, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function clientIp(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return (req.headers && req.headers['x-ms-client-ip']) || 'unknown';
}

module.exports = {
  COOKIE_NAME,
  MAX_AGE_SECONDS,
  passwordMatches,
  issueToken,
  isAuthorised,
  cookieHeader,
  clearCookieHeader,
  tooManyAttempts,
  clientIp,
  parseCookies,
  tokenValid
};
