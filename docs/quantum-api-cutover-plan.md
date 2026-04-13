# Quantum API Env-Key Deprecation Cutover Plan

This plan formalizes the migration from legacy env-based runtime API keys in frontend clients to server-mediated key handling with Identerest auth and DB-managed key lifecycle.

## Scope

- Portfolio frontend repo: `DavidsPortfolio`
- Quantum backend repo: `quantum-api`
- Public SDK package: `@mr.dj2u/quantum-api`

## Current State (As Implemented)

- Frontend runtime calls are SDK-backed and routed through `/api/quantum-backend`.
- Long-lived runtime API keys are server-side (`QUANTUM_BACKEND_API_KEY`) and are not required in public client env vars.
- Bearer-protected key/profile routes use authenticated user session tokens.
- Frontend dependency has moved from local file SDK linkage to npm package `@mr.dj2u/quantum-api`.

## Cutover Objective

Deprecate any remaining frontend dependence on env-exposed runtime keys and enforce server-mediated runtime auth as the only supported production path.

## Cutover Steps

1. Freeze legacy guidance
- Remove/avoid docs that suggest `EXPO_PUBLIC_QUANTUM_API_KEY` for production clients.
- Keep direct key usage guidance only for local/dev/prototype workflows.

2. Enforce server-mediated runtime path
- Runtime calls from app clients must go through `/api/quantum-backend`.
- Proxy injects `QUANTUM_BACKEND_API_KEY` server-side.

3. Confirm bearer lifecycle boundary
- `/v1/keys*` and `/v1/ibm/profiles*` remain bearer-authenticated user flows.
- Frontend must not contain service-role or privileged backend credentials.

4. Operational verification
- Typecheck passes.
- Focused Quantum suites pass.
- Full test suite and web deploy build pass.
- Manual smoke: sign in, create key, rotate/revoke, IBM profile validation UX.

## Rollback Strategy

If a regression appears in production:

1. Keep the server proxy path enabled while rolling back frontend package/version.
2. Pin frontend dependency to last known-good SDK version.
3. Re-run focused Quantum tests and web deploy build before redeploy.

## Ownership

- Frontend enforcement and UX: `DavidsPortfolio`
- JWT/key lifecycle/caching/CORS policy: `quantum-api`

## External Dependencies / Blockers

The following remain backend-owned and must be completed in `quantum-api`:

- JWT validation test matrix
- Key ownership/invalidation/security integration tests
- CORS policy confirmation for localhost bearer routes
- Live `/v1/gates/run` auth policy review if 401 anomalies occur
