# DJ's Portfolio

Expo Router portfolio app for web/mobile with public API docs, project showcases, Quantum API self-serve authentication tooling, and public Gateway project management.

## Current Status

- Quantum API dashboard supports Supabase-authenticated key lifecycle:
  - list keys
  - create key (one-time reveal)
  - rotate key
  - revoke key
  - delete revoked keys
- Gateway page supports Identerest-authenticated Gateway project management:
  - list/create/update Gateway projects
  - choose a default Quantum API key and IBM profile
  - create/rotate/revoke publishable Gateway client keys
  - mint short-lived runtime tokens for client calls
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

2. Create local env file (`.env`) with at least:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_QUANTUM_API_BASE_URL=https://davidjgrimsley.com/public-facing/api/quantum/v1
QUANTUM_BACKEND_API_KEY=qapi_...
QUANTUM_PROXY_ALLOWED_ORIGINS=https://davidjgrimsley.com,https://quizzical-hofstadter.108-175-12-95.plesk.page
EXPO_PUBLIC_QUANTUM_GATEWAY_BASE_URL=https://davidjgrimsley.com/public-facing/api/quantum-gateway/v1
```

`EXPO_PUBLIC_*` variables are build-time for Expo web output. After changing them, rebuild and redeploy.
On Plesk, set these variables in the Node.js environment before post-deploy runs.
The deploy hook fails fast when required variables are missing.

Production note: `EXPO_PUBLIC_QUANTUM_API_BASE_URL` must be explicitly set in production. Development keeps a safe local fallback (`http://127.0.0.1:8000/v1`).
`QUANTUM_PROXY_ALLOWED_ORIGINS` is optional for cross-origin callers; same-origin browser requests are allowed automatically.
For local exported web builds, the app will proxy the Quantum API and Gateway mounted paths through the local server when running on localhost.
For non-web runtimes that need runtime proxy calls, set `EXPO_PUBLIC_QUANTUM_RUNTIME_PROXY_BASE_URL` to an absolute proxy URL (for example `https://davidjgrimsley.com/api/quantum-backend`).

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
- Main PR source guard workflow: `.github/workflows/main-pr-source-guard.yml`.
- Deploy marker files generated during deploy build:
  - `/__djsportfolio_build.txt`
  - `/__djsportfolio_build.json`
- Browser console logs build metadata on load using `/__djsportfolio_build.json`.
- Plesk post-deploy script for Git deployments: `scripts/plesk-post-deploy.sh`.
- Quality job uploads the generated `dist/client` directory as a GitHub Actions artifact (`quality-dist-client-<sha>`), including build marker files.

### Required GitHub Actions Secrets

- `PLESK_STAGING_WEBHOOK_URL`
- `PLESK_STAGING_SITE_ORIGIN`
- `PLESK_PRODUCTION_WEBHOOK_URL`
- `PLESK_PRODUCTION_SITE_ORIGIN`

### Deployment Verification Contract

The CI deploy jobs verify live deployment by polling:

- `${PLESK_STAGING_SITE_ORIGIN}/__djsportfolio_build.txt`
- `${PLESK_PRODUCTION_SITE_ORIGIN}/__djsportfolio_build.txt`

If the deployment serves static files under `dist/client`, the verifier also checks:

- `${SITE_ORIGIN}/dist/client/__djsportfolio_build.txt`

The endpoint must return the exact deployed commit SHA.

## Notes

- IBM secrets are not written directly from frontend to Supabase.
- IBM profile CRUD uses Quantum API bearer-authenticated endpoints.
- Hardware jobs use API-key-authenticated Quantum API runtime endpoints.
- Client endpoint demos use `EXPO_PUBLIC_QUANTUM_API_BASE_URL` directly.
- Gateway runtime calls use publishable Gateway client keys to mint short-lived runtime tokens.
- Direct Quantum API key mode remains an explicit local/dev fallback, not the shipped Gateway runtime path.
