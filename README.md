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
- Quantum animation supports simulator mode and IBM hardware mode through Quantum API runtime endpoints when `EXPO_PUBLIC_QUANTUM_API_KEY` is set.
- Without `EXPO_PUBLIC_QUANTUM_API_KEY`, the animation card runs a local fallback demo state.

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
# Optional for live simulator/hardware demo calls in Quantum animation:
# EXPO_PUBLIC_QUANTUM_API_KEY=qapi_...
```

`EXPO_PUBLIC_*` variables are build-time for Expo web output. After changing them, rebuild and redeploy.
On Plesk, set these variables in the Node.js environment before post-deploy runs.
The deploy hook fails fast when required variables are missing.

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

- `PLESK_STAGING_WEBHOOK_URL` — Plesk Git webhook URL for the staging site
- `PLESK_PRODUCTION_WEBHOOK_URL` — Plesk Git webhook URL for the production site
- `EXPO_PUBLIC_SUPABASE_URL` *(optional)* — baked into the web bundle; falls back gracefully if absent
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` *(optional)* — baked into the web bundle; falls back gracefully if absent
- `EXPO_PUBLIC_QUANTUM_API_BASE_URL` *(optional)* — defaults to `https://davidjgrimsley.com/public-facing/api/quantum/v1`

### Deploy Flow

On push to `test` or `main`, CI:
1. Runs quality checks (lint, typecheck, tests, expo-doctor, build).
2. On success, fires the Plesk webhook for the matching environment.
3. Plesk pulls the latest commit from GitHub and runs `scripts/plesk-post-deploy.sh` (npm ci + build + restart).

## Notes

- IBM secrets are not written directly from frontend to Supabase.
- IBM profile CRUD uses Quantum API bearer-authenticated endpoints.
- Hardware jobs use API-key-authenticated Quantum API runtime endpoints.
- Client endpoint demos use `EXPO_PUBLIC_QUANTUM_API_BASE_URL` directly.
