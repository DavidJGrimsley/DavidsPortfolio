/**
 * Fixed-window failure counters stored in SQLite, so limits survive restarts and are shared
 * by every Node process that opens the same database.
 */
function createRateLimiter({ db, now = () => Date.now() }) {
  const select = db.prepare('SELECT window_start, count FROM beta_rate_limits WHERE bucket = ?');
  const upsert = db.prepare(`
    INSERT INTO beta_rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
    ON CONFLICT(bucket) DO UPDATE SET
      count = CASE WHEN window_start + ? <= ? THEN 1 ELSE count + 1 END,
      window_start = CASE WHEN window_start + ? <= ? THEN ? ELSE window_start END
  `);
  const prune = db.prepare('DELETE FROM beta_rate_limits WHERE window_start < ?');
  const clear = db.prepare('DELETE FROM beta_rate_limits');

  /** Returns { blocked, retryAfterSeconds } for the first bucket that has hit its limit. */
  function check(rules) {
    const current = now();
    for (const { bucket, limit, windowMs } of rules) {
      const row = select.get(bucket);
      if (row && row.window_start + windowMs > current && row.count >= limit) {
        return {
          blocked: true,
          retryAfterSeconds: Math.max(1, Math.ceil((row.window_start + windowMs - current) / 1000)),
        };
      }
    }
    return { blocked: false, retryAfterSeconds: 0 };
  }

  function recordFailure(rules) {
    const current = now();
    for (const { bucket, windowMs } of rules) {
      upsert.run(bucket, current, windowMs, current, windowMs, current, current);
    }
    prune.run(current - 24 * 3600_000);
  }

  function reset() {
    clear.run();
  }

  return { check, recordFailure, reset };
}

module.exports = { createRateLimiter };
