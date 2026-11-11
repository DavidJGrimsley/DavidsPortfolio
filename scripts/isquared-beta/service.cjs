const crypto = require('node:crypto');
const { transaction } = require('./db.cjs');
const { createRateLimiter } = require('./rate-limit.cjs');
const {
  generateCode,
  hashClient,
  hashCode,
  hashToken,
  newToken,
  normalizeCode,
  validateManualCode,
} = require('./security.cjs');

const TOUCH_INTERVAL_MS = 60_000;
const MAX_NAME_LENGTH = 100;
const HISTORY_EVENT_TYPES = ['login', 'visit'];

class BetaError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BetaError';
    this.code = code;
  }
}

function toIso(ms) {
  return new Date(ms).toISOString();
}

function parseExpiry(value) {
  if (value === null || value === undefined || value === '' || value === 'none') {
    return null;
  }
  const text = String(value).trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text) ? Date.parse(`${text}T23:59:59.999Z`) : Date.parse(text);
  if (Number.isNaN(parsed)) {
    throw new BetaError('bad_expiry', `Cannot read "${text}" as a date. Use YYYY-MM-DD or an ISO timestamp.`);
  }
  return toIso(parsed);
}

function cleanName(value) {
  const name = String(value ?? '').replace(/\s+/g, ' ').trim();
  // eslint-disable-next-line no-control-regex
  if (!name || name.length > MAX_NAME_LENGTH || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new BetaError('bad_name', `Tester names must be 1-${MAX_NAME_LENGTH} printable characters.`);
  }
  return name;
}

function testerStatus(row, nowIso) {
  if (!row.active) return 'disabled';
  if (row.expires_at && row.expires_at <= nowIso) return 'expired';
  if (!row.last_login_at) return 'invited';
  return 'active';
}

/**
 * All beta state lives behind this object: testers, codes, sessions, agreements, events and
 * statistics. It has no HTTP knowledge, so routes and the admin CLI share one implementation.
 */
