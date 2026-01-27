#!/usr/bin/env node

const path = require('path');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('expo-server/adapter/express');

const CLIENT_BUILD_DIR = path.join(process.cwd(), 'dist/client');
const SERVER_BUILD_DIR = path.join(process.cwd(), 'dist/server');

const app = express();

app.use(compression());
app.disable('x-powered-by');
app.use(morgan('tiny'));

// Serve static files from client build
app.use(express.static(CLIENT_BUILD_DIR, { maxAge: '1h' }));

// Handle all remaining requests through Expo Router
app.all('*', createRequestHandler({
  build: SERVER_BUILD_DIR,
}));

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
