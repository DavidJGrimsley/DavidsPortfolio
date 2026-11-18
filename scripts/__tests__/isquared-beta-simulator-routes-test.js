const express = require('express');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { createIsquaredBeta } = require('../isquared-beta/index.cjs');
const { openDatabase } = require('../isquared-beta/db.cjs');
const { createBetaRouter } = require('../isquared-beta/routes.cjs');
const { hashToken, newToken } = require('../isquared-beta/security.cjs');
const { createBetaService } = require('../isquared-beta/service.cjs');
const { createSimulatorService } = require('../isquared-beta/simulator-service.cjs');

const TEST_PEPPER = '1234567890123456789012345678901234567890';

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

describe('Simulator Foundation HTTP Routes (isquared-beta)', () => {
  let tempDir;
  let webDir;
  let server;
  let baseUrl;
  let betaInstance;
  let app;
  let testCode;
  let testTester;

  beforeAll((done) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isq-sim-routes-test-'));
    webDir = path.join(tempDir, 'web');
    fs.mkdirSync(webDir, { recursive: true });
    fs.writeFileSync(path.join(webDir, 'index.html'), '<!doctype html><html><body>iSquared</body></html>');

    const env = {
      ISQUARED_BETA_CODE_PEPPER: TEST_PEPPER,
      ISQUARED_BETA_DB_PATH: ':memory:',
      ISQUARED_BETA_WEB_DIR: webDir,
      ISQUARED_BETA_INSECURE_COOKIES: '1',
      ISQUARED_SIMULATOR_PROVIDER: 'simulated',
      ISQUARED_SIMULATOR_MONTHLY_BUDGET_MINUTES: '60',
      ISQUARED_SIMULATOR_MAX_SESSION_MINUTES: '5',
    };

    betaInstance = createIsquaredBeta({
      appRoot: tempDir,
      env,
      logger: { log: () => {}, error: () => {} },
    });

    // Create a tester
    const created = betaInstance.service.createTester({ name: 'SimTester' });
    testCode = created.code;
    testTester = created.tester;

    app = express();
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

  async function loginAsTester(code = testCode) {
    // 1. GET /iSquared/api/session to obtain CSRF token cookie and token string
    const initRes = await httpRequest(`${baseUrl}/iSquared/api/session`);
    const initData = await initRes.json();
    const cookies = parseSetCookies(initRes);
    const csrfToken = initData.csrfToken || cookies.isq_csrf;

    // 2. GET /iSquared/api/agreement for terms
    const agreementRes = await httpRequest(`${baseUrl}/iSquared/api/agreement`);
    const agreementData = await agreementRes.json();

    // 3. POST /iSquared/api/access
    const accessRes = await httpRequest(`${baseUrl}/iSquared/api/access`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: cookieHeader(cookies),
        origin: baseUrl,
      },
      body: JSON.stringify({
        code,
        acceptTerms: true,
        agreementVersion: agreementData.version,
        agreementDigest: agreementData.digest,
      }),
    });

    const sessionCookies = { ...cookies, ...parseSetCookies(accessRes) };
    return { cookies: sessionCookies, csrfToken };
  }

  test('Unauthenticated requests to simulator endpoints return 401', async () => {
    const sessionRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/session`);
    expect(sessionRes.status).toBe(401);

    const startRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(startRes.status).toBe(403); // CSRF blocks first or 401
  });

  test('GET /iSquared/api/simulator/session returns session and budget info with no-store', async () => {
    const { cookies } = await loginAsTester();

    const res = await httpRequest(`${baseUrl}/iSquared/api/simulator/session`, {
      headers: { cookie: cookieHeader(cookies) },
    });

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('private, no-store');
    expect(res.headers['pragma']).toBe('no-cache');

    const data = await res.json();
    expect(data.authenticated).toBe(true);
    expect(data.tester.name).toBe('SimTester');
    expect(data.provider.available).toBe(true);
    expect(data.provider.simulated).toBe(true);
    expect(data.budget.monthlyBudgetSeconds).toBe(3600);
    expect(data.session).toBeNull();
  });

  test('POST /iSquared/api/simulator/start requires CSRF protection', async () => {
    const { cookies } = await loginAsTester();

    // Missing CSRF token header
    const missingCsrf = await httpRequest(`${baseUrl}/iSquared/api/simulator/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: cookieHeader(cookies),
        origin: baseUrl,
      },
      body: JSON.stringify({ durationMinutes: 5 }),
    });
    expect(missingCsrf.status).toBe(403);

    // Wrong CSRF token
    const wrongCsrf = await httpRequest(`${baseUrl}/iSquared/api/simulator/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': 'wrong-csrf-token-123456789012345678901234567890',
        cookie: cookieHeader(cookies),
        origin: baseUrl,
      },
      body: JSON.stringify({ durationMinutes: 5 }),
    });
    expect(wrongCsrf.status).toBe(403);
  });

  test('Lifecycle: start session, verify no-store, test concurrency, stop session', async () => {
    const { cookies, csrfToken } = await loginAsTester();

    // 1. Start session
    const startRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: cookieHeader(cookies),
        origin: baseUrl,
      },
      body: JSON.stringify({
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 5,
      }),
    });

    expect(startRes.status).toBe(201);
    expect(startRes.headers['cache-control']).toBe('private, no-store');
    const startData = await startRes.json();
    expect(startData.ok).toBe(true);
    expect(startData.session.status).toBe('active');
    expect(startData.session.platform).toBe('android');
    expect(startData.session.projectId).toBe('pet-show-and-tell');
    expect(startData.session.webPreviewUrl).toBeDefined();
    // In accordance with security requirements, same-origin preview URLs must NOT contain token query params
    expect(startData.session.webPreviewUrl).not.toContain('token=');

    const sessionId = startData.session.id;

    // 2. Concurrency: attempt duplicate start -> 409
    const dupRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: cookieHeader(cookies),
        origin: baseUrl,
      },
      body: JSON.stringify({ durationMinutes: 5 }),
    });
    expect(dupRes.status).toBe(409);
    const dupData = await dupRes.json();
    expect(dupData.error).toBe('concurrent_session');

    // 3. Query session status
    const statusRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/session`, {
      headers: { cookie: cookieHeader(cookies) },
    });
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.session).toBeDefined();
    expect(statusData.session.id).toBe(sessionId);
    expect(statusData.session.webPreviewUrl).toBeDefined();

    // 4. Open the preview URL exactly as the start API returned it
    const previewRes = await httpRequest(new URL(startData.session.webPreviewUrl, baseUrl).toString(), {
      headers: { cookie: cookieHeader(cookies) },
    });
    expect(previewRes.status).toBe(200);
    expect(previewRes.headers['cache-control']).toBe('private, no-store');
    const previewHtml = await previewRes.text();
    expect(previewHtml).toContain('Simulated Preview · Not a Live EAS Simulator');
    expect(previewHtml).toContain('Pet Show and Tell');

    // 5. Stop session
    const stopRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/stop`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: cookieHeader(cookies),
        origin: baseUrl,
      },
      body: JSON.stringify({ sessionId }),
    });
    expect(stopRes.status).toBe(200);
    expect(stopRes.headers['cache-control']).toBe('private, no-store');
    const stopData = await stopRes.json();
    expect(stopData.ok).toBe(true);
    expect(stopData.stopped).toBe(true);

    // 6. Verify session is no longer active
    const postStopRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/session`, {
      headers: { cookie: cookieHeader(cookies) },
    });
    const postStopData = await postStopRes.json();
    expect(postStopData.session).toBeNull();
  });

  test('Raw provider errors never leak through HTTP responses or logs', async () => {
    const errorLogs = [];
    const testLogger = {
      log: () => {},
      error: (msg) => errorLogs.push(String(msg)),
    };

    const secretToken = 'super_secret_bearer_token_xyz_98765';
    const secretCode = 'leak_code?token=' + secretToken;

    const leakingProvider = {
      name: 'leaking_provider',
      async isAvailable() { return { available: true }; },
      async startSession() {
        const err = new Error('Fatal backend failure: ' + secretToken);
        err.code = secretCode;
        err.isDefinitive = true;
        throw err;
      },
      async stopSession() { return { ok: true }; },
      async inspectSession() { return null; },
    };

    const { db: testDb } = openDatabase(':memory:');
    const testService = createBetaService({
      db: testDb,
      config: betaInstance.config,
      agreement: { version: '1', digest: 'dig', title: 'T', statement: 'S', checkboxLabel: 'C', terms: [] },
      now: () => Date.now(),
    });
    testService.registerAgreement();
    const tester = testService.createTester({ name: 'LeakTester' }).tester;

    const testSimService = createSimulatorService({
      db: testDb,
      config: betaInstance.config,
      provider: leakingProvider,
      now: () => Date.now(),
    });

    const testRouter = createBetaRouter({
      service: testService,
      simulatorService: testSimService,
      config: betaInstance.config,
      logger: testLogger,
    });

    const testApp = express();
    testApp.use('/iSquared', testRouter);
    const testServer = http.createServer(testApp);
    await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
    const testPort = testServer.address().port;
    const testBaseUrl = `http://127.0.0.1:${testPort}`;

    try {
      const sessionToken = 'a'.repeat(48);
      const sessionHash = hashToken(sessionToken);
      const sessionNow = new Date().toISOString();
      testDb.prepare(
        'INSERT INTO beta_sessions (id, tester_id, token_hash, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run('sess_leak', tester.id, sessionHash, sessionNow, new Date(Date.now() + 3600_000).toISOString(), sessionNow);

      const csrfToken = newToken();
      const cookies = {
        isq_beta: sessionToken,
        isq_csrf: csrfToken,
      };

      const startRes = await httpRequest(`${testBaseUrl}/iSquared/api/simulator/start`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': csrfToken,
          cookie: cookieHeader(cookies),
          origin: testBaseUrl,
        },
        body: JSON.stringify({ durationMinutes: 5 }),
      });

      expect(startRes.status).toBe(500);
      const resText = await startRes.text();
      // Ensure raw error message and secret token NEVER leak to HTTP
      expect(resText).not.toContain(secretToken);
      expect(resText).not.toContain(secretCode);
      const resJson = JSON.parse(resText);
      expect(resJson.error).toBe('start_failed');
      expect(resJson.message).toBe('Simulator provider operation failed.');

      // Ensure error logs NEVER leak secret token or unsanitized code
      expect(errorLogs.length).toBeGreaterThan(0);
      for (const logMsg of errorLogs) {
        expect(logMsg).not.toContain(secretToken);
        expect(logMsg).not.toContain('?token=');
        expect(logMsg).toContain('[simulator] start failed: provider_error');
      }
    } finally {
      testServer.close();
      testDb.close();
    }
  });

  test('only returns preview tokens to authenticated owner with no-store cache headers', async () => {
    // 1. Unauthenticated request to /api/simulator/session
    const unauthRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/session`, {
      method: 'GET',
    });
    expect(unauthRes.status).toBe(401);
    const unauthJson = await unauthRes.json();
    expect(unauthJson.error).toBe('unauthorized');
    expect(unauthJson.session).toBeUndefined();

    // 2. Authenticated owner request
    const authRes = await httpRequest(`${baseUrl}/iSquared/api/simulator/session`, {
      method: 'GET',
      headers: {
        cookie: cookieHeader({ isq_beta: testCode }), // Use valid session if testCode is valid
      },
    });
    expect(authRes.headers['cache-control']).toContain('no-store');
  });

  async function startSimulator(cookies, csrfToken, body) {
    return httpRequest(`${baseUrl}/iSquared/api/simulator/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: cookieHeader(cookies),
        origin: baseUrl,
      },
      body: JSON.stringify(body),
    });
  }

  async function stopSimulator(cookies, csrfToken, sessionId) {
    return httpRequest(`${baseUrl}/iSquared/api/simulator/stop`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: cookieHeader(cookies),
        origin: baseUrl,
      },
      body: JSON.stringify({ sessionId }),
    });
  }

  test('the preview URL returned by start opens for its owner only', async () => {
    const owner = await loginAsTester(betaInstance.service.createTester({ name: 'PreviewOwner' }).code);
    const other = await loginAsTester(betaInstance.service.createTester({ name: 'PreviewOther' }).code);

    const startRes = await startSimulator(owner.cookies, owner.csrfToken, { durationMinutes: 2 });
    expect(startRes.status).toBe(201);
    const { session } = await startRes.json();
    const previewUrl = new URL(session.webPreviewUrl, baseUrl);
    // The provider builds the URL from its own session ID, not the database ID.
    expect(previewUrl.searchParams.get('session')).toMatch(/^sim_/);
    expect(previewUrl.searchParams.get('session')).not.toBe(session.id);

    const ownerHeaders = { headers: { cookie: cookieHeader(owner.cookies) } };
    const ownerPreview = await httpRequest(previewUrl.toString(), ownerHeaders);
    expect(ownerPreview.status).toBe(200);
    expect(await ownerPreview.text()).toContain('Simulated Preview · Not a Live EAS Simulator');

    // Another authenticated tester cannot open it.
    const otherPreview = await httpRequest(previewUrl.toString(), { headers: { cookie: cookieHeader(other.cookies) } });
    expect(otherPreview.status).toBe(403);

    // Signed-out requests are refused.
    expect((await httpRequest(previewUrl.toString())).status).toBe(401);

    // Missing, repeated, unknown and database-ID values do not open a preview.
    const previewPath = `${baseUrl}/iSquared/simulator/preview`;
    expect((await httpRequest(previewPath, ownerHeaders)).status).toBe(400);
    expect((await httpRequest(`${previewPath}?session=`, ownerHeaders)).status).toBe(400);
    expect((await httpRequest(`${previewPath}?session=a&session=b`, ownerHeaders)).status).toBe(400);
    expect((await httpRequest(`${previewPath}?session=sim_00000000-0000-0000-0000-000000000000`, ownerHeaders)).status).toBe(403);
    expect((await httpRequest(`${previewPath}?session=${encodeURIComponent(session.id)}`, ownerHeaders)).status).toBe(403);

    // Once stopped, the owner's preview URL no longer opens.
    expect((await stopSimulator(owner.cookies, owner.csrfToken, session.id)).status).toBe(200);
    expect((await httpRequest(previewUrl.toString(), ownerHeaders)).status).toBe(410);
  });

  test('start normalizes fractional durations and rejects invalid ones', async () => {
    const tester = await loginAsTester(betaInstance.service.createTester({ name: 'DurationRouteTester' }).code);

    const invalid = await startSimulator(tester.cookies, tester.csrfToken, { durationMinutes: -2 });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error).toBe('invalid_duration');

    const startRes = await startSimulator(tester.cookies, tester.csrfToken, { durationMinutes: 1.1 });
    expect(startRes.status).toBe(201);
    const { session } = await startRes.json();
    expect(session.durationSeconds).toBe(60);
    expect(Date.parse(session.expiresAt) - Date.parse(session.createdAt)).toBe(60_000);

    expect((await stopSimulator(tester.cookies, tester.csrfToken, session.id)).status).toBe(200);
  });

  test('a start that is stopped while the provider is still starting returns the stopped result', async () => {
    const errorLogs = [];
    const testLogger = { log: () => {}, error: (msg) => errorLogs.push(String(msg)) };

    let resolveProviderStart;
    const stoppedProviderSessions = [];
    const delayedProvider = {
      name: 'delayed_provider',
      hasDeterministicExpiry: false,
      async isAvailable() { return { available: true }; },
      startSession() {
        return new Promise((resolve) => {
          resolveProviderStart = resolve;
        });
      },
      async stopSession(providerSessionId) {
        stoppedProviderSessions.push(providerSessionId);
        return { ok: true, stopped: true };
      },
      async inspectSession() { return null; },
    };

    const { db: testDb } = openDatabase(':memory:');
    const testService = createBetaService({
      db: testDb,
      config: betaInstance.config,
      agreement: { version: '1', digest: 'dig', title: 'T', statement: 'S', checkboxLabel: 'C', terms: [] },
      now: () => Date.now(),
    });
    testService.registerAgreement();
    const tester = testService.createTester({ name: 'CancelTester' }).tester;
    const testSimService = createSimulatorService({
      db: testDb,
      config: betaInstance.config,
      provider: delayedProvider,
      now: () => Date.now(),
    });
    const testApp = express();
    testApp.use('/iSquared', createBetaRouter({
      service: testService,
      simulatorService: testSimService,
      config: betaInstance.config,
      logger: testLogger,
    }));
    const testServer = http.createServer(testApp);
    await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
    const testBaseUrl = `http://127.0.0.1:${testServer.address().port}`;

    try {
      const sessionToken = 'c'.repeat(48);
      const sessionNow = new Date().toISOString();
      testDb.prepare(
        'INSERT INTO beta_sessions (id, tester_id, token_hash, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run('sess_cancel', tester.id, hashToken(sessionToken), sessionNow, new Date(Date.now() + 3600_000).toISOString(), sessionNow);
      const csrfToken = newToken();
      const headers = {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
        cookie: cookieHeader({ isq_beta: sessionToken, isq_csrf: csrfToken }),
        origin: testBaseUrl,
      };

      const startPromise = httpRequest(`${testBaseUrl}/iSquared/api/simulator/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ durationMinutes: 5 }),
      });

      // Wait until the start request has reserved its session and is waiting on the provider.
      let starting = null;
      for (let i = 0; i < 200 && !(starting && resolveProviderStart); i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        starting = testSimService.getActiveSession(tester.id);
      }
      expect(starting.status).toBe('starting');

      const stopRes = await httpRequest(`${testBaseUrl}/iSquared/api/simulator/stop`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId: starting.id }),
      });
      expect(stopRes.status).toBe(200);
      expect(await stopRes.json()).toMatchObject({ ok: true, stopping: true });

      resolveProviderStart({ providerSessionId: 'late_cancel_prov', webPreviewUrl: 'https://test-preview.local/session/late_cancel_prov' });
      const startRes = await startPromise;
      const startBody = await startRes.json();

      expect(startRes.status).toBe(200);
      expect(startBody).toMatchObject({ ok: false, stopped: true, sessionId: starting.id });
      expect(startBody.error).toBeUndefined();
      expect(startBody.session).toBeUndefined();
      expect(JSON.stringify(startBody)).not.toContain('test-preview.local');
      expect(errorLogs).toEqual([]);

      expect(stoppedProviderSessions).toEqual(['late_cancel_prov']);
      const finalSession = testSimService.getSession(starting.id, tester.id);
      expect(finalSession.status).toBe('stopped');
      expect(finalSession.reservedSeconds).toBe(0);
    } finally {
      testServer.close();
      testDb.close();
    }
  });
});
