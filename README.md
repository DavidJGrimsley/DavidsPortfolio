# DJ's Portfolio

Expo Router portfolio app for web/mobile with public API docs, project showcases, and Quantum API self-serve authentication tooling.

## Current Status

- Quantum API dashboard supports Supabase-authenticated key lifecycle:
  - list keys
  - create key (one-time reveal)
  - rotate key
  - revoke key
  - delete revoked keys
- IBM Credentials section supports BYO profile management through Quantum API bearer endpoints:
  - list/create/edit/delete profile
  - verify profile
  - set default profile
- Quantum animation supports simulator mode and IBM hardware mode through SDK-backed runtime calls routed via `/api/quantum-backend`.
- Runtime API keys remain server-side only (`QUANTUM_BACKEND_API_KEY`), not client-exposed.

## Tech Stack

- Expo Router
- React Native + React Native Web
- TypeScript
- Supabase Auth (browser client)
- Jest + jest-expo
- Uniwind/Tailwind utility styling

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file (`.env`) with at least:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_SITE_ORIGIN=http://localhost:3000
EXPO_PUBLIC_QUANTUM_API_BASE_URL=https://YOUR_QUANTUM_API_HOST/v1
QUANTUM_BACKEND_API_KEY=qapi_...
QUANTUM_PROXY_ALLOWED_ORIGINS=http://localhost:3000
```

`EXPO_PUBLIC_*` variables are baked into the Expo web build and are also served by `server.js` at runtime through `/__djsportfolio_runtime_config__`, while `QUANTUM_BACKEND_API_KEY` stays server-side.
`EXPO_PUBLIC_SITE_ORIGIN` controls the Supabase auth callback origin for the current environment. Use the exact origin for each file: localhost in `.env`, the Plesk temp domain in `.env.test`, and `https://davidjgrimsley.com` in `.env.production`.
Plesk Support warned that Additional Deployment Actions do not always inherit the Node.js environment automatically. For Plesk Git deploys, keep a server-local `.env.test` or `.env.production` file in the app root so both the build step and the running Node server read the same values.

### Plesk Env Files

Use this file layout:

- `.env` for local development
- `.env.test` for the Plesk temp/staging domain
- `.env.production` for the production domain

For each Plesk deployment root, create the matching server-local file next to `server.js`. Example `.env.test` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_SITE_ORIGIN=https://quizzical-hofstadter.108-175-12-95.plesk.page
EXPO_PUBLIC_QUANTUM_API_BASE_URL=https://YOUR_QUANTUM_API_HOST/v1
QUANTUM_BACKEND_API_KEY=qapi_...
QUANTUM_PROXY_ALLOWED_ORIGINS=https://quizzical-hofstadter.108-175-12-95.plesk.page
```

`scripts/plesk-post-deploy.sh` picks `.env.test` on the `test` branch and `.env.production` on `main`, then warns if required values are blank instead of aborting immediately.
`server.js` uses the same env-loader at runtime, so the build and the running app stay on the same environment contract. If a hosted `.env.test` or `.env.production` file still points `EXPO_PUBLIC_SITE_ORIGIN` at localhost, the loader warns so you can correct the deployment configuration; it is not automatically rejected.
Existing Plesk deployments that still have `.env.plesk` will continue to use it as a legacy fallback. In that fallback mode, `.env` is loaded first and `.env.plesk` is loaded on top to match the old server behavior. Rename the server-local file to `.env.test` or `.env.production` so the environment is obvious.

Production note: `EXPO_PUBLIC_QUANTUM_API_BASE_URL` must be explicitly set in production to the upstream Quantum API service, not this portfolio app's `/public-facing/api/quantum/v1` proxy route on the same host. Development keeps a safe local fallback (`http://127.0.0.1:8000/v1`).
`QUANTUM_PROXY_ALLOWED_ORIGINS` is optional for cross-origin callers to the Quantum proxy routes; same-origin browser requests are allowed automatically.
For non-web runtimes that need runtime proxy calls, set `EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL` to an absolute proxy URL (for example `https://davidjgrimsley.com/api/quantum-backend`).

### Supabase Auth Callback Setup

Supabase must allow the callback URL for every environment you use. If the requested redirect URL is not allow-listed, Supabase can fall back to its configured Site URL, which often looks like an unexpected `localhost` redirect during staging.

In Supabase Auth settings:

1. Set the Site URL intentionally for the environment you are testing.
2. Add redirect URLs for each environment you need, for example:
   - `http://localhost:3000/public-facing/api/quantum`
   - `https://quizzical-hofstadter.108-175-12-95.plesk.page/public-facing/api/quantum`
   - `https://davidjgrimsley.com/public-facing/api/quantum`

For staging on `test`, set `EXPO_PUBLIC_SITE_ORIGIN` to the temp-domain origin and keep the matching callback URL in Supabase's allow-list.

3. Start the app:

```bash
npm run web
```

## Useful Commands

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run doctor
npm run build:web:deploy
```

## CI + Deploy Flow

- Branch model: `feature/* -> test -> main`.
- GitHub Actions workflow: `.github/workflows/ci.yml`.
- Main PR source guard workflow: `.github/workflows/require-main-pr-source.yml`.
- Deploy marker files generated during deploy build:
  - `/__djsportfolio_build.txt`
  - `/__djsportfolio_build.json`
- Browser console logs build metadata on load using `/__djsportfolio_build.json`.
- Plesk post-deploy script for Git deployments: `scripts/plesk-post-deploy.sh`.
- Public deploy verification script: `scripts/verify-deployment.mjs`.
- Quality job uploads the generated `dist/client` directory as a GitHub Actions artifact (`quality-dist-client-<sha>`), including build marker files.

### Required GitHub Actions Secrets

- `PLESK_STAGING_WEBHOOK_URL`
- `PLESK_PRODUCTION_WEBHOOK_URL`

### Deploy Behavior

On PRs and pushes, CI works like this:

1. `Quality` runs lint, typecheck, tests, Expo Doctor, and `build:web:deploy`.
2. Pushes to `test` run `Deploy Staging`, which validates `PLESK_STAGING_WEBHOOK_URL`, fires the staging Plesk webhook, then verifies a fresh public build marker and healthy home page on the staging domain.
3. Pushes to `main` run `Deploy Production`, which validates `PLESK_PRODUCTION_WEBHOOK_URL`, fires the production Plesk webhook, then verifies a fresh public build marker and healthy home page on production.
4. PRs into `main` also run `Require Main PR Source`, which only allows `test` or `hotfix/*`.

Important: the webhook only confirms that Plesk received the deploy trigger. It does not confirm that the Git pull, Additional Deployment Actions, build, or restart finished successfully. Plesk Support told us to treat `/var/log/plesk/panel.log` as the authoritative server log, and CI now uses the public build marker as an external verification signal after the webhook fires.

### Recommended Rulesets

- `test`: require pull request, require `Quality`, require up-to-date branch, block force pushes, restrict deletions
- `main`: require pull request, require `Quality` and `Require Main PR Source`, require up-to-date branch, block force pushes, restrict deletions

## Notes

- IBM secrets are not written directly from frontend to Supabase.
- IBM profile CRUD uses Quantum API bearer-authenticated endpoints.
- Hardware jobs use API-key-authenticated Quantum API runtime endpoints.
- Client endpoint demos use `EXPO_PUBLIC_QUANTUM_API_BASE_URL` directly.
- Keep `.env`, `.env.test`, `.env.production`, and legacy `.env.plesk` files out of git. They are server-local deployment files, not application artifacts.
