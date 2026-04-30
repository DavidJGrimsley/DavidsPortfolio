import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

type RuntimeEnvironment = 'local' | 'test' | 'production';

let loadedKey: string | null = null;

function normalizeEnvironmentName(value: string | null | undefined): RuntimeEnvironment | null {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return null;
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

  return null;
}

function inferEnvironmentFromHost(hostname: string): RuntimeEnvironment | null {
  const normalized = hostname.toLowerCase();
  if (normalized === 'davidjgrimsley.com' || normalized === 'www.davidjgrimsley.com') {
    return 'production';
  }

  if (normalized.endsWith('.plesk.page')) {
    return 'test';
  }

  if (normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1') {
    return 'local';
  }

  return null;
}

function inferEnvironment(request?: Request): RuntimeEnvironment {
  const explicit = normalizeEnvironmentName(
    process.env.DJS_ENV ||
      process.env.DJSPORTFOLIO_ENV ||
      process.env.APP_ENV ||
      process.env.DEPLOY_ENV ||
      process.env.DEPLOY_BRANCH ||
      process.env.GITHUB_REF_NAME
  );
  if (explicit) {
    return explicit;
  }

  if (request) {
    try {
      const hostname = new URL(request.url).hostname;
      const hostEnvironment = inferEnvironmentFromHost(hostname);
      if (hostEnvironment) {
        return hostEnvironment;
      }
    } catch {
      // Fall through to local env loading.
    }
  }

  return 'local';
}

function findEnvFiles(cwd: string, environment: RuntimeEnvironment) {
  const preferred =
    environment === 'test'
      ? '.env.test'
      : environment === 'production'
        ? '.env.production'
        : '.env';
  const candidates =
    environment === 'local'
      ? [preferred]
      : fs.existsSync(path.resolve(cwd, preferred))
        ? [preferred]
        : ['.env', '.env.plesk'];

  return candidates
    .map((fileName) => ({
      fileName,
      filePath: path.resolve(cwd, fileName),
    }))
    .filter(({ filePath }) => {
      try {
        return fs.statSync(filePath).isFile();
      } catch {
        return false;
      }
    });
}

function applyEnvFile(filePath: string, override: boolean) {
  const parsed = dotenv.parse(fs.readFileSync(filePath, 'utf8'));
  Object.entries(parsed).forEach(([key, value]) => {
    if (override || typeof process.env[key] !== 'string' || process.env[key] === '') {
      process.env[key] = value;
    }
  });
}

export function loadServerRuntimeEnv(request?: Request) {
  const cwd = process.cwd();
  const environment = inferEnvironment(request);
  const key = `${cwd}:${environment}`;
  if (loadedKey === key) {
    return;
  }

  const envFiles = findEnvFiles(cwd, environment);
  const shouldOverrideInitialEnvFile = loadedKey !== null;
  envFiles.forEach(({ filePath }, index) => {
    applyEnvFile(filePath, shouldOverrideInitialEnvFile || index > 0);
  });

  loadedKey = key;
}
