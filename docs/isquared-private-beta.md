# iSquared Private Beta: Operations, Administration, and Deployment Guide

This guide documents the architecture, setup, administration, and deployment of the private beta access system for the **iSquared** browser prototype hosted at `https://davidjgrimsley.com/iSquared/`.

---

## 1. Architecture Overview

The system spans two repositories:

1. **Portfolio Repository (`DavidsPortfolio`)**:
   - Express 5 server (`server.js`) serving the production site, Quantum API proxy, MCP endpoints, and Expo Router SSR.
   - Manages private beta authentication, session cookies, rate limiting, confidentiality terms, usage tracking, and the administrative dashboard.
   - Uses Node.js built-in `node:sqlite` (zero native module dependencies, Node >= 22.13).
   - Serves the built iSquared prototype files only to authorized, active sessions.
   - Stays completely dormant (and transparent to the rest of the site) unless `ISQUARED_BETA_CODE_PEPPER` is set.

2. **iSquared Repository (`mrdj-dev-suite` / `apps/i2-ide-prototype`)**:
   - Independent Vite + React static prototype.
   - Built with base path `/iSquared/` using `pnpm build:hosted:archive` (or `pnpm build:hosted` from `package.json`, running `scripts/build-hosted.mjs`).
   - All public asset paths use the `assetUrl()` helper to resolve correctly under `/iSquared/`.
   - Produces static files (`dist-hosted/web/`), verified by static analysis against localhost URLs, leaked secrets, or missing base prefixes.
   - Contains no access control secrets, tokens, or auth logic.

```
Visitor -> https://davidjgrimsley.com/iSquared/
              |
              v (Plesk Nginx / Apache / Passenger -> Node.js Express server)
        [Session Cookie Valid?]
         /               \
       YES                NO
        |                  \
        v                   v
Serve Protected        Display Access Code Login Screen
iSquared Prototype     (Requires Code + Confidentiality Agreement)
(index.html / assets)       |
                       Validate Code (HMAC-SHA256 lookup in SQLite)
                            |
                       Issue HttpOnly Session Cookie -> Redirect
```

> [!IMPORTANT]
> The exact reverse proxy topology on the live VPS (whether Nginx terminates directly into Passenger or proxies via Apache) must be verified against actual server configuration. Never assume routing behavior or proxy hop counts without live verification.

---

## 2. Directory Layout on VPS

The prototype files and database are placed in a private directory **outside** the public document root:

```text
/var/www/vhosts/davidjgrimsley.com/
├── httpdocs/                          <-- Portfolio app root
│   ├── server.js                      <-- Node startup script
│   ├── .env                           <-- Server environment variables
│   └── dist/
│       └── client/                    <-- Public document root (portfolio static files)
│
└── iSquared-beta/                     <-- Private deployment directory (outside document root)
    ├── web/                           <-- Static files extracted from iSquared archive
    │   ├── index.html
    │   ├── assets/
    │   └── robots.txt
    ├── manifest.json                  <-- Build verification metadata
    └── data/
        ├── beta.sqlite                <-- SQLite database (mode 0600)
        ├── beta.sqlite-wal
        └── beta.sqlite-shm
```

Default directory: `<appRoot>/iSquared-beta` or explicitly configured via `ISQUARED_BETA_DIR`.

---

## 3. Environment Variables

