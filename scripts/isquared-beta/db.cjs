const fs = require('node:fs');
const path = require('node:path');

// node:sqlite ships with Node (22.13+ without flags), so there is no native module to build
// on the VPS. getBuiltinModule also avoids Jest's resolver, which does not know node:sqlite.
function loadSqlite() {
  if (typeof process.getBuiltinModule === 'function') {
    const mod = process.getBuiltinModule('node:sqlite');
    if (mod) {
      return mod;
    }
  }
  return require('node:sqlite');
}

// Append-only. Never edit a shipped migration; add a new one. The applied version is stored
// in PRAGMA user_version, so deployments and restarts never reset tester data.
const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE beta_testers (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL COLLATE NOCASE UNIQUE,
        code_hash     TEXT NOT NULL UNIQUE,
        active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        created_at    TEXT NOT NULL,
        expires_at    TEXT,
        last_login_at TEXT
      );

      CREATE TABLE beta_sessions (
        id            TEXT PRIMARY KEY,
        tester_id     INTEGER NOT NULL REFERENCES beta_testers(id),
        token_hash    TEXT NOT NULL UNIQUE,
        created_at    TEXT NOT NULL,
        expires_at    TEXT NOT NULL,
        last_seen_at  TEXT NOT NULL,
        revoked_at    TEXT,
        last_visit_at TEXT
      );
      CREATE INDEX beta_sessions_tester ON beta_sessions(tester_id);

      CREATE TABLE beta_events (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        tester_id  INTEGER REFERENCES beta_testers(id),
        session_id TEXT,
        event_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        metadata   TEXT
      );
      CREATE INDEX beta_events_tester ON beta_events(tester_id, event_type, created_at);
      CREATE INDEX beta_events_type ON beta_events(event_type, created_at);

      CREATE TABLE beta_agreements (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        tester_id         INTEGER NOT NULL REFERENCES beta_testers(id),
        agreement_version TEXT NOT NULL,
        accepted_at       TEXT NOT NULL,
        agreement_digest  TEXT NOT NULL,
        UNIQUE (tester_id, agreement_digest)
      );

      CREATE TABLE beta_agreement_texts (
        version    TEXT PRIMARY KEY,
        digest     TEXT NOT NULL,
        content    TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE beta_admin_sessions (
        id           TEXT PRIMARY KEY,
        token_hash   TEXT NOT NULL UNIQUE,
        created_at   TEXT NOT NULL,
        expires_at   TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        revoked_at   TEXT
      );

      CREATE TABLE beta_rate_limits (
        bucket       TEXT PRIMARY KEY,
        window_start INTEGER NOT NULL,
        count        INTEGER NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE beta_simulator_config (
        scope                TEXT PRIMARY KEY,
        monthly_budget_secs  INTEGER NOT NULL,
        max_session_secs     INTEGER NOT NULL,
        updated_at           TEXT NOT NULL
      );

      CREATE TABLE beta_simulator_sessions (
        id                   TEXT PRIMARY KEY,
        tester_id            INTEGER NOT NULL REFERENCES beta_testers(id),
        project_id           TEXT NOT NULL,
        platform             TEXT NOT NULL,
        status               TEXT NOT NULL CHECK (status IN ('starting', 'active', 'stopping', 'stopped', 'failed', 'expired', 'uncertain')),
        provider             TEXT NOT NULL,
        provider_session_id  TEXT,
        web_preview_url      TEXT,
        duration_seconds     INTEGER NOT NULL,
        reserved_seconds     INTEGER NOT NULL DEFAULT 0,
        used_seconds         INTEGER NOT NULL DEFAULT 0,
        created_at           TEXT NOT NULL,
        expires_at           TEXT NOT NULL,
        ended_at             TEXT,
        reconciled_at        TEXT,
        error_code           TEXT,
        metadata             TEXT
      );
      CREATE INDEX beta_sim_sessions_tester_status ON beta_simulator_sessions(tester_id, status);
      CREATE INDEX beta_sim_sessions_created ON beta_simulator_sessions(created_at);

      CREATE TABLE beta_simulator_attempts (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id           TEXT NOT NULL REFERENCES beta_simulator_sessions(id),
        tester_id            INTEGER NOT NULL REFERENCES beta_testers(id),
        action               TEXT NOT NULL,
        outcome              TEXT NOT NULL,
        created_at           TEXT NOT NULL,
        details              TEXT
      );
      CREATE INDEX beta_sim_attempts_session ON beta_simulator_attempts(session_id);
      CREATE INDEX beta_sim_attempts_tester ON beta_simulator_attempts(tester_id);
    `,
  },
  {
    version: 3,
    sql: 'ALTER TABLE beta_testers ADD COLUMN personal_message TEXT;',
  },
];

function migrate(db) {
  const current = db.prepare('PRAGMA user_version').get().user_version;
  const pending = MIGRATIONS.filter((migration) => migration.version > current);
  for (const migration of pending) {
    db.exec('BEGIN IMMEDIATE');
    try {
      // Re-check inside the write lock: another process may have migrated meanwhile.
      const latest = db.prepare('PRAGMA user_version').get().user_version;
      if (latest < migration.version) {
        db.exec(migration.sql);
        db.exec(`PRAGMA user_version = ${migration.version}`);
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  return { from: current, to: MIGRATIONS[MIGRATIONS.length - 1].version, applied: pending.length };
}

function openDatabase(dbPath) {
  const { DatabaseSync } = loadSqlite();
  const inMemory = dbPath === ':memory:';
  if (!inMemory) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  if (!inMemory) {
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');
  }
  const result = migrate(db);
  if (!inMemory) {
    try {
      fs.chmodSync(dbPath, 0o600);
    } catch {
      // Best effort: Windows and some filesystems ignore POSIX modes.
    }
  }
  return { db, migration: result };
}

const activeTransactions = new WeakSet();

function transaction(db, fn) {
  if (activeTransactions.has(db)) {
    return fn();
  }
  activeTransactions.add(db);
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    activeTransactions.delete(db);
  }
}

module.exports = { MIGRATIONS, migrate, openDatabase, transaction };
