const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const pages = require('./pages.cjs');
const {
  clientAddress,
  hashToken,
  isSameOriginRequest,
  newToken,
  parseCookies,
  safeEqual,
  serializeCookie,
  verifyPassword,
} = require('./security.cjs');

const PUBLIC_DIR = path.join(__dirname, 'public');
const PUBLIC_ASSETS = {
  'beta.css': 'text/css; charset=utf-8',
  'login.js': 'application/javascript; charset=utf-8',
  'admin.js': 'application/javascript; charset=utf-8',
};
const PAGE_CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; " +
  "form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
const FORBIDDEN_FILE = /\.(map|sqlite3?|db|env|log|bak|ts|tsx)$/i;
const CSRF_VALUE = /^[A-Za-z0-9_-]{43}$/;
const jsonParser = express.json({ limit: '2kb', strict: true, type: () => true });

function parseJsonBody(req, res) {
  return new Promise((resolve, reject) => {
    jsonParser(req, res, (error) => (error ? reject(error) : resolve(req.body)));
  });
}

function createBetaRouter({ service, config, logger = console }) {
  const prefix = config.secureCookies ? '__Secure-' : '';
  const names = { session: `${prefix}isq_beta`, csrf: `${prefix}isq_csrf`, admin: `${prefix}isq_admin` };
  const mount = config.mountPath;
  const publicAssets = new Map(
    Object.entries(PUBLIC_ASSETS).map(([name, type]) => [name, { type, body: fs.readFileSync(path.join(PUBLIC_DIR, name)) }])
  );
  const adminEnabled = Boolean(config.admin.username && config.admin.passwordHash);

  // ── helpers ────────────────────────────────────────────────────────────────
  const cookieOptions = (extra) => ({ secure: config.secureCookies, ...extra });
  const cookiesOf = (req) => parseCookies(req.headers.cookie);

  function appendCookie(res, value) {
    res.append('Set-Cookie', value);
  }

  function setSessionCookie(res, token, maxAgeSeconds) {
    appendCookie(res, serializeCookie(names.session, token, cookieOptions({ path: mount, maxAgeSeconds, sameSite: 'Lax' })));
  }

  function clearCookie(res, name, cookiePath, sameSite) {
    appendCookie(res, serializeCookie(name, '', cookieOptions({ path: cookiePath, maxAgeSeconds: 0, sameSite })));
  }

  /** Double-submit CSRF token: an HttpOnly cookie that the page echoes back in a header. */
  function ensureCsrf(req, res) {
    const existing = cookiesOf(req)[names.csrf];
    if (existing && CSRF_VALUE.test(existing)) {
      return existing;
    }
    const token = newToken();
    appendCookie(res, serializeCookie(names.csrf, token, cookieOptions({ path: mount, sameSite: 'Strict' })));
    return token;
  }

  function sendJson(res, status, body) {
    res.status(status).type('application/json').send(JSON.stringify(body));
  }

  function sendPage(res, status, html) {
    res.status(status);
    res.setHeader('Content-Security-Policy', PAGE_CSP);
    res.setHeader('X-Frame-Options', 'DENY');
    res.type('text/html; charset=utf-8').send(html);
  }

  function sendPlain(res, status, text) {
    res.status(status).type('text/plain; charset=utf-8').send(text);
  }

  /** CSRF gate for every state-changing route. Returns the parsed JSON body or null (response sent). */
  async function guardStateChange(req, res) {
    if (!isSameOriginRequest(req, config.siteOrigin)) {
      sendJson(res, 403, { error: 'forbidden' });
      return null;
    }
    const cookieToken = cookiesOf(req)[names.csrf];
    const headerToken = req.headers['x-csrf-token'];
    if (!cookieToken || !CSRF_VALUE.test(cookieToken) || typeof headerToken !== 'string' || !safeEqual(cookieToken, headerToken)) {
      sendJson(res, 403, { error: 'forbidden' });
      return null;
    }
    if (!req.is('application/json')) {
      sendJson(res, 415, { error: 'unsupported_media_type' });
      return null;
    }
    try {
      const body = await parseJsonBody(req, res);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        sendJson(res, 400, { error: 'bad_request' });
        return null;
      }
      return body;
    } catch {
      sendJson(res, 400, { error: 'bad_request' });
      return null;
    }
  }

  function methodNotAllowed(res, allow) {
    res.setHeader('Allow', allow);
    sendJson(res, 405, { error: 'method_not_allowed' });
  }

  const isRead = (req) => req.method === 'GET' || req.method === 'HEAD';

  // ── tester API ─────────────────────────────────────────────────────────────
  async function handleApi(req, res) {
    const route = req.path.replace(/\/+$/, '');

    if (route === '/api/agreement') {
      if (!isRead(req)) return methodNotAllowed(res, 'GET, HEAD');
      const { version, title, statement, checkboxLabel, terms, digest } = service.agreement;
      return sendJson(res, 200, { version, title, statement, checkboxLabel, terms, digest });
    }

    if (route === '/api/session') {
      if (!isRead(req)) return methodNotAllowed(res, 'GET, HEAD');
      const csrfToken = ensureCsrf(req, res);
      const session = service.validateSession(cookiesOf(req)[names.session]);
      return sendJson(
        res,
        200,
        session
          ? { authenticated: true, tester: { name: session.testerName }, expiresAt: session.expiresAt, csrfToken }
          : { authenticated: false, csrfToken }
      );
    }

    if (route === '/api/access') {
      if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
      const body = await guardStateChange(req, res);
      if (!body) return undefined;
      const result = service.authenticate({
        code: body.code,
        accepted: body.acceptTerms === true,
        agreementVersion: body.agreementVersion,
        agreementDigest: body.agreementDigest,
        clientAddress: clientAddress(req, config.trustedProxyHops),
      });
      if (result.ok) {
        setSessionCookie(res, result.token, result.maxAgeSeconds);
        return sendJson(res, 200, { ok: true });
      }
      if (result.reason === 'rate_limited') {
        res.setHeader('Retry-After', String(result.retryAfterSeconds));
        return sendJson(res, 429, { error: 'limited' });
      }
      if (result.reason === 'terms_not_accepted') return sendJson(res, 400, { error: 'terms' });
      if (result.reason === 'terms_outdated') return sendJson(res, 409, { error: 'outdated' });
      // Unknown, inactive, expired and revoked codes are indistinguishable to the caller.
      return sendJson(res, 401, { error: 'invalid' });
    }

    if (route === '/api/logout') {
      if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
      const body = await guardStateChange(req, res);
      if (!body) return undefined;
      service.logout(cookiesOf(req)[names.session]);
      clearCookie(res, names.session, mount, 'Lax');
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: 'not_found' });
  }

  // ── admin ──────────────────────────────────────────────────────────────────
  function adminSessionOf(req) {
    return service.validateAdminSession(cookiesOf(req)[names.admin]);
  }

  function verifyAdminCredentials(username, password) {
    // Always run the password hash so a wrong username costs the same as a wrong password.
    const passwordOk = verifyPassword(typeof password === 'string' ? password : '', config.admin.passwordHash);
    const userOk = safeEqual(hashToken(String(username ?? '')), hashToken(config.admin.username));
    return passwordOk && userOk;
  }

  async function handleAdmin(req, res) {
    if (!adminEnabled) return sendPlain(res, 404, 'Not found');
    const route = req.path.replace(/\/+$/, '') || '/';
    const adminPath = `${mount}/admin`;

    if (route === '/admin') {
      if (!isRead(req)) return methodNotAllowed(res, 'GET, HEAD');
      const csrfToken = ensureCsrf(req, res);
      if (!adminSessionOf(req)) {
        return sendPage(res, 200, pages.renderAdminLoginPage({ csrfToken }));
      }
      const days = Number.parseInt(String(req.query.days ?? '30'), 10);
      const stats = service.stats({ days: Number.isFinite(days) ? days : 30 });
      return sendPage(res, 200, pages.renderDashboard({ stats, query: req.query, csrfToken }));
    }

    if (route === '/admin/api/login') {
      if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
      const body = await guardStateChange(req, res);
      if (!body) return undefined;
      const address = clientAddress(req, config.trustedProxyHops);
      const gate = service.adminLoginGate(address);
      if (gate.blocked) {
        res.setHeader('Retry-After', String(gate.retryAfterSeconds));
        return sendJson(res, 429, { error: 'limited' });
      }
      if (!verifyAdminCredentials(body.username, body.password)) {
        service.recordAdminLoginFailure(address);
        return sendJson(res, 401, { error: 'invalid' });
      }
      const session = service.createAdminSession();
      appendCookie(
        res,
        serializeCookie(names.admin, session.token, cookieOptions({ path: adminPath, maxAgeSeconds: session.maxAgeSeconds, sameSite: 'Strict' }))
      );
      return sendJson(res, 200, { ok: true });
    }

    if (route === '/admin/api/logout') {
      if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
      const body = await guardStateChange(req, res);
      if (!body) return undefined;
      service.revokeAdminSession(cookiesOf(req)[names.admin]);
      clearCookie(res, names.admin, adminPath, 'Strict');
      return sendJson(res, 200, { ok: true });
    }

    if (route === '/admin/api/summary') {
      if (!isRead(req)) return methodNotAllowed(res, 'GET, HEAD');
      if (!adminSessionOf(req)) return sendJson(res, 401, { error: 'unauthorized' });
      const days = Number.parseInt(String(req.query.days ?? '30'), 10);
      return sendJson(res, 200, service.stats({ days: Number.isFinite(days) ? days : 30 }));
    }

    return sendPlain(res, 404, 'Not found');
  }

  // ── protected prototype ────────────────────────────────────────────────────
  function isNavigation(req, requestPath) {
    if (!isRead(req) || !String(req.headers.accept || '').includes('text/html')) return false;
    const extension = path.extname(requestPath.split('/').filter(Boolean).pop() || '');
    return extension === '' || extension.toLowerCase() === '.html';
  }

  /** Maps a URL path to a file inside the prototype root, or returns the HTTP status to send. */
  function resolvePrototypeFile(requestPath) {
    let decoded;
    try {
      decoded = decodeURIComponent(requestPath);
    } catch {
      return { status: 400 };
    }
    const segments = decoded.split('/').filter(Boolean);
    // Rejects traversal, dotfiles, backslashes, drive letters/streams and NUL before touching disk.
    if (segments.some((segment) => segment.startsWith('.') || /[\\:\0]/.test(segment))) {
      return { status: 404 };
    }
    if (segments.length > 0 && FORBIDDEN_FILE.test(segments[segments.length - 1])) {
      return { status: 404 };
    }
    let realRoot;
    try {
      realRoot = fs.realpathSync(config.webDir);
    } catch {
      return { status: 503 };
    }
    const target = segments.length === 0 ? 'index.html' : path.join(...segments);
    let real;
    try {
      real = fs.realpathSync(path.join(realRoot, target));
    } catch {
      return { status: 404, realRoot };
    }
    const relative = path.relative(realRoot, real);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.statSync(real).isFile()) {
      return { status: 404, realRoot };
    }
    return { file: real, realRoot };
  }

  function sendPrototypeFile(req, res, session, resolved) {
    const isDocument = path.relative(resolved.realRoot, resolved.file) === 'index.html';
    if (isDocument) {
      res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
      res.setHeader('X-Frame-Options', 'DENY');
      if (req.method === 'GET') {
        try {
          service.recordVisit(session);
        } catch (error) {
          logger.error(`[isquared-beta] could not record visit: ${error.name}`);
        }
      }
    }
    // private + no-cache: browsers may keep a copy but must revalidate (and so re-authenticate).
    res.setHeader('Cache-Control', 'private, no-cache');
    res.sendFile(resolved.file, { dotfiles: 'allow', cacheControl: false, headers: {} }, (error) => {
      if (error && !res.headersSent) {
        sendPlain(res, error.status === 404 ? 404 : 500, error.status === 404 ? 'Not found' : 'Server error');
      }
    });
  }

  function handlePrototype(req, res) {
    if (!isRead(req)) {
      res.setHeader('Allow', 'GET, HEAD');
      return sendPlain(res, 405, 'Method not allowed');
    }
    const session = service.validateSession(cookiesOf(req)[names.session]);
    if (!session) {
      if (isNavigation(req, req.path)) {
        const csrfToken = ensureCsrf(req, res);
        const html = pages.renderLoginPage({ agreement: service.agreement, csrfToken });
        return sendPage(res, req.path === '/' ? 200 : 401, html);
      }
      return sendPlain(res, 401, 'Unauthorized');
    }

    const resolved = resolvePrototypeFile(req.path);
    if (resolved.file) return sendPrototypeFile(req, res, session, resolved);
    if (resolved.status === 404 && resolved.realRoot && isNavigation(req, req.path)) {
      // The prototype keeps its state in memory and the query string, so any page-like URL
      // gets the entry document (a refresh on a nested URL still works).
      const entry = resolvePrototypeFile('/');
      if (entry.file) return sendPrototypeFile(req, res, session, entry);
    }
    if (resolved.status === 503) return sendPlain(res, 503, 'The prototype has not been deployed yet.');
    return sendPlain(res, resolved.status, resolved.status === 400 ? 'Bad request' : 'Not found');
  }

  function handleSignout(req, res) {
    if (!isRead(req)) return methodNotAllowed(res, 'GET, HEAD');
    const csrfToken = ensureCsrf(req, res);
    const session = service.validateSession(cookiesOf(req)[names.session]);
    return sendPage(res, 200, pages.renderSignoutPage({ csrfToken, testerName: session ? session.testerName : null }));
  }

  // ── dispatch ───────────────────────────────────────────────────────────────
  const router = express.Router({ caseSensitive: false, strict: false });

  router.use(async (req, res, next) => {
    try {
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      res.setHeader('Vary', 'Cookie');

      // Cookies are scoped to the exact-case mount path, so /isquared/x -> /iSquared/x, and the
      // bare mount path gets its trailing slash so relative behavior matches the build base.
      const url = new URL(req.originalUrl, 'http://localhost');
      const first = url.pathname.split('/')[1];
      const rest = url.pathname.slice(first.length + 1);
      if (first !== mount.slice(1) || rest === '') {
        return res.redirect(308, `${mount}${rest || '/'}${url.search}`);
      }

      const p = req.path;
      if (p.startsWith('/_beta/')) {
        const asset = publicAssets.get(p.slice('/_beta/'.length));
        if (!asset || !isRead(req)) return sendPlain(res, 404, 'Not found');
        res.setHeader('Cache-Control', 'no-cache');
        return res.type(asset.type).send(asset.body);
      }
      if (p === '/api' || p.startsWith('/api/')) return await handleApi(req, res);
      if (p === '/admin' || p.startsWith('/admin/')) {
        if (p === '/admin') return res.redirect(308, `${mount}/admin/${url.search}`);
        return await handleAdmin(req, res);
      }
      if (p === '/signout' || p === '/signout/') return handleSignout(req, res);
      return handlePrototype(req, res);
    } catch (error) {
      logger.error(`[isquared-beta] request failed: ${error && error.name}`);
      if (!res.headersSent) return sendPlain(res, 500, 'Server error');
      return next(error);
    }
  });

  return router;
}

module.exports = { createBetaRouter };
