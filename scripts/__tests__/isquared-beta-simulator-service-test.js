const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../isquared-beta/db.cjs');
const { createBetaService } = require('../isquared-beta/service.cjs');
const { BaseSimulatorProvider, SimulatorError, SimulatedSimulatorProvider, ExpoRestSimulatorProvider } = require('../isquared-beta/simulator-provider.cjs');
const { createSimulatorService, ABSOLUTE_MAX_SESSION_SECS } = require('../isquared-beta/simulator-service.cjs');

// Test fake provider
class TestFakeProvider extends BaseSimulatorProvider {
  constructor({
    shouldFail = false,
    isUncertain = false,
    isDefinitive = false,
    failMessage = 'Provider encountered test failure',
    inspectResult = null,
    stopResult = { ok: true },
    hasDeterministicExpiry = true,
  } = {}) {
    super('fake_test_provider');
    this.shouldFail = shouldFail;
    this.isUncertain = isUncertain;
    this.isDefinitive = isDefinitive;
    this.failMessage = failMessage;
    this.inspectResult = inspectResult;
    this.stopResult = stopResult;
    this.hasDeterministicExpiry = hasDeterministicExpiry;
    this.stoppedSessions = [];
    this.startedSessions = [];
  }

  async isAvailable() {
    return { available: true, fake: true };
  }

  async startSession(options) {
    if (this.shouldFail) {
      throw new SimulatorError('test_provider_failure', this.failMessage, {
        isUncertain: this.isUncertain,
        isDefinitive: this.isDefinitive,
      });
    }
    const providerSessionId = `test_prov_${Math.random().toString(36).slice(2)}`;
    const webPreviewUrl = `https://test-preview.local/session/${providerSessionId}?bearer=secret_test_token_12345`;
    this.startedSessions.push({ providerSessionId, options });
    return {
      providerSessionId,
      webPreviewUrl,
    };
  }

  async stopSession(providerSessionId) {
    this.stoppedSessions.push(providerSessionId);
    if (this.stopResult instanceof Error) {
      throw this.stopResult;
    }
    return this.stopResult;
  }

  async inspectSession(_providerSessionId) {
    if (this.inspectResult instanceof Error) {
      throw this.inspectResult;
    }
    return this.inspectResult;
  }
}

// Simulates an external cloud provider (e.g. Expo EAS Android Simulator)
// where emulator boot takes time, and the cloud max-duration timer only starts when the device is ready.
class DelayedBootExternalProvider extends BaseSimulatorProvider {
  constructor({ bootDelayMs = 30_000, sessionDurationMs = 60_000, getCurrentTime } = {}) {
    super('delayed_boot_external_provider');
    this.hasDeterministicExpiry = false; // External provider: non-deterministic local expiry
    this.bootDelayMs = bootDelayMs;
    this.sessionDurationMs = sessionDurationMs;
    this.getCurrentTime = getCurrentTime;
    this.externalSession = null;
  }

  async isAvailable() {
    return { available: true, fake: true };
  }

  async startSession(options) {
    const providerSessionId = `ext_prov_${Math.random().toString(36).slice(2)}`;
    const now = this.getCurrentTime();
    const readyAt = now + this.bootDelayMs;
    const externalExpiresAt = readyAt + this.sessionDurationMs;

    this.externalSession = {
      providerSessionId,
      requestedAt: now,
      readyAt,
      externalExpiresAt,
      stopped: false,
      stoppedAt: null,
    };

    return {
      providerSessionId,
      webPreviewUrl: `https://test-preview.local/session/${providerSessionId}`,
    };
  }

  async inspectSession(providerSessionId) {
    if (!this.externalSession || this.externalSession.providerSessionId !== providerSessionId) {
      return { running: false, status: 'not_found', absent: true };
    }
    if (this.externalSession.stopped) {
      const usedSecs = Math.max(1, Math.round((this.externalSession.stoppedAt - this.externalSession.readyAt) / 1000));
      return { running: false, status: 'stopped', ended: true, usedSeconds: usedSecs, authoritativeUsage: true };
    }

    const now = this.getCurrentTime();
    if (now >= this.externalSession.externalExpiresAt) {
      this.externalSession.stopped = true;
      this.externalSession.stoppedAt = this.externalSession.externalExpiresAt;
      const usedSecs = Math.round(this.sessionDurationMs / 1000);
      return { running: false, status: 'expired', ended: true, usedSeconds: usedSecs, authoritativeUsage: true };
    }

    return {
      running: true,
      status: now < this.externalSession.readyAt ? 'booting' : 'active',
      readyAt: new Date(this.externalSession.readyAt).toISOString(),
      expiresAt: new Date(this.externalSession.externalExpiresAt).toISOString(),
    };
  }

  async stopSession(providerSessionId) {
    if (this.externalSession && this.externalSession.providerSessionId === providerSessionId) {
      this.externalSession.stopped = true;
      this.externalSession.stoppedAt = this.getCurrentTime();
      const usedSecs = Math.max(1, Math.round((this.externalSession.stoppedAt - this.externalSession.readyAt) / 1000));
      return { ok: true, stopped: true, usedSeconds: usedSecs, authoritativeUsage: true };
    }
    return { ok: true, stopped: true };
  }
}