Configure these in the production `.env` (or Plesk Node.js environment settings):

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `ISQUARED_BETA_CODE_PEPPER` | **Yes** | *None* | 32+ character random secret used as the HMAC key for hashing access codes. Feature remains disabled if unset. |
| `ISQUARED_ADMIN_USERNAME` | No | *None* | Username for the `/iSquared/admin/` dashboard. |
| `ISQUARED_ADMIN_PASSWORD_HASH` | No | *None* | Scrypt hash of the admin password. Generated using CLI. |
| `ISQUARED_BETA_DIR` | No | `<appRoot>/iSquared-beta` | Path to the private beta directory holding `web/` and `data/`. |
| `ISQUARED_BETA_DB_PATH` | No | `<baseDir>/data/beta.sqlite` | Explicit database file path. |
| `ISQUARED_BETA_WEB_DIR` | No | `<baseDir>/web` | Explicit path to built prototype web files. |
| `ISQUARED_AGREEMENT_VERSION` | No | *Highest found* | Pin a specific confidentiality agreement version (e.g. `1`). |
| `ISQUARED_SESSION_TTL_HOURS` | No | `12` | Absolute session expiration (hours, 1-168). |
| `ISQUARED_SESSION_IDLE_MINUTES` | No | `240` | Session idle timeout (minutes, 5-10080). |
| `ISQUARED_VISIT_GAP_MINUTES` | No | `30` | Minimum gap between visits to count a new visit (minutes, 1-1440). |
| `ISQUARED_TRUSTED_PROXY_HOPS` | No | `1` | Number of trusted reverse proxy hops appending to `X-Forwarded-For`. **Must be verified on the host** (see Section 10). |
| `ISQUARED_RATE_IP_FAILURES` | No | `8` | Failed code attempts per IP before temporary lockout (15 min window). |
| `ISQUARED_RATE_GLOBAL_FAILURES`| No | `100` | Global failed attempts before lockout (60 min window). |
| `ISQUARED_BETA_INSECURE_COOKIES`| No | `0` | Set to `1` only during local HTTP development if `NODE_ENV=production`. |

### Generating Secrets

1. **HMAC Pepper (Server Secret):**
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

2. **Admin Password Hash:**
   ```bash
   npm run isquared:beta -- hash-password
   ```

---

## 4. Administration CLI

Manage testers and inspect usage via `scripts/isquared-beta-admin.cjs`:

```bash
npm run isquared:beta -- <command> [options]
```

Testers can be referenced by either exact name (case-insensitive) or numeric ID, via positional argument or explicit `--name` / `--id` flags.

### Common Commands

#### 1. Create a Tester with a Manually Selected Code
```bash
npm run isquared:beta -- create --name "Jane Smith" --code "4X73B"
```
Or enter via hidden prompt:
```bash
npm run isquared:beta -- create --name "Jane Smith" --code-stdin
```
*(Manual codes are stored hashed and never displayed again unless `--show-code` is supplied at creation).*

#### 2. Create a Tester with an Auto-Generated Random Code
```bash
npm run isquared:beta -- create --name "John Doe" --generate
```
*(Generates an unambiguous 12-character code, shown once upon creation).*

#### 3. Create a Tester with an Expiration Date
```bash
npm run isquared:beta -- create --name "Guest Tester" --generate --expires 2026-12-31
```

#### 4. List All Testers
```bash
npm run isquared:beta -- list
# Or output raw JSON:
npm run isquared:beta -- list --json
```
Outputs: `Id`, `Tester`, `Logins`, `Visits`, `Last login (UTC)`, `Status`.

#### 5. Show Details and Login History for a Tester
Positional argument or flag:
```bash
npm run isquared:beta -- show "Jane Smith"
npm run isquared:beta -- show --id 1
npm run isquared:beta -- history "Jane Smith" --limit 25
```

#### 6. Disable or Re-enable a Tester
Disabling immediately revokes all active sessions for that tester:
```bash
npm run isquared:beta -- disable "Jane Smith"
npm run isquared:beta -- enable "Jane Smith"
# Flag style:
npm run isquared:beta -- disable --name "Jane Smith"
```

#### 7. Rotate a Tester's Access Code
Replaces the code and revokes all active sessions:
```bash
npm run isquared:beta -- rotate-code "Jane Smith" --generate
# Or assign a new manual code:
npm run isquared:beta -- rotate-code "Jane Smith" --code "NEW99X"
```

#### 8. Adjust Expiration Date
Set an expiration date or remove expiration:
```bash
npm run isquared:beta -- set-expiry "Jane Smith" 2027-01-15
npm run isquared:beta -- set-expiry "Jane Smith" none
# Flag style:
npm run isquared:beta -- set-expiry --name "Jane Smith" --expires 2027-01-15
```

#### 9. Clear Rate-Limit Lockout
If an IP or global counter locked out access attempts:
```bash
npm run isquared:beta -- unlock
```

#### 10. View Aggregate Usage Statistics
```bash
npm run isquared:beta -- stats --days 30
npm run isquared:beta -- stats --days 30 --json
```

