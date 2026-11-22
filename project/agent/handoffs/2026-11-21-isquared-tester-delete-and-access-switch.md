# iSquared tester deletion and global access switch

status: COMPLETE

## Source

User request, 2026-11-21. Sole implementation owner is this Grok session. One PPP round before implementation. No commits, push, deploy, or implementation delegation.

## Requirements

- Permanently delete one tester from the admin dashboard, with explicit destructive confirmation.
- Remove that tester's private data and active access. Respect foreign keys and audit history. Do not delete shared data.
- One-click reversible global tester-access switch on the admin dashboard. It blocks every tester immediately, including signed-in sessions and protected APIs. Administrators can turn it back on.
- Decide and document active simulator-session behavior and any limit.
- Keep auth, CSRF, privacy, and rate limits. Migrate existing databases. Handle races and show dashboard feedback.
- Tests and development use synthetic isolated databases only. Never change a real tester database.
- Leave the preview at http://127.0.0.1:41731/ running. Do not restart it. Say if a restart is required to see the change.
- Preserve existing uncommitted work, including the personal-message fix and `project/agent/handoffs/2026-11-20-fix-isquared-personal-messages.md`.

## Baseline

- Worktree: `F:/ReactNativeApps/DavidsPortfolio-i2Workspace/DavidsPortfolio-fix-isquared-page`
- HEAD: `124f7fb` on `fix-isquared-page` (unchanged; nothing committed)
- Schema before this work: `PRAGMA user_version` 3. Migration 4 adds the access flag and retained simulator usage.

## Decisions

PPP round 1 of 1, before implementation. No OpenAI model.

- Claude Opus 5.5, high, read. Session `f965c44f-1c1c-43c0-9b74-4e8724da44eb`. `jamsession models claude` failed on Windows `fcntl`; that was not a provider failure, and the run succeeded. Gemini Hydrogen (`gemini-4-hydrogen-high`) was available and was not used.
- Grok 4.7, high, read. Session `314edec6-0d4c-48c5-af6b-2688a2ceb009`.
- Worksheet auto-logging failed with the same `fcntl` error. The sessions still returned plans.

Integrated result:

- Delete confirmation is the exact stored name after whitespace is collapsed. Case matters. The client compares the typed string strictly; the server collapses whitespace and does not run `cleanName`.
- The global switch is one click. Body is `{ testerAccessEnabled: boolean }`. It is idempotent and has no extra dialog.
- Turning access off does not revoke sessions. Turning it on adds the paused duration to `last_seen_at` only for sessions that were inside the idle window at the pause, unrevoked, unexpired, whose tester is active and unexpired. It does not extend `expires_at` and does not grant a fresh idle window.
- `POST /api/access` checks the existing rate limit first. While access is off it then returns 503 `{ error: "paused" }` for every code and does not record a failure. A full bucket still returns rate limited. Message lookup still spends its message-bucket attempt, then returns `{ message: null }` before selecting a tester.
- Logout during a pause still revokes. It looks up the unrevoked token directly and skips only the idle test while paused.
- Deletion is allowed while a simulator row is starting, active, stopping, or uncertain. One transaction snapshots provider ids, charges that tester's current-month used seconds plus unresolved reserved seconds into `beta_simulator_usage_retained`, deletes that tester's private rows, writes one `tester_deleted` event with counts only, then deletes the tester. One best-effort provider stop runs after commit. A disabled provider returns `skipped_provider_disabled` and does not use the network. An unconfirmed stop still leaves the tester deleted.
- Used seconds in the retained table are month-scoped. Reserved seconds are not, matching `calculateMonthlyUsage`. A deleted tester's unresolved reservation stays charged in later months because the row can no longer be reconciled.
- A missing `beta_access_control` row fails closed. The migration inserts access ON.

Simulator limit: the switch does not stop simulator rows or call the provider. A preview URL already delivered can keep running until the provider ends it. Info and the agreement stay public. Admin routes keep working.

## Evidence

- `npx jest --testPathPattern "scripts/__tests__/isquared-beta-" --forceExit --no-coverage`: 7 suites, 141 tests, all passed. Isolated `:memory:` and temp databases only. Includes the closed notice, the closed-code sentence, no secret leakage, desktop and phone placement, and the switch turning back on.
- Covered: version 2 and version 3 upgrades leave access on; delete isolation and exact-name confirmation; unresolved reservation charge and post-commit stop; pause, restore, logout during pause; already-idle, disabled, revoked, and expired sessions are not restored; a full login bucket stays rate limited while paused; a missing access row fails closed; signed-in prototype, session, and simulator APIs return unauthenticated while off; unknown and real codes return 503 `paused`; admin summary and dashboard stay available; re-enable restores the same tester cookie; CSRF rejection; dashboard click and typed-name gate via the admin script.
- Preview still listening: `127.0.0.1:41731`, node PID 25820. It was not restarted. The running process loaded the router and public assets at startup, so this change is not visible there until a later restart.

## Addition: closed access notice

While tester access is off, the access view shows an orange-red top-right notice, `Closed for changes.` Entering a code shows `We're glad you're here but we need to make some changes. Please come back later or contact David Grimsley.` The personal message and full-screen note stay hidden, and the lookup response is `{ message: null, closed: true }` with no secret text. Open behavior is unchanged. The page checks `/api/session` every 4 seconds and when the tab is focused, so the notice follows the switch without a manual reload. A signed-in Continue view reloads into the closed form. A parked session reloads back to Continue when access returns.

## Outcome

Implemented in this checkout and left uncommitted. The personal-message handoff and the earlier dirty `public/sitemap.xml` and `uniwind-types.d.ts` files were not part of this change and were left as they were.

No commit, push, or deploy. The preview on port 41731 was not restarted.
