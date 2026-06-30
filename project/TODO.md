# DJs Portfolio Master TODO and Roadmap

This file is the planning source of truth for portfolio delivery and Phase 3.5 integration work.

## North Star

Ship a reliable, production-grade portfolio experience that showcases real shipped systems and safely integrates Quantum API key management for external developers.

## Current Status (Already Delivered)

### App Foundation

- [x] Expo Router root app shell with font loading, splash/startup handling, and web SSR-safe startup flow
- [x] Multi-section navigation for portfolio/public-facing/services routes
- [x] Public-facing API, MCP, and production-app route structure

### Portfolio and Content

- [x] JSON-driven portfolio content architecture and category detail views
- [x] Services content API route (`/api/content`) and typed client fetch helper
- [x] Public-facing API metadata sync pattern with local fallback support

### Styling and UX

- [x] Uniwind/Tailwind global theme utilities and themed UI primitives
- [x] Reusable navigation/cards/wrapper components across public-facing pages

### Tooling and Deploy

- [x] Web export + sitemap generation scripts
- [x] Express runtime server for exported build
- [x] Static asset/icon copy automation
- [x] Lint/test script scaffolding

## Phase 0 - Documentation and Reliability Backfill (High Priority)

Goal: close obvious repo hygiene gaps before major integration work.

### Docs and Project Metadata

- [x] Create `project/info.md` with current baseline + Phase 3.5 planning scope
- [x] Create `project/TODO.md` as roadmap source of truth
- [ ] Fill `project/style.md` with design/system conventions
- [ ] Replace starter `README.md` with real architecture, runbook, and deploy docs

### Quality and CI

- [ ] Add CI workflow(s) for lint/test/build
- [ ] Expand test coverage beyond current minimal baseline
- [ ] Resolve known lint gaps in SEO/public-facing components

## Phase 3.5 / 3.75 (Quantum-API Todo phase) - Portfolio Integration for Real API Key Management

Goal: integrate portfolio UI with real key lifecycle backend (Supabase Auth + Postgres + Redis), without implementing backend changes in this repo yet.

### Backend Dependency Tasks (Tracked Here for Cross-Repo Coordination)

- [x] Create Supabase Postgres `api_keys` table (owner, prefix, hashed secret, status, quotas/limits, lifecycle timestamps)
- [x] Create `api_key_audit_events` table for create/revoke/rotate actor metadata
- [x] Add Supabase JWT verification with JWKS caching and strict issuer/audience checks
- [x] Build key lifecycle service (create one-time secret, revoke, rotate atomically)
- [x] Hard cut runtime auth to DB-managed keys only (remove `API_KEYS_JSON` runtime fallback)
- [x] Add prefix-based key lookup + constant-time hash verification
- [x] Keep Redis metadata cache with explicit invalidation on revoke/rotate

### API Contract and Config

- [x] Confirm/ship user-scoped key endpoints:
  - [x] `GET /v1/keys`
  - [x] `POST /v1/keys`
  - [x] `DELETE /v1/keys/{key_id}` (revoked-only delete)
  - [x] `DELETE /v1/keys/revoked` (bulk revoked cleanup)
  - [x] `POST /v1/keys/{key_id}/revoke`
  - [x] `POST /v1/keys/{key_id}/rotate`
- [x] Ensure protected runtime endpoints continue using `X-API-Key` from DB-backed records
- [x] Roll out required config:
  - [x] `DATABASE_URL`
  - [x] `SUPABASE_URL`
  - [x] `SUPABASE_JWT_AUDIENCE`
  - [x] `SUPABASE_JWT_ISSUER`
  - [x] `API_KEY_HASH_SECRET`
- [x] Preserve Redis requirement for rate limiting + key metadata cache
- [x] Swap frontend integration from local SDK path to published npm package `@mr.dj2u/quantum-api` and validate compatibility

### Consistency and Maintainability

- [x] Reconcile Quantum API base URL messaging (public mount: `/public-facing/api/quantum/v1`; app proxy: `/api/quantum-backend`)
- [x] Reconcile request schema wording/examples to `gate_type` in API docs page content
- [x] Remove stale auth copy conflicts (runtime endpoints require `X-API-Key`; key/profile dashboard requires Identerest auth)
- [ ] Split large public-facing files into smaller maintainable modules (deferred refactor)

### Portfolio UI Work (Phase 3.75 Focus)

