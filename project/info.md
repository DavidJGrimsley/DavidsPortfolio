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

## Scope (Phase 3.5 Planning Only - Not Implemented Yet)

- Add Supabase GitHub sign-in UX on the portfolio Quantum API page.
- Add "API Keys" dashboard UX for list/create/revoke/rotate flows.
- Integrate portfolio UI with backend key-management endpoints using bearer tokens.
- Align portfolio copy and docs with real key lifecycle semantics (one-time secret reveal, revoke/rotate behavior).
- Use Identerest Account branding for auth UX while keeping API route docs configurable by deploy environment.

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

- Portfolio docs and planning artifacts clearly reflect current repo baseline and Phase 3.5 scope.
- All Phase 3.5 integration tasks are tracked before implementation begins.
- Public route/base URL messaging is consistent across metadata, docs, and page copy.
- No implementation work is performed until this planning checkpoint is approved.

## Broad Repo Backlog (Outside Phase 3.5)

- Replace starter `README.md` with project-specific setup/architecture/deploy docs.
- Add CI workflows for lint/test/build checks in `.github`.
- Expand tests beyond the current minimal baseline.
- Resolve stale/inconsistent public API copy (base URL and request schema wording).
- Break down very large public-facing files for maintainability and lower drift risk.

## Phase 3.5 TODO Snapshot (Portfolio + Quantum API Integration)

- Create `api_keys` and `api_key_audit_events` tables in Supabase Postgres.
- Add Supabase JWT verification via JWKS cache with strict issuer/audience checks.
- Build key lifecycle service: create (one-time reveal), revoke, rotate (atomic).
- Hard cut runtime key auth to DB-backed lookup only (remove `API_KEYS_JSON` fallback).
- Add/confirm key-management endpoints:
  - `GET /v1/keys`
  - `POST /v1/keys`
  - `POST /v1/keys/{key_id}/revoke`
  - `POST /v1/keys/{key_id}/rotate`
- Add required config:
  - `DATABASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_JWT_AUDIENCE`
  - `SUPABASE_JWT_ISSUER`
  - `API_KEY_HASH_SECRET`
- Build portfolio UI flow:
  - GitHub sign-in
  - List/create/revoke/rotate key actions
  - Copy-once UX and confirmation dialogs
  - Friendly error handling
- Add test coverage:
  - unit (hashing/JWT/lifecycle semantics)
  - integration (user scoping/cache invalidation/rate-limit policy)
  - security (cross-user blocking/no secret leakage/audit events)
  - E2E UI flow (login/create/copy/revoke/rotate/error states)