#### 11. Database Cleanup
Removes sessions that expired or were revoked more than 7 days ago:
```bash
npm run isquared:beta -- cleanup
```

#### 12. Display Active Confidentiality Agreement
Show the active confidentiality agreement version, SHA-256 digest, and terms:
```bash
npm run isquared:beta -- agreement
```

#### 13. Initialize or Migrate SQLite Schema
Create or upgrade the SQLite schema (also executed automatically on server startup):
```bash
npm run isquared:beta -- init
```

#### 14. Hash Admin Password
Compute the scrypt hash for setting `ISQUARED_ADMIN_PASSWORD_HASH`:
```bash
npm run isquared:beta -- hash-password
```

---

## 5. Web Administration Dashboard

When `ISQUARED_ADMIN_USERNAME` and `ISQUARED_ADMIN_PASSWORD_HASH` are set:

- **URL:** `https://davidjgrimsley.com/iSquared/admin/`
- **Features:**
  - Secure login with scrypt credential verification and independent rate limiting.
  - Summary tiles: total invited testers, active testers, never logged in, total logins, total visits, period logins/visits.
  - Interactive table showing all testers, their status, logins, visits, and last login time.
  - Sorting by any column and filtering by status, search string, or time window (7, 14, 30, 90, 365 days).
  - Ordinary tester sessions **cannot** access the admin dashboard or its API endpoints.

---

## 6. Updating the Confidentiality Agreement

The confidentiality agreement is versioned and immutable:

1. Agreements are stored in `scripts/isquared-beta/agreements/<version>.json`.
2. To release a new agreement (e.g. after legal review):
   - Create `scripts/isquared-beta/agreements/2.json` with the new version number, title, statement, checkbox label, and terms.
   - Do **not** modify `1.json` (modifying an existing recorded version throws an `agreement_changed` error on startup).
   - Set `ISQUARED_AGREEMENT_VERSION=2` in `.env` (or leave unset to automatically select the highest version).
3. On their next visit, testers will be prompted to review and accept version 2 before proceeding. Acceptance is recorded in `beta_agreements` with the version and SHA-256 digest.

---

## 7. Deployment Procedures

### Building the iSquared Prototype (in `mrdj-dev-suite`)

```bash
cd apps/i2-ide-prototype
pnpm install
pnpm build:hosted:archive
```

Available build scripts in `apps/i2-ide-prototype/package.json`:
- `pnpm build:hosted:archive`: Runs `node scripts/build-hosted.mjs --archive`. Builds the Vite prototype with base path `/iSquared/`, verifies output, and generates `dist-hosted/isquared-web.tgz`.
- `pnpm build:hosted`: Runs `node scripts/build-hosted.mjs`. Generates `dist-hosted/web/` and `manifest.json` without packaging an archive.
- `pnpm test`: Runs `node --test "scripts/__tests__/*.test.mjs"` to test build and verification logic.

The hosted build process (`scripts/build-hosted.mjs`):
1. Builds the Vite application with base path `/iSquared/`.
2. Runs static verification (`verifyHostedOutput`) ensuring no source maps, localhost URLs, or secrets are present.
3. Produces output directory `dist-hosted/` containing:
   - `web/` (static directory containing `index.html`, `assets/`, `robots.txt`, etc.)
   - `manifest.json` (build verification metadata)
   - `isquared-web.tgz` (tar archive containing `web/` and `manifest.json`)

### Uploading and Extracting on the VPS

> [!WARNING]
> The tar archive `isquared-web.tgz` contains root entries `web/` and `manifest.json`.
> Extracting directly into `.../iSquared-beta/web/` without `--strip-components` will result in a nested `.../web/web/` directory that causes HTTP 503 ("prototype not deployed"). Always extract into the base directory `/var/www/vhosts/davidjgrimsley.com/iSquared-beta/`.

1. Copy `isquared-web.tgz` to the VPS server.
2. Prepare the base directory and extract cleanly:
   ```bash
   # Ensure base deployment directory exists
   mkdir -p /var/www/vhosts/davidjgrimsley.com/iSquared-beta

   # For updates: clean out previous web files to avoid orphaned hashed assets, preserving data/
   rm -rf /var/www/vhosts/davidjgrimsley.com/iSquared-beta/web

   # Extract archive into base directory (re-creates web/ and manifest.json)
   tar -xzf isquared-web.tgz -C /var/www/vhosts/davidjgrimsley.com/iSquared-beta/
   ```

