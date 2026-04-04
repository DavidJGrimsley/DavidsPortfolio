#!/usr/bin/env node

const path = require('path');
const { Readable } = require('stream');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('expo-server/adapter/express');

const CLIENT_BUILD_DIR = path.join(process.cwd(), 'dist/client');
const SERVER_BUILD_DIR = path.join(process.cwd(), 'dist/server');

const app = express();
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const QUANTUM_REMOTE_ORIGIN = 'https://davidjgrimsley.com';

app.use(compression());
app.disable('x-powered-by');
app.use(morgan('tiny'));

function isLocalhostRequest(req) {
  const hostname = String(req.hostname || '').toLowerCase();
  return LOCAL_HOSTS.has(hostname);
}

async function proxyToQuantumOrigin(req, res, targetUrl) {
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

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(502).json({ error: 'Quantum proxy failed', message });
  }
}

app.use('/public-facing/api/quantum', async (req, res, next) => {
  if (!isLocalhostRequest(req)) {
    return next();
  }

  const targetUrl = `${QUANTUM_REMOTE_ORIGIN}${req.originalUrl}`;
  await proxyToQuantumOrigin(req, res, targetUrl);
});

app.use('/api/quantum-backend', async (req, res, next) => {
  if (!isLocalhostRequest(req)) {
    return next();
  }

  const suffix = req.originalUrl.slice('/api/quantum-backend'.length);
  let normalizedSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
  if (normalizedSuffix === '/v1' || normalizedSuffix.startsWith('/v1/')) {
    normalizedSuffix = normalizedSuffix.slice(3);
    if (!normalizedSuffix.startsWith('/')) {
      normalizedSuffix = `/${normalizedSuffix}`;
    }
  }
  const targetUrl = `${QUANTUM_REMOTE_ORIGIN}/public-facing/api/quantum/v1${normalizedSuffix}`;
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
