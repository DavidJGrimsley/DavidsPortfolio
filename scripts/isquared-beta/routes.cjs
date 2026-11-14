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
const { sanitizeErrorCode } = require('./simulator-service.cjs');

const PUBLIC_DIR = path.join(__dirname, 'public');
const PUBLIC_ASSETS = {
  'beta.css': 'text/css; charset=utf-8',
  'login.js': 'application/javascript; charset=utf-8',
  'admin.js': 'application/javascript; charset=utf-8',
};
const PAGE_CSP =
  "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; " +
  "form-action 'self'; base-uri 'none'; frame-ancestors 'none'; frame-src 'self' data: blob: https://*.expo.dev https://expo.dev";
const FORBIDDEN_FILE = /\.(map|sqlite3?|db|env|log|bak|ts|tsx)$/i;
const CSRF_VALUE = /^[A-Za-z0-9_-]{43}$/;
const jsonParser = express.json({ limit: '2kb', strict: true, type: () => true });

function parseJsonBody(req, res) {
  return new Promise((resolve, reject) => {
    jsonParser(req, res, (error) => (error ? reject(error) : resolve(req.body)));
  });
}

function createBetaRouter({ service, simulatorService, config, logger = console }) {
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

    if (route === '/api/personal-message') {
      if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
      res.setHeader('Cache-Control', 'private, no-store');
      const body = await guardStateChange(req, res);
      if (!body) return undefined;
      const result = service.lookupMessage({ code: body.code, clientAddress: clientAddress(req, config.trustedProxyHops) });
      if (result.limited) {
        res.setHeader('Retry-After', String(result.retryAfterSeconds));
        return sendJson(res, 429, { error: 'limited' });
      }
      return sendJson(res, 200, { message: result.message });
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

    // ── simulator API ──────────────────────────────────────────────────────────
    if (route === '/api/simulator/session') {
      if (!isRead(req)) return methodNotAllowed(res, 'GET, HEAD');
      const session = service.validateSession(cookiesOf(req)[names.session]);
      if (!session) return sendJson(res, 401, { error: 'unauthorized' });

      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Pragma', 'no-cache');
      const csrfToken = ensureCsrf(req, res);
      const budget = simulatorService ? simulatorService.getBudgetStatus() : null;
      let activeSession = simulatorService ? simulatorService.getActiveSession(session.testerId) : null;
      if (activeSession && ['starting', 'active'].includes(activeSession.status) && typeof simulatorService.syncActiveSession === 'function') {
        activeSession = await simulatorService.syncActiveSession(session.testerId);
      }
      const providerAvail = simulatorService?.provider
        ? await simulatorService.provider.isAvailable()
        : { available: false, reason: 'no_provider' };

      return sendJson(res, 200, {
        authenticated: true,
        tester: { id: session.testerId, name: session.testerName },
        provider: providerAvail,
        budget,
        session: activeSession
          ? {
              id: activeSession.id,
              projectId: activeSession.projectId,
              platform: activeSession.platform,
              status: activeSession.status,
              durationSeconds: activeSession.durationSeconds,
              remainingSeconds: Math.max(
                0,
                Math.floor((Date.parse(activeSession.expiresAt) - Date.now()) / 1000)
              ),
              createdAt: activeSession.createdAt,
              expiresAt: activeSession.expiresAt,
              errorCode: activeSession.errorCode,
              // Bearer URL and preview parameters returned strictly to the owning authenticated tester:
              webPreviewUrl: activeSession.webPreviewUrl,
              previewApiUrl: activeSession.previewApiUrl || null,
              webPreviewToken: activeSession.webPreviewToken || null,
            }
          : null,
        csrfToken,
      });
    }

    if (route === '/api/simulator/start') {
      if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
      const body = await guardStateChange(req, res);
      if (!body) return undefined;

      const session = service.validateSession(cookiesOf(req)[names.session]);
      if (!session) return sendJson(res, 401, { error: 'unauthorized' });

      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Pragma', 'no-cache');

      if (!simulatorService) return sendJson(res, 503, { error: 'simulator_disabled' });

      try {
        const frameAncestor = config.siteOrigin || `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
        const result = await simulatorService.startSession({
          testerId: session.testerId,
          projectId: body.projectId || 'pet-show-and-tell',
          platform: body.platform || 'android',
          durationMinutes: body.durationMinutes || 5,
          frameAncestor,
        });

        if (result.uncertain) {
          return sendJson(res, 202, {
            ok: false,
            uncertain: true,
            sessionId: result.sessionId,
            message: result.reason,
          });
        }

        return sendJson(res, 201, {
          ok: true,
          session: {
            id: result.session.id,
            projectId: result.session.projectId,
            platform: result.session.platform,
            status: result.session.status,
            durationSeconds: result.session.durationSeconds,
            createdAt: result.session.createdAt,
            expiresAt: result.session.expiresAt,
            webPreviewUrl: result.session.webPreviewUrl,
            previewApiUrl: result.session.previewApiUrl || null,
            webPreviewToken: result.session.webPreviewToken || null,
          },
        });
      } catch (err) {
        if (err.code === 'concurrent_session_not_allowed') {
          return sendJson(res, 409, { error: 'concurrent_session', message: 'Another session is already active or starting.' });
        }
        if (err.code === 'budget_exhausted') {
          return sendJson(res, 429, { error: 'budget_exhausted', message: 'Monthly simulator budget exhausted.' });
        }
        if (err.code === 'provider_disabled' || err.code === 'provider_unavailable') {
          return sendJson(res, 503, { error: 'provider_unavailable', message: 'Simulator provider is currently disabled.' });
        }
        // Redaction: never log provider error text that could contain bearer preview tokens
        logger.error(`[simulator] start failed: ${sanitizeErrorCode(err)}`);
        return sendJson(res, 500, { error: 'start_failed', message: 'Simulator provider operation failed.' });
      }
    }

    if (route === '/api/simulator/stop') {
      if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
      const body = await guardStateChange(req, res);
      if (!body) return undefined;

      const session = service.validateSession(cookiesOf(req)[names.session]);
      if (!session) return sendJson(res, 401, { error: 'unauthorized' });

      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Pragma', 'no-cache');

      if (!simulatorService) return sendJson(res, 503, { error: 'simulator_disabled' });
      if (!body.sessionId) return sendJson(res, 400, { error: 'missing_session_id' });

      try {
        const result = await simulatorService.stopSession({
          testerId: session.testerId,
          sessionId: body.sessionId,
        });
        if (result.uncertain) {
          return sendJson(res, 202, result);
        }
        return sendJson(res, 200, result);
      } catch (err) {
        if (err.code === 'not_found') {
          return sendJson(res, 404, { error: 'not_found', message: 'Session not found or not owned by tester.' });
        }
        logger.error(`[simulator] stop failed: ${sanitizeErrorCode(err)}`);
        return sendJson(res, 500, { error: 'stop_failed', message: 'Simulator provider stop operation failed.' });
      }
    }

    if (route === '/api/simulator/reconcile') {
      if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
      const body = await guardStateChange(req, res);
      if (!body) return undefined;

      const session = service.validateSession(cookiesOf(req)[names.session]);
      if (!session) return sendJson(res, 401, { error: 'unauthorized' });

      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Pragma', 'no-cache');

      if (!simulatorService) return sendJson(res, 503, { error: 'simulator_disabled' });
      if (!body.sessionId) return sendJson(res, 400, { error: 'missing_session_id' });

      try {
        const result = await simulatorService.reconcileSession({
          testerId: session.testerId,
          sessionId: body.sessionId,
        });
        return sendJson(res, 200, result);
      } catch (err) {
        if (err.code === 'not_found') {
          return sendJson(res, 404, { error: 'not_found', message: 'Session not found or not owned by tester.' });
        }
        logger.error(`[simulator] reconcile failed: ${sanitizeErrorCode(err)}`);
        return sendJson(res, 500, { error: 'reconcile_failed', message: 'Simulator provider reconciliation failed.' });
      }
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
      res.setHeader(
        'Content-Security-Policy',
        "frame-ancestors 'none'; frame-src 'self' data: blob: https://*.expo.dev https://expo.dev"
      );
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

  function handleSimulatedPreview(req, res) {
    if (!isRead(req)) return methodNotAllowed(res, 'GET, HEAD');
    const session = service.validateSession(cookiesOf(req)[names.session]);
    if (!session) {
      return sendPlain(res, 401, 'Unauthorized: tester session required');
    }

    const simSessionId = String(req.query.session || '');
    if (simulatorService && simSessionId) {
      const simSession = simulatorService.getSession(simSessionId, session.testerId);
      if (!simSession) {
        return sendPlain(res, 403, 'Forbidden: session not found or not owned by tester');
      }
    }

    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none'; frame-ancestors 'self' " +
        (config.siteOrigin ? config.siteOrigin : '*')
    );
    return res.type('text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pet Show and Tell · Simulated Android Preview</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f7f5ef;
      color: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
      box-sizing: border-box;
      user-select: none;
    }
    .banner {
      background: #eab308;
      color: #000;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 12px;
      text-align: center;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .status-bar {
      height: 24px;
      background: #e5eee3;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
      font-size: 11px;
      font-weight: 600;
      color: #444;
    }
    .app-header {
      background: #ffffff;
      padding: 16px;
      border-bottom: 1px solid #e0dfd5;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .app-title {
      font-size: 18px;
      font-weight: 700;
      color: #234e38;
      margin: 0;
    }
    .feed-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e0dfd5;
      padding: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .card-author {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    .card-image-placeholder {
      width: 100%;
      height: 180px;
      background: #e5eee3;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    .card-caption {
      font-size: 13px;
      color: #555;
      margin-top: 10px;
      line-height: 1.4;
    }
    .action-bar {
      padding: 12px 16px;
      background: #ffffff;
      border-top: 1px solid #e0dfd5;
      display: flex;
      justify-content: space-around;
    }
    .action-btn {
      background: #234e38;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="banner">Simulated Preview · Not a Live EAS Simulator</div>
  <div class="status-bar">
    <span>10:30 AM</span>
    <span>Android 14 · Pet Show and Tell</span>
    <span>100%</span>
  </div>
  <div class="app-header">
    <h1 class="app-title">🐾 Pet Show and Tell</h1>
    <span style="font-size: 12px; background: #e5eee3; color: #234e38; padding: 4px 8px; border-radius: 6px; font-weight: 600;">Time-Limited Session</span>
  </div>
  <div class="feed-container">
    <div class="card">
      <div class="card-author">🐶 Buster the Golden Retriever</div>
      <div class="card-image-placeholder">🐕</div>
      <div class="card-caption">First day at the dog park learning fetch! Ready for show and tell!</div>
    </div>
    <div class="card">
      <div class="card-author">🐱 Mochi the Calico</div>
      <div class="card-image-placeholder">🐈</div>
      <div class="card-caption">Sunbeam nap champion 2026. Living her best life.</div>
    </div>
  </div>
  <div class="action-bar">
    <button class="action-btn" type="button">+ Add Pet Photo</button>
  </div>
</body>
</html>`);
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
      if (p === '/simulator/preview' || p.startsWith('/simulator/preview/')) {
        return handleSimulatedPreview(req, res);
      }
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
