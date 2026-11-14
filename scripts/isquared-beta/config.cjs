const path = require('node:path');

const MOUNT_PATH = '/iSquared';
const MIN_PEPPER_LENGTH = 32;

function readInt(value, fallback, { min, max }) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

/**
 * Reads the private-beta settings from the environment. Nothing here has a secret default:
 * without ISQUARED_BETA_CODE_PEPPER the feature stays disabled and /iSquared is not served.
 */
function loadConfig({ appRoot, env = process.env } = {}) {
  if (!appRoot) {
    throw new Error('loadConfig requires appRoot');
  }

  const pepper = String(env.ISQUARED_BETA_CODE_PEPPER || '');
  const baseDir = env.ISQUARED_BETA_DIR
    ? path.resolve(env.ISQUARED_BETA_DIR)
    : path.join(appRoot, 'iSquared-beta');

  return {
    mountPath: MOUNT_PATH,
    pepper,
    configured: pepper.length >= MIN_PEPPER_LENGTH,
    pepperTooShort: pepper.length > 0 && pepper.length < MIN_PEPPER_LENGTH,
    baseDir,
    dbPath: env.ISQUARED_BETA_DB_PATH
      ? (env.ISQUARED_BETA_DB_PATH === ':memory:' ? ':memory:' : path.resolve(env.ISQUARED_BETA_DB_PATH))
      : path.join(baseDir, 'data', 'beta.sqlite'),
    webDir: env.ISQUARED_BETA_WEB_DIR
      ? path.resolve(env.ISQUARED_BETA_WEB_DIR)
      : path.join(baseDir, 'web'),
    agreementVersion: String(env.ISQUARED_AGREEMENT_VERSION || '').trim() || null,
    // Cookies are Secure (and __Secure- prefixed) whenever the server runs in production.
    secureCookies:
      env.ISQUARED_BETA_INSECURE_COOKIES === '1' ? false : env.NODE_ENV === 'production',
    sessionTtlMs: readInt(env.ISQUARED_SESSION_TTL_HOURS, 12, { min: 1, max: 168 }) * 3600_000,
    idleTimeoutMs: readInt(env.ISQUARED_SESSION_IDLE_MINUTES, 240, { min: 5, max: 10_080 }) * 60_000,
    visitGapMs: readInt(env.ISQUARED_VISIT_GAP_MINUTES, 30, { min: 1, max: 1440 }) * 60_000,
    adminSessionTtlMs: readInt(env.ISQUARED_ADMIN_SESSION_HOURS, 8, { min: 1, max: 72 }) * 3600_000,
    // How many reverse proxies append to X-Forwarded-For in front of Node (nginx only = 1).
    trustedProxyHops: readInt(env.ISQUARED_TRUSTED_PROXY_HOPS, 1, { min: 0, max: 5 }),
    siteOrigin: String(env.EXPO_PUBLIC_SITE_ORIGIN || '').trim() || null,
    admin: {
      username: String(env.ISQUARED_ADMIN_USERNAME || '').trim(),
      passwordHash: String(env.ISQUARED_ADMIN_PASSWORD_HASH || '').trim(),
    },
    simulator: {
      provider: String(env.ISQUARED_SIMULATOR_PROVIDER || 'disabled').trim().toLowerCase(),
      monthlyBudgetMinutes: readInt(env.ISQUARED_SIMULATOR_MONTHLY_BUDGET_MINUTES, 60, { min: 1, max: 10_000 }),
      // Absolute 5 minute maximum enforced even if env/config asks longer
      maxSessionMinutes: Math.min(5, readInt(env.ISQUARED_SIMULATOR_MAX_SESSION_MINUTES, 5, { min: 1, max: 60 })),
      allowedOrigin: String(env.ISQUARED_SIMULATOR_ALLOWED_ORIGIN || env.EXPO_PUBLIC_SITE_ORIGIN || '').trim() || null,
      allowedOrigins: env.ISQUARED_SIMULATOR_ALLOWED_ORIGINS
        ? env.ISQUARED_SIMULATOR_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      projectId: String(env.EXPO_PROJECT_ID || '00ff11f9-a771-44bb-a352-ba497bfea0c7').trim(),
      buildId: env.EXPO_BUILD_ID ? String(env.EXPO_BUILD_ID).trim() : null,
      applicationArchiveUrl: env.EXPO_APPLICATION_ARCHIVE_URL ? String(env.EXPO_APPLICATION_ARCHIVE_URL).trim() : null,
    },
    limits: {
      ipFailures: readInt(env.ISQUARED_RATE_IP_FAILURES, 8, { min: 1, max: 1000 }),
      ipWindowMs: 15 * 60_000,
      globalFailures: readInt(env.ISQUARED_RATE_GLOBAL_FAILURES, 100, { min: 1, max: 100_000 }),
      globalWindowMs: 60 * 60_000,
      messageIpAttempts: readInt(env.ISQUARED_MESSAGE_IP_ATTEMPTS, 20, { min: 1, max: 1000 }),
      messageGlobalAttempts: readInt(env.ISQUARED_MESSAGE_GLOBAL_ATTEMPTS, 300, { min: 1, max: 100_000 }),
      adminIpFailures: 5,
      adminGlobalFailures: 30,
    },
  };
}

module.exports = { MIN_PEPPER_LENGTH, MOUNT_PATH, loadConfig };
