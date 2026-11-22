# Fix iSquared signed-out personal messages — task worksheet

Status: COMPLETE (uncommitted; awaiting user review). Production data/environment checks remain for the user (see Remaining).
Task source: direct user request (repair secret/personal messages on the signed-out iSquared access form). Unmapped to any roadmap checkbox.
Worktree: F:/ReactNativeApps/DavidsPortfolio-i2Workspace/DavidsPortfolio-fix-isquared-page
Branch: fix-isquared-page
Base SHA: 124f7fbbd89208e58d39a9f13a40fdd5dde38bc6
Implementation owner: Anthropic Claude Opus 5.5 (this session). No push, merge, deploy or commit authority. OpenAI models not used.
Exclusions honored: no .env, credentials, private tester databases, unrelated repositories, provider stores, network or production changes. Synthetic tester data only.

## Reported state
User screenshot: signed-out access form with a populated access code, unchecked pledge, and no personal message. An authenticated-only explanation cannot account for it.

## Planning provenance (Ping-Pong Planning, one round)
- Claude independent planning session f35913ca-64f6-49e4-be4d-695ccf9a8894 (coordinator summary): lookup fires on `input` after 250 ms, text-safe, subject to message availability and rate limiting.
- Google session f0dc635e-2a59-4de9-9c17-2c15cee0fd91: exited without a usable answer.
- xAI Grok session 6449d8ac-9da5-495e-8df1-f1f3276439e1 (grok-4.7, process 70468): independent signed-out investigation. Read with `grok export` because `jamsession recall` fails on Windows (`ModuleNotFoundError: No module named 'fcntl'`). That failure also stopped jamsession logging the challenge in this worksheet's Jam Session log.
- Read-only verification: after the first Grok run and again after the challenge resume, all seven coordinator SHA256 hashes and the index hash matched. `git status` was clean apart from ignored `temp/` and then this worksheet.
- Challenge round: Grok was resumed once (`jamsession message ... --resume-with grok-4.7 high edit`, read-only instructions) on Claude's browser evidence and its candidate (schedule the lookup on init, on `pageshow` and on `change`, with dedupe). Grok rejected `change`: typing and paste already fire `input`, and `change` would only add blur flicker and extra spend. It showed that the proposed dedupe had to run before `clearLookup` and must not block backspacing to an earlier value. It noted that init and `pageshow` do not fix a silent value set after load, and that Chrome does not restore the field on back or reload. It confirmed there was no privacy regression and flagged proxy-hop collapse as a production mechanism.
- Integration (Claude): accepted all of Grok's rejections and dropped init, `pageshow` and `change`. A further experiment run after the challenge found the defect below. Grok's guidance shaped the fix: skip before clear, keep `input` rescheduling unconditional for real edits, and never retry a settled answer on a non-edit. Grok did not review the final debounce/cache design itself.

## Root cause (demonstrated)
`login.js` debounced the lookup by only 250 ms and treated the raw value as the key. Typing a 12-character code at a normal 300 ms/key cadence sent one rate-limited lookup per pause, one per prefix of 5 or more characters plus a duplicate after a hyphen: 9 lookups per entry. The server counts every lookup, including hits, against `message:client` (20 per IP per 15 minutes), and 429 is shown as nothing by design. As a result, the third entry of the code within 15 minutes silently showed no message. Measured in headless Chrome on a synthetic preview at HEAD: rounds 1–2 returned 9×200 with the message shown; round 3 returned 200,200 then 7×429 with no message; round 4 returned 9×429. The screen then showed a populated code, an unchecked pledge and no message, matching the screenshot.

