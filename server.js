#!/usr/bin/env node

const path = require('path');
const fs = require('node:fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('expo-server/adapter/express');
const { loadFirstEnvFile } = require('./scripts/env-loader.cjs');

const loadedEnv = loadFirstEnvFile({ cwd: __dirname, prefix: '[startup]' });

const CLIENT_BUILD_DIR = path.join(__dirname, 'dist/client');
const SERVER_BUILD_DIR = path.join(__dirname, 'dist/server');
const ROUTES_MANIFEST_PATH = path.join(SERVER_BUILD_DIR, '_expo/routes.json');
const BUILD_METADATA_PATH = path.join(CLIENT_BUILD_DIR, '__djsportfolio_build.json');
const SERVICE_WORKER_PATH = path.join(CLIENT_BUILD_DIR, 'sw.js');

const app = express();
const PUBLIC_RUNTIME_ENV_KEYS = [
  'EXPO_PUBLIC_PUBLIC_FACING_DEBUG',
  'EXPO_PUBLIC_QUANTUM_API_BASE_URL',
  'EXPO_PUBLIC_QUANTUM_API_KEY',
  'EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL',
  'EXPO_PUBLIC_SITE_ORIGIN',
  'EXPO_PUBLIC_SITE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_KEY',
  'EXPO_PUBLIC_SUPABASE_URL',
];
const HOSTED_ENV_FILES = new Set(['.env.test', '.env.production', '.env.plesk']);
const HOSTED_RUNTIME_REQUIRED_ENV_KEYS = [
  'EXPO_PUBLIC_SITE_ORIGIN',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_QUANTUM_API_BASE_URL',
  'QUANTUM_BACKEND_API_KEY',
];
const HOSTED_RUNTIME_DEPRECATED_ENV_KEYS = ['QUANTUM_UPSTREAM_URL'];
const ENABLE_LOCAL_QUANTUM_PROXY = process.env.ENABLE_LOCAL_QUANTUM_PROXY !== 'false';
const DEFAULT_QUANTUM_UPSTREAM_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';
const DISALLOWED_QUANTUM_BACKEND_PROXY_PATHS = ['/keys', '/ibm/profiles'];
const STAGING_HOST_CLEAR_SITE_DATA_MARKERS = ['quizzical-hofstadter.', '.plesk.page'];

function buildPublicRuntimeConfig() {
  return PUBLIC_RUNTIME_ENV_KEYS.reduce((config, key) => {
    if (typeof process.env[key] === 'string') {
      config[key] = process.env[key];
    }

    return config;
  }, {});
}

function parseSiteOriginOrThrow(rawSiteOrigin) {
  let parsed;
  try {
    parsed = new URL(rawSiteOrigin);
  } catch {
    throw new Error('[startup] EXPO_PUBLIC_SITE_ORIGIN must be a valid absolute URL.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('[startup] EXPO_PUBLIC_SITE_ORIGIN must use http:// or https://.');
  }

  const hasNonRootPath = parsed.pathname !== '/' && parsed.pathname !== '';
  if (hasNonRootPath || parsed.search || parsed.hash) {
    throw new Error(
      '[startup] EXPO_PUBLIC_SITE_ORIGIN must be an origin without path, query, or hash (for example: "https://example.com").'
    );
  }

  return parsed;
}

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || '').toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1' || normalized === '[::1]';
}

function shouldClearStagingSiteData(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }

  const host = String(req.headers.host || '').split(',')[0].trim().toLowerCase();
  if (!STAGING_HOST_CLEAR_SITE_DATA_MARKERS.every((marker) => host.includes(marker))) {
    return false;
  }

  const accept = String(req.headers.accept || '');
  return accept.includes('text/html');
}