3. Ensure file permissions allow the Node.js user to read files:
   ```bash
   chown -R <plesk-user>:psacln /var/www/vhosts/davidjgrimsley.com/iSquared-beta/web
   chmod -R 750 /var/www/vhosts/davidjgrimsley.com/iSquared-beta/web
   ```

### Initializing SQLite on the VPS

Run the CLI initialization once (or let `server.js` auto-migrate on startup):
```bash
cd /var/www/vhosts/davidjgrimsley.com/httpdocs
npm run isquared:beta -- init
```

### Restarting the Portfolio Application

In Plesk:
- Touch the restart file: `touch /var/www/vhosts/davidjgrimsley.com/httpdocs/tmp/restart.txt`
- Or click **Restart** in the Plesk Node.js extension.

---

## 8. Backup, Restore, and Maintenance

### Database Backup
The database uses SQLite WAL mode. Use the SQLite CLI or a file copy to create safe backups:
```bash
sqlite3 /var/www/vhosts/davidjgrimsley.com/iSquared-beta/data/beta.sqlite ".backup '/var/www/vhosts/davidjgrimsley.com/iSquared-beta/data/beta-backup-$(date +%F).sqlite'"
```

### Database Restore
1. Stop Node.js or touch restart file.
2. Replace `beta.sqlite` with the backup file.
3. Remove `beta.sqlite-wal` and `beta.sqlite-shm` if present.
4. Restart Node.js.

### Rollback Strategy
If a deployment of the prototype fails:
- Replace the files in `iSquared-beta/web/` with the previous build.
- The portfolio website itself remains completely unaffected.
- If private beta access needs to be immediately suspended, remove `ISQUARED_BETA_CODE_PEPPER` from `.env` and restart Node. All requests to `/iSquared/` will immediately return standard portfolio 404s with zero beta code active.

---

## 9. Production HTTPS Cookie Behavior and Browser Compatibility

### 1. `__Secure-` Cookie Prefix (RFC 6265bis)
- When `NODE_ENV=production`, all session and security cookies are prefixed with `__Secure-` (`__Secure-isq_beta`, `__Secure-isq_csrf`, `__Secure-isq_admin`).
- Browsers adhering to RFC 6265bis require that any cookie with the `__Secure-` prefix:
  1. Must have the `Secure` flag set.
  2. Must only be set from an encrypted HTTPS origin.
- The Node.js application sets the `Secure` flag and `__Secure-` prefix whenever `NODE_ENV=production` (unless overridden by `ISQUARED_BETA_INSECURE_COOKIES=1` during local testing).
- Browsers enforce this secure-context requirement on the client's direct connection to the public origin (`https://davidjgrimsley.com/`). The edge reverse proxy must ensure that external client connections are secured via HTTPS (and that plain HTTP requests are redirected to HTTPS).
- **Proxy Independence**: While `server.js` maintains `app.set('trust proxy', true)` for general Express proxy routing, `isquaredBeta` does not rely on Express `req.secure` or `req.ip`. Cookie attributes are set deterministically in production, and client rate-limiting addresses are resolved via `clientAddress(req, config.trustedProxyHops)` by counting hops from `X-Forwarded-For`.
- If testing production mode locally over plain HTTP, set `ISQUARED_BETA_INSECURE_COOKIES=1` in your local `.env`.

### 2. SameSite Policies and Navigation
- **Tester Session Cookie (`isq_beta`): `SameSite=Lax`**
  - Scoped to `Path=/iSquared`.
  - Configured with `SameSite=Lax` so that top-level GET navigations (such as clicking an invitation link in Gmail, Outlook, Slack, or Discord) successfully include the cookie.
  - Setting `SameSite=Strict` on the tester session cookie would strip the cookie when entering the site from external links, repeatedly forcing testers back to the login screen.
