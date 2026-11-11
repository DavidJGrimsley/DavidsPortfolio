const crypto = require('node:crypto');

// Visually unambiguous alphabet (no 0/O, 1/I/L) for generated codes: 31^12 is about 2^59.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const GENERATED_CODE_LENGTH = 12;
const MIN_MANUAL_CODE_LENGTH = 5;
const MAX_CODE_LENGTH = 32;

/** Uppercases and strips spaces/hyphens. Returns null when the value cannot be a code. */
function normalizeCode(input) {
  if (typeof input !== 'string' || input.length > 64) {
    return null;
  }
  const normalized = input.replace(/[\s-]+/g, '').toUpperCase();
  return /^[A-Z0-9]{4,32}$/.test(normalized) ? normalized : null;
}

function validateManualCode(input) {
  const normalized = normalizeCode(input);
  if (!normalized || normalized.length < MIN_MANUAL_CODE_LENGTH || normalized.length > MAX_CODE_LENGTH) {
    throw new Error(
      `Access codes must be ${MIN_MANUAL_CODE_LENGTH}-${MAX_CODE_LENGTH} letters or digits (spaces and hyphens are ignored).`
    );
  }
  return normalized;
}

function generateCode() {
  let code = '';
  for (let index = 0; index < GENERATED_CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function formatCode(code) {
  return code.length === GENERATED_CODE_LENGTH ? code.match(/.{4}/g).join('-') : code;
}

/**
 * Keyed lookup hash for access codes. A short code is guessable offline if the database leaks,
 * so the HMAC key (ISQUARED_BETA_CODE_PEPPER) lives only in the server environment.
 */
function hmac(pepper, purpose, value) {
  return crypto.createHmac('sha256', pepper).update(`${purpose}\0${value}`).digest('hex');
}

function hashCode(pepper, normalizedCode) {
  return hmac(pepper, 'code', normalizedCode);
}

function hashClient(pepper, clientAddress) {
  return hmac(pepper, 'client', clientAddress).slice(0, 32);
}

function newToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// Session and CSRF tokens carry 256 bits of entropy, so a plain SHA-256 is sufficient.
function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 32 };

function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Admin passwords must be at least 12 characters.');
  }
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT.keyLength, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64url'), derived.toString('base64url')].join('$');
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt' || typeof password !== 'string') {
    return false;
  }
  const [, n, r, p, salt, expected] = parts;
  try {
    const expectedBuffer = Buffer.from(expected, 'base64url');
    const derived = crypto.scryptSync(password, Buffer.from(salt, 'base64url'), expectedBuffer.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return derived.length === expectedBuffer.length && crypto.timingSafeEqual(derived, expectedBuffer);
  } catch {
    return false;
  }
}

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) {
      const name = part.slice(0, index).trim();
      if (!(name in cookies)) {
        cookies[name] = part.slice(index + 1).trim();
      }
    }
  }
  return cookies;
}

function serializeCookie(name, value, { maxAgeSeconds, path, secure, sameSite = 'Lax' }) {
  const parts = [`${name}=${value}`, `Path=${path}`, 'HttpOnly', `SameSite=${sameSite}`];
  if (maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }
  if (secure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Address used for rate limiting. X-Forwarded-For is client-controllable on its left side, so
 * only the entry appended by our own proxies (counted from the right) is trusted.
 */
function clientAddress(req, trustedProxyHops) {
  const socketAddress = String((req.socket && req.socket.remoteAddress) || 'unknown');
  if (trustedProxyHops <= 0) {
    return socketAddress;
  }
  const header = req.headers['x-forwarded-for'];
  const list = String(Array.isArray(header) ? header.join(',') : header || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const entry = list.length >= trustedProxyHops ? list[list.length - trustedProxyHops] : list[0];
  return entry || socketAddress;
}

function firstHeader(req, name) {
  const value = req.headers[name];
  return String(Array.isArray(value) ? value[0] : value || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
}

/**
 * Same-origin check for state-changing requests: the Origin header must name this site, and a
 * browser that reports Sec-Fetch-Site must not say cross-site/same-site.
 */
function isSameOriginRequest(req, siteOrigin) {
  const fetchSite = firstHeader(req, 'sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return false;
  }
  const origin = firstHeader(req, 'origin');
  if (!origin) {
    return true;
  }
  let originHost;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  // Only trust the request Host header and the server's configured siteOrigin.
  // Never trust client-supplied X-Forwarded-Host as an allowed origin.
  const allowed = new Set([firstHeader(req, 'host')].filter(Boolean));
  if (siteOrigin) {
    try {
      allowed.add(new URL(siteOrigin).host.toLowerCase());
    } catch {
      // Ignore a malformed configured origin.
    }
  }
  return allowed.has(originHost);
}

module.exports = {
  clientAddress,
  formatCode,
  generateCode,
  hashClient,
  hashCode,
  hashPassword,
  hashToken,
  isSameOriginRequest,
  newToken,
  normalizeCode,
  parseCookies,
  safeEqual,
  serializeCookie,
  validateManualCode,
  verifyPassword,
};
