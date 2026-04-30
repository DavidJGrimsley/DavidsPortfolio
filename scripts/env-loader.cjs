const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const dotenv = require('dotenv');

const LOCAL_ENV_FILE = '.env';
const TEST_ENV_FILE = '.env.test';
const PRODUCTION_ENV_FILE = '.env.production';
const LEGACY_PLESK_ENV_FILE = '.env.plesk';
const DEFAULT_ENV_FILE_CANDIDATES = [
  LOCAL_ENV_FILE,
  TEST_ENV_FILE,
  PRODUCTION_ENV_FILE,
  LEGACY_PLESK_ENV_FILE,
];

function hasEnvFile(cwd, fileName) {
  const filePath = path.resolve(cwd, fileName);
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function readGitBranch(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function normalizeEnvironmentName(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return '';
  }

  if (normalized === 'prod' || normalized === 'production' || normalized === 'main') {
    return 'production';
  }

  if (normalized === 'stage' || normalized === 'staging' || normalized === 'test') {
    return 'test';
  }

  if (normalized === 'dev' || normalized === 'development' || normalized === 'local') {
    return 'local';
  }

  return normalized;
}

function inferEnvironmentName(cwd) {
  const explicit =
    process.env.DJS_ENV ||
    process.env.DJSPORTFOLIO_ENV ||
    process.env.APP_ENV ||
    process.env.DEPLOY_ENV ||
    '';
  const explicitName = normalizeEnvironmentName(explicit);
  if (explicitName) {
    return explicitName;
  }

  const branch =
    process.env.DEPLOY_BRANCH ||
    process.env.GITHUB_REF_NAME ||
    readGitBranch(cwd);
  return normalizeEnvironmentName(branch);
}

function resolveEnvFileCandidates(options = {}) {
  if (Array.isArray(options.candidates) && options.candidates.length > 0) {
    return options.candidates;
  }

  const cwd = options.cwd || process.cwd();
  const environmentName = normalizeEnvironmentName(options.environment) || inferEnvironmentName(cwd);

  if (environmentName === 'test') {
    return hasEnvFile(cwd, TEST_ENV_FILE)
      ? [TEST_ENV_FILE]
      : [LOCAL_ENV_FILE, LEGACY_PLESK_ENV_FILE];
  }

  if (environmentName === 'production') {
    return hasEnvFile(cwd, PRODUCTION_ENV_FILE)
      ? [PRODUCTION_ENV_FILE]
      : [LOCAL_ENV_FILE, LEGACY_PLESK_ENV_FILE];
  }

  if (environmentName === 'local') {
    return [LOCAL_ENV_FILE];
  }

  return [LOCAL_ENV_FILE];
}

function findFirstEnvFile(options = {}) {
  const found = findEnvFiles(options);
  return {
    candidates: found.candidates,
    sourceFile: found.sourceFiles[0] || null,
    sourcePath: found.sourcePaths[0] || null,
  };
}

function findEnvFiles(options = {}) {
  const cwd = options.cwd || process.cwd();
  const candidates = resolveEnvFileCandidates(options);
  const sourceFiles = [];
  const sourcePaths = [];

  for (const fileName of candidates) {
    const filePath = path.resolve(cwd, fileName);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      sourceFiles.push(fileName);
      sourcePaths.push(filePath);
    }
  }

  return {
    candidates,
    sourceFile: sourceFiles[sourceFiles.length - 1] || null,
    sourceFiles,
    sourcePath: sourcePaths[sourcePaths.length - 1] || null,
    sourcePaths,
  };
}

function readFirstEnvFile(options = {}) {
  const found = findEnvFiles(options);
  if (found.sourcePaths.length === 0) {
    return { ...found, envFromFile: {} };
  }

  const envFromFile = found.sourcePaths.reduce((merged, sourcePath) => {
    return {
      ...merged,
      ...dotenv.parse(fs.readFileSync(sourcePath, 'utf8')),
    };
  }, {});

  return { ...found, envFromFile };
}

function loadFirstEnvFile(options = {}) {
  const {
    override = false,
    prefix = '[env]',
    logger = console.log,
    silent = false,
  } = options;
  const found = findEnvFiles(options);

  if (found.sourcePaths.length === 0) {
    if (!silent && typeof logger === 'function') {
      logger(`${prefix} No env file found (checked ${found.candidates.join(', ')}).`);
    }
    return { ...found, envFromFile: {} };
  }

  const parsedFiles = found.sourcePaths.map((sourcePath, index) => {
    const result = dotenv.config({
      path: sourcePath,
      override: index > 0 ? true : override,
      quiet: true,
    });
    if (result.error) {
      throw result.error;
    }

    return result.parsed || {};
  });

  if (!silent && typeof logger === 'function') {
    logger(`${prefix} Loaded ${found.sourceFiles.join(', ')}`);
  }

  return {
    ...found,
    envFromFile: Object.assign({}, ...parsedFiles),
  };
}

module.exports = {
  DEFAULT_ENV_FILE_CANDIDATES,
  findEnvFiles,
  findFirstEnvFile,
  inferEnvironmentName,
  loadFirstEnvFile,
  readFirstEnvFile,
  resolveEnvFileCandidates,
};
