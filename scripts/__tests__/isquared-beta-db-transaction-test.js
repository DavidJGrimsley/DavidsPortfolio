const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase, transaction } = require('../isquared-beta/db.cjs');

describe('isquared-beta transaction()', () => {
  let tempDir;
  let dbPath;
  let holder;
  let writer;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isq-beta-tx-'));
    dbPath = path.join(tempDir, 'beta.sqlite');
    holder = openDatabase(dbPath).db;
    writer = openDatabase(dbPath).db;
    // Fail lock acquisition immediately instead of waiting the default 5s busy timeout.
    writer.exec('PRAGMA busy_timeout = 0');
  });

  afterEach(() => {
    for (const db of [holder, writer]) {
      try {
        db.close();
      } catch {
        // already closed
      }
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function rateLimitRows(db) {
    return db.prepare('SELECT bucket FROM beta_rate_limits ORDER BY bucket').all().map((row) => row.bucket);
  }

  test('a failed BEGIN IMMEDIATE does not leave the connection marked as in a transaction', () => {
    // Connection 1 holds the write lock.
    holder.exec('BEGIN IMMEDIATE');

    // Connection 2 cannot take the lock; the original SQLite error must reach the caller.
    let lockError;
    let callbackRan = false;
    try {
      transaction(writer, () => {
        callbackRan = true;
      });
    } catch (error) {
      lockError = error;
    }
    expect(lockError).toBeDefined();
    expect(String(lockError.message)).toMatch(/locked|busy/i);
    expect(callbackRan).toBe(false);

    holder.exec('ROLLBACK');

    // A later transaction on connection 2 that throws must roll back its write.
    expect(() =>
      transaction(writer, () => {
        writer.prepare('INSERT INTO beta_rate_limits (bucket, window_start, count) VALUES (?, ?, ?)').run('must-roll-back', 0, 1);
        throw new Error('boom after write');
      })
    ).toThrow('boom after write');

    expect(writer.isTransaction).toBe(false);
    // Read from the other connection so only committed data is visible.
    expect(rateLimitRows(holder)).toEqual([]);
    expect(rateLimitRows(writer)).toEqual([]);

    // And a successful transaction afterwards still commits normally.
    transaction(writer, () => {
      writer.prepare('INSERT INTO beta_rate_limits (bucket, window_start, count) VALUES (?, ?, ?)').run('committed', 0, 1);
    });
    expect(rateLimitRows(holder)).toEqual(['committed']);
  });

  test('nested transactions join the outer transaction and roll back together', () => {
    transaction(writer, () => {
      writer.prepare('INSERT INTO beta_rate_limits (bucket, window_start, count) VALUES (?, ?, ?)').run('outer', 0, 1);
      transaction(writer, () => {
        writer.prepare('INSERT INTO beta_rate_limits (bucket, window_start, count) VALUES (?, ?, ?)').run('inner', 0, 1);
      });
    });
    expect(rateLimitRows(holder)).toEqual(['inner', 'outer']);

    expect(() =>
      transaction(writer, () => {
        writer.prepare('INSERT INTO beta_rate_limits (bucket, window_start, count) VALUES (?, ?, ?)').run('outer-2', 0, 1);
        transaction(writer, () => {
          writer.prepare('INSERT INTO beta_rate_limits (bucket, window_start, count) VALUES (?, ?, ?)').run('inner-2', 0, 1);
          throw new Error('inner failure');
        });
      })
    ).toThrow('inner failure');
    expect(writer.isTransaction).toBe(false);
    expect(rateLimitRows(holder)).toEqual(['inner', 'outer']);
  });

  test('a failing ROLLBACK does not hide the original error', () => {
    const original = new Error('original failure');
    expect(() =>
      transaction(writer, () => {
        // Ending the transaction early makes the wrapper's ROLLBACK fail.
        writer.exec('ROLLBACK');
        throw original;
      })
    ).toThrow(original);
    expect(writer.isTransaction).toBe(false);

    transaction(writer, () => {
      writer.prepare('INSERT INTO beta_rate_limits (bucket, window_start, count) VALUES (?, ?, ?)').run('after', 0, 1);
    });
    expect(rateLimitRows(holder)).toEqual(['after']);
  });
});