- **CSRF Token Cookie (`isq_csrf`): `SameSite=Strict`**
  - Scoped to `Path=/iSquared`.
  - Sent only on same-origin requests; double-submitted via the `X-CSRF-Token` header on state-changing API requests.
- **Admin Session Cookie (`isq_admin`): `SameSite=Strict`**
  - Scoped to `Path=/iSquared/admin`.
  - Restricts admin dashboard sessions to same-origin navigations. Bookmarks or direct external links require the user to already be within a same-origin context.

### 3. Cookie Path Case Sensitivity
- Under RFC 6265 Section 5.1.4, cookie path matching is **case-sensitive**. A cookie with `Path=/iSquared` will not be attached by browsers to requests for `/isquared` or `/ISQUARED`.
- To prevent authentication loss from URL mistyping, the server router issues an HTTP 308 permanent redirect from `/isquared/*` to the canonical `/iSquared/*` before reading cookies.

### 4. Browser Quirks and Incompatibilities
- **Safari / WebKit Intelligent Tracking Prevention (ITP)**:
  - Safari limits JavaScript-set (`document.cookie`) storage lifespans to 7 days or 24 hours.
  - Because all iSquared beta cookies are issued as `HttpOnly` server response headers, they are immune to ITP client-side storage caps.
- **In-App Browsers / WebViews (Slack, LinkedIn, Twitter/X, Instagram)**:
  - In-app browsers run in isolated webviews (e.g. `SFSafariViewController` or `WKWebView`) that do not share the user's primary Safari or Chrome cookie jar.
  - A tester who authenticates in an in-app browser will remain authenticated only within that in-app browser session, and vice-versa.
- **Firefox Total Cookie Protection & Chrome Third-Party Cookie Deprecation**:
  - Because `/iSquared/` is hosted on the first-party domain `davidjgrimsley.com`, partitioning and third-party cookie restrictions have zero impact on tester authentication.

---

## 10. Plesk / Nginx / Passenger Integration, Routing Verification, and Route Bypass Tests

> [!CAUTION]
> **Do not assume live Plesk nginx/Passenger routing is known or inject unverified server directives.**
> Plesk environments vary widely depending on whether "Proxy mode", "Smart static files processing", or "Serve static files directly by nginx" are enabled for the domain. Never insert ad-hoc directives (such as manual Passenger location blocks) without inspecting the effective web server configuration generated by Plesk.

### 1. Reverse Proxy Routing and Hop Counts
In Plesk hosting environments, two proxy topologies are common:
1. **Nginx Reverse Proxy -> Apache -> Phusion Passenger / Node.js** (2 hops):
   - Nginx receives client requests over HTTPS and appends the client IP to `X-Forwarded-For`.
   - Apache receives requests from Nginx and appends Nginx's proxy address (`127.0.0.1`) to `X-Forwarded-For`.
   - In this 2-hop topology, `ISQUARED_TRUSTED_PROXY_HOPS=2` ensures that `security.cjs`'s `clientAddress()` extracts the client's public IP rather than Apache's proxy address.
2. **Nginx Standalone -> Passenger / Node.js** (1 hop):
   - Nginx receives client requests and passes them directly to Passenger/Node.
   - In this 1-hop topology, `ISQUARED_TRUSTED_PROXY_HOPS=1` is correct.

> [!WARNING]
> If `ISQUARED_TRUSTED_PROXY_HOPS` is configured incorrectly (e.g. set to `1` when 2 hops exist), rate limiting resolves to `127.0.0.1`! A lockout on failed attempts would lock out **all users globally**. Verify the proxy chain on the host.

