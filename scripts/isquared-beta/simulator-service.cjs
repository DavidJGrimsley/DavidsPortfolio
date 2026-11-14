const crypto = require('node:crypto');
const { transaction } = require('./db.cjs');
const { BetaError } = require('./service.cjs');
const { DisabledEasSimulatorProvider } = require('./simulator-provider.cjs');

// Absolute 5-minute session maximum enforced regardless of env, config, or tester request.
const ABSOLUTE_MAX_SESSION_SECS = 300;

function toIso(ms) {
  return new Date(ms).toISOString();
}

function sanitizeErrorCode(err) {
  if (err && typeof err.code === 'string' && /^[a-z0-9_]{1,40}$/i.test(err.code)) {
    return err.code;
  }
  return 'provider_error';
}

/**
 * Manages the time-limited simulator preview foundation:
 * - Append-only SQLite tracking of attempts, ownership, status, and expiry
 * - Transaction-safe budget accounting calculated inside BEGIN IMMEDIATE transactions
 * - Concurrency control across cross-process concurrent testers
 * - Unresolved reservations held across UTC month boundaries to avoid undercounting
 * - Never marks stopped or refunds before provider confirms stop
 * - Safe reconciliation positively identifying running, confirmed absent, ended, and unknown
 * - Redaction of preview bearer URLs from logs, events, error text, and static bundles
 */
