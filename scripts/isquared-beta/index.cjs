const express = require('express');
const { loadAgreement } = require('./agreement.cjs');
const { loadConfig } = require('./config.cjs');
const { openDatabase } = require('./db.cjs');
const { createBetaRouter } = require('./routes.cjs');
const { createBetaService } = require('./service.cjs');
const { createSimulatorProvider } = require('./simulator-provider.cjs');
const { createSimulatorService } = require('./simulator-service.cjs');

/** Opens the database and builds the service; shared by the HTTP router and the admin CLI. */
function openBeta({ appRoot, env = process.env, now, config: provided } = {}) {
  const config = provided || loadConfig({ appRoot, env });
  if (!config.configured) {
    throw new Error(
      config.pepperTooShort
        ? 'ISQUARED_BETA_CODE_PEPPER must be at least 32 characters.'
        : 'ISQUARED_BETA_CODE_PEPPER is not set.'
    );
  }
  const agreement = loadAgreement({ version: config.agreementVersion });
  const { db, migration } = openDatabase(config.dbPath);
  const service = createBetaService({ db, config, agreement, now });
  service.registerAgreement();

  const provider = config.simulatorProviderInstance || createSimulatorProvider(config.simulator);
  const simulatorService = createSimulatorService({ db, config, provider, now });

  return { config, db, migration, service, simulatorService, provider, agreement, close: () => db.close() };
}

function failClosedRouter(message) {
  const router = express.Router();
  router.use((_req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(503).type('text/plain').send(message);
  });
  return router;
}

/**
 * Mounts nothing unless ISQUARED_BETA_CODE_PEPPER is set (the portfolio then behaves exactly as
 * before). If it is set but startup fails, /iSquared answers 503 instead of falling through to
 * any other handler, and the rest of the site keeps running.
 */
function createIsquaredBeta({ appRoot, env = process.env, logger = console, now } = {}) {
  const config = loadConfig({ appRoot, env });
  if (!config.configured) {
    logger.log(
      config.pepperTooShort
        ? '[isquared-beta] disabled: ISQUARED_BETA_CODE_PEPPER must be at least 32 characters.'
        : '[isquared-beta] disabled: ISQUARED_BETA_CODE_PEPPER is not set.'
    );
    return { enabled: false, config };
  }

  try {
    const beta = openBeta({ appRoot, env, now, config });
    const router = createBetaRouter({
      service: beta.service,
      simulatorService: beta.simulatorService,
      config,
      logger,
    });
    logger.log(
      `[isquared-beta] enabled: agreement v${beta.agreement.version}, db schema v${beta.migration.to}, ` +
        `admin dashboard ${config.admin.username && config.admin.passwordHash ? 'on' : 'off'}, ` +
        `simulator provider ${beta.provider.name}`
    );
    return {
      enabled: true,
      config,
      router,
      service: beta.service,
      simulatorService: beta.simulatorService,
      provider: beta.provider,
      close: beta.close,
    };
  } catch (error) {
    logger.error(`[isquared-beta] failed to start (${error.name}): ${error.message}`);
    return {
      enabled: true,
      config,
      router: failClosedRouter('The iSquared private beta is temporarily unavailable.'),
      failed: true,
    };
  }
}

module.exports = { createIsquaredBeta, openBeta };