### 2. Static File Interception and Routing Verification
- If Plesk has **"Serve static files directly by nginx"** or **"Smart static files processing"** enabled, Nginx attempts to serve static assets directly from the public document root (`httpdocs/dist/client/`).
- Because private beta prototype files reside **outside** the public document root in `iSquared-beta/web/`, Nginx must not intercept or attempt to resolve `/iSquared/` requests directly from disk.
- Authorized server administration must inspect the effective configuration (such as Plesk's "Apache & nginx Settings" or the generated configuration files `/var/www/vhosts/system/davidjgrimsley.com/conf/nginx.conf` and `httpd.conf`) to verify that all requests under `/iSquared/` are forwarded directly to the Node.js application process without static file interception or premature 404 generation.

### 3. Calibrating Proxy Headers and Rate-Limiting without Exposing Sensitive Data
- **Zero Sensitive Data Logging**:
  - The access control subsystem adheres strictly to privacy and data minimization principles: **no access codes, session tokens, passwords, raw IP addresses, or personal data are ever written to disk or logged**.
  - The SQLite table `beta_events` records only operational event types (`login`, `visit`, `login_failed`, `admin_login_failed`) with non-sensitive metadata (such as `{ "reason": "invalid_code" }`). It does **not** contain an IP address column and records no client IP addresses.
  - Client IP addresses are hashed using keyed HMAC-SHA256 (`hashClient(pepper, address)`), and only the resulting 32-character hex hash is used in `beta_rate_limits` bucket keys (`access:client:<hash>`).
- **Verifying Proxy Headers and Calibrating Hops via Authorized Administration**:
  1. Inspect effective proxy headers (`X-Forwarded-For`, `X-Forwarded-Proto`, and `Host`) through authorized server administration to verify proxy chain depth.
  2. To calibrate `ISQUARED_TRUSTED_PROXY_HOPS` safely using the rate limiter:
     - Perform a test login attempt with an invalid code from a known external test IP.
     - Compute the expected HMAC hash of that test IP using the server pepper:
       ```bash
       node -e "const crypto = require('crypto'); console.log(crypto.createHmac('sha256', process.env.ISQUARED_BETA_CODE_PEPPER).update('client\0' + '<known-external-ip>').digest('hex').slice(0, 32))"
       ```
     - Query the transient rate-limit bucket in SQLite:
       ```bash
       sqlite3 /var/www/vhosts/davidjgrimsley.com/iSquared-beta/data/beta.sqlite "SELECT bucket, count, datetime(window_start/1000, 'unixepoch') FROM beta_rate_limits WHERE bucket LIKE 'access:client:%';"
       ```
     - Verify that the active bucket matches `access:client:<expected-hash>`. If the bucket matches the hash of `127.0.0.1` or the loopback/proxy IP, increment `ISQUARED_TRUSTED_PROXY_HOPS`.
     - Clear the test counter using the administrative CLI:
       ```bash
       npm run isquared:beta -- unlock
       ```

### 4. Mandatory Pre-Launch Route and Asset Bypass Tests
Execute these tests from an external machine to verify that no prototype route or static asset can bypass authentication.

> [!IMPORTANT]
> **Use real deployed asset paths from the build output, not guessed paths.**
> Vite produces content-hashed asset filenames (such as `assets/index-TVwQlTMH.js` and `assets/index-CumXa5fr.css`). Testing a guessed asset like `assets/index.js` tests a nonexistent file and yields false confidence. Obtain the actual deployed asset path from the build output before running bypass checks:
> ```bash
> # In dist-hosted/web or from the archive:
> tar -ztvf isquared-web.tgz | grep -E "assets/index-.*(js|css)"
> # Or inspect index.html:
> grep -o -E "assets/index-[^\"']+" dist-hosted/web/index.html
> ```

```bash
# 1. Unauthenticated root request -> Must return 200 OK with Login Page HTML (contains CSRF token)
curl -s -i https://davidjgrimsley.com/iSquared/ | head -n 15

# 2. Unauthenticated direct JavaScript bundle request -> Must return 401 Unauthorized (NOT 200 OK or raw bundle)
curl -s -i https://davidjgrimsley.com/iSquared/assets/index-TVwQlTMH.js | head -n 15

# 3. Unauthenticated direct stylesheet request -> Must return 401 Unauthorized
curl -s -i https://davidjgrimsley.com/iSquared/assets/index-CumXa5fr.css | head -n 15

# 4. Unauthenticated API session query -> Must return 200 with authenticated: false
curl -s https://davidjgrimsley.com/iSquared/api/session

# 5. State-changing request without CSRF -> Must return 403 Forbidden
curl -s -i -X POST https://davidjgrimsley.com/iSquared/api/access \
  -H "Content-Type: application/json" \
  -d '{"code":"4X73B","acceptTerms":true}' | head -n 15

# 6. Case-insensitivity normalization -> Must return 308 Permanent Redirect to /iSquared/
curl -s -i https://davidjgrimsley.com/isquared | head -n 10

# 7. Verify security headers on prototype responses
curl -s -I https://davidjgrimsley.com/iSquared/ | grep -E -i "(x-frame-options|x-robots-tag|referrer-policy|cross-origin-resource-policy)"
```

Expected response and header characteristics:
- Root request (`/iSquared/`): Returns `HTTP/1.1 200 OK` with `Content-Type: text/html` and embedded CSRF token.
- Direct asset requests (`/iSquared/assets/*`): Return `HTTP/1.1 401 Unauthorized` with `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow, noarchive`.
- Security headers present on all prototype responses:
  - `x-frame-options: DENY`
  - `x-robots-tag: noindex, nofollow, noarchive`
  - `referrer-policy: no-referrer`
  - `cross-origin-resource-policy: same-origin`

## Pet Show and Tell simulator preview (not enabled for testers)

**Current decision (2026-11-13): testers get the labeled simulated preview.** The live embed is parked because the Expo account that owns Pet Show and Tell (`mrdj2u`) is on the Starter plan, and Expo refuses session creation that sets `frameAncestors` or `corsOrigins` ("supported on Production and Enterprise plans"). The embed requires those options, so the live path stays disabled (`ISQUARED_SIMULATOR_PROVIDER` unset) until the owning account is on a plan that supports them. Verified by an `eas simulator:start --cors-origin ... --frame-ancestor ...` attempt, which failed before creating any session; the same request over the REST API returned HTTP 403. Reading sessions and reaching create validation both work with a personal access token, so this is a plan restriction, not a token problem. An Android build for this project exists (`emulator` profile APK; build `50ccf8c9-26cf-4bed-a814-c671acef6980`) and the direct Expo-hosted preview works for the account owner. Live tapping, typing and scrolling inside the embedded `@expo/hub-client` view have still never been exercised.

The simulator adapter is disabled by default. This integration is experimental and must pass a real, separately authorized end-to-end trial before tester access. The five-minute maximum is per simulator session, independent of beta login duration. The configurable budget is an internal conservative limit; it is not a statement of Expo's free allowance or billing. Confirm Expo availability, pricing, boot time and partial-session billing before enabling it.

After a standalone Android APK has been built and made available to Expo as a compatible EAS build or an HTTPS application archive, configure the portfolio server's private environment:

- `ISQUARED_SIMULATOR_PROVIDER=eas`
- `EXPO_TOKEN`: a server-only Expo access token with the necessary project permissions.
- `EXPO_PROJECT_ID`: the linked Pet Show and Tell Expo project ID.
- Exactly one of `EXPO_BUILD_ID` or `EXPO_APPLICATION_ARCHIVE_URL` identifying the Android APK.
- `ISQUARED_SIMULATOR_ALLOWED_ORIGIN`: the exact HTTPS origin of the i² page; localhost is permitted for development. Include no path or trailing slash.
- Optional: `ISQUARED_SIMULATOR_MONTHLY_BUDGET_MINUTES` and `ISQUARED_SIMULATOR_MAX_SESSION_MINUTES` (maximum five).

Restart the server with the existing persistent beta SQLite database. Credentials must never be placed in the prototype bundle. The preview token is sent only in no-store responses to the owning beta tester; anyone who obtains it can control that device until the session ends. Never share or log preview responses. The simulator runs the actual app; the fallback is explicitly labeled as simulated.

An uncertain start, stop, or expired external session retains its reservation until the provider positively confirms its state. The server does not run a background reconciler: a tester must request reconciliation, and a lost create response without an Expo session ID may require an operator to investigate in the Expo dashboard. Do not delete the SQLite record or launch a replacement until the external session is confirmed ended. Confirm the service's actual usage accounting in Expo before changing limits.

For the authorized trial, exercise start, touch, scrolling, text entry, Android navigation, scaling, reload/reconnection, stop and expiry within the existing frame. Confirm the Expo screen has just one set of system bars and inspect browser network/CSP errors. Also verify a second tester cannot access the first tester's preview. Do not enable public tester access until these checks and the artifact's startup without a development server pass.