## Change
- `scripts/isquared-beta/public/login.js`:
  - Lookups wait for an 800 ms typing pause.
  - The key is the server-normalized code (spaces/hyphens stripped, uppercased).
  - Spacing, hyphen or case-only edits keep the armed, in-flight or shown lookup.
  - Settled 200 answers, including "no message", are reused on this page without a request.
  - 403, 429 and network failures are not cached, and a real edit asks again.
  - Request body now sends the normalized code. The server normalizes identically.
  - Unchanged: CSRF header, abort and version guard, `textContent` rendering, silent non-OK/null, submit flow, markup, CSS and server.
- `scripts/__tests__/isquared-beta-login-test.js`: the existing stale-response test was retimed to 800 ms. Added 5 tests: one lookup for a long code typed at 300 ms/key; no re-request or hide on spacing/hyphen/case edits; reuse of settled answers, including null; refused 429/403 shows nothing and a real edit retries; non-code values never fetch. The first three fail against HEAD's `login.js` and the last two guard existing safety behavior.
- `docs/isquared-private-beta.md`: personal-messages paragraph now explains the pause, the per-code request and why rate limits can hide a message.

## Evidence
- `node --check scripts/isquared-beta/public/login.js`: OK.
- Focused Jest (`node node_modules/jest/bin/jest.js --config temp/isq-fix/jest.config.cjs --runInBand`): baseline 7 suites/114 passed; final 7 suites/119 passed.
- New tests against HEAD `login.js` (temporarily swapped, then restored and byte-compared): 3 failed (long-code once, format edits, settled reuse) and 8 passed.
- `git diff --check`: clean. Only a warning remains: the test file is LF in the working copy; the index is LF and autocrlf normalizes it.
- ESLint on the two changed JS files reports only pre-existing categories present at HEAD: `no-var` in the browser IIFE, which uses `var` throughout, and Jest/Node globals (`no-undef`) that the repo config does not define for tests. No new rule categories.
- Headless Chrome (CDP, disposable in-memory preview, synthetic testers DEMO7 and ABCD-EFGH-JKMN):
  - After the fix: typed and paste-like entry show the message as text (`<b>` literal), with the pledge unchecked and submit disabled. Back and reload leave the field empty, as at HEAD. A silent value set still sends no lookup, as at HEAD. An unknown code shows nothing.
  - Lookups per 12-character entry over 4 rounds: 1 at 150 ms/key, 1 at 300 ms/key, 2 at 500 ms/key. All returned 200 and the message showed every round. At HEAD the same 300 ms/key run went silent from round 3.
  - Desktop 1280×900 and mobile 390×844 screenshots show the message and fullscreen note below the code/pledge row with no horizontal overflow (`temp/isq-fix/access-*-message.png`, ignored).
  - Sign-in with the pledge checked continued to `/iSquared/Prototype?s=q1`, and the protected asset loaded.

## Remaining / limitations
- Very slow entry (pauses over 800 ms between keys) can still spend several lookups. Server limits were deliberately not changed.
- A value inserted without any `input` event is still not looked up (Grok's point). Chrome does not restore this field on back or reload, and no real filler observed here does this, so no polling was added.
- Production causes not checkable from source, and not inspected per the exclusions. The user should check, through authorized administration:
  - that the tester's code is active and unexpired and has a message set (`npm run isquared:beta -- set-message ...`);
  - that the visitor IP had no 8+ failed logins in 15 minutes, which also blocks lookups;
  - that `ISQUARED_TRUSTED_PROXY_HOPS` matches the proxy chain (docs §10); a wrong value collapses all visitors into one message/login bucket;
  - that the deployed `login.js` is this version.
- No commit, push, merge or deployment was made.

## Files changed
- scripts/isquared-beta/public/login.js
- scripts/__tests__/isquared-beta-login-test.js
- docs/isquared-private-beta.md
- project/agent/handoffs/2026-11-20-fix-isquared-personal-messages.md (this worksheet)
- Ignored local tooling only: `node_modules` junction → DavidsPortfolio-main/node_modules; `temp/isq-fix/` (jest config, synthetic preview, CDP driver, repro/screenshot scripts). The preview server has been stopped.

## Jam Session log