function createSimulatorService({
  db,
  config,
  provider = new DisabledEasSimulatorProvider(),
  now = () => Date.now(),
}) {
  const defaultMonthlyBudgetSecs = (config.simulator?.monthlyBudgetMinutes ?? 60) * 60;
  const defaultMaxSessionSecs = Math.min(
    ABSOLUTE_MAX_SESSION_SECS,
    (config.simulator?.maxSessionMinutes ?? 5) * 60
  );

  // ── budget & config ────────────────────────────────────────────────────────
  function getBudgetConfig(scope = 'global') {
    const row = db
      .prepare('SELECT scope, monthly_budget_secs, max_session_secs, updated_at FROM beta_simulator_config WHERE scope = ?')
      .get(scope);
    if (!row) {
      return {
        scope,
        monthlyBudgetSeconds: defaultMonthlyBudgetSecs,
        maxSessionSeconds: defaultMaxSessionSecs,
      };
    }
    return {
      scope: row.scope,
      monthlyBudgetSeconds: row.monthly_budget_secs,
      // Absolute 5 minute maximum enforced even if config table has a larger value
      maxSessionSeconds: Math.min(ABSOLUTE_MAX_SESSION_SECS, row.max_session_secs),
    };
  }

  function setBudgetConfig({ scope = 'global', monthlyBudgetSeconds, maxSessionSeconds }) {
    return transaction(db, () => {
      const current = getBudgetConfig(scope);
      const monthly = Number.isInteger(monthlyBudgetSeconds) ? monthlyBudgetSeconds : current.monthlyBudgetSeconds;
      const rawMax = Number.isInteger(maxSessionSeconds) ? maxSessionSeconds : current.maxSessionSeconds;
      const maxSession = Math.min(ABSOLUTE_MAX_SESSION_SECS, rawMax);
      db.prepare(
        `INSERT INTO beta_simulator_config (scope, monthly_budget_secs, max_session_secs, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(scope) DO UPDATE SET
           monthly_budget_secs = excluded.monthly_budget_secs,
           max_session_secs = excluded.max_session_secs,
           updated_at = excluded.updated_at`
      ).run(scope, monthly, maxSession, toIso(now()));
      return getBudgetConfig(scope);
    });
  }

  /**
   * Calculates monthly reservation totals.
   * Crucial invariants:
   * 1. Unresolved reservations (status in 'starting', 'active', 'stopping', 'uncertain') are
   *    held across UTC month boundaries so that rollover does not drop in-flight or held budget.
   * 2. Used seconds are tracked for sessions whose usage falls into the active month window.
   */
  function calculateMonthlyUsage(dbInstance, nowMs) {
    const d = new Date(nowMs);
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const startIso = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();

    const usageRow = dbInstance
      .prepare(
        `SELECT
           COALESCE(SUM(CASE
             WHEN (ended_at >= ? OR (ended_at IS NULL AND created_at >= ?)) THEN used_seconds
             ELSE 0
           END), 0) AS used_secs,
           COALESCE(SUM(CASE
             WHEN status IN ('starting', 'active', 'stopping', 'uncertain') THEN reserved_seconds
             ELSE 0
           END), 0) AS reserved_secs
         FROM beta_simulator_sessions
         WHERE created_at >= ? OR ended_at >= ? OR status IN ('starting', 'active', 'stopping', 'uncertain')`
      )
      .get(startIso, startIso, startIso, startIso);

    return {
      monthKey,
      startIso,
      usedSeconds: Number(usageRow.used_secs),
      reservedSeconds: Number(usageRow.reserved_secs),
    };
  }

  function getBudgetStatus(scope = 'global', dbInstance = db) {
    const budgetConfig = getBudgetConfig(scope);
    cleanupExpiredSessions(dbInstance);

    const usage = calculateMonthlyUsage(dbInstance, now());
    const committedSeconds = usage.usedSeconds + usage.reservedSeconds;
    const remainingSeconds = Math.max(0, budgetConfig.monthlyBudgetSeconds - committedSeconds);

    return {
      scope,
      month: usage.monthKey,
      monthlyBudgetSeconds: budgetConfig.monthlyBudgetSeconds,
      maxSessionSeconds: budgetConfig.maxSessionSeconds,
      usedSeconds: usage.usedSeconds,
      reservedSeconds: usage.reservedSeconds,
      committedSeconds,
      remainingSeconds,
      exhausted: remainingSeconds <= 0,
    };
  }

  // ── expiry & cleanup ───────────────────────────────────────────────────────
  function cleanupExpiredSessions(dbInstance = db, { inTransaction = false } = {}) {
    const runInTx = (fn) => (inTransaction ? fn() : transaction(dbInstance, fn));
    const nowIso = toIso(now());
    return runInTx(() => {
      dbInstance.prepare("UPDATE beta_simulator_sessions SET status = 'uncertain', error_code = 'unconfirmed_expiry' WHERE status = 'starting' AND expires_at <= ?").run(nowIso);
      const expiredRows = dbInstance
        .prepare("SELECT id, tester_id, duration_seconds, provider FROM beta_simulator_sessions WHERE status = 'active' AND expires_at <= ?")
        .all(nowIso);

      let cleanedCount = 0;
      for (const row of expiredRows) {
        if (provider.hasDeterministicExpiry === true && row.provider === provider.name) {
          // Only the provider that created the session can establish deterministic expiry.
          // Atomic conditional update ensures only active sessions are marked expired
          // and protects against race conditions with concurrent stops or reconciliations.
          const updated = dbInstance.prepare(
            "UPDATE beta_simulator_sessions SET status = 'expired', used_seconds = duration_seconds, reserved_seconds = 0, ended_at = expires_at WHERE id = ? AND status = 'active'"
          ).run(row.id);

          if (updated.changes > 0) {
            cleanedCount++;
            dbInstance.prepare(
              'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(row.id, row.tester_id, 'expire', 'success', nowIso, JSON.stringify({ code: 'expired' }));
          }
        } else {
          // A local deadline does not prove an external or different provider has stopped.
          const updated = dbInstance.prepare(
            "UPDATE beta_simulator_sessions SET status = 'uncertain', error_code = 'unconfirmed_expiry', metadata = ? WHERE id = ? AND status = 'active'"
          ).run(JSON.stringify({ code: 'local_display_expired_unconfirmed' }), row.id);

          if (updated.changes > 0) {
            cleanedCount++;
            dbInstance.prepare(
              'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(row.id, row.tester_id, 'expire', 'uncertain', nowIso, JSON.stringify({ code: 'local_display_expired_unconfirmed' }));
          }
        }
      }
      return cleanedCount;
    });
  }

  // ── session lookup ─────────────────────────────────────────────────────────
  function getSession(sessionId, testerId = null) {
    cleanupExpiredSessions();
    const query = testerId
      ? 'SELECT * FROM beta_simulator_sessions WHERE id = ? AND tester_id = ?'
      : 'SELECT * FROM beta_simulator_sessions WHERE id = ?';
    const params = testerId ? [sessionId, testerId] : [sessionId];
    const row = db.prepare(query).get(...params);
    if (!row) return null;

    return {
      id: row.id,
      testerId: row.tester_id,
      projectId: row.project_id,
      platform: row.platform,
      status: row.status,
      provider: row.provider,
      providerSessionId: row.provider_session_id,
      durationSeconds: row.duration_seconds,
      reservedSeconds: row.reserved_seconds,
      usedSeconds: row.used_seconds,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      endedAt: row.ended_at,
      reconciledAt: row.reconciled_at,
      errorCode: row.error_code,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      // Bearer URL returned only to caller with session ownership:
      webPreviewUrl: row.web_preview_url,
    };
  }

  function getActiveSession(testerId) {
    if (!testerId) return null;
    cleanupExpiredSessions();
    const row = db
      .prepare(
        "SELECT id FROM beta_simulator_sessions WHERE tester_id = ? AND status IN ('starting', 'active', 'stopping', 'uncertain') ORDER BY created_at DESC LIMIT 1"
      )
      .get(testerId);
    if (!row) return null;
    return getSession(row.id, testerId);
  }

  // ── start session ──────────────────────────────────────────────────────────
  async function startSession({
    testerId,
    projectId = 'pet-show-and-tell',
    platform = 'android',
    durationMinutes = 5,
    frameAncestor = '*',
  }) {
    if (!testerId) {
      throw new BetaError('unauthorized', 'Authenticated tester is required.');
    }

    const budgetConfig = getBudgetConfig();
    const maxSessionSecs = Math.min(ABSOLUTE_MAX_SESSION_SECS, budgetConfig.maxSessionSeconds);
    const requestedSeconds = Math.min(maxSessionSecs, Math.max(60, Math.floor(durationMinutes * 60)));

    const sessionId = crypto.randomUUID();
    const nowMs = now();
    const createdAt = toIso(nowMs);
    const expiresAt = toIso(nowMs + requestedSeconds * 1000);

    // 1. Transaction-safe check & pre-reservation inside BEGIN IMMEDIATE:
    // Concurrency check and budget accounting MUST run inside the write lock
    // to serialize cross-process concurrent testers and avoid over-reservation.
    transaction(db, () => {
      cleanupExpiredSessions(db, { inTransaction: true });

      // Validate tester
      const tester = db.prepare('SELECT id, active, expires_at FROM beta_testers WHERE id = ?').get(testerId);
      if (!tester || !tester.active || (tester.expires_at && tester.expires_at <= createdAt)) {
        throw new BetaError('inactive', 'Tester is inactive or expired.');
      }

      // Concurrency check: Reject if an active, starting, stopping, or uncertain session exists
      const existing = db
        .prepare(
          "SELECT id, status FROM beta_simulator_sessions WHERE tester_id = ? AND status IN ('starting', 'active', 'stopping', 'uncertain')"
        )
        .get(testerId);
      if (existing) {
        throw new BetaError(
          'concurrent_session_not_allowed',
          `Cannot start a new session: existing session "${existing.id}" is currently "${existing.status}".`
        );
      }

      // Calculate monthly reservation totals INSIDE BEGIN IMMEDIATE transaction
      const usage = calculateMonthlyUsage(db, nowMs);
      const committed = usage.usedSeconds + usage.reservedSeconds;
      const remaining = Math.max(0, budgetConfig.monthlyBudgetSeconds - committed);

      if (remaining < requestedSeconds) {
        throw new BetaError(
          'budget_exhausted',
          `Monthly simulator budget exhausted (${committed}/${budgetConfig.monthlyBudgetSeconds}s reserved or used).`
        );
      }

      // Persist starting session with reservation
      db.prepare(
        `INSERT INTO beta_simulator_sessions (
           id, tester_id, project_id, platform, status, provider,
           duration_seconds, reserved_seconds, used_seconds, created_at, expires_at
         ) VALUES (?, ?, ?, ?, 'starting', ?, ?, ?, 0, ?, ?)`
      ).run(sessionId, testerId, projectId, platform, provider.name, requestedSeconds, requestedSeconds, createdAt, expiresAt);

      db.prepare(
        'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        sessionId,
        testerId,
        'start',
        'starting',
        createdAt,
        JSON.stringify({ requestedSeconds, projectId, platform })
      );
    });

    // 2. Invoke provider OUTSIDE the DB transaction to avoid holding write lock across network calls
    let result;
    let providerError = null;
    try {
      result = await provider.startSession({
        platform,
        projectId,
        maxDurationMinutes: Math.ceil(requestedSeconds / 60),
        frameAncestor,
      });
    } catch (err) {
      providerError = err;
    }

    // 3. Handle provider error or malformed response
    if (providerError) {
      // Provider rejection, null, malformed response or failed stop must be treated as uncertain
      // unless definitively proven safe.
      const isDefinitive = Boolean(providerError.isDefinitive || providerError.code === 'provider_disabled');
      if (isDefinitive) {
        // Definitive failure: safe to refund reservation immediately
        transaction(db, () => {
          const failNow = toIso(now());
          const safeCode = sanitizeErrorCode(providerError);
          db.prepare(
            "UPDATE beta_simulator_sessions SET status = 'failed', reserved_seconds = 0, ended_at = ?, error_code = ?, metadata = ? WHERE id = ?"
          ).run(failNow, safeCode, JSON.stringify({ code: safeCode }), sessionId);

          db.prepare(
            'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            sessionId,
            testerId,
            'start',
            'failure',
            failNow,
            JSON.stringify({ code: safeCode })
          );
        });
        throw providerError;
      }

      // Non-definitive failure: hold reservation in SQLite across restarts until reconciled
      transaction(db, () => {
        const failNow = toIso(now());
        const safeCode = sanitizeErrorCode(providerError);
        db.prepare(
          "UPDATE beta_simulator_sessions SET status = 'uncertain', error_code = 'uncertain_start', metadata = ? WHERE id = ?"
        ).run(JSON.stringify({ code: safeCode }), sessionId);

        db.prepare(
          'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          sessionId,
          testerId,
          'start',
          'uncertain',
          failNow,
          JSON.stringify({ code: safeCode })
        );
      });

      return {
        ok: false,
        uncertain: true,
        sessionId,
        reason: 'Start outcome is uncertain. Budget remains reserved until reconciled.',
      };
    }

    // Fail closed on malformed or unsafe result from provider
    const maxAllowedExpiryMs = nowMs + requestedSeconds * 1000;
    const isPendingOrStarting = Boolean(result && (result.pending === true || result.status === 'starting' || result.status === 'queued'));
    const isMalformed =
      !result ||
      typeof result !== 'object' ||
      typeof result.providerSessionId !== 'string' ||
      result.providerSessionId.trim() === '' ||
      (!isPendingOrStarting && (typeof result.webPreviewUrl !== 'string' || result.webPreviewUrl.trim() === '')) ||
      (result.expiresAt !== undefined &&
        (typeof result.expiresAt !== 'string' ||
          isNaN(Date.parse(result.expiresAt)) ||
          Date.parse(result.expiresAt) <= nowMs));

    if (isMalformed) {
      transaction(db, () => {
        const failNow = toIso(now());
        const updated = db.prepare(
          "UPDATE beta_simulator_sessions SET status = 'uncertain', error_code = 'malformed_provider_response', metadata = ? WHERE id = ? AND status = 'starting'"
        ).run(JSON.stringify({ code: 'malformed_response' }), sessionId);

        if (updated.changes > 0) {
          db.prepare(
            'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            sessionId,
            testerId,
            'start',
            'uncertain',
            failNow,
            JSON.stringify({ code: 'malformed_response' })
          );
        }
      });

      return {
        ok: false,
        uncertain: true,
        sessionId,
        reason: 'Provider returned malformed response. Budget remains reserved until reconciled.',
      };
    }

    // Ensure no provider expiry can extend a session beyond five-minute max from start time
    const providerExpiryMs = result.expiresAt ? Date.parse(result.expiresAt) : maxAllowedExpiryMs;
    const effectiveExpiresAtMs = Math.min(providerExpiryMs, maxAllowedExpiryMs);
    const effectiveExpiresAt = toIso(effectiveExpiresAtMs);

    // 4. Provider succeeded: transition to active (or starting if pending), ensuring no race with in-flight stop
    let wasStoppedDuringStart = false;
    let lateProviderSessionId = result.providerSessionId;
    const targetStatus = isPendingOrStarting ? 'starting' : 'active';

    transaction(db, () => {
      // Conditional CAS update: only transition if STILL in 'starting' status
      const updated = db.prepare(
        "UPDATE beta_simulator_sessions SET status = ?, provider_session_id = ?, web_preview_url = ?, expires_at = ? WHERE id = ? AND status = 'starting'"
      ).run(
        targetStatus,
        result.providerSessionId,
        result.webPreviewUrl || null,
        effectiveExpiresAt,
        sessionId
      );

      if (updated.changes > 0) {
        // Redact bearer tokens: NEVER log web_preview_url in attempts or events
        db.prepare(
          'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          sessionId,
          testerId,
          'start',
          'success',
          toIso(now()),
          JSON.stringify({ providerSessionId: result.providerSessionId })
        );
      } else {
        // Status was no longer 'starting'! Stop was requested while start was in flight.
        // Prevent unsafe race where late start revives stopped attempt!
        wasStoppedDuringStart = true;
        db.prepare(
          "UPDATE beta_simulator_sessions SET provider_session_id = ? WHERE id = ?"
        ).run(result.providerSessionId, sessionId);

        db.prepare(
          'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          sessionId,
          testerId,
          'start',
          'abandoned_by_stop',
          toIso(now()),
          JSON.stringify({ providerSessionId: result.providerSessionId })
        );
      }
    });

    if (wasStoppedDuringStart) {
      let stopConfirmed = false;
      let stopError = null;
      let stopResult = null;

      try {
        stopResult = await provider.stopSession(lateProviderSessionId);
        if (stopResult && typeof stopResult === 'object' && stopResult.ok === true) {
          stopConfirmed = true;
        } else {
          stopError = new Error(stopResult?.reason || 'provider_stop_rejected');
        }
      } catch (err) {
        stopError = err;
      }

      if (!stopConfirmed) {
        // Retain uncertain/stopping and hold reservation unless stop confirmation is explicit
        transaction(db, () => {
          const safeCode = sanitizeErrorCode(stopError);
          const failNow = toIso(now());
          const updated = db.prepare(
            "UPDATE beta_simulator_sessions SET status = 'uncertain', error_code = 'stop_uncertain', metadata = ? WHERE id = ? AND status = 'stopping'"
          ).run(JSON.stringify({ code: safeCode }), sessionId);

          if (updated.changes > 0) {
            db.prepare(
              'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(
              sessionId,
              testerId,
              'stop',
              'uncertain',
              failNow,
              JSON.stringify({ code: safeCode })
            );
          }
        });

        return {
          ok: false,
          uncertain: true,
          sessionId,
          reason: 'Session stop was requested while start was in-flight, but provider stop could not be confirmed. Budget remains reserved until reconciled.',
        };
      }

      // Stop confirmed explicitly by provider
      transaction(db, () => {
        const row = db.prepare('SELECT status, created_at, duration_seconds FROM beta_simulator_sessions WHERE id = ?').get(sessionId);
        if (row && row.status === 'stopping') {
          const nowMsStop = now();
          const hasAuthoritativeUsage =
            stopResult &&
            (stopResult.authoritativeUsage === true || stopResult.isAuthoritative === true || stopResult.authoritative === true) &&
            Number.isInteger(stopResult.usedSeconds) &&
            stopResult.usedSeconds >= 0;

          // Avoid refunds assuming unverified billing; conservatively account full reservation unless actual provider usage accounting is explicitly authoritative
          const usedSeconds = hasAuthoritativeUsage
            ? Math.max(0, Math.min(row.duration_seconds, stopResult.usedSeconds))
            : row.duration_seconds;
          const refundedSeconds = Math.max(0, row.duration_seconds - usedSeconds);

          // Conditional transition protects concurrent resolution
          const updated = db.prepare(
            "UPDATE beta_simulator_sessions SET status = 'stopped', used_seconds = ?, reserved_seconds = 0, ended_at = ? WHERE id = ? AND status = 'stopping'"
          ).run(usedSeconds, toIso(nowMsStop), sessionId);

          if (updated.changes > 0) {
            db.prepare(
              'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(
              sessionId,
              testerId,
              'stop',
              'success',
              toIso(nowMsStop),
              JSON.stringify({ usedSeconds, refundedSeconds })
            );
          }
        }
      });

      return {
        ok: false,
        stopped: true,
        sessionId,
        reason: 'Session stop was requested while start was in-flight. Stopped cleanly.',
      };
    }

    const startedSession = getSession(sessionId, testerId);
    if (startedSession) {
      if (result.previewApiUrl) startedSession.previewApiUrl = result.previewApiUrl;
      if (result.webPreviewToken) startedSession.webPreviewToken = result.webPreviewToken;
    }

    return {
      ok: true,
      pending: isPendingOrStarting,
      session: startedSession,
    };
  }

  // ── stop session ───────────────────────────────────────────────────────────
  async function stopSession({ testerId, sessionId }) {
    if (!testerId) {
      throw new BetaError('unauthorized', 'Authenticated tester is required.');
    }

    const session = getSession(sessionId, testerId);
    if (!session) {
      throw new BetaError('not_found', 'No simulator session found for this tester.');
    }

    if (!['starting', 'active', 'stopping', 'uncertain'].includes(session.status)) {
      return { ok: true, alreadyEnded: true, status: session.status };
    }

    if (session.provider !== provider.name) {
      return { ok: false, uncertain: true, sessionId, message: 'The original provider is unavailable. Budget remains reserved.' };
    }

    const nowMs = now();
    const createdMs = Date.parse(session.createdAt);
    const elapsedSeconds = provider.name === 'eas' ? session.durationSeconds :
      Math.max(1, Math.min(session.durationSeconds, Math.ceil((nowMs - createdMs) / 1000)));

    // If session is still starting, record that stop was requested.
    // Must retain reservation and block new starts.
    if (session.status === 'starting' && !session.providerSessionId) {
      transaction(db, () => {
        db.prepare("UPDATE beta_simulator_sessions SET status = 'stopping' WHERE id = ? AND status = 'starting'").run(sessionId);
        db.prepare(
          'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          sessionId,
          testerId,
          'stop',
          'pending_start',
          toIso(nowMs),
          JSON.stringify({ code: 'stop_during_start' })
        );
      });
      return {
        ok: true,
        stopping: true,
        message: 'Stop requested for in-flight start. Reservation held until start completes.',
      };
    }

    // Mark status as 'stopping' before provider call. Never mark stopped/refund before provider confirms stop!
    transaction(db, () => {
      db.prepare("UPDATE beta_simulator_sessions SET status = 'stopping' WHERE id = ?").run(sessionId);
    });

    let stopConfirmed = false;
    let stopError = null;

    if (session.providerSessionId) {
      try {
        const res = await provider.stopSession(session.providerSessionId);
        if (res && res.ok === true) {
          stopConfirmed = true;
        } else {
          stopError = new Error(res?.reason || 'provider_stop_rejected');
        }
      } catch (err) {
        stopError = err;
      }
    } else {
      // No providerSessionId (e.g. uncertain start where session was never provisioned)
      // Check if provider inspect confirms absent:
      try {
        const inspected = await provider.inspectSession(session.id);
        if (inspected && (inspected.absent || inspected.status === 'not_found')) {
          stopConfirmed = true;
        } else {
          stopError = new Error('no_provider_session_id');
        }
      } catch (err) {
        stopError = err;
      }
    }

    if (!stopConfirmed) {
      // Provider rejection, null, malformed response or failed stop must be treated as uncertain.
      // Retain reservation and do NOT refund!
      transaction(db, () => {
        const safeCode = sanitizeErrorCode(stopError);
        const updated = db.prepare(
          "UPDATE beta_simulator_sessions SET status = 'uncertain', error_code = 'stop_uncertain', metadata = ? WHERE id = ? AND status = 'stopping'"
        ).run(JSON.stringify({ code: safeCode }), sessionId);

        if (updated.changes > 0) {
          db.prepare(
            'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            sessionId,
            testerId,
            'stop',
            'uncertain',
            toIso(nowMs),
            JSON.stringify({ code: safeCode })
          );
        }
      });

      return {
        ok: false,
        uncertain: true,
        sessionId,
        message: 'Provider stop could not be confirmed. Budget remains reserved until reconciled.',
      };
    }

    // Provider confirmed stop! Now and only now mark stopped and release unused reservation:
    transaction(db, () => {
      const endedAt = toIso(nowMs);
      const updated = db.prepare(
        "UPDATE beta_simulator_sessions SET status = 'stopped', used_seconds = ?, reserved_seconds = 0, ended_at = ? WHERE id = ? AND status = 'stopping'"
      ).run(elapsedSeconds, endedAt, sessionId);

      if (updated.changes > 0) {
        db.prepare(
          'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          sessionId,
          testerId,
          'stop',
          'success',
          endedAt,
          JSON.stringify({ usedSeconds: elapsedSeconds, refundedSeconds: session.durationSeconds - elapsedSeconds })
        );
      }
    });

    return {
      ok: true,
      stopped: true,
      usedSeconds: elapsedSeconds,
      refundedSeconds: session.durationSeconds - elapsedSeconds,
    };
  }

  // ── reconcile session ──────────────────────────────────────────────────────
  async function reconcileSession({ testerId, sessionId }) {
    if (!testerId) {
      throw new BetaError('unauthorized', 'Authenticated tester is required.');
    }

    const session = getSession(sessionId, testerId);
    if (!session) {
      throw new BetaError('not_found', 'No simulator session found for this tester.');
    }

    if (!['uncertain', 'stopping'].includes(session.status)) {
      return {
        reconciled: false,
        status: session.status,
        message: 'Session is not in uncertain or stopping state.',
      };
    }

    if (session.provider !== provider.name) {
      return { reconciled: false, status: session.status, reason: 'The original provider is unavailable. Budget remains reserved.' };
    }

    let inspected = null;
    let inspectError = null;
    try {
      inspected = await provider.inspectSession(session.providerSessionId || session.id);
    } catch (err) {
      inspectError = err;
    }

    const reconciledNow = toIso(now());

    // 1. Unknown / inspect failed / unverified: retain budget when unknown
    if (inspectError || !inspected || inspected.unknown) {
      const safeCode = inspectError ? sanitizeErrorCode(inspectError) : 'unknown_provider_status';
      transaction(db, () => {
        db.prepare(
          'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          sessionId,
          testerId,
          'reconcile',
          'unknown',
          reconciledNow,
          JSON.stringify({ code: safeCode })
        );
      });

      return {
        reconciled: false,
        status: session.status,
        reason: 'Provider session status is unknown. Budget remains reserved.',
      };
    }

    // 2. Confirmed running: activate and keep reserved
    if (inspected.running) {
      const nowMs = now();
      const isPastLocalExpiry = Date.parse(session.expiresAt) <= nowMs;

      if (isPastLocalExpiry) {
        // External provider confirms session is STILL RUNNING past the local display deadline!
        // Local display deadline has expired, but external provider has not ended.
        // Overlap protection and budget reservation MUST remain held until provider confirms ended.
        transaction(db, () => {
          const updated = db.prepare(
            "UPDATE beta_simulator_sessions SET status = 'uncertain', reconciled_at = ?, error_code = 'provider_still_running', metadata = ? WHERE id = ? AND status IN ('uncertain', 'stopping')"
          ).run(reconciledNow, JSON.stringify({ code: 'provider_still_running', running: true }), sessionId);

          if (updated.changes > 0) {
            db.prepare(
              'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(
              sessionId,
              testerId,
              'reconcile',
              'still_running',
              reconciledNow,
              JSON.stringify({ status: 'uncertain', code: 'provider_still_running', running: true })
            );
          }
        });

        return {
          reconciled: true,
          running: true,
          status: 'uncertain',
          message: 'Provider confirms external session is still running past local display deadline. Reservation and overlap protection remain held.',
          session: getSession(sessionId, testerId),
        };
      }

      // Within display window: transition to active
      transaction(db, () => {
        const updated = db.prepare(
          "UPDATE beta_simulator_sessions SET status = 'active', reconciled_at = ? WHERE id = ? AND status IN ('uncertain', 'stopping')"
        ).run(reconciledNow, sessionId);

        if (updated.changes > 0) {
          db.prepare(
            'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            sessionId,
            testerId,
            'reconcile',
            'success',
            reconciledNow,
            JSON.stringify({ status: 'active', code: 'confirmed_running' })
          );
        }
      });

      return {
        reconciled: true,
        running: true,
        status: 'active',
        session: getSession(sessionId, testerId),
      };
    }

    // 3. Confirmed absent: positively identify that session NEVER ran / was never allocated
    if (inspected.absent === true || inspected.status === 'not_found') {
      transaction(db, () => {
        const updated = db.prepare(
          "UPDATE beta_simulator_sessions SET status = 'failed', reserved_seconds = 0, ended_at = ?, reconciled_at = ?, error_code = 'reconciled_absent' WHERE id = ? AND status IN ('uncertain', 'stopping')"
        ).run(reconciledNow, reconciledNow, sessionId);

        if (updated.changes > 0) {
          db.prepare(
            'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            sessionId,
            testerId,
            'reconcile',
            'failure',
            reconciledNow,
            JSON.stringify({ status: 'failed_absent', refundedSeconds: session.reservedSeconds })
          );
        }
      });

      return {
        reconciled: true,
        status: 'failed',
        refundedSeconds: session.reservedSeconds,
      };
    }

    // 4. Confirmed ended: session DID run on provider, and is now ended or stopped
    // Avoid refund of consumed billing! Record used_seconds and only refund unconsumed remainder if any.
    if (inspected.ended === true || ['stopped', 'expired'].includes(inspected.status)) {
      const consumedSeconds = (Number.isInteger(inspected.usedSeconds) && inspected.usedSeconds >= 0)
        ? Math.max(0, Math.min(session.durationSeconds, inspected.usedSeconds))
        : session.durationSeconds; // Avoid refunds assuming unverified billing; conservatively account full reservation unless actual provider usage accounting is explicitly authoritative

      const refundedSeconds = Math.max(0, session.durationSeconds - consumedSeconds);

      transaction(db, () => {
        const updated = db.prepare(
          "UPDATE beta_simulator_sessions SET status = 'stopped', used_seconds = ?, reserved_seconds = 0, ended_at = ?, reconciled_at = ?, error_code = 'reconciled_ended' WHERE id = ? AND status IN ('uncertain', 'stopping')"
        ).run(consumedSeconds, reconciledNow, reconciledNow, sessionId);

        if (updated.changes > 0) {
          db.prepare(
            'INSERT INTO beta_simulator_attempts (session_id, tester_id, action, outcome, created_at, details) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            sessionId,
            testerId,
            'reconcile',
            'ended',
            reconciledNow,
            JSON.stringify({ usedSeconds: consumedSeconds, refundedSeconds })
          );
        }
      });

      return {
        reconciled: true,
        status: 'stopped',
        usedSeconds: consumedSeconds,
        refundedSeconds,
      };
    }

    // 5. Fallback: treat any other unverified state as unknown, retain budget
    return {
      reconciled: false,
      status: session.status,
      reason: 'Provider session status is unknown. Budget remains reserved.',
    };
  }

  // ── session history & attempts ─────────────────────────────────────────────
  function listSessionsForTester(testerId, { limit = 20 } = {}) {
    cleanupExpiredSessions();
    const rows = db
      .prepare(
        `SELECT id, tester_id, project_id, platform, status, provider,
                duration_seconds, reserved_seconds, used_seconds,
                created_at, expires_at, ended_at, reconciled_at, error_code
           FROM beta_simulator_sessions
          WHERE tester_id = ?
          ORDER BY created_at DESC
          LIMIT ?`
      )
      .all(testerId, Math.min(Math.max(1, limit), 100));

    // Note: NEVER include web_preview_url in listing!
    return rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      platform: r.platform,
      status: r.status,
      provider: r.provider,
      durationSeconds: r.duration_seconds,
      usedSeconds: r.used_seconds,
      reservedSeconds: r.reserved_seconds,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      endedAt: r.ended_at,
      reconciledAt: r.reconciled_at,
      errorCode: r.error_code,
    }));
  }

  function getAttempts(sessionId) {
    return db
      .prepare('SELECT id, session_id, tester_id, action, outcome, created_at, details FROM beta_simulator_attempts WHERE session_id = ? ORDER BY id ASC')
      .all(sessionId)
      .map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        testerId: row.tester_id,
        action: row.action,
        outcome: row.outcome,
        createdAt: row.created_at,
        details: row.details ? JSON.parse(row.details) : null,
      }));
  }

  async function syncActiveSession(testerId) {
    if (!testerId) return null;
    const session = getActiveSession(testerId);
    if (!session || !session.providerSessionId) return session;

    if (['starting', 'active'].includes(session.status) && session.provider === provider.name) {
      try {
        const inspected = await provider.inspectSession(session.providerSessionId);
        if (inspected && inspected.running && inspected.status === 'active') {
          const nowIso = toIso(now());
          transaction(db, () => {
            db.prepare(
              "UPDATE beta_simulator_sessions SET status = 'active', reconciled_at = ? WHERE id = ? AND status = 'starting'"
            ).run(nowIso, session.id);
          });
          const updated = getSession(session.id, testerId);
          if (updated) {
            updated.previewApiUrl = inspected.previewApiUrl;
            updated.webPreviewToken = inspected.webPreviewToken;
            return updated;
          }
        } else if (inspected && inspected.ended) {
          const nowIso = toIso(now());
          transaction(db, () => {
            db.prepare(
              "UPDATE beta_simulator_sessions SET status = 'stopped', used_seconds = duration_seconds, reserved_seconds = 0, ended_at = ? WHERE id = ? AND status IN ('starting', 'active')"
            ).run(nowIso, session.id);
          });
          return getSession(session.id, testerId);
        } else if (inspected && inspected.absent) {
          transaction(db, () => {
            db.prepare(
              "UPDATE beta_simulator_sessions SET status = 'failed', reserved_seconds = 0 WHERE id = ? AND status = 'starting'"
            ).run(session.id);
          });
          return getSession(session.id, testerId);
        }
      } catch {
        // Inspection failure during active sync retains starting status
      }
    }
    return session;
  }

  return {
    cleanupExpiredSessions,
    getActiveSession,
    getAttempts,
    getBudgetConfig,
    getBudgetStatus,
    getSession,
    listSessionsForTester,
    provider,
    reconcileSession,
    setBudgetConfig,
    startSession,
    stopSession,
    syncActiveSession,
  };
}

module.exports = { createSimulatorService, ABSOLUTE_MAX_SESSION_SECS, sanitizeErrorCode };
