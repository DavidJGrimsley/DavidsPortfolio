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

### Consistency and Maintainability

- [ ] Reconcile Quantum API base URL messaging (`/api/quantum` vs `/public-facing/api/quantum`)
- [ ] Reconcile request schema wording/examples (`gate` vs `gate_type`) in API docs page content
- [ ] Remove stale "no auth/no API keys" copy before Phase 3.5 rollout
- [ ] Split large public-facing files into smaller maintainable modules

## Phase 3.5 / 3.75 - Portfolio Integration for Real API Key Management

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
- [ ] Cutover plan for deprecating env-based keys is approved and documented
- [x] Phase 3.5 implementation can begin without unresolved planning gaps

## Later Enhancements (Post-3.5)

- [ ] Add per-user plan tiers/policies without changing lifecycle endpoint contracts
- [ ] Add richer dashboard analytics (usage, quota consumption, recent key events)
- [ ] Add long-term content governance checks to reduce stale claims on public-facing pages
