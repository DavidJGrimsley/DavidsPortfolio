# Project Info - DJs Portfolio

## Product Goal

Build a production-ready portfolio app (Expo Router + React Native Web) that showcases projects, exposes public developer resources, and supports a clean Phase 3.5 integration for Quantum API self-serve key management.

## Primary Consumers

1. Recruiters and hiring managers reviewing shipped work
2. Developers exploring public APIs and MCP tooling
3. API users integrating Quantum API endpoints
4. Collaborators reviewing portfolio case studies and production links
5. Site operator (David) managing content and deployments

## Current Baseline (Already Delivered)

- App shell, startup UX, and route architecture are implemented (Expo Router root layout, tabs/stacks, public-facing sections).
- Public-facing API, MCP, and production-app pages are live with metadata sync + local fallback behavior.
- Portfolio category browsing/detail flows are implemented with centralized JSON-driven content.
- Services intake flow and internal content API route are implemented.
- Web export/server hosting scripts, sitemap generation, and static asset pipeline are in place.
- Uniwind/Tailwind theming and core UI primitives are integrated.

## Scope (Phase 3.5 / 3.75 Status)

- Supabase GitHub + magic-link sign-in UX is implemented on the portfolio Quantum API page.
- "API Keys" dashboard UX is implemented for list/create/revoke/rotate flows.
- Revoked-key cleanup UX is implemented (single-key delete + bulk delete revoked).
- Portfolio UI is integrated with backend key-management endpoints using bearer tokens.
- Portfolio copy/docs now reflect key lifecycle semantics (one-time secret reveal, revoke/rotate behavior).
- Identerest Account branding is now used for auth UX.
- Quantum API base URL configuration is env-driven with fallback (no longer hardcoded throughout page/components).
- Portfolio-side validation now covers Quantum API base URL fallback plus key service normalization/error handling; backend-heavy security coverage is still pending.

## Out of Scope (Phase 3.5)

- Implementing backend DB migrations or auth services inside this portfolio repo
- Exposing any Supabase service-role credentials client-side
- Paid-plan/tier design (future enhancement)
- Full refactor of all large content-heavy public-facing pages

## Constraints

- Runtime protected API calls remain `X-API-Key` based, but key lifecycle moves to DB-backed management.
- Portfolio key management endpoints must use `Authorization: Bearer <supabase_jwt>`.
- `API_KEYS_JSON` is planned for hard cutover removal from active runtime auth path.
- Redis remains required for rate limiting and key metadata caching.
- Public page copy must not claim "no API keys/no signup" once Phase 3.5 is rolled out.

## Success Criteria

- Portfolio docs and planning artifacts clearly reflect current baseline and Phase 3.75 rollout status.
- Auth/key-management flows are live in UI with Identerest Account branding.
- Public route/base URL messaging is consistent across metadata, docs, and page copy.
- Remaining work is limited to validation hardening (tests, final rollout verification, and release checks).

## Broad Repo Backlog (Outside Phase 3.5)

- Replace starter `README.md` with project-specific setup/architecture/deploy docs.
- Add CI workflows for lint/test/build checks in `.github`.
- Expand tests beyond the current minimal baseline.
- Resolve stale/inconsistent public API copy (base URL and request schema wording).
- Break down very large public-facing files for maintainability and lower drift risk.

## Phase 3.5 / 3.75 TODO Snapshot (Portfolio + Quantum API Integration)

- Create `api_keys` and `api_key_audit_events` tables in Supabase Postgres. (done)
- Add Supabase JWT verification via JWKS cache with strict issuer/audience checks. (done)
- Build key lifecycle service: create (one-time reveal), revoke, rotate (atomic). (done)
- Hard cut runtime key auth to DB-backed lookup only (remove `API_KEYS_JSON` fallback). (done)
- Add/confirm key-management endpoints: (done)
  - `GET /v1/keys`
  - `POST /v1/keys`
  - `DELETE /v1/keys/{key_id}` (revoked-only delete)
  - `DELETE /v1/keys/revoked` (bulk revoked cleanup)
  - `POST /v1/keys/{key_id}/revoke`
  - `POST /v1/keys/{key_id}/rotate`
- Add required config: (done)
  - `DATABASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_JWT_AUDIENCE`
  - `SUPABASE_JWT_ISSUER`
  - `API_KEY_HASH_SECRET`
- Build portfolio UI flow: (done)
  - GitHub sign-in
  - List/create/revoke/rotate key actions
  - Copy-once UX and confirmation dialogs
  - Friendly error handling
- Add env-driven base URL config:
  - `EXPO_PUBLIC_QUANTUM_API_BASE_URL` with production fallback (done)
  - portfolio-side validation for fallback + service normalization/error handling (done)
- Add test coverage:
  - unit (hashing/JWT/lifecycle semantics)
  - integration (user scoping/cache invalidation/rate-limit policy)
  - security (cross-user blocking/no secret leakage/audit events)
  - E2E UI flow (login/create/copy/revoke/rotate/error states)
