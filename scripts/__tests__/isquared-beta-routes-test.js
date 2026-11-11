const express = require('express');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { createIsquaredBeta } = require('../isquared-beta/index.cjs');
const { hashPassword } = require('../isquared-beta/security.cjs');

const TEST_PEPPER = '1234567890123456789012345678901234567890';
const ADMIN_PASS = 'admin-secret-password-123';

function httpRequest(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        path: `${u.pathname}${u.search}`,
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: async () => buffer.toString('utf8'),
            json: async () => JSON.parse(buffer.toString('utf8')),
          });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('isquared-beta routes and server integration', () => {
  let tempDir;
  let webDir;
  let server;
  let baseUrl;
  let betaInstance;
  let app;

  function parseSetCookies(res) {
    const raw = res.headers['set-cookie'];
    if (!raw) return {};
    const cookies = {};
    const list = Array.isArray(raw) ? raw : [raw];
    for (const item of list) {
      const match = item.match(/^([^=]+)=([^;]*)/);
      if (match) {
        cookies[match[1].trim()] = match[2].trim();
      }
    }
    return cookies;
  }

  function cookieHeader(cookieMap) {
    return Object.entries(cookieMap)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  beforeAll((done) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isq-routes-test-'));
    webDir = path.join(tempDir, 'web');
    fs.mkdirSync(path.join(webDir, 'assets'), { recursive: true });
    fs.writeFileSync(
      path.join(webDir, 'index.html'),
      '<!doctype html><html><head><title>iSquared App</title></head><body><div id="root">App</div></body></html>'
    );
    fs.writeFileSync(path.join(webDir, 'assets', 'main.js'), 'console.log("iSquared Prototype");');
    fs.writeFileSync(path.join(webDir, 'assets', 'main.js.map'), '{"version":3}');
    fs.writeFileSync(path.join(webDir, 'secret.sqlite'), 'sqlite-data');
    fs.writeFileSync(path.join(webDir, '.env'), 'SECRET=123');

    const env = {
      ISQUARED_BETA_CODE_PEPPER: TEST_PEPPER,
      ISQUARED_BETA_DB_PATH: ':memory:',
      ISQUARED_BETA_WEB_DIR: webDir,
      ISQUARED_BETA_INSECURE_COOKIES: '1', // test over plain http localhost
      ISQUARED_ADMIN_USERNAME: 'admin',
      ISQUARED_ADMIN_PASSWORD_HASH: hashPassword(ADMIN_PASS),
    };

    betaInstance = createIsquaredBeta({
      appRoot: tempDir,
      env,
      logger: { log: () => {}, error: () => {} },
    });

    app = express();
    // Non-isquared routes to verify non-interference
    app.get('/api/test', (_req, res) => res.json({ portfolio: 'ok' }));
    app.get('/', (_req, res) => res.send('Portfolio Home'));

    if (betaInstance.enabled) {
      app.use(betaInstance.config.mountPath, betaInstance.router);
    }

    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  afterAll((done) => {
    if (betaInstance && betaInstance.close) betaInstance.close();
    server.close(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      done();
    });
  });

  it('keeps normal portfolio routes functional without interference', async () => {
    const resHome = await httpRequest(`${baseUrl}/`);
    expect(resHome.status).toBe(200);
    expect(await resHome.text()).toBe('Portfolio Home');

    const resApi = await httpRequest(`${baseUrl}/api/test`);
    expect(resApi.status).toBe(200);
    const json = await resApi.json();
    expect(json.portfolio).toBe('ok');
  });

  it('redirects 308 for case normalization and missing trailing slash', async () => {
    // Missing trailing slash
    const resSlash = await httpRequest(`${baseUrl}/iSquared`);
    expect(resSlash.status).toBe(308);
    expect(resSlash.headers.location).toBe('/iSquared/');

    // Lowercase
    const resLower = await httpRequest(`${baseUrl}/isquared/`);
    expect(resLower.status).toBe(308);
    expect(resLower.headers.location).toBe('/iSquared/');
  });

  it('serves static beta UI assets with correct content types', async () => {
    const resCss = await httpRequest(`${baseUrl}/iSquared/_beta/beta.css`);
    expect(resCss.status).toBe(200);
    expect(resCss.headers['content-type']).toContain('text/css');
    expect(await resCss.text()).toContain('--accent');

    const resLoginJs = await httpRequest(`${baseUrl}/iSquared/_beta/login.js`);
    expect(resLoginJs.status).toBe(200);
    expect(resLoginJs.headers['content-type']).toContain('javascript');

    const resAdminJs = await httpRequest(`${baseUrl}/iSquared/_beta/admin.js`);
    expect(resAdminJs.status).toBe(200);
    expect(resAdminJs.headers['content-type']).toContain('javascript');
  });

  it('displays the access-code login page for unauthenticated HTML requests', async () => {
    const res = await httpRequest(`${baseUrl}/iSquared/`, {
      headers: { Accept: 'text/html' },
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-frame-options']).toBe('DENY');
    const html = await res.text();
    expect(html).toContain('iSquared Private Preview');
    expect(html).toContain('Please enter your personal access code to continue.');
    expect(html).toContain('4X73B');
    expect(html).toContain('I have read and agree to the confidentiality terms.');
    expect(html).toContain('Enter iSquared');
    expect(html).toContain('terms-dialog');
    expect(html).toContain('postscript');
    expect(html).toContain('This is a limited prototype');
    expect(html).toContain('dynamic interactions with AI agents');
  });

  it('blocks unauthenticated access to prototype files and assets with 401', async () => {
    const resAsset = await httpRequest(`${baseUrl}/iSquared/assets/main.js`);
    expect(resAsset.status).toBe(401);
    expect(await resAsset.text()).toBe('Unauthorized');
  });

  it('returns agreement metadata and session status via API', async () => {
    const resAgree = await httpRequest(`${baseUrl}/iSquared/api/agreement`);
    expect(resAgree.status).toBe(200);
    const agree = await resAgree.json();
    expect(agree.version).toBe('1');
    expect(agree.digest).toBeTruthy();

    const resSess = await httpRequest(`${baseUrl}/iSquared/api/session`);
    expect(resSess.status).toBe(200);
    const sess = await resSess.json();
    expect(sess.authenticated).toBe(false);
    expect(sess.csrfToken).toBeTruthy();
  });

  it('rejects state-changing access requests without CSRF protection or invalid origin', async () => {
    // Missing CSRF token
    const resNoCsrf = await httpRequest(`${baseUrl}/iSquared/api/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '4X73B', acceptTerms: true }),
    });
    expect(resNoCsrf.status).toBe(403);

    // Cross origin
    const resCross = await httpRequest(`${baseUrl}/iSquared/api/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'tok',
        'Sec-Fetch-Site': 'cross-site',
      },
      body: JSON.stringify({ code: '4X73B', acceptTerms: true }),
    });
    expect(resCross.status).toBe(403);
  });

  it('performs full login flow, prototype serving, visit tracking, and logout', async () => {
    // 1. Create a tester in the service
    betaInstance.service.createTester({ name: 'Tester Alice', code: '4X73B' });

    // 2. Get CSRF token and cookie from session endpoint
    const sessRes = await httpRequest(`${baseUrl}/iSquared/api/session`);
    const sessJson = await sessRes.json();
    const csrfToken = sessJson.csrfToken;
    const cookies = parseSetCookies(sessRes);
    expect(cookies.isq_csrf).toBe(csrfToken);

    // 3. Post access code
    const agreeRes = await httpRequest(`${baseUrl}/iSquared/api/agreement`);
    const agree = await agreeRes.json();

    const loginRes = await httpRequest(`${baseUrl}/iSquared/api/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookieHeader(cookies),
      },
      body: JSON.stringify({
        code: '4X73B',
        acceptTerms: true,
        agreementVersion: agree.version,
        agreementDigest: agree.digest,
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginJson = await loginRes.json();
    expect(loginJson.ok).toBe(true);

    const loginCookies = parseSetCookies(loginRes);
    expect(loginCookies.isq_beta).toBeTruthy();
    const sessionCookie = loginCookies.isq_beta;
    const authCookies = { ...cookies, isq_beta: sessionCookie };

    // 4. Session endpoint now returns authenticated: true
    const authSessRes = await httpRequest(`${baseUrl}/iSquared/api/session`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    const authSessJson = await authSessRes.json();
    expect(authSessJson.authenticated).toBe(true);
    expect(authSessJson.tester.name).toBe('Tester Alice');

    // 5. Access protected prototype index.html
    const protoRes = await httpRequest(`${baseUrl}/iSquared/`, {
      headers: {
        Accept: 'text/html',
        Cookie: cookieHeader(authCookies),
      },
    });
    expect(protoRes.status).toBe(200);
    const protoHtml = await protoRes.text();
    expect(protoHtml).toContain('<div id="root">App</div>');
    expect(protoRes.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(protoRes.headers['cache-control']).toContain('private, no-cache');

    // Verify 1 visit was logged
    let stats = betaInstance.service.stats({ days: 30 });
    expect(stats.summary.totalLogins).toBe(1);
    expect(stats.summary.totalVisits).toBe(1);

    // 6. Reload index.html immediately -> visit count remains 1
    const reloadRes = await httpRequest(`${baseUrl}/iSquared/`, {
      headers: {
        Accept: 'text/html',
        Cookie: cookieHeader(authCookies),
      },
    });
    expect(reloadRes.status).toBe(200);
    stats = betaInstance.service.stats({ days: 30 });
    expect(stats.summary.totalVisits).toBe(1);

    // 7. Access protected prototype asset -> 200, visit count remains 1
    const assetRes = await httpRequest(`${baseUrl}/iSquared/assets/main.js`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(assetRes.status).toBe(200);
    expect(await assetRes.text()).toContain('iSquared Prototype');
    stats = betaInstance.service.stats({ days: 30 });
    expect(stats.summary.totalVisits).toBe(1);

    // 8. SPA fallback for nested navigation route
    const spaRes = await httpRequest(`${baseUrl}/iSquared/session/b05`, {
      headers: {
        Accept: 'text/html',
        Cookie: cookieHeader(authCookies),
      },
    });
    expect(spaRes.status).toBe(200);
    expect(await spaRes.text()).toContain('<div id="root">App</div>');

    // 9. Path traversal attempts are rejected
    const trav1 = await httpRequest(`${baseUrl}/iSquared/../server.js`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(trav1.status).toBe(404);

    const trav2 = await httpRequest(`${baseUrl}/iSquared/%2e%2e/server.js`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(trav2.status).toBe(404);

    // 10. Forbidden file extensions rejected
    const mapRes = await httpRequest(`${baseUrl}/iSquared/assets/main.js.map`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(mapRes.status).toBe(404);

    const dbRes = await httpRequest(`${baseUrl}/iSquared/secret.sqlite`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(dbRes.status).toBe(404);

    const envRes = await httpRequest(`${baseUrl}/iSquared/.env`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(envRes.status).toBe(404);

    // 11. Logout
    const logoutRes = await httpRequest(`${baseUrl}/iSquared/api/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookieHeader(authCookies),
      },
      body: '{}',
    });
    expect(logoutRes.status).toBe(200);

    // After logout, asset access is 401 again
    const postLogoutAsset = await httpRequest(`${baseUrl}/iSquared/assets/main.js`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(postLogoutAsset.status).toBe(401);
  });

  it('protects the admin dashboard and enforces admin auth and tester isolation', async () => {
    // 1. Unauthenticated /iSquared/admin/ renders admin login
    const adminPage = await httpRequest(`${baseUrl}/iSquared/admin/`);
    expect(adminPage.status).toBe(200);
    const html = await adminPage.text();
    expect(html).toContain('Administrator sign-in');

    const adminCookies = parseSetCookies(adminPage);
    const csrfToken = adminCookies.isq_csrf;

    // 2. Tester session cannot access admin summary
    betaInstance.service.createTester({ name: 'Bob Tester', code: 'BOB123' });
    const auth = betaInstance.service.authenticate({
      code: 'BOB123',
      accepted: true,
      agreementVersion: betaInstance.service.agreement.version,
      agreementDigest: betaInstance.service.agreement.digest,
    });
    const summaryAttempt = await httpRequest(`${baseUrl}/iSquared/admin/api/summary`, {
      headers: { Cookie: `isq_beta=${auth.token}` },
    });
    expect(summaryAttempt.status).toBe(401);

    // 3. Admin login with bad password fails
    const badLogin = await httpRequest(`${baseUrl}/iSquared/admin/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookieHeader(adminCookies),
      },
      body: JSON.stringify({ username: 'admin', password: 'wrong-password' }),
    });
    expect(badLogin.status).toBe(401);

    // 4. Admin login with good credentials succeeds
    const goodLogin = await httpRequest(`${baseUrl}/iSquared/admin/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookieHeader(adminCookies),
      },
      body: JSON.stringify({ username: 'admin', password: ADMIN_PASS }),
    });
    expect(goodLogin.status).toBe(200);
    const loginCookies = parseSetCookies(goodLogin);
    expect(loginCookies.isq_admin).toBeTruthy();
    const adminAuthCookies = { ...adminCookies, isq_admin: loginCookies.isq_admin };

    // 5. Admin dashboard loads with stats and tester table
    const dashRes = await httpRequest(`${baseUrl}/iSquared/admin/`, {
      headers: { Cookie: cookieHeader(adminAuthCookies) },
    });
    expect(dashRes.status).toBe(200);
    const dashHtml = await dashRes.text();
    expect(dashHtml).toContain('iSquared beta dashboard');
    expect(dashHtml).toContain('Invited testers');
    expect(dashHtml).toContain('Bob Tester');

    // 6. Admin summary API succeeds
    const summaryRes = await httpRequest(`${baseUrl}/iSquared/admin/api/summary`, {
      headers: { Cookie: cookieHeader(adminAuthCookies) },
    });
    expect(summaryRes.status).toBe(200);
    const summaryJson = await summaryRes.json();
    expect(summaryJson.summary.totalTesters).toBeGreaterThanOrEqual(1);

    // 7. Admin logout
    const adminLogout = await httpRequest(`${baseUrl}/iSquared/admin/api/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookieHeader(adminAuthCookies),
      },
      body: '{}',
    });
    expect(adminLogout.status).toBe(200);

    // After logout, summary is 401
    const postLogoutSummary = await httpRequest(`${baseUrl}/iSquared/admin/api/summary`, {
      headers: { Cookie: cookieHeader(adminAuthCookies) },
    });
    expect(postLogoutSummary.status).toBe(401);
  });
});
