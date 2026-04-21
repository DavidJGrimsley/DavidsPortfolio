#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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
const DEFAULT_QUANTUM_UPSTREAM_BASE_URL = 'https://davidjgrimsley.com/public-facing/api/quantum/v1';
const DISALLOWED_QUANTUM_BACKEND_PROXY_PATHS = ['/keys', '/ibm/profiles'];

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

  return DEFAULT_QUANTUM_UPSTREAM_BASE_URL;
}

const QUANTUM_UPSTREAM_BASE_URL = normalizeQuantumUpstreamBaseUrl();
const QUANTUM_UPSTREAM_HOST = (() => {
  if (!QUANTUM_UPSTREAM_BASE_URL) {
    return '';
  }

  try {
    return new URL(QUANTUM_UPSTREAM_BASE_URL).host.toLowerCase();
  } catch {
    return '';
  }
})();

app.use(compression());
app.disable('x-powered-by');
app.use(morgan('tiny'));
assertHostedRuntimeEnvHealth();

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

function normalizeRequestHost(rawHost) {
  const firstHost = String(rawHost || '').split(',')[0].trim().toLowerCase();
  if (!firstHost) {
    return '';
  }

  try {
    return new URL(`http://${firstHost}`).host.toLowerCase();
  } catch {
    return firstHost;
  }
}

function getRequestHost(req) {
  return normalizeRequestHost(req.headers['x-forwarded-host'] || req.headers.host);
}

function getHostnameFromHost(host) {
  try {
    return new URL(`http://${host}`).hostname.toLowerCase();
  } catch {
    return String(host || '').toLowerCase();
  }
}

function isProductionQuantumHost(host) {
  const hostname = getHostnameFromHost(host);
  return hostname === 'davidjgrimsley.com' || hostname === 'www.davidjgrimsley.com';
}

function shouldProxyPublicQuantumRequest(req) {
  if (!ENABLE_LOCAL_QUANTUM_PROXY) {
    return false;
  }

  const requestHost = getRequestHost(req);
  if (isProductionQuantumHost(requestHost)) {
    return false;
  }

  if (!requestHost || !QUANTUM_UPSTREAM_HOST) {
    return isLocalhostRequest(req);
  }

  return requestHost !== QUANTUM_UPSTREAM_HOST;
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

app.use('/public-facing/api/quantum/v1', async (req, res, next) => {
  if (!shouldProxyPublicQuantumRequest(req)) {
    if (!isProductionQuantumHost(getRequestHost(req))) {
      res.status(502).json({
        error: 'quantum_public_proxy_not_enabled',
        message:
          'The public Quantum API proxy did not run for this host. Check ENABLE_LOCAL_QUANTUM_PROXY and EXPO_PUBLIC_QUANTUM_API_BASE_URL.',
      });
      return;
    }

    return next();
  }

  if (!QUANTUM_UPSTREAM_BASE_URL) {
    res.status(500).json({
      error: 'quantum_public_proxy_not_configured',
      message: 'EXPO_PUBLIC_QUANTUM_API_BASE_URL is missing on the server.',
    });
    return;
  }

  const requestUrl = new URL(req.originalUrl, 'http://localhost');
  const publicPrefix = '/public-facing/api/quantum/v1';
  const suffix = requestUrl.pathname.startsWith(publicPrefix)
    ? requestUrl.pathname.slice(publicPrefix.length)
    : requestUrl.pathname;
  const normalizedSuffix = suffix.length > 0 ? suffix : '';
  const targetUrl = `${QUANTUM_UPSTREAM_BASE_URL}${normalizedSuffix}${requestUrl.search}`;
  await proxyToQuantumOrigin(req, res, targetUrl);
});

app.use('/api/quantum-backend', async (req, res, next) => {
  if (!isLocalhostRequest(req)) {
    return next();
  }

  if (!QUANTUM_UPSTREAM_BASE_URL) {
    return next();
  }

  const backendApiKey = process.env.QUANTUM_BACKEND_API_KEY?.trim();
  if (!backendApiKey) {
    res.status(500).json({
      error: 'proxy_not_configured',
      message: 'QUANTUM_BACKEND_API_KEY is missing on the server.',
    });
    return;
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

  const targetUrl = `${QUANTUM_UPSTREAM_BASE_URL}${normalizedSuffix}${requestUrl.search}`;
  await proxyToQuantumOrigin(req, res, targetUrl, { apiKey: backendApiKey });
});

app.get('/__djsportfolio_runtime_config__', (_req, res) => {
  res.type('application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(
    `window.__DJS_RUNTIME_CONFIG__ = Object.freeze(${JSON.stringify(buildPublicRuntimeConfig())});\n`
  );
});

// Serve static files from client build
app.use(express.static(CLIENT_BUILD_DIR, { maxAge: '1h' }));

// Handle all remaining requests through Expo Router
app.all('/{*all}', createRequestHandler({
  build: SERVER_BUILD_DIR,
}));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