- [x] Add Supabase GitHub sign-in flow on the Quantum API public-facing page
- [x] Rebrand the sign-in component for "Identerest Account" (final logo/style pass later)
- [x] Add authenticated "API Keys" dashboard section
- [x] Implement key list/create/revoke/rotate UI interactions
- [x] Add revoked-key cleanup controls (per-row delete + bulk delete revoked)
- [x] Implement one-time secret reveal + copy-once UX
- [x] Add confirmation dialogs and friendly error states
- [x] Integrate bearer-token calls to key-management endpoints
- [x] Ensure no Supabase service-role credentials are exposed client-side
- [x] Update docs/copy to use Identerest Account auth branding and avoid hardcoded domain-specific migration guidance
- [x] Move hardcoded Quantum API base URL usage to env-driven config with safe fallback

### Validation and Security

- [x] Portfolio-side unit tests for Quantum API base URL fallback and key service normalization/error handling
- [x] Add deeper component tests for IBM dashboard interactions (auth config warning + IBM profile required-field validation)

#### External Blockers (Backend-Owned Validation)

- [ ] Backend-owned unit tests for key generation/parsing/hashing/constant-time verification
- [ ] Unit tests for JWT validation paths (valid/expired/wrong issuer/wrong audience/malformed)
- [ ] Integration tests for user-scoped key ownership boundaries
- [ ] Integration tests for revoked/rotated key rejection and Redis invalidation behavior
- [ ] Security tests for cross-user access blocking and zero secret leakage
- [ ] Audit-event assertions for create/revoke/rotate actions
- [ ] E2E tests for GitHub login -> create key -> copy once -> revoke -> rotate -> error handling

### Completion Criteria

- [x] Portfolio and backend contracts align for authenticated self-serve key management
- [x] Public copy and code examples no longer conflict with auth/key requirements
- [x] Cutover plan for deprecating env-based keys is documented and linked in repo docs
- [x] Phase 3.5 implementation can begin without unresolved planning gaps

Reference: `docs/quantum-api-cutover-plan.md`

## Phase 4 V1 - BYO IBM Credentials + Hardware Runtime (for Quantum-API)

Goal: keep simulator usage seamless while enabling optional IBM profile management and IBM hardware execution via existing Quantum API contracts.

### IBM Profile Management (Bearer Auth)

- [x] Add service support for:
  - [x] `GET /v1/ibm/profiles`
  - [x] `POST /v1/ibm/profiles`
  - [x] `PATCH /v1/ibm/profiles/{profile_id}`
  - [x] `DELETE /v1/ibm/profiles/{profile_id}`
  - [x] `POST /v1/ibm/profiles/{profile_id}/verify`
- [x] Add dashboard UX for list/create/edit/delete/default/verify profile actions
- [x] Support channel selector with:
  - [x] `ibm_quantum_platform`
  - [x] `ibm_cloud`
- [x] Keep IBM raw token write-only in UX and avoid client persistence of secrets
- [x] Surface user-facing errors for duplicate profile names and invalid credentials

### IBM Runtime (API Key Auth)

- [x] Add service support for:
  - [x] `GET /v1/list_backends?provider=ibm`
  - [x] `POST /v1/jobs/circuits`
  - [x] `GET /v1/jobs/{job_id}`
  - [x] `GET /v1/jobs/{job_id}/result`
  - [x] `POST /v1/jobs/{job_id}/cancel`
- [x] Add simulator/hardware run toggle in quantum demo UI
- [x] Display hardware execution evidence (backend/local job id/remote job id/status)
- [x] Ensure hardware mode uses default IBM profile when no explicit profile selection is needed

### UX and Copy

- [x] Add IBM Credentials help modal
- [x] Keep IBM Credentials section collapsed by default
- [x] Update API page copy to clarify simulator-first + BYO IBM model
- [x] Fix dropdown contrast for IBM channel and backend selection

### Remaining Follow-ups

- [ ] Backend CORS policy must include localhost web origin for bearer IBM/key routes (external blocker)
- [ ] Backend auth/key policy review for `/v1/gates/run` 401 debugging in live env (external blocker)
- [x] Add deeper component tests for IBM dashboard interactions

## Later Enhancements (Post-3.5)

- [ ] Add per-user plan tiers/policies without changing lifecycle endpoint contracts
- [ ] Add richer dashboard analytics (usage, quota consumption, recent key events)
- [ ] Add long-term content governance checks to reduce stale claims on public-facing pages

## [API] page (deferred until after sdk55 branch merge)

- [ ] remove extra content from this page from being hardcoded to be more like the content.ts strategy I've used in landing pages such as in time2pay. https://github.com/DavidJGrimsley/time2pay/blob/main/src/app/index.tsx
- [ ] Add scroll wheel cause the page is so long
- [ ] Make endpoints section collapsible
- [ ] Make the API key dashboard collapsible.
- [ ] Make all collapsibles animate open and close (make a parent collapsible component and subclasses of that or something)


## Expo Go page
- [ ] 