describe('Simulator Foundation Service (isquared-beta)', () => {
  let db;
  let betaService;
  let currentTime;
  let testTester;

  const fakeAgreement = {
    version: '1',
    digest: 'fake_digest_123',
    title: 'Test Terms',
    statement: 'Agree',
    checkboxLabel: 'I Agree',
    terms: ['Term 1'],
  };

  const fakeConfig = {
    pepper: 'a'.repeat(48),
    sessionTtlMs: 3600_000,
    idleTimeoutMs: 600_000,
    visitGapMs: 60_000,
    limits: { ipFailures: 10, ipWindowMs: 60_000, globalFailures: 100, globalWindowMs: 60_000 },
    simulator: {
      provider: 'test',
      monthlyBudgetMinutes: 60, // 3600s
      maxSessionMinutes: 5, // 300s
    },
  };

  beforeEach(() => {
    currentTime = Date.parse('2026-11-11T12:00:00.000Z');
    const dbHandle = openDatabase(':memory:');
    db = dbHandle.db;

    betaService = createBetaService({
      db,
      config: fakeConfig,
      agreement: fakeAgreement,
      now: () => currentTime,
    });
    betaService.registerAgreement();

    const created = betaService.createTester({ name: 'Alice Test' });
    testTester = created.tester;
  });

  afterEach(() => {
    if (db) db.close();
  });

  test('Database migration creates simulator tables at version 2', () => {
    const version = db.prepare('PRAGMA user_version').get().user_version;
    expect(version).toBe(2);

    const service = createSimulatorService({ db, config: { ...fakeConfig, simulator: { monthlyBudgetMinutes: 10, maxSessionMinutes: 3 } } });
    expect(service.getBudgetConfig()).toMatchObject({ monthlyBudgetSeconds: 600, maxSessionSeconds: 180 });
  });

  test('Starts session, deducts reservation, and activates with bearer preview URL', async () => {
    const fakeProvider = new TestFakeProvider();
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: fakeProvider,
      now: () => currentTime,
    });

    const result = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    expect(result.ok).toBe(true);
    expect(result.session.status).toBe('active');
    expect(result.session.durationSeconds).toBe(300);
    expect(result.session.reservedSeconds).toBe(300);
    expect(result.session.webPreviewUrl).toContain('secret_test_token_12345');

    // Budget check: 300s reserved
    const budget = simService.getBudgetStatus();
    expect(budget.reservedSeconds).toBe(300);
    expect(budget.usedSeconds).toBe(0);
    expect(budget.remainingSeconds).toBe(3300);
  });

  test('Enforces absolute 5-minute maximum session duration even if config asks longer', async () => {
    const fakeProvider = new TestFakeProvider();
    const configWithLongSession = {
      ...fakeConfig,
      simulator: {
        ...fakeConfig.simulator,
        maxSessionMinutes: 60, // Attempt 60 minutes
      },
    };

    const simService = createSimulatorService({
      db,
      config: configWithLongSession,
      provider: fakeProvider,
      now: () => currentTime,
    });

    // Database config also attempts to set max_session_secs higher
    simService.setBudgetConfig({ scope: 'global', maxSessionSeconds: 3600 });
    const budgetConfig = simService.getBudgetConfig('global');
    expect(budgetConfig.maxSessionSeconds).toBe(ABSOLUTE_MAX_SESSION_SECS); // clamped to 300s

    // Request 30 minutes
    const result = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 30,
    });

    expect(result.ok).toBe(true);
    expect(result.session.durationSeconds).toBe(300); // Enforced 5 min cap
    expect(result.session.reservedSeconds).toBe(300);
  });

  test('Enforces concurrency: prevents duplicate concurrent sessions for same tester', async () => {
    const fakeProvider = new TestFakeProvider();
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: fakeProvider,
      now: () => currentTime,
    });

    await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    // Attempt second session while first is active
    await expect(
      simService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 5,
      })
    ).rejects.toThrow(/Cannot start a new session/i);
  });

  test('Enforces monthly budget exhaustion inside BEGIN IMMEDIATE transaction', async () => {
    const fakeProvider = new TestFakeProvider();
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: fakeProvider,
      now: () => currentTime,
    });

    // Set budget to 200s (less than 300s session request)
    simService.setBudgetConfig({ scope: 'global', monthlyBudgetSeconds: 200 });

    await expect(
      simService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 5,
      })
    ).rejects.toThrow(/Monthly simulator budget exhausted/i);
  });

  test('Holds unresolved reservations across UTC month boundaries without undercounting', async () => {
    const uncertainProvider = new TestFakeProvider({ shouldFail: true, isUncertain: true });
    // Set time to end of October: 2026-10-31T23:59:00Z
    currentTime = Date.parse('2026-10-31T23:59:00.000Z');

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: uncertainProvider,
      now: () => currentTime,
    });

    // Start session in October that results in uncertain status
    const startRes = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });
    expect(startRes.uncertain).toBe(true);

    // Rollover to November 1: 2026-11-01T00:01:00Z
    currentTime = Date.parse('2026-11-01T00:01:00.000Z');

    // Budget check in November: Unresolved reservation from October must STILL be held!
    const novemberBudget = simService.getBudgetStatus('global');
    expect(novemberBudget.month).toBe('2026-11');
    expect(novemberBudget.reservedSeconds).toBe(300);
    expect(novemberBudget.remainingSeconds).toBe(3300); // 3600 - 300
    expect(novemberBudget.exhausted).toBe(false);
  });

  test('Never marks stopped/refunds before provider confirms stop', async () => {
    // Provider fails on stopSession
    const failingStopProvider = new TestFakeProvider({
      stopResult: new Error('Network timeout during provider stop'),
    });

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: failingStopProvider,
      now: () => currentTime,
    });

    const startRes = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    // Advance 60 seconds
    currentTime += 60_000;

    // Tester attempts stop, but provider stop fails
    const stopRes = await simService.stopSession({
      testerId: testTester.id,
      sessionId: startRes.session.id,
    });

    // Must be treated as uncertain, reservation must NOT be refunded!
    expect(stopRes.ok).toBe(false);
    expect(stopRes.uncertain).toBe(true);

    const sessionInDb = simService.getSession(startRes.session.id, testTester.id);
    expect(sessionInDb.status).toBe('uncertain');
    expect(sessionInDb.reservedSeconds).toBe(300); // Reservation held!

    const budget = simService.getBudgetStatus();
    expect(budget.reservedSeconds).toBe(300);
    expect(budget.remainingSeconds).toBe(3300);
  });

  test('Early session stop releases unspent reserved seconds once provider confirms stop', async () => {
    const fakeProvider = new TestFakeProvider({ stopResult: { ok: true, stopped: true } });
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: fakeProvider,
      now: () => currentTime,
    });

    const startRes = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5, // 300s reserved
    });

    // Advance 60 seconds
    currentTime += 60_000;

    const stopRes = await simService.stopSession({
      testerId: testTester.id,
      sessionId: startRes.session.id,
    });

    expect(stopRes.ok).toBe(true);
    expect(stopRes.stopped).toBe(true);
    expect(stopRes.usedSeconds).toBe(60);
    expect(stopRes.refundedSeconds).toBe(240);
    expect(fakeProvider.stoppedSessions).toHaveLength(1);

    // Budget check: 60s used, 0s reserved, 3540s remaining
    const budget = simService.getBudgetStatus();
    expect(budget.usedSeconds).toBe(60);
    expect(budget.reservedSeconds).toBe(0);
    expect(budget.remainingSeconds).toBe(3540);
  });

  test('Stop during in-flight start retains reservation and prevents late start reviving session', async () => {
    let resolveProviderStart;
    const delayedProvider = {
      name: 'delayed_provider',
      async isAvailable() { return { available: true }; },
      async startSession() {
        return new Promise((resolve) => {
          resolveProviderStart = resolve;
        });
      },
      async stopSession() { return { ok: true, stopped: true }; },
      async inspectSession() { return { running: false }; },
    };

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: delayedProvider,
      now: () => currentTime,
    });

    // 1. Kick off startSession (it will hang on provider promise)
    const startPromise = simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    // Verify session in DB is 'starting'
    const startingSession = simService.getActiveSession(testTester.id);
    expect(startingSession.status).toBe('starting');
    expect(startingSession.reservedSeconds).toBe(300);

    // 2. While start is in-flight, tester calls stopSession
    const stopRes = await simService.stopSession({
      testerId: testTester.id,
      sessionId: startingSession.id,
    });
    expect(stopRes.ok).toBe(true);
    expect(stopRes.stopping).toBe(true);

    // Concurrency: starting another session while 'stopping' must be BLOCKED
    await expect(
      simService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 5,
      })
    ).rejects.toThrow(/Cannot start a new session/i);

    // 3. Now let the delayed provider start resolve
    resolveProviderStart({
      providerSessionId: 'late_prov_999',
      webPreviewUrl: 'https://test-preview.local/session/late_prov_999?bearer=secret_token',
    });

    const startOutcome = await startPromise;
    expect(startOutcome.ok).toBe(false);
    expect(startOutcome.stopped).toBe(true);

    // In DB, status must be stopped, NOT revived to active!
    const finalSession = simService.getSession(startingSession.id, testTester.id);
    expect(finalSession.status).toBe('stopped');
  });

  test('Provider reconciliation distinguishes confirmed absent, ended, running, and unknown', async () => {
    const provider = new TestFakeProvider();
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider,
      now: () => currentTime,
    });

    // Insert an uncertain session directly
    const sessionId = 'test_reconcile_session';
    const nowIso = new Date(currentTime).toISOString();
    const expiresIso = new Date(currentTime + 300_000).toISOString();
    db.prepare(
      `INSERT INTO beta_simulator_sessions (
         id, tester_id, project_id, platform, status, provider,
         duration_seconds, reserved_seconds, used_seconds, created_at, expires_at
       ) VALUES (?, ?, 'pet-show-and-tell', 'android', 'uncertain', 'fake_test_provider', 300, 300, 0, ?, ?)`
    ).run(sessionId, testTester.id, nowIso, expiresIso);

    // 1. Unknown inspect (inspect throws or returns unknown) -> retain budget
    provider.inspectResult = new Error('Inspect timeout');
    const unknownRes = await simService.reconcileSession({
      testerId: testTester.id,
      sessionId,
    });
    expect(unknownRes.reconciled).toBe(false);
    expect(unknownRes.status).toBe('uncertain');
    let s = simService.getSession(sessionId, testTester.id);
    expect(s.reservedSeconds).toBe(300); // Budget held

    // 2. Confirmed running -> activates session
    provider.inspectResult = { running: true, status: 'active' };
    const runningRes = await simService.reconcileSession({
      testerId: testTester.id,
      sessionId,
    });
    expect(runningRes.reconciled).toBe(true);
    expect(runningRes.status).toBe('active');
    s = simService.getSession(sessionId, testTester.id);
    expect(s.status).toBe('active');
    expect(s.reservedSeconds).toBe(300);

    // Change status back to uncertain for next checks
    db.prepare("UPDATE beta_simulator_sessions SET status = 'uncertain' WHERE id = ?").run(sessionId);

    // 3. Confirmed absent -> mark failed and refund reservation
    provider.inspectResult = { running: false, absent: true, status: 'not_found' };
    const absentRes = await simService.reconcileSession({
      testerId: testTester.id,
      sessionId,
    });
    expect(absentRes.reconciled).toBe(true);
    expect(absentRes.status).toBe('failed');
    expect(absentRes.refundedSeconds).toBe(300);
    s = simService.getSession(sessionId, testTester.id);
    expect(s.reservedSeconds).toBe(0);

    // 4. Confirmed ended -> mark stopped, record used billing, avoid refund of consumed time
    const endedSessionId = 'test_ended_session';
    db.prepare(
      `INSERT INTO beta_simulator_sessions (
         id, tester_id, project_id, platform, status, provider,
         duration_seconds, reserved_seconds, used_seconds, created_at, expires_at
       ) VALUES (?, ?, 'pet-show-and-tell', 'android', 'uncertain', 'fake_test_provider', 300, 300, 0, ?, ?)`
    ).run(endedSessionId, testTester.id, nowIso, nowIso);

    provider.inspectResult = { running: false, ended: true, usedSeconds: 180, status: 'stopped' };
    const endedRes = await simService.reconcileSession({
      testerId: testTester.id,
      sessionId: endedSessionId,
    });
    expect(endedRes.reconciled).toBe(true);
    expect(endedRes.status).toBe('stopped');
    expect(endedRes.usedSeconds).toBe(180);
    expect(endedRes.refundedSeconds).toBe(120);

    const endedDb = simService.getSession(endedSessionId, testTester.id);
    expect(endedDb.usedSeconds).toBe(180);
    expect(endedDb.reservedSeconds).toBe(0);
  });

  test('Never logs, persists, or exposes secret-bearing provider exceptions', async () => {
    const secretError = new SimulatorError(
      'provider_fail',
      'Crash with bearer secret_token_xyz987654321 and URL https://api.expo.dev?token=secret_token_xyz987654321',
      { isUncertain: true }
    );

    const secretLeakingProvider = new TestFakeProvider({
      shouldFail: true,
      failMessage: secretError.message,
      isUncertain: true,
    });

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: secretLeakingProvider,
      now: () => currentTime,
    });

    const res = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    expect(res.uncertain).toBe(true);

    // Verify session metadata and error code do NOT contain secrets
    const session = simService.getSession(res.sessionId, testTester.id);
    expect(JSON.stringify(session.metadata || {})).not.toContain('secret_token_xyz987654321');
    expect(session.errorCode).toBe('uncertain_start');

    // Verify attempts table does NOT contain secrets
    const attempts = simService.getAttempts(res.sessionId);
    for (const a of attempts) {
      expect(JSON.stringify(a.details || {})).not.toContain('secret_token_xyz987654321');
    }
  });

  test('Simulated fallback provider URLs never embed tokens in request paths', async () => {
    const simProvider = new SimulatedSimulatorProvider();
    const result = await simProvider.startSession({
      projectId: 'pet-show-and-tell',
      platform: 'android',
      maxDurationMinutes: 5,
    });

    // Morgan logs request paths; verify token is not present in query string
    expect(result.webPreviewUrl).toBeDefined();
    expect(result.webPreviewUrl).not.toContain('token=');
    expect(result.webPreviewUrl).toContain('session=');
    expect(result.webPreviewUrl).toContain('simulated=true');
  });

  test('Crash/restart uncertain paths survive and hold budget across database reopen', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isq-crash-test-'));
    const dbFile = path.join(tempDir, 'crash-test.sqlite');

    try {
      // 1. Open first DB connection
      const { db: db1 } = openDatabase(dbFile);
      const betaSvc1 = createBetaService({
        db: db1,
        config: fakeConfig,
        agreement: fakeAgreement,
        now: () => currentTime,
      });
      betaSvc1.registerAgreement();
      const tester = betaSvc1.createTester({ name: 'CrashTester' }).tester;

      const uncertainProv = new TestFakeProvider({ shouldFail: true, isUncertain: true });
      const simSvc1 = createSimulatorService({
        db: db1,
        config: fakeConfig,
        provider: uncertainProv,
        now: () => currentTime,
      });

      const startRes = await simSvc1.startSession({
        testerId: tester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 5,
      });
      expect(startRes.uncertain).toBe(true);

      // Simulate crash: close first connection
      db1.close();

      // 2. Restart server: open second DB connection to same file
      const { db: db2 } = openDatabase(dbFile);
      const simSvc2 = createSimulatorService({
        db: db2,
        config: fakeConfig,
        provider: new TestFakeProvider(),
        now: () => currentTime,
      });

      // Budget check on restart: 300s remains held!
      const budget = simSvc2.getBudgetStatus('global');
      expect(budget.reservedSeconds).toBe(300);
      expect(budget.remainingSeconds).toBe(3300);

      // Concurrency check on restart: Tester cannot start a new session
      await expect(
        simSvc2.startSession({
          testerId: tester.id,
          projectId: 'pet-show-and-tell',
          platform: 'android',
          durationMinutes: 5,
        })
      ).rejects.toThrow(/Cannot start a new session/i);

      db2.close();
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('Simultaneous reservations in separate DB connections serialize inside BEGIN IMMEDIATE', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isq-concur-test-'));
    const dbFile = path.join(tempDir, 'concur-test.sqlite');

    try {
      // Create and initialize database
      const { db: initDb } = openDatabase(dbFile);
      const betaInit = createBetaService({
        db: initDb,
        config: fakeConfig,
        agreement: fakeAgreement,
        now: () => currentTime,
      });
      betaInit.registerAgreement();

      const tester1 = betaInit.createTester({ name: 'Tester One' }).tester;
      const tester2 = betaInit.createTester({ name: 'Tester Two' }).tester;

      // Set budget so it only fits EXACTLY ONE 5-minute session (300 seconds)
      const simInit = createSimulatorService({ db: initDb, config: fakeConfig, now: () => currentTime });
      simInit.setBudgetConfig({ scope: 'global', monthlyBudgetSeconds: 300 });
      initDb.close();

      // Open 2 separate DB handles (simulating two processes/threads)
      const { db: conn1 } = openDatabase(dbFile);
      const { db: conn2 } = openDatabase(dbFile);

      const sim1 = createSimulatorService({ db: conn1, config: fakeConfig, provider: new TestFakeProvider(), now: () => currentTime });
      const sim2 = createSimulatorService({ db: conn2, config: fakeConfig, provider: new TestFakeProvider(), now: () => currentTime });

      // Run startSession concurrently across the two connections
      const results = await Promise.allSettled([
        sim1.startSession({ testerId: tester1.id, projectId: 'pet-show-and-tell', platform: 'android', durationMinutes: 5 }),
        sim2.startSession({ testerId: tester2.id, projectId: 'pet-show-and-tell', platform: 'android', durationMinutes: 5 }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly ONE must succeed and the other must be rejected for budget exhaustion
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason.message).toMatch(/budget exhausted/i);

      conn1.close();
      conn2.close();
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('Enforces tester ownership: Tester B cannot stop or read Tester A session', async () => {
    const fakeProvider = new TestFakeProvider();
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: fakeProvider,
      now: () => currentTime,
    });

    const bob = betaService.createTester({ name: 'Bob Test' }).tester;

    const startRes = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    // Bob tries to stop Alice's session
    await expect(
      simService.stopSession({
        testerId: bob.id,
        sessionId: startRes.session.id,
      })
    ).rejects.toThrow(/No simulator session found/i);

    // Bob cannot retrieve Alice's session
    const bobsView = simService.getSession(startRes.session.id, bob.id);
    expect(bobsView).toBeNull();
  });

  test('Provider definitive failure refunds reservation immediately', async () => {
    const failingProvider = new TestFakeProvider({ shouldFail: true, isDefinitive: true });
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: failingProvider,
      now: () => currentTime,
    });

    await expect(
      simService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 5,
      })
    ).rejects.toThrow(/Provider encountered test failure/i);

    // Budget check: 0 used, 0 reserved, fully available
    const budget = simService.getBudgetStatus();
    expect(budget.usedSeconds).toBe(0);
    expect(budget.reservedSeconds).toBe(0);
    expect(budget.remainingSeconds).toBe(3600);
  });

  test('Never leaks preview bearer URLs in attempts table or session lists', async () => {
    const fakeProvider = new TestFakeProvider();
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: fakeProvider,
      now: () => currentTime,
    });

    const startRes = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    // Check attempts table
    const attempts = simService.getAttempts(startRes.session.id);
    expect(attempts.length).toBeGreaterThan(0);
    for (const attempt of attempts) {
      const detailsStr = JSON.stringify(attempt.details || {});
      expect(detailsStr).not.toContain('secret_test_token_12345');
      expect(detailsStr).not.toContain('https://test-preview.local');
    }

    // Check listSessionsForTester
    const list = simService.listSessionsForTester(testTester.id);
    expect(list[0].webPreviewUrl).toBeUndefined();
  });

  test('Starting after another active session expires cleans up expired session inside transaction without nested transaction error', async () => {
    const fakeProvider = new TestFakeProvider();
    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: fakeProvider,
      now: () => currentTime,
    });

    const bob = betaService.createTester({ name: 'Bob Tester' }).tester;

    // 1. Alice starts a session
    const aliceStart = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });
    expect(aliceStart.ok).toBe(true);
    expect(aliceStart.session.status).toBe('active');

    // 2. Advance time past Alice's expiry
    currentTime += 301_000;

    // 3. Bob starts a session: startSession opens a transaction and calls cleanupExpiredSessions
    // Prior defect threw: "cannot start a transaction within a transaction"
    const bobStart = await simService.startSession({
      testerId: bob.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });
    expect(bobStart.ok).toBe(true);
    expect(bobStart.session.status).toBe('active');

    // Verify Alice's session was cleanly expired and budget released
    const aliceFinal = simService.getSession(aliceStart.session.id, testTester.id);
    expect(aliceFinal.status).toBe('expired');
    expect(aliceFinal.usedSeconds).toBe(300);
    expect(aliceFinal.reservedSeconds).toBe(0);

    const attempts = simService.getAttempts(aliceStart.session.id);
    const expireAttempt = attempts.find((a) => a.action === 'expire');
    expect(expireAttempt).toBeDefined();
    expect(expireAttempt.outcome).toBe('success');
  });

  test('wasStoppedDuringStart retains uncertain state and reservation if provider.stopSession throws', async () => {
    let resolveProviderStart;
    const delayedProvider = {
      name: 'delayed_provider',
      async isAvailable() { return { available: true }; },
      async startSession() {
        return new Promise((resolve) => {
          resolveProviderStart = resolve;
        });
      },
      async stopSession() {
        throw new Error('Network error during provider stop');
      },
      async inspectSession() { return { running: false }; },
    };

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: delayedProvider,
      now: () => currentTime,
    });

    // 1. Kick off startSession
    const startPromise = simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    const startingSession = simService.getActiveSession(testTester.id);
    expect(startingSession.status).toBe('starting');

    // 2. Tester requests stop while start is in-flight
    const stopRes = await simService.stopSession({
      testerId: testTester.id,
      sessionId: startingSession.id,
    });
    expect(stopRes.ok).toBe(true);
    expect(stopRes.stopping).toBe(true);

    // 3. Late provider start resolves
    resolveProviderStart({
      providerSessionId: 'late_prov_err',
      webPreviewUrl: 'https://test-preview.local/session/late_prov_err',
    });

    const startOutcome = await startPromise;
    expect(startOutcome.ok).toBe(false);
    expect(startOutcome.uncertain).toBe(true);

    // In DB: status must be uncertain, NOT stopped; reservation must be HELD (300s)
    const sessionInDb = simService.getSession(startingSession.id, testTester.id);
    expect(sessionInDb.status).toBe('uncertain');
    expect(sessionInDb.errorCode).toBe('stop_uncertain');
    expect(sessionInDb.reservedSeconds).toBe(300);
    expect(sessionInDb.usedSeconds).toBe(0);

    // Budget check: reservation remains held, no unverified refund
    const budget = simService.getBudgetStatus();
    expect(budget.reservedSeconds).toBe(300);
    expect(budget.usedSeconds).toBe(0);
  });

  test('wasStoppedDuringStart retains uncertain state and reservation if provider.stopSession returns ok:false', async () => {
    let resolveProviderStart;
    const delayedProvider = {
      name: 'delayed_provider',
      async isAvailable() { return { available: true }; },
      async startSession() {
        return new Promise((resolve) => {
          resolveProviderStart = resolve;
        });
      },
      async stopSession() {
        return { ok: false, reason: 'provider_rate_limited' };
      },
      async inspectSession() { return { running: false }; },
    };

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: delayedProvider,
      now: () => currentTime,
    });

    const startPromise = simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    const startingSession = simService.getActiveSession(testTester.id);

    await simService.stopSession({
      testerId: testTester.id,
      sessionId: startingSession.id,
    });

    resolveProviderStart({
      providerSessionId: 'late_prov_false',
      webPreviewUrl: 'https://test-preview.local/session/late_prov_false',
    });

    const startOutcome = await startPromise;
    expect(startOutcome.ok).toBe(false);
    expect(startOutcome.uncertain).toBe(true);

    const sessionInDb = simService.getSession(startingSession.id, testTester.id);
    expect(sessionInDb.status).toBe('uncertain');
    expect(sessionInDb.reservedSeconds).toBe(300);

    const budget = simService.getBudgetStatus();
    expect(budget.reservedSeconds).toBe(300);
  });

  test('wasStoppedDuringStart conservatively accounts full reservation when provider stop lacks authoritative usage', async () => {
    let resolveProviderStart;
    const delayedProvider = {
      name: 'delayed_provider',
      async isAvailable() { return { available: true }; },
      async startSession() {
        return new Promise((resolve) => {
          resolveProviderStart = resolve;
        });
      },
      async stopSession() {
        return { ok: true }; // Provider stop confirmed, but without authoritative usage accounting
      },
      async inspectSession() { return { running: false }; },
    };

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: delayedProvider,
      now: () => currentTime,
    });

    const startPromise = simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    const startingSession = simService.getActiveSession(testTester.id);

    // Advance clock 20 seconds
    currentTime += 20_000;

    await simService.stopSession({
      testerId: testTester.id,
      sessionId: startingSession.id,
    });

    resolveProviderStart({
      providerSessionId: 'late_prov_unverified',
      webPreviewUrl: 'https://test-preview.local/session/late_prov_unverified',
    });

    const startOutcome = await startPromise;
    expect(startOutcome.ok).toBe(false);
    expect(startOutcome.stopped).toBe(true);

    const sessionInDb = simService.getSession(startingSession.id, testTester.id);
    expect(sessionInDb.status).toBe('stopped');
    // Must conservatively account full reservation (300s) rather than unverified elapsed time (20s)
    expect(sessionInDb.usedSeconds).toBe(300);
    expect(sessionInDb.reservedSeconds).toBe(0);

    const budget = simService.getBudgetStatus();
    expect(budget.usedSeconds).toBe(300);
    expect(budget.reservedSeconds).toBe(0);
  });

  test('wasStoppedDuringStart respects authoritative provider usage accounting when provided', async () => {
    let resolveProviderStart;
    const delayedProvider = {
      name: 'delayed_provider',
      async isAvailable() { return { available: true }; },
      async startSession() {
        return new Promise((resolve) => {
          resolveProviderStart = resolve;
        });
      },
      async stopSession() {
        return { ok: true, authoritative: true, usedSeconds: 35 };
      },
      async inspectSession() { return { running: false }; },
    };

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: delayedProvider,
      now: () => currentTime,
    });

    const startPromise = simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    const startingSession = simService.getActiveSession(testTester.id);

    await simService.stopSession({
      testerId: testTester.id,
      sessionId: startingSession.id,
    });

    resolveProviderStart({
      providerSessionId: 'late_prov_auth',
      webPreviewUrl: 'https://test-preview.local/session/late_prov_auth',
    });

    const startOutcome = await startPromise;
    expect(startOutcome.ok).toBe(false);
    expect(startOutcome.stopped).toBe(true);

    const sessionInDb = simService.getSession(startingSession.id, testTester.id);
    expect(sessionInDb.status).toBe('stopped');
    expect(sessionInDb.usedSeconds).toBe(35);
    expect(sessionInDb.reservedSeconds).toBe(0);
  });

  test('Ensures no provider expiry can extend session beyond 5-minute max from start time', async () => {
    class FarFutureExpiryProvider extends BaseSimulatorProvider {
      async isAvailable() { return { available: true }; }
      async startSession() {
        return {
          providerSessionId: 'prov_far_future',
          webPreviewUrl: 'https://test-preview.local/session/prov_far_future',
          // Provider attempts to set expiry 1 hour in the future!
          expiresAt: new Date(currentTime + 3600_000).toISOString(),
        };
      }
    }

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: new FarFutureExpiryProvider(),
      now: () => currentTime,
    });

    const result = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 5,
    });

    expect(result.ok).toBe(true);
    // Expiry must be strictly capped to 5 minutes (300s) from session start time
    const expectedMaxExpiry = new Date(currentTime + 300_000).toISOString();
    expect(result.session.expiresAt).toBe(expectedMaxExpiry);

    const inDb = simService.getSession(result.session.id, testTester.id);
    expect(inDb.expiresAt).toBe(expectedMaxExpiry);
  });

  test('Fails closed on malformed or unsafe provider start results', async () => {
    class MalformedProvider extends BaseSimulatorProvider {
      constructor(result) {
        super('malformed_provider');
        this.result = result;
      }
      async isAvailable() { return { available: true }; }
      async startSession() { return this.result; }
    }

    const cases = [
      { providerSessionId: '', webPreviewUrl: 'https://test/url' }, // Empty session ID
      { providerSessionId: 'valid_id', webPreviewUrl: '' }, // Empty preview URL
      { providerSessionId: 'valid_id', webPreviewUrl: 'https://test/url', expiresAt: 'not-a-valid-date' }, // Unparseable expiry
      { providerSessionId: 'valid_id', webPreviewUrl: 'https://test/url', expiresAt: new Date(currentTime - 1000).toISOString() }, // Past expiry
      null, // Null response
      { providerSessionId: 'valid_id' }, // Missing preview URL
    ];

    for (const testCase of cases) {
      const simService = createSimulatorService({
        db,
        config: fakeConfig,
        provider: new MalformedProvider(testCase),
        now: () => currentTime,
      });

      const result = await simService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 5,
      });

      expect(result.ok).toBe(false);
      expect(result.uncertain).toBe(true);

      const inDb = simService.getSession(result.sessionId, testTester.id);
      expect(inDb.status).toBe('uncertain');
      expect(inDb.errorCode).toBe('malformed_provider_response');
      expect(inDb.reservedSeconds).toBe(300); // Reservation held!

      // Reset for next test case
      db.prepare('DELETE FROM beta_simulator_attempts').run();
      db.prepare('DELETE FROM beta_simulator_sessions').run();
    }
  });

  test('Local display expiry must not release budget, remove overlap protection, or permit another paid start when external provider session continues past display deadline (delayed boot)', async () => {
    // Scenario:
    // Tester requests a 60-second session at T=0.
    // Local display expiry is set to T+60s.
    // External provider has a 30-second boot delay, so external session starts at T+30s
    // and continues running until T+90s.
    const externalProvider = new DelayedBootExternalProvider({
      bootDelayMs: 30_000,
      sessionDurationMs: 60_000,
      getCurrentTime: () => currentTime,
    });

    const simService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: externalProvider,
      now: () => currentTime,
    });

    // 1. Tester starts 1-minute (60s) session at T=0 (12:00:00)
    const startResult = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 1, // 60s
    });

    expect(startResult.ok).toBe(true);
    expect(startResult.session.status).toBe('active');
    expect(startResult.session.durationSeconds).toBe(60);
    expect(startResult.session.reservedSeconds).toBe(60);

    const sessionId = startResult.session.id;
    const initialExpiresAt = startResult.session.expiresAt;
    expect(initialExpiresAt).toBe(new Date(currentTime + 60_000).toISOString());

    // 2. Advance time to T+65s (12:01:05):
    // Local display expiry (12:01:00) has passed!
    // But external emulator has only been active for 35s and is still running in cloud until T+90s (12:01:30)!
    currentTime += 65_000;

    // Trigger cleanup / status check
    const budgetAtT65 = simService.getBudgetStatus();

    // Verification 1: Local display expiry must NOT release budget!
    expect(budgetAtT65.reservedSeconds).toBe(60);
    expect(budgetAtT65.usedSeconds).toBe(0); // Avoid assumptions about billing!

    // Verification 2: In SQLite, session status is 'uncertain' (unconfirmed expiry), NOT 'expired'
    const sessionAtT65 = simService.getSession(sessionId, testTester.id);
    expect(sessionAtT65.status).toBe('uncertain');
    expect(sessionAtT65.errorCode).toBe('unconfirmed_expiry');
    expect(sessionAtT65.reservedSeconds).toBe(60);
    expect(sessionAtT65.usedSeconds).toBe(0);

    // Verification 3: Overlap protection must NOT be removed!
    // Tester must NOT be permitted to start another paid session while external session continues!
    await expect(
      simService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 1,
      })
    ).rejects.toThrow('Cannot start a new session: existing session');

    // Verification 4: Hold reservation across service restarts / DB reopen
    const reopenedService = createSimulatorService({
      db,
      config: fakeConfig,
      provider: externalProvider,
      now: () => currentTime,
    });
    const reopenedBudget = reopenedService.getBudgetStatus();
    expect(reopenedBudget.reservedSeconds).toBe(60);
    expect(reopenedBudget.usedSeconds).toBe(0);

    // Reopened service still blocks concurrent start
    await expect(
      reopenedService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 1,
      })
    ).rejects.toThrow('Cannot start a new session: existing session');

    // Verification 5: Reconcile while external session is STILL RUNNING:
    // Provider confirms inspected.running === true.
    // Reconcile must maintain reservation and overlap protection past local display deadline!
    const reconcileRunning = await simService.reconcileSession({
      testerId: testTester.id,
      sessionId,
    });
    expect(reconcileRunning.reconciled).toBe(true);
    expect(reconcileRunning.running).toBe(true);
    expect(reconcileRunning.status).toBe('uncertain');

    const sessionAfterReconcile = simService.getSession(sessionId, testTester.id);
    expect(sessionAfterReconcile.status).toBe('uncertain');
    expect(sessionAfterReconcile.reservedSeconds).toBe(60);
    expect(sessionAfterReconcile.errorCode).toBe('provider_still_running');

    // Attempting start still rejected
    await expect(
      simService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 1,
      })
    ).rejects.toThrow('Cannot start a new session: existing session');

    // 3. Advance time to T+95s (12:01:35):
    // External session on provider has now reached its full duration (ended at T+90s)!
    currentTime += 30_000;

    // Now reconcile with provider: provider confirms external session has ended!
    const reconcileEnded = await simService.reconcileSession({
      testerId: testTester.id,
      sessionId,
    });
    expect(reconcileEnded.reconciled).toBe(true);
    expect(reconcileEnded.status).toBe('stopped');
    expect(reconcileEnded.usedSeconds).toBe(60);
    expect(reconcileEnded.refundedSeconds).toBe(0);

    // Verification 6: NOW and ONLY NOW is the reservation released and billing recorded
    const finalBudget = simService.getBudgetStatus();
    expect(finalBudget.reservedSeconds).toBe(0);
    expect(finalBudget.usedSeconds).toBe(60);

    const finalSession = simService.getSession(sessionId, testTester.id);
    expect(finalSession.status).toBe('stopped');
    expect(finalSession.reservedSeconds).toBe(0);
    expect(finalSession.usedSeconds).toBe(60);

    // Verification 7: NOW overlap protection is cleared, permitting another paid start!
    const nextStart = await simService.startSession({
      testerId: testTester.id,
      projectId: 'pet-show-and-tell',
      platform: 'android',
      durationMinutes: 1,
    });
    expect(nextStart.ok).toBe(true);
    expect(nextStart.session.status).toBe('active');
  });
  test('changing providers never expires or reconciles another provider session', async () => {
    const original = new DelayedBootExternalProvider({ getCurrentTime: () => currentTime });
    const service = createSimulatorService({ db, config: fakeConfig, provider: original, now: () => currentTime });
    const started = await service.startSession({ testerId: testTester.id, durationMinutes: 1 });
    currentTime += 65_000;
    const replacement = createSimulatorService({ db, config: fakeConfig, provider: new TestFakeProvider(), now: () => currentTime });
    const session = replacement.getSession(started.session.id, testTester.id);
    expect(session.status).toBe('uncertain');
    expect(session.reservedSeconds).toBe(60);
    expect((await replacement.stopSession({ testerId: testTester.id, sessionId: session.id })).uncertain).toBe(true);
    expect((await replacement.reconcileSession({ testerId: testTester.id, sessionId: session.id })).reconciled).toBe(false);
    expect(replacement.getBudgetStatus().reservedSeconds).toBe(60);
  });

  describe('ExpoRestSimulatorProvider', () => {
    test('is disabled when expoToken is missing or enabled: false', async () => {
      const disabled = new ExpoRestSimulatorProvider({ enabled: false, expoToken: null });
      const avail = await disabled.isAvailable();
      expect(avail.available).toBe(false);
      expect(avail.reason).toBe('provider_disabled');
      await expect(disabled.startSession({ platform: 'android' })).rejects.toThrow('Live EAS Simulator execution is disabled');
    });

    test('requires an artifact and exact origin before allocating', async () => {
      const fetchImpl = jest.fn();
      const provider = new ExpoRestSimulatorProvider({ enabled: true, expoToken: 'fake', fetchImpl });
      expect((await provider.isAvailable()).available).toBe(false);
      await expect(provider.startSession()).rejects.toThrow();
      expect(fetchImpl).not.toHaveBeenCalled();
    });

    test('404 and unconfirmed stop never prove a session ended', async () => {
      const provider = new ExpoRestSimulatorProvider({ enabled: true, expoToken: 'fake',
        buildId: 'fake', allowedOrigin: 'https://example.com',
        fetchImpl: async () => ({ ok: false, status: 404 }) });
      expect(await provider.inspectSession('session')).toEqual({ unknown: true });
      expect((await provider.stopSession('session')).ok).toBe(false);
    });

    test('validates platform is strictly android', async () => {
      const provider = new ExpoRestSimulatorProvider({
        enabled: true,
        expoToken: 'mock_token',
        buildId: 'test-build', allowedOrigin: 'http://localhost:3000',
        fetchImpl: async () => ({ ok: true, json: async () => ({}) }),
      });
      await expect(provider.startSession({ platform: 'ios' })).rejects.toThrow('Only Android platform is supported');
    });

    test('validates and allowlists project ID', async () => {
      const provider = new ExpoRestSimulatorProvider({
        enabled: true,
        expoToken: 'mock_token',
        buildId: 'test-build', allowedOrigin: 'http://localhost:3000',
        projectId: '00ff11f9-a771-44bb-a352-ba497bfea0c7',
        fetchImpl: async () => ({ ok: true, json: async () => ({}) }),
      });
      await expect(provider.startSession({ platform: 'android', projectId: 'unauthorized_project_123' })).rejects.toThrow('is not allowlisted');
    });

    test('enforces 5-minute cap, operator origin, and bearer auth in REST request', async () => {
      let capturedUrl = null;
      let capturedHeaders = null;
      let capturedBody = null;

      const mockFetch = async (url, opts) => {
        capturedUrl = url;
        capturedHeaders = opts.headers;
        capturedBody = JSON.parse(opts.body);
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'eas_sess_123',
              appId: '00ff11f9-a771-44bb-a352-ba497bfea0c7',
              platform: 'android',
              status: 'queued',
            },
          }),
        };
      };

      const provider = new ExpoRestSimulatorProvider({
        enabled: true,
        expoToken: 'secret_expo_test_token',
        projectId: '00ff11f9-a771-44bb-a352-ba497bfea0c7',
        buildId: 'build_uuid_456',
        allowedOrigin: 'http://localhost:3000',
        fetchImpl: mockFetch,
      });

      const res = await provider.startSession({
        platform: 'android',
        projectId: 'pet-show-and-tell',
        maxDurationMinutes: 10, // Requesting 10 minutes must clamp to 5
      });

      expect(capturedUrl).toBe('https://api.expo.dev/v2/device-run-sessions');
      expect(capturedHeaders.Authorization).toBe('Bearer secret_expo_test_token');
      expect(capturedBody.appId).toBe('00ff11f9-a771-44bb-a352-ba497bfea0c7');
      expect(capturedBody.maxDurationMinutes).toBe(5); // Clamped
      expect(capturedBody.corsOrigins).toEqual(['http://localhost:3000']);
      expect(capturedBody.frameAncestors).toEqual(['http://localhost:3000']);
      expect(capturedBody.buildId).toBe('build_uuid_456');

      expect(res.providerSessionId).toBe('eas_sess_123');
      expect(res.status).toBe('queued');
      expect(res.pending).toBe(true);
    });

    test('ambiguous create throws uncertain_start without blind retry', async () => {
      let callCount = 0;
      const mockFetch = async () => {
        callCount++;
        throw new Error('socket hang up');
      };

      const provider = new ExpoRestSimulatorProvider({
        enabled: true,
        expoToken: 'test_token',
        buildId: 'test-build', allowedOrigin: 'http://localhost:3000',
        fetchImpl: mockFetch,
      });

      try {
        await provider.startSession({ platform: 'android', projectId: 'pet-show-and-tell' });
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.code).toBe('uncertain_start');
        expect(err.isUncertain).toBe(true);
        expect(err.isDefinitive).toBe(false);
      }
      expect(callCount).toBe(1); // No blind retry!
    });

    test('service integration: async session creation with polling via syncActiveSession', async () => {
      let sessionState = 'queued';
      const mockFetch = async (url, opts) => {
        if (opts && opts.method === 'POST' && url.endsWith('/device-run-sessions')) {
          return {
            ok: true,
            status: 201,
            json: async () => ({
              data: {
                id: 'eas_async_789',
                appId: '00ff11f9-a771-44bb-a352-ba497bfea0c7',
                platform: 'android',
                status: sessionState,
              },
            }),
          };
        }
        if (url.includes('/device-run-sessions/eas_async_789')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: {
                id: 'eas_async_789',
                status: sessionState,
                remoteConfig: sessionState === 'in-progress'
                  ? {
                      previewApiUrl: 'https://preview.expo.dev/eas_async_789',
                      webPreviewToken: 'bearer_token_secret_xyz',
                      webPreviewUrl: 'https://preview.expo.dev/eas_async_789?token=bearer_token_secret_xyz',
                    }
                  : null,
              },
            }),
          };
        }
        throw new Error(`Unhandled fetch: ${url}`);
      };

      const provider = new ExpoRestSimulatorProvider({
        enabled: true,
        expoToken: 'mock_token',
        buildId: 'test-build', allowedOrigin: 'http://localhost:3000',
        fetchImpl: mockFetch,
      });

      const simService = createSimulatorService({
        db,
        config: fakeConfig,
        provider,
        now: () => currentTime,
      });

      // 1. Initial start creates session in 'starting' status with held reservation
      const startRes = await simService.startSession({
        testerId: testTester.id,
        projectId: 'pet-show-and-tell',
        platform: 'android',
        durationMinutes: 5,
      });

      expect(startRes.ok).toBe(true);
      expect(startRes.pending).toBe(true);
      expect(startRes.session.status).toBe('starting');
      expect(startRes.session.reservedSeconds).toBe(300);

      // 2. While queued, syncActiveSession leaves session in 'starting'
      const synQueued = await simService.syncActiveSession(testTester.id);
      expect(synQueued.status).toBe('starting');

      // 3. Cloud emulator transitions to 'in-progress'
      sessionState = 'in-progress';
      const syncActive = await simService.syncActiveSession(testTester.id);
      expect(syncActive.status).toBe('active');
      expect(syncActive.webPreviewUrl).toBeNull();
      expect(syncActive.previewApiUrl).toBe('https://preview.expo.dev/eas_async_789');
      expect(syncActive.webPreviewToken).toBe('bearer_token_secret_xyz');
      const afterRefresh = await simService.syncActiveSession(testTester.id);
      expect(afterRefresh.webPreviewToken).toBe('bearer_token_secret_xyz');
      const persisted = db.prepare('SELECT * FROM beta_simulator_sessions WHERE id = ?').get(startRes.session.id);
      expect(JSON.stringify(persisted)).not.toContain('bearer_token_secret_xyz');

      // Verify attempts table does NOT leak the bearer token!
      const attempts = simService.getAttempts(startRes.session.id);
      for (const att of attempts) {
        const text = JSON.stringify(att);
        expect(text).not.toContain('bearer_token_secret_xyz');
      }
    });
  });
});
