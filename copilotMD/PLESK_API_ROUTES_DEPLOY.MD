# Plesk Deployment Guide (Expo Router API Routes + Server Output)

This guide covers **start → finish** for deploying this Expo Router app (with API routes) to Plesk VPS.

## 🎯 CRITICAL: The server.js Fix

**The #1 issue that breaks deployment:** Using Expo Router syntax in Express route handler.

In `server.js`, the catch-all route MUST use Express syntax:

```javascript
// ❌ WRONG - Expo Router syntax doesn't work in Express
app.all('/{*all}', createRequestHandler({ build: SERVER_BUILD_DIR }));

// ✅ CORRECT - Express wildcard syntax
app.all('*', createRequestHandler({ build: SERVER_BUILD_DIR }));
```

Also remove `extensions: ['html']` from express.static options - it can interfere with routing.

**Complete working server.js:**
```javascript
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
```

## 0) Prereqs
- Expo Router with API routes (`+api.ts`).
- `app.json` web output set to `server`.
- **CRITICAL:** Correct `server.js` with `'*'` route pattern (see above).

## 1) Local build
1. Ensure web output is server:
	- `app.json` → `expo.web.output = "server"`.
2. Build web export:
	- `npx expo export -p web`
3. Confirm build artifacts exist:
	- `dist/client/` folder (contains assets, NO index.html - this is normal for server mode!)
	- `dist/server/` folder (contains server bundles)

**IMPORTANT:** Server output mode does NOT generate `index.html`. All routing is handled by `server.js`.

## 2) Files to upload to Plesk Application Root
Upload **these exact files** into the Application Root folder:
- `server.js`
- `package.json`
- `package-lock.json`
- `dist/` (entire folder)

Do **not** rely on older `server.js` or `package.json` in the home directory. Replace with the current ones.

## 3) Plesk Node.js Settings (Verified Working Config)
In Plesk → Domains → your domain → Node.js:

**Confirmed Working Settings:**
- **Node.js Version:** 23.11.1 (or latest available)
- **Package Manager:** npm
- **Document Root:** `/dist/client`
- **Application Root:** `/` (root of domain folder containing server.js and dist/)
- **Application Startup File:** `server.js`
- **Application Mode:** production
- **Custom Environment Variables:**
  - `NODE_ENV=production`

**IMPORTANT:** You don't need to change these settings after initial setup. Once configured:
1. Upload updated `server.js` (if you made changes)
2. Click **Restart App**

**Only run NPM install if:**

### If 404s on root `/` and `/api/content`:

**FIRST:** Check your `server.js` route pattern!
```javascript
// Must be this:
app.all('*', createRequestHandler({ build: SERVER_BUILD_DIR }));

// NOT this:
app.all('/{*all}', createRequestHandler({ build: SERVER_BUILD_DIR }));
```

**Other checks:**
1. Verify `dist/client/` folder exists (no index.html needed - server handles routing!)
2. Verify `dist/server/` folder exists with compiled bundles
3. Confirm Plesk Application Root points to folder containing `server.js` and `dist/`
4. Check Plesk **Logs** for startup errors (common: missing dependencies)
5. If logs show "Cannot find module", run **NPM install** in Plesk

### Test locally first:
```bash
# From project root
node server.js

# Then visit http://localhost:3000
# Both / and /api/content should work
```

If it works locally but not on Plesk, the issue is Plesk configuration, not your code
- `https://your-domain.com/api/content` should return JSON.

## 5) Troubleshooting 404
If you see `404 Not Found` for `/` and `/api/content`:
1. Verify `dist/client/index.html` exists in Plesk File Manager.
2. Verify `dist/server/` exists.
3. Confirm Plesk Application Root points to the folder that actually contains `server.js` and `dist/`.
4. Re-run **NPM install** in Plesk (must succeed).
5. Open Plesk **Logs** for the Node.js app and check for startup errors.

## 6) Notes about folders
- The `source` folder is not needed unless your **Application Root** points to it. If you are not using it, you can delete it.
- System files like `.node-version`, `.php-version`, `.php.ini`, `.imunify_*` should be kept.

## 7) Mobile-ready later
Nothing here blocks mobile. When ready, set Expo Router `origin` to your deployed URL so native builds can reach `/api/content`.

