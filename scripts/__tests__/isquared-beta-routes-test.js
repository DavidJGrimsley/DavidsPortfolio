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

  it('shows only the slim access form on the main page for unauthenticated visitors', async () => {
    const res = await httpRequest(`${baseUrl}/iSquared/`, {
      headers: { Accept: 'text/html' },
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['cache-control']).toContain('no-store');
    expect(parseSetCookies(res).isq_csrf).toBeTruthy();
    const html = await res.text();
    expect(html).toContain('<h1 id="page-title">iSquared Agentic IDE Private Preview</h1>');
    expect(html).toContain(
      '<p class="page-caption">iSquared will be open source. For now, I’m sharing this prototype with a small number of people.</p>'
    );
    expect(html).toContain('brand-infinity');
    expect(html).toContain('<span class="brand-wordmark">i2</span>');
    expect(html).toContain('INFINITE INTELLIGENCE');
    expect(html).toContain('4X73B');
    expect(html).toContain('<label for="code" class="visually-hidden">Access code</label>');
    expect(html).toContain('I won&#39;t steal these ideas for my own profit or gain while this prototype is in private access.');
    expect(html).not.toContain('I have read and agree to the confidentiality terms.');
    expect(html).not.toContain('Invitation only');
    expect(html).toContain('Enter iSquared');
    expect(html).not.toContain('terms-dialog');
    const agreeRes = await httpRequest(`${baseUrl}/iSquared/api/agreement`);
    const agree = await agreeRes.json();
    expect(agree.version).toBe('2');
    expect(agree.terms).toEqual([agree.checkboxLabel]);
    expect(html).toContain(`data-agreement-version="${agree.version}"`);
    expect(html).toContain(`data-agreement-digest="${agree.digest}"`);
    expect(html).toContain('data-next="/iSquared/Prototype"');
    expect(html).toContain('id="fullscreen-message"');
    expect(html).toContain('Please put this browser window in full screen before starting the prototype experience. Enjoy.');
    expect(html.indexOf('id="personal-message"')).toBeLessThan(html.indexOf('id="fullscreen-message"'));
    // Code and pledge share one row; the submit button follows that row; More info follows the form.
    const row = html.slice(html.indexOf('class="access-row"'), html.indexOf('id="submit"'));
    expect(row).toContain('id="code"');
    expect(row).toContain('id="agree"');
    expect(html.indexOf('</form>')).toBeLessThan(html.indexOf('href="/iSquared/Info"'));
    expect(html).toContain('More info');
    // Moved to /iSquared/Info or removed.
    expect(html).not.toContain('About this prototype');
    expect(html).not.toContain('Explore the code');
    expect(html).not.toContain('inspiration-dialog');
    expect(html).not.toContain('access-title');
    expect(html).not.toContain('Please enter your personal access code to continue.');
    expect(html).not.toContain('preview-note');
    expect(html).not.toContain('Continue to prototype');
  });

  it('serves the main access page regardless of the Accept header and rejects other methods', async () => {
    const plain = await httpRequest(`${baseUrl}/iSquared/`);
    expect(plain.status).toBe(200);
    expect(plain.headers['content-type']).toContain('text/html');
    expect(await plain.text()).toContain('id="access-form"');

    const head = await httpRequest(`${baseUrl}/iSquared/`, { method: 'HEAD' });
    expect(head.status).toBe(200);

    const post = await httpRequest(`${baseUrl}/iSquared/`, { method: 'POST' });
    expect(post.status).toBe(405);
    expect(post.headers.allow).toBe('GET, HEAD');
  });

  it('serves the public info page with the moved content and no access form', async () => {
    const res = await httpRequest(`${baseUrl}/iSquared/Info`, { headers: { Accept: 'text/html' } });
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['content-security-policy']).toContain('https://www.youtube-nocookie.com');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['cache-control']).toContain('no-store');
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow, noarchive');
    expect(parseSetCookies(res).isq_csrf).toBeUndefined();
    const html = await res.text();
    expect(html).not.toContain('id="access-form"');
    expect(html).toContain('href="/iSquared/"');
    expect(html).toContain('Back to access page');
    expect(html).toContain('/iSquared/_beta/login.js');
    expect(html).not.toContain('What’s real and what’s simulated');
    expect(html).toContain('About this prototype');
    expect(html).toContain('This prototype is a Vite TypeScript app for demonstration and design purposes.');
    expect(html).toContain('Please set aside at least 30 minutes for your initial review.');
    expect(html).toContain('Web previews of the Pet Show and Tell and Experimemo Exact apps.');
    expect(html).toContain('A lot of other claims.');
    expect(html).toContain('archive points');
    expect(html).toContain(". That's where I want to lean on some more experienced developers who want to join the cause.");
    expect(html).toContain('Figma, Expo, GitHub, Brain.fm');
    expect(html).toContain('Use your imagination :)');
    expect(html).toContain('Explore the code');
    expect(html).toContain('github.com/DavidJGrimsley/mrdj-dev-suite');
    expect(html).toContain('github.com/DavidJGrimsley/pet-show-and-tell');
    expect(html).toContain('github.com/DavidJGrimsley/experimemo-exact');
    expect(html).toContain('github.com/DavidJGrimsley/not-hot-dog');
    expect(html).toContain('davidjgrimsley.com/portfolio/software-development/isquared');
    expect(html).toContain('Where I stole this idea');
    expect(html).toContain('id="open-inspiration"');
    expect(html).toContain('id="inspiration-dialog"');
    expect(html).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1');
    expect(html.indexOf('About this prototype')).toBeLessThan(html.indexOf('Explore the code'));

    const head = await httpRequest(`${baseUrl}/iSquared/Info`, { method: 'HEAD' });
    expect(head.status).toBe(200);
  });

  it('canonicalizes info and prototype aliases in one redirect and keeps asset case', async () => {
    for (const [from, to] of [
      ['/iSquared/info', '/iSquared/Info'],
      ['/iSquared/INFO/', '/iSquared/Info'],
      ['/iSquared/Info/', '/iSquared/Info'],
      ['/isquared/info/?x=1', '/iSquared/Info?x=1'],
      ['/ISQUARED/Info', '/iSquared/Info'],
      ['/iSquared/prototype', '/iSquared/Prototype'],
      ['/isquared/PROTOTYPE/?s=b05', '/iSquared/Prototype?s=b05'],
      ['/iSquared/Prototype/', '/iSquared/Prototype'],
      ['/isquared/assets/Main.JS', '/iSquared/assets/Main.JS'],
    ]) {
      const res = await httpRequest(`${baseUrl}${from}`);
      expect([from, res.status]).toEqual([from, 308]);
      expect([from, res.headers.location]).toEqual([from, to]);
    }
  });

  it('rejects unsupported methods on info and prototype paths before redirecting', async () => {
    for (const target of ['/iSquared/Info', '/iSquared/info', '/isquared/INFO/', '/iSquared/Prototype', '/iSquared/prototype/']) {
      const res = await httpRequest(`${baseUrl}${target}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect([target, res.status]).toEqual([target, 405]);
      expect(res.headers.allow).toBe('GET, HEAD');
    }
  });

  it('shows the access form in place for unauthenticated prototype requests', async () => {
    const nav = await httpRequest(`${baseUrl}/iSquared/Prototype?s=b05`, { headers: { Accept: 'text/html' } });
    expect(nav.status).toBe(401);
    const html = await nav.text();
    expect(html).toContain('id="access-form"');
    // No fixed continuation: a successful login reloads this exact URL.
    expect(html).not.toContain('data-next');

    const nested = await httpRequest(`${baseUrl}/iSquared/session/b05`, { headers: { Accept: 'text/html' } });
    expect(nested.status).toBe(401);
    expect(await nested.text()).not.toContain('data-next');

    const plain = await httpRequest(`${baseUrl}/iSquared/Prototype`);
    expect(plain.status).toBe(401);
    expect(await plain.text()).toBe('Unauthorized');
  });

  it('links the sign-out page back to the prototype address', async () => {
    const res = await httpRequest(`${baseUrl}/iSquared/signout`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<a href="/iSquared/Prototype">Back to the prototype</a>');
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
    expect(agree.version).toBe('2');
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

  it('returns personal messages only for matching active codes without creating a session', async () => {
    const { tester } = betaInstance.service.createTester({ name: 'Message User', code: 'M3SSAGE' });
    betaInstance.service.setMessage(tester.id, 'Hello from David!');
    const noCsrf = await httpRequest(`${baseUrl}/iSquared/api/personal-message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'M3SSAGE' }),
    });
    expect(noCsrf.status).toBe(403);
    const session = await httpRequest(`${baseUrl}/iSquared/api/session`);
    const { csrfToken } = await session.json();
    const headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Cookie: cookieHeader(parseSetCookies(session)) };
    const lookup = await httpRequest(`${baseUrl}/iSquared/api/personal-message`, {
      method: 'POST', headers, body: JSON.stringify({ code: 'm3ssage' }),
    });
    expect(lookup.headers['cache-control']).toContain('no-store');
    expect(await lookup.json()).toEqual({ message: 'Hello from David!' });
    expect(parseSetCookies(lookup).isq_beta).toBeUndefined();
    const invalid = await httpRequest(`${baseUrl}/iSquared/api/personal-message`, {
      method: 'POST', headers, body: JSON.stringify({ code: 'WRONG' }),
    });
    expect(await invalid.json()).toEqual({ message: null });
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

    // 5. The main page stays the access page: a Continue link replaces the form, no visit.
    const mainRes = await httpRequest(`${baseUrl}/iSquared/?s=b05`, {
      headers: {
        Accept: 'text/html',
        Cookie: cookieHeader(authCookies),
      },
    });
    expect(mainRes.status).toBe(200);
    const mainHtml = await mainRes.text();
    expect(mainHtml).toContain('iSquared Agentic IDE Private Preview');
    expect(mainHtml).toContain('href="/iSquared/Prototype?s=b05"');
    expect(mainHtml).toContain('Continue to prototype');
    expect(mainHtml).toContain('href="/iSquared/Info"');
    expect(mainHtml).not.toContain('id="access-form"');
    expect(mainHtml).not.toContain('Tester Alice');
    expect(mainHtml).not.toContain('signout');
    expect(mainRes.headers['cache-control']).toContain('no-store');
    expect(mainRes.headers.vary).toContain('Cookie');

    const escapedMain = await httpRequest(`${baseUrl}/iSquared/?q=%22%3E%3Cscript%3E`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(await escapedMain.text()).not.toContain('"><script>');

    const infoRes = await httpRequest(`${baseUrl}/iSquared/Info`, {
      headers: { Accept: 'text/html', Cookie: cookieHeader(authCookies) },
    });
    expect(infoRes.status).toBe(200);
    let stats = betaInstance.service.stats({ days: 30 });
    expect(stats.summary.totalLogins).toBe(1);
    expect(stats.summary.totalVisits).toBe(0);

    // HEAD on the prototype document does not count a visit.
    const headRes = await httpRequest(`${baseUrl}/iSquared/Prototype`, {
      method: 'HEAD',
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(headRes.status).toBe(200);
    stats = betaInstance.service.stats({ days: 30 });
    expect(stats.summary.totalVisits).toBe(0);

    // 6. The protected prototype document, independent of the Accept header.
    const protoRes = await httpRequest(`${baseUrl}/iSquared/Prototype`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(protoRes.status).toBe(200);
    const protoHtml = await protoRes.text();
    expect(protoHtml).toContain('<div id="root">App</div>');
    expect(protoRes.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(protoRes.headers['x-frame-options']).toBe('DENY');
    expect(protoRes.headers['cache-control']).toContain('private, no-cache');

    // Verify 1 visit was logged
    stats = betaInstance.service.stats({ days: 30 });
    expect(stats.summary.totalVisits).toBe(1);

    // Reload the prototype immediately -> visit count remains 1
    const reloadRes = await httpRequest(`${baseUrl}/iSquared/Prototype?s=b05`, {
      headers: {
        Accept: 'text/html',
        Cookie: cookieHeader(authCookies),
      },
    });
    expect(reloadRes.status).toBe(200);
    stats = betaInstance.service.stats({ days: 30 });
    expect(stats.summary.totalVisits).toBe(1);

    // The legacy index.html address still serves the prototype document.
    const legacyIndex = await httpRequest(`${baseUrl}/iSquared/index.html`, {
      headers: { Cookie: cookieHeader(authCookies) },
    });
    expect(legacyIndex.status).toBe(200);
    expect(await legacyIndex.text()).toContain('<div id="root">App</div>');

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

    // After logout, the prototype shows the access form again and the main page offers the form.
    const postLogoutProto = await httpRequest(`${baseUrl}/iSquared/Prototype`, {
      headers: { Accept: 'text/html', Cookie: cookieHeader(authCookies) },
    });
    expect(postLogoutProto.status).toBe(401);
    expect(await postLogoutProto.text()).toContain('id="access-form"');
    const postLogoutMain = await httpRequest(`${baseUrl}/iSquared/`, {
      headers: { Accept: 'text/html', Cookie: cookieHeader(authCookies) },
    });
    expect(postLogoutMain.status).toBe(200);
    expect(await postLogoutMain.text()).toContain('id="access-form"');
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

describe('isquared-beta prototype entry without a deployable archive', () => {
  async function withBeta(prepareWebDir, run) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isq-entry-test-'));
    const webDir = path.join(tempDir, 'web');
    prepareWebDir(webDir);
    const beta = createIsquaredBeta({
      appRoot: tempDir,
      env: {
        ISQUARED_BETA_CODE_PEPPER: TEST_PEPPER,
        ISQUARED_BETA_DB_PATH: ':memory:',
        ISQUARED_BETA_WEB_DIR: webDir,
        ISQUARED_BETA_INSECURE_COOKIES: '1',
      },
      logger: { log: () => {}, error: () => {} },
    });
    const app = express();
    app.use(beta.config.mountPath, beta.router);
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      beta.service.createTester({ name: 'Entry Tester', code: 'ENTRY7' });
      const auth = beta.service.authenticate({
        code: 'ENTRY7',
        accepted: true,
        agreementVersion: beta.service.agreement.version,
        agreementDigest: beta.service.agreement.digest,
      });
      await run(`http://127.0.0.1:${server.address().port}`, `isq_beta=${auth.token}`);
    } finally {
      beta.close();
      await new Promise((resolve) => server.close(resolve));
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  it('authenticates before reporting a missing archive (503)', async () => {
    await withBeta(() => {}, async (baseUrl, cookie) => {
      const anonymous = await httpRequest(`${baseUrl}/iSquared/Prototype`, { headers: { Accept: 'text/html' } });
      expect(anonymous.status).toBe(401);
      const res = await httpRequest(`${baseUrl}/iSquared/Prototype`, { headers: { Cookie: cookie } });
      expect(res.status).toBe(503);
      expect(await res.text()).toBe('The prototype has not been deployed yet.');
    });
  });

  it('returns 404 when the archive has no entry document', async () => {
    await withBeta((webDir) => fs.mkdirSync(path.join(webDir, 'assets'), { recursive: true }), async (baseUrl, cookie) => {
      const anonymous = await httpRequest(`${baseUrl}/iSquared/Prototype`);
      expect(anonymous.status).toBe(401);
      const res = await httpRequest(`${baseUrl}/iSquared/Prototype`, { headers: { Accept: 'text/html', Cookie: cookie } });
      expect(res.status).toBe(404);
      expect(await res.text()).toBe('Not found');
    });
  });
});
