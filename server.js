#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const dotenv = require('dotenv');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('expo-server/adapter/express');

const PLESK_ENV_PATH = path.join(process.cwd(), '.env.plesk');

if (fs.existsSync(PLESK_ENV_PATH)) {
  dotenv.config({ path: PLESK_ENV_PATH });
}

const CLIENT_BUILD_DIR = path.join(process.cwd(), 'dist/client');
const SERVER_BUILD_DIR = path.join(process.cwd(), 'dist/server');

const app = express();
const ENABLE_LOCAL_QUANTUM_PROXY = process.env.ENABLE_LOCAL_QUANTUM_PROXY !== 'false';
const DEFAULT_QUANTUM_UPSTREAM_BASE_URL_LOCAL = 'http://127.0.0.1:8000/v1';

function normalizeQuantumUpstreamBaseUrl() {
  const raw = process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL
    ? String(process.env.EXPO_PUBLIC_QUANTUM_API_BASE_URL).trim()
    : '';

  if (raw.length > 0) {
    const trimmed = raw.replace(/\/+$/, '');
    return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return DEFAULT_QUANTUM_UPSTREAM_BASE_URL_LOCAL;
}

const QUANTUM_UPSTREAM_BASE_URL = normalizeQuantumUpstreamBaseUrl();

app.use(compression());
app.disable('x-powered-by');
app.use(morgan('tiny'));

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

async function proxyToQuantumOrigin(req, res, targetUrl) {
  const abortController = new AbortController();
  const abortUpstream = () => {
    abortController.abort();
  };

  req.on('aborted', abortUpstream);
  res.on('close', abortUpstream);

  try {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!value) return;
      const lower = key.toLowerCase();
      if (lower === 'host' || lower === 'connection' || lower === 'content-length') return;
      if (Array.isArray(value)) {
        value.forEach((item) => headers.append(key, item));
      } else {
        headers.set(key, String(value));
      }
    });

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

app.use('/public-facing/api/quantum/v1', async (req, res, next) => {
  if (!isLocalhostRequest(req)) {
    return next();
  }

  if (!QUANTUM_UPSTREAM_BASE_URL) {
    return next();
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

  const requestUrl = new URL(req.originalUrl, 'http://localhost');
  const suffix = requestUrl.pathname.slice('/api/quantum-backend'.length);
  let normalizedSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
  if (normalizedSuffix === '/v1' || normalizedSuffix.startsWith('/v1/')) {
    normalizedSuffix = normalizedSuffix.slice(3);
    if (normalizedSuffix.length > 0 && !normalizedSuffix.startsWith('/')) {
      normalizedSuffix = `/${normalizedSuffix}`;
    }
  }
  const targetUrl = `${QUANTUM_UPSTREAM_BASE_URL}${normalizedSuffix}${requestUrl.search}`;
  await proxyToQuantumOrigin(req, res, targetUrl);
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