function createBetaService({ db, config, agreement, now = () => Date.now() }) {
  const limiter = createRateLimiter({ db, now });
  const limits = config.limits;

  function logEvent({ testerId = null, sessionId = null, type, metadata = null }) {
    db.prepare(
      'INSERT INTO beta_events (tester_id, session_id, event_type, created_at, metadata) VALUES (?, ?, ?, ?, ?)'
    ).run(testerId, sessionId, type, toIso(now()), metadata ? JSON.stringify(metadata) : null);
  }

  // ── agreement ──────────────────────────────────────────────────────────────
  function registerAgreement() {
    const existing = db.prepare('SELECT digest FROM beta_agreement_texts WHERE version = ?').get(agreement.version);
    if (existing) {
      if (existing.digest !== agreement.digest) {
        throw new BetaError(
          'agreement_changed',
          `Agreement version "${agreement.version}" was already recorded with different text. ` +
            'Published versions are immutable: add a new agreement file with a new version instead.'
        );
      }
      return false;
    }
    const { digest, ...content } = agreement;
    db.prepare('INSERT INTO beta_agreement_texts (version, digest, content, created_at) VALUES (?, ?, ?, ?)').run(
      agreement.version,
      digest,
      JSON.stringify(content),
      toIso(now())
    );
    return true;
  }

  // ── testers ────────────────────────────────────────────────────────────────
  function generateUniqueCode() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = generateCode();
      const taken = db.prepare('SELECT 1 FROM beta_testers WHERE code_hash = ?').get(hashCode(config.pepper, code));
      if (!taken) return code;
    }
    throw new BetaError('code_generation_failed', 'Could not generate an unused access code.');
  }

  function createTester({ name, code, expiresAt } = {}) {
    const cleanedName = cleanName(name);
    const generated = code === undefined || code === null || code === '';
    const normalized = generated ? generateUniqueCode() : validateManualCode(code);
    const expiry = parseExpiry(expiresAt);
    if (expiry && expiry <= toIso(now())) {
      throw new BetaError('bad_expiry', 'The expiry date is already in the past.');
    }
    try {
      return transaction(db, () => {
        const info = db
          .prepare('INSERT INTO beta_testers (name, code_hash, active, created_at, expires_at) VALUES (?, ?, 1, ?, ?)')
          .run(cleanedName, hashCode(config.pepper, normalized), toIso(now()), expiry);
        const testerId = Number(info.lastInsertRowid);
        logEvent({ testerId, type: 'tester_created' });
        return { tester: getTester(testerId), code: normalized, generated };
      });
    } catch (error) {
      if (error instanceof BetaError) throw error;
      if (/UNIQUE constraint failed: beta_testers\.name/i.test(error.message)) {
        throw new BetaError('duplicate_name', `A tester named "${cleanedName}" already exists.`);
      }
      if (/UNIQUE constraint failed: beta_testers\.code_hash/i.test(error.message)) {
        throw new BetaError('duplicate_code', 'That access code is already assigned to another tester.');
      }
      throw error;
    }
  }

  function getTester(id) {
    return db.prepare('SELECT * FROM beta_testers WHERE id = ?').get(id) ?? null;
  }

  /** Accepts a numeric id or an exact (case-insensitive) name. */
  function findTester(reference) {
    const text = String(reference ?? '').trim();
    if (!text) {
      throw new BetaError('bad_input', 'A tester ID or name is required.');
    }
    const row = /^\d+$/.test(text)
      ? getTester(Number(text))
      : db.prepare('SELECT * FROM beta_testers WHERE name = ?').get(text);
    if (!row) {
      throw new BetaError('not_found', `No tester matches "${text}".`);
    }
    return row;
  }

  function revokeTesterSessions(testerId) {
    return Number(
      db
        .prepare('UPDATE beta_sessions SET revoked_at = ? WHERE tester_id = ? AND revoked_at IS NULL')
        .run(toIso(now()), testerId).changes
    );
  }

  function setActive(testerId, active) {
    return transaction(db, () => {
      db.prepare('UPDATE beta_testers SET active = ? WHERE id = ?').run(active ? 1 : 0, testerId);
      const revoked = active ? 0 : revokeTesterSessions(testerId);
      logEvent({ testerId, type: active ? 'tester_enabled' : 'tester_disabled', metadata: { revokedSessions: revoked } });
      return { tester: getTester(testerId), revokedSessions: revoked };
    });
  }

  function setExpiry(testerId, value) {
    const expiry = parseExpiry(value);
    db.prepare('UPDATE beta_testers SET expires_at = ? WHERE id = ?').run(expiry, testerId);
    logEvent({ testerId, type: 'expiry_changed', metadata: { expiresAt: expiry } });
    return getTester(testerId);
  }

  function rotateCode(testerId, code) {
    const generated = code === undefined || code === null || code === '';
    const normalized = generated ? generateUniqueCode() : validateManualCode(code);
    try {
      return transaction(db, () => {
        db.prepare('UPDATE beta_testers SET code_hash = ? WHERE id = ?').run(hashCode(config.pepper, normalized), testerId);
        const revoked = revokeTesterSessions(testerId);
        logEvent({ testerId, type: 'code_rotated', metadata: { revokedSessions: revoked } });
        return { tester: getTester(testerId), code: normalized, generated, revokedSessions: revoked };
      });
    } catch (error) {
      if (/UNIQUE constraint failed: beta_testers\.code_hash/i.test(error.message)) {
        throw new BetaError('duplicate_code', 'That access code is already assigned to another tester.');
      }
      throw error;
    }
  }

  // ── tester login ───────────────────────────────────────────────────────────
  function accessRules(client) {
    return [
      { bucket: `access:client:${client}`, limit: limits.ipFailures, windowMs: limits.ipWindowMs },
      { bucket: 'access:global', limit: limits.globalFailures, windowMs: limits.globalWindowMs },
    ];
  }

  function clientKey(address) {
    return hashClient(config.pepper, address);
  }

  /**
   * Verifies a code and, on success, creates a session. Returns { ok: true, token, ... } or
   * { ok: false, reason }. Reasons are for logging and tests; callers must show one generic
   * message for every code-related failure.
   */
  function authenticate({ code, accepted, agreementVersion, agreementDigest, clientAddress = 'unknown' }) {
    const rules = accessRules(clientKey(clientAddress));
    const limited = limiter.check(rules);
    if (limited.blocked) {
      return { ok: false, reason: 'rate_limited', retryAfterSeconds: limited.retryAfterSeconds };
    }
    if (accepted !== true) {
      return { ok: false, reason: 'terms_not_accepted' };
    }
    if (agreementVersion !== agreement.version || agreementDigest !== agreement.digest) {
      return { ok: false, reason: 'terms_outdated' };
    }

    const fail = (reason, testerId = null) => {
      limiter.recordFailure(rules);
      logEvent({ testerId, type: 'login_failed', metadata: { reason } });
      return { ok: false, reason };
    };

    const normalized = normalizeCode(code);
    if (!normalized) {
      return fail('invalid_code');
    }
    const tester = db.prepare('SELECT * FROM beta_testers WHERE code_hash = ?').get(hashCode(config.pepper, normalized));
    if (!tester) return fail('invalid_code');
    if (!tester.active) return fail('inactive', tester.id);
    if (tester.expires_at && tester.expires_at <= toIso(now())) return fail('expired', tester.id);

    return transaction(db, () => {
      const current = now();
      const token = newToken();
      const sessionId = crypto.randomUUID();
      const sessionExpiry = Math.min(
        current + config.sessionTtlMs,
        tester.expires_at ? Date.parse(tester.expires_at) : Infinity
      );
      db.prepare(
        'INSERT OR IGNORE INTO beta_agreements (tester_id, agreement_version, accepted_at, agreement_digest) VALUES (?, ?, ?, ?)'
      ).run(tester.id, agreement.version, toIso(current), agreement.digest);
      db.prepare(
        'INSERT INTO beta_sessions (id, tester_id, token_hash, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(sessionId, tester.id, hashToken(token), toIso(current), toIso(sessionExpiry), toIso(current));
      db.prepare('UPDATE beta_testers SET last_login_at = ? WHERE id = ?').run(toIso(current), tester.id);
      logEvent({ testerId: tester.id, sessionId, type: 'login', metadata: { agreementVersion: agreement.version } });
      return {
        ok: true,
        token,
        maxAgeSeconds: Math.floor((sessionExpiry - current) / 1000),
        tester: { id: tester.id, name: tester.name },
      };
    });
  }

  // ── tester sessions ────────────────────────────────────────────────────────
  /** Returns the live session for a cookie token, or null. Re-checks the tester every call. */
  function validateSession(token) {
    if (typeof token !== 'string' || token.length < 20 || token.length > 128) {
      return null;
    }
    const row = db
      .prepare(
        `SELECT s.id, s.tester_id, s.expires_at, s.last_seen_at, s.last_visit_at,
                t.name, t.active, t.expires_at AS tester_expires_at
           FROM beta_sessions s JOIN beta_testers t ON t.id = s.tester_id
          WHERE s.token_hash = ? AND s.revoked_at IS NULL`
      )
      .get(hashToken(token));
    if (!row || !row.active) return null;

    const current = now();
    if (Date.parse(row.expires_at) <= current) return null;
    if (row.tester_expires_at && Date.parse(row.tester_expires_at) <= current) return null;
    const lastSeen = Date.parse(row.last_seen_at);
    if (lastSeen + config.idleTimeoutMs <= current) return null;

    if (current - lastSeen >= TOUCH_INTERVAL_MS) {
      db.prepare('UPDATE beta_sessions SET last_seen_at = ? WHERE id = ?').run(toIso(current), row.id);
    }
    return {
      sessionId: row.id,
      testerId: row.tester_id,
      testerName: row.name,
      expiresAt: row.expires_at,
      lastVisitAt: row.last_visit_at,
    };
  }

  /**
   * Counts an authenticated opening of the prototype document. Asset requests never call this,
   * and a reload inside the visit gap extends the current visit instead of adding a new one.
   */
  function recordVisit(session) {
    const current = now();
    const last = db.prepare('SELECT last_visit_at FROM beta_sessions WHERE id = ?').get(session.sessionId)?.last_visit_at;
    const isNewVisit = !last || current - Date.parse(last) >= config.visitGapMs;
    return transaction(db, () => {
      db.prepare('UPDATE beta_sessions SET last_visit_at = ? WHERE id = ?').run(toIso(current), session.sessionId);
      if (isNewVisit) {
        logEvent({ testerId: session.testerId, sessionId: session.sessionId, type: 'visit' });
      }
      return isNewVisit;
    });
  }

  function logout(token) {
    const session = validateSession(token);
    if (!session) return false;
    db.prepare('UPDATE beta_sessions SET revoked_at = ? WHERE id = ?').run(toIso(now()), session.sessionId);
    logEvent({ testerId: session.testerId, sessionId: session.sessionId, type: 'logout' });
    return true;
  }

  // ── admin sessions ─────────────────────────────────────────────────────────
  function adminRules(client) {
    return [
      { bucket: `admin:client:${client}`, limit: limits.adminIpFailures, windowMs: limits.ipWindowMs },
      { bucket: 'admin:global', limit: limits.adminGlobalFailures, windowMs: limits.globalWindowMs },
    ];
  }

  function adminLoginGate(clientAddress) {
    return limiter.check(adminRules(clientKey(clientAddress)));
  }

  function recordAdminLoginFailure(clientAddress) {
    limiter.recordFailure(adminRules(clientKey(clientAddress)));
    logEvent({ type: 'admin_login_failed' });
  }

  function createAdminSession() {
    const current = now();
    const token = newToken();
    const id = crypto.randomUUID();
    db.prepare(
      'INSERT INTO beta_admin_sessions (id, token_hash, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, hashToken(token), toIso(current), toIso(current + config.adminSessionTtlMs), toIso(current));
    logEvent({ type: 'admin_login', sessionId: id });
    return { token, maxAgeSeconds: Math.floor(config.adminSessionTtlMs / 1000) };
  }

  function validateAdminSession(token) {
    if (typeof token !== 'string' || token.length < 20 || token.length > 128) {
      return null;
    }
    const row = db
      .prepare('SELECT id, expires_at FROM beta_admin_sessions WHERE token_hash = ? AND revoked_at IS NULL')
      .get(hashToken(token));
    if (!row || Date.parse(row.expires_at) <= now()) return null;
    return { sessionId: row.id };
  }

  function revokeAdminSession(token) {
    const session = validateAdminSession(token);
    if (!session) return false;
    db.prepare('UPDATE beta_admin_sessions SET revoked_at = ? WHERE id = ?').run(toIso(now()), session.sessionId);
    logEvent({ type: 'admin_logout', sessionId: session.sessionId });
    return true;
  }

  // ── reporting ──────────────────────────────────────────────────────────────
  function testerHistory(testerId, { limit = 50 } = {}) {
    return db
      .prepare('SELECT id, event_type, created_at, metadata FROM beta_events WHERE tester_id = ? ORDER BY id DESC LIMIT ?')
      .all(testerId, Math.min(Math.max(1, limit), 1000))
      .map((row) => ({
        id: row.id,
        type: row.event_type,
        at: row.created_at,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
  }

  function listAgreementsFor(testerId) {
    return db
      .prepare('SELECT agreement_version, accepted_at, agreement_digest FROM beta_agreements WHERE tester_id = ? ORDER BY id')
      .all(testerId);
  }

  /**
   * Per-tester and aggregate usage. Logins and visits come only from beta_events rows of those
   * two types; an "active tester" is currently enabled, unexpired, and has a login or visit
   * inside the reporting window.
   */
  function stats({ days = 30 } = {}) {
    const periodDays = Math.min(Math.max(1, Math.floor(days)), 365);
    const nowMs = now();
    const nowIso = toIso(nowMs);
    const since = toIso(nowMs - periodDays * 86_400_000);

    const rows = db
      .prepare(
        `SELECT t.id, t.name, t.active, t.created_at, t.expires_at, t.last_login_at,
                (SELECT COUNT(*) FROM beta_events e WHERE e.tester_id = t.id AND e.event_type = 'login') AS logins,
                (SELECT COUNT(*) FROM beta_events e WHERE e.tester_id = t.id AND e.event_type = 'visit') AS visits,
                (SELECT MAX(e.created_at) FROM beta_events e WHERE e.tester_id = t.id AND e.event_type = 'visit') AS last_visit_at,
                (SELECT COUNT(*) FROM beta_events e WHERE e.tester_id = t.id AND e.event_type IN ('login', 'visit') AND e.created_at >= ?) AS period_events
           FROM beta_testers t ORDER BY t.name`
      )
      .all(since);

    const testers = rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: testerStatus(row, nowIso),
      logins: row.logins,
      visits: row.visits,
      lastLoginAt: row.last_login_at,
      lastVisitAt: row.last_visit_at,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      activeInPeriod: Boolean(row.active) && !(row.expires_at && row.expires_at <= nowIso) && row.period_events > 0,
    }));

    const totals = db
      .prepare(
        `SELECT
           COALESCE(SUM(event_type = 'login'), 0) AS logins,
           COALESCE(SUM(event_type = 'visit'), 0) AS visits,
           COALESCE(SUM(event_type = 'login' AND created_at >= ?), 0) AS period_logins,
           COALESCE(SUM(event_type = 'visit' AND created_at >= ?), 0) AS period_visits
         FROM beta_events WHERE event_type IN (${HISTORY_EVENT_TYPES.map(() => '?').join(', ')})`
      )
      .get(since, since, ...HISTORY_EVENT_TYPES);

    return {
      generatedAt: nowIso,
      periodDays,
      since,
      summary: {
        totalTesters: testers.length,
        activeTesters: testers.filter((tester) => tester.status === 'active' || tester.status === 'invited').length,
        activeTestersInPeriod: testers.filter((tester) => tester.activeInPeriod).length,
        neverLoggedIn: testers.filter((tester) => !tester.lastLoginAt).length,
        totalLogins: Number(totals.logins),
        totalVisits: Number(totals.visits),
        loginsInPeriod: Number(totals.period_logins),
        visitsInPeriod: Number(totals.period_visits),
      },
      testers,
    };
  }

  function cleanup() {
    const cutoff = toIso(now() - 7 * 86_400_000);
    const sessions = db
      .prepare('DELETE FROM beta_sessions WHERE (expires_at < ? OR revoked_at < ?)')
      .run(cutoff, cutoff).changes;
    const adminSessions = db
      .prepare('DELETE FROM beta_admin_sessions WHERE (expires_at < ? OR revoked_at < ?)')
      .run(cutoff, cutoff).changes;
    return { sessions: Number(sessions), adminSessions: Number(adminSessions) };
  }

  return {
    agreement,
    authenticate,
    cleanup,
    createAdminSession,
    createTester,
    findTester,
    getTester,
    listAgreementsFor,
    logout,
    adminLoginGate,
    recordAdminLoginFailure,
    recordVisit,
    registerAgreement,
    resetRateLimits: () => limiter.reset(),
    revokeAdminSession,
    revokeTesterSessions,
    rotateCode,
    setActive,
    setExpiry,
    stats,
    testerHistory,
    validateAdminSession,
    validateSession,
  };
}

module.exports = { BetaError, createBetaService };