function assertHostedRuntimeEnvHealth() {
  if (!HOSTED_ENV_FILES.has(loadedEnv.sourceFile)) {
    return;
  }

  const missingKeys = HOSTED_RUNTIME_REQUIRED_ENV_KEYS.filter(
    (key) => !String(process.env[key] || '').trim()
  );
  if (missingKeys.length > 0) {
    console.warn(
      `[startup] ${loadedEnv.sourceFile} is missing environment variables: ${missingKeys.join(', ')}`
    );
  }

  const deprecatedKeys = HOSTED_RUNTIME_DEPRECATED_ENV_KEYS.filter((key) =>
    Boolean(String(process.env[key] || '').trim())
  );
  if (deprecatedKeys.length > 0) {
    if (loadedEnv.sourceFile === '.env.plesk') {
      console.warn(
        `[startup] Ignoring deprecated legacy .env.plesk variables: ${deprecatedKeys.join(', ')}`
      );
    } else {
      console.warn(
        `[startup] Hosted env contains deprecated environment variables that are ignored: ${deprecatedKeys.join(', ')}`
      );
    }
  }

  const rawSiteOrigin = String(process.env.EXPO_PUBLIC_SITE_ORIGIN || '').trim();
  if (rawSiteOrigin) {
    try {
      const parsedSiteOrigin = parseSiteOriginOrThrow(rawSiteOrigin);
      if (isLoopbackHostname(parsedSiteOrigin.hostname)) {
        console.warn(
          `[startup] ${loadedEnv.sourceFile} uses a loopback EXPO_PUBLIC_SITE_ORIGIN; browser runtime origin will be used for hosted redirects.`
        );
      }
    } catch (error) {
      console.warn(error instanceof Error ? error.message : String(error));
    }
  }

  console.log(`[startup] Hosted env ${loadedEnv.sourceFile} finished runtime checks.`);
}

function normalizeQuantumUpstreamBaseUrl() {
  const raw = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL
    ? String(process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL).trim()
    : '';

  if (raw.length > 0) {
    const trimmed = raw.replace(/\/+$/, '');
    return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
  }

  return process.env.NODE_ENV === 'production' ? null : DEFAULT_QUANTUM_UPSTREAM_BASE_URL_LOCAL;
}

const QUANTUM_UPSTREAM_BASE_URL = normalizeQuantumUpstreamBaseUrl();
app.use(compression());
app.disable('x-powered-by');
app.use(morgan('tiny'));
assertHostedRuntimeEnvHealth();

app.use((req, res, next) => {
  if (shouldClearStagingSiteData(req)) {
    res.setHeader('Clear-Site-Data', '"cache", "storage"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }

  next();
});

function assertBuildArtifact(filePath, description) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `${description} not found at ${filePath}. ` +
        'Run "npm run build:web:deploy" first. dist artifacts are generated at deploy time.'
    );
  }
}

assertBuildArtifact(CLIENT_BUILD_DIR, 'Client build directory');
assertBuildArtifact(SERVER_BUILD_DIR, 'Server build directory');
assertBuildArtifact(ROUTES_MANIFEST_PATH, 'Generated Expo routes manifest');
assertBuildArtifact(BUILD_METADATA_PATH, 'Build metadata');

function normalizeRemoteAddress(address) {
  const normalized = String(address || '').toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    return normalized.slice(7);
  }
  return normalized;
}

function isLoopbackAddress(address) {
  const normalized = normalizeRemoteAddress(address);
  return normalized === '::1' || normalized === '127.0.0.1' || normalized.startsWith('127.');
}

function isLocalhostRequest(req) {
  if (!ENABLE_LOCAL_QUANTUM_PROXY) {
    return false;
  }

  const remoteAddress = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : req.ip;
  return isLoopbackAddress(remoteAddress);
}

function getHeaderValue(value) {
  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  return String(value);
}

function getFirstHeaderValue(value) {
  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.find(Boolean) || '';
  }

  return String(value);
}

function buildQuantumProxyHeaders(req, options = {}) {
  const headers = new Headers();
  const accept = getHeaderValue(req.headers.accept);
  const contentType = getFirstHeaderValue(req.headers['content-type']);
  const authorization = getFirstHeaderValue(req.headers.authorization);
  const apiKey = options.apiKey ?? getFirstHeaderValue(req.headers['x-api-key']);
  const requestId = getFirstHeaderValue(req.headers['x-request-id']);

  headers.set('Accept', accept || 'application/json');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (authorization) {
    headers.set('Authorization', authorization);
  }

  if (apiKey) {
    headers.set('X-API-Key', apiKey);
  }

  if (requestId) {
    headers.set('X-Request-ID', requestId);
  }

  return headers;
}

async function proxyToQuantumOrigin(req, res, targetUrl, options = {}) {
  const abortController = new AbortController();
  const abortUpstream = () => {
    abortController.abort();
  };

  req.on('aborted', abortUpstream);
  res.on('close', abortUpstream);

  try {
    const headers = buildQuantumProxyHeaders(req, options);

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? 'half' : undefined,
      redirect: 'manual',
      signal: abortController.signal,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'connection') return;
      res.setHeader(key, value);
    });

    if (!response.body) {
      res.end();
      return;
    }

    await pipeline(Readable.fromWeb(response.body), res);
  } catch (error) {
    if (abortController.signal.aborted || req.destroyed) {
      if (!res.writableEnded) {
        res.end();
      }
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Quantum proxy failed', message });
      return;
    }

    if (!res.writableEnded) {
      res.destroy(error instanceof Error ? error : undefined);
    }
  } finally {
    req.off('aborted', abortUpstream);
    res.off('close', abortUpstream);
  }
}

