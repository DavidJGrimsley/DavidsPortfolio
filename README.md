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

2. Create local env file (`.env`) with at least:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_QUANTUM_API_BASE_URL=https://davidjgrimsley.com/public-facing/api/quantum/v1
QUANTUM_BACKEND_API_KEY=qapi_...
QUANTUM_PROXY_ALLOWED_ORIGINS=https://davidjgrimsley.com,https://quizzical-hofstadter.108-175-12-95.plesk.page
```

`EXPO_PUBLIC_*` variables are baked into the Expo web build, while `QUANTUM_BACKEND_API_KEY` is read by the Node server at runtime.
The running Node app still reads runtime values from `process.env`, but Plesk Support warned that Additional Deployment Actions do not always inherit the Node.js environment automatically. For Plesk Git deploys, keep a server-local env file for the build step too.

### Plesk Env Files

For each Plesk deployment root, create a server-local `.env.plesk` file next to `server.js` with the values for that specific environment. Example staging file:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_QUANTUM_API_BASE_URL=https://quizzical-hofstadter.108-175-12-95.plesk.page/public-facing/api/quantum/v1
QUANTUM_BACKEND_API_KEY=qapi_...
QUANTUM_PROXY_ALLOWED_ORIGINS=https://quizzical-hofstadter.108-175-12-95.plesk.page
```

`scripts/plesk-post-deploy.sh` now loads env in this order:

1. `PLESK_ENV_FILE` if you explicitly set it
2. `.env.plesk`
3. `.env`

The deploy script fails fast if the required values are still missing after that.

For now, keep the runtime values in the Plesk Node.js environment too. This change guarantees the build script sees the env file; it does not change how the running Node app receives `process.env`.

Production note: `EXPO_PUBLIC_QUANTUM_API_BASE_URL` must be explicitly set in production. Development keeps a safe local fallback (`http://127.0.0.1:8000/v1`).
`QUANTUM_PROXY_ALLOWED_ORIGINS` is optional for cross-origin callers; same-origin browser requests are allowed automatically.
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
- Main PR source guard workflow: `.github/workflows/require-main-pr-source.yml`.
- Deploy marker files generated during deploy build:
  - `/__djsportfolio_build.txt`
  - `/__djsportfolio_build.json`
- Browser console logs build metadata on load using `/__djsportfolio_build.json`.
- Plesk post-deploy script for Git deployments: `scripts/plesk-post-deploy.sh`.
- Quality job uploads the generated `dist/client` directory as a GitHub Actions artifact (`quality-dist-client-<sha>`), including build marker files.

### Required GitHub Actions Secrets

- `PLESK_STAGING_WEBHOOK_URL`
- `PLESK_PRODUCTION_WEBHOOK_URL`

### Deploy Behavior

On PRs and pushes, CI works like this:

1. `Quality` runs lint, typecheck, tests, Expo Doctor, and `build:web:deploy`.
2. Pushes to `test` run `Deploy Staging`, which validates `PLESK_STAGING_WEBHOOK_URL` and fires the staging Plesk webhook.
3. Pushes to `main` run `Deploy Production`, which validates `PLESK_PRODUCTION_WEBHOOK_URL` and fires the production Plesk webhook.
4. PRs into `main` also run `Require Main PR Source`, which only allows `test` or `hotfix/*`.

Important: the webhook only confirms that Plesk received the deploy trigger. It does not confirm that the Git pull, Additional Deployment Actions, build, or restart finished successfully. Plesk Support told us to treat `/var/log/plesk/panel.log` as the authoritative deploy log for completion/failure details.

Build marker files are still generated and served for manual diagnostics once the site is live, but they are no longer used as a blocking CI signal.

### Recommended Rulesets

- `test`: require pull request, require `Quality`, require up-to-date branch, block force pushes, restrict deletions
- `main`: require pull request, require `Quality` and `Require Main PR Source`, require up-to-date branch, block force pushes, restrict deletions

## Notes

- IBM secrets are not written directly from frontend to Supabase.
- IBM profile CRUD uses Quantum API bearer-authenticated endpoints.
- Hardware jobs use API-key-authenticated Quantum API runtime endpoints.
- Client endpoint demos use `EXPO_PUBLIC_QUANTUM_API_BASE_URL` directly.
- Keep `.env.plesk` out of git. It is a server-local deployment file, not an application artifact.