function isDisallowedQuantumBackendProxyPath(pathname) {
  return DISALLOWED_QUANTUM_BACKEND_PROXY_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isTruthyQueryValue(value) {
  if (!value) {
    return false;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function isIbmHardwareBackendsProxyPath(pathname, searchParams) {
  if (pathname !== '/list_backends') {
    return false;
  }

  const provider = String(searchParams.get('provider') || '').trim().toLowerCase();
  if (provider !== 'ibm') {
    return false;
  }

  return !isTruthyQueryValue(searchParams.get('simulator_only'));
}

function isIbmHardwareBackendProxyPath(pathname, searchParams) {
  return (
    pathname === '/jobs/circuits' ||
    pathname.startsWith('/jobs/') ||
    isIbmHardwareBackendsProxyPath(pathname, searchParams)
  );
}

function buildSafeQuantumBackendProxySearch(pathname, searchParams) {
  const query = new URLSearchParams(searchParams);

  if (pathname === '/list_backends') {
    const provider = String(query.get('provider') || '').trim().toLowerCase();
    const simulatorOnly = query.get('simulator_only');

    if (!provider) {
      query.set('provider', 'aer');
    }

    if (!simulatorOnly && query.get('provider') !== 'ibm') {
      query.set('simulator_only', 'true');
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

app.use('/api/quantum-backend', async (req, res, next) => {
  if (!isLocalhostRequest(req)) {
    return next();
  }

  if (!QUANTUM_UPSTREAM_BASE_URL) {
    return next();
  }

  const requestUrl = new URL(req.originalUrl, 'http://localhost');
  const suffix = requestUrl.pathname.slice('/api/quantum-backend'.length);
  let normalizedSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
  if (normalizedSuffix === '/v1' || normalizedSuffix.startsWith('/v1/')) {
    normalizedSuffix = normalizedSuffix.slice(3);
    if (normalizedSuffix.length > 0 && !normalizedSuffix.startsWith('/')) {
      normalizedSuffix = `/${normalizedSuffix}`;
    }
  }

  if (isDisallowedQuantumBackendProxyPath(normalizedSuffix)) {
    res.status(403).json({
      error: 'proxy_path_disallowed',
      message:
        'This route is intentionally blocked on quantum-backend. Call the upstream endpoint directly with user JWT.',
    });
    return;
  }

  const requiresUserApiKey = isIbmHardwareBackendProxyPath(normalizedSuffix, requestUrl.searchParams);
  const userApiKey = getFirstHeaderValue(req.headers['x-api-key']).trim();
  const backendApiKey = process.env.QUANTUM_BACKEND_API_KEY?.trim() ?? '';
  const apiKey = requiresUserApiKey ? userApiKey : backendApiKey;

  if (requiresUserApiKey && !apiKey) {
    res.status(401).json({
      error: 'user_api_key_required',
      message: 'IBM hardware routes require your own Quantum API key in X-API-Key.',
    });
    return;
  }

  if (!requiresUserApiKey && !apiKey) {
    res.status(500).json({
      error: 'proxy_not_configured',
      message: 'QUANTUM_BACKEND_API_KEY is missing on the server.',
    });
    return;
  }

  const targetUrl = `${QUANTUM_UPSTREAM_BASE_URL}${normalizedSuffix}${buildSafeQuantumBackendProxySearch(
    normalizedSuffix,
    requestUrl.searchParams
  )}`;
  await proxyToQuantumOrigin(req, res, targetUrl, { apiKey });
});

app.get('/__djsportfolio_runtime_config__', (_req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(
    `window.__DJS_RUNTIME_CONFIG__ = Object.freeze(${JSON.stringify(buildPublicRuntimeConfig())});\n`
  );
});

app.get('/__djsportfolio_build.json', (_req, res) => {
  res.type('application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(fs.readFileSync(BUILD_METADATA_PATH, 'utf8'));
});

app.get('/sw.js', (_req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(SERVICE_WORKER_PATH);
});

// Serve static files from client build
app.use(express.static(CLIENT_BUILD_DIR, { maxAge: '1h' }));

// Handle all remaining requests through Expo Router
app.all('/{*all}', createRequestHandler({
  build: SERVER_BUILD_DIR,
}));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`DJsPortfolio server listening on http://localhost:${port}`);
});
