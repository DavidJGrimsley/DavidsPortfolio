# Hotfix iSquared per-person messages — task worksheet

Status: COMPLETE
Task mapping: Unmapped. `project/todo.md` has no checkbox for this personal-message or fullscreen-note hotfix. `todo.md` was not changed.
Task source: user request to hotfix missing per-person special messages from freshly fetched `origin/main`, and to show the fullscreen note whether or not an individual message is set, including while access is closed, without leaking personal secrets while closed.
Implementation owner: this session (sole owner). No merge and no production deploy.

## Git
- Container: `F:/ReactNativeApps/DavidsPortfolio-i2Workspace` (i² workspace; root `.git` is not expected).
- Source checkout: `DavidsPortfolio-main`. Default branch: `main`.
- Verified `origin/main` at branch creation: `b6eece248aaf8b9adb1447f353591f78f335b11a` (Merge pull request #87 from DavidJGrimsley/test).
- Branch: `hotfix/isquared-personal-messages`.
- Worktree: `F:/ReactNativeApps/DavidsPortfolio-i2Workspace/DavidsPortfolio-hotfix-isquared-personal-messages`.
- Mobile closed-badge commit `ce872100c1292fd9f291aacd41fc979e4fdde498` is an ancestor of this base. `scripts/isquared-beta/public/beta.css` was not changed.
- Remote-deletion sweep: no local branch was deleted. Every upstream-gone branch is protected by unknown task or session ownership. Other checkouts were left in place.
- Opaque env copy from the main checkout, counts only: copied 4, skipped 0, conflicts 0, missing 1, listed 5. Contents were not read.

## Requirements reconciled
- When access is open and the tester has a non-empty personal message, that message appears with `textContent`.
- The static fullscreen sentence appears as soon as the field contains an eligible code (5–32 letters or digits). It does not wait for a personal message. It stays up when the message is empty, the code is unknown, the lookup is refused, and while access is closed.
- While access is closed, the badge is "Closed for changes." and the sentence is "We're glad you're here but we need to make some changes. Please come back later or contact David Grimsley." The personal message stays empty. The server still returns `{ message: null, closed: true }` and does not read the stored message.
- Unknown, inactive, expired, and empty codes still share `200 { message: null }` when access is on. No field was added that tells a caller a code is valid. The fullscreen sentence is the same static text for every eligible value, including before the server answers.
- A non-OK lookup (403, 429, or a network failure) does not show a personal message and does not retry by itself. The static note stays visible while the field is still eligible. The next edit, including the same letters, may ask again.
- CSRF is still required. The session poll copies a new `csrfToken` into the form and does not start a lookup. There is no lookup on init, `pageshow`, or `change`.
- Older tests and the docs said a null message and closed access hid the fullscreen note. That conflicted with the latest fullscreen instruction. The note is static page text, not a personal secret, so those expectations were updated. Personal-message suppression while closed was kept.

## Jam Session
- Launch was authorized for xAI, Google, and Anthropic on this repository, excluding secrets. No OpenAI model was used.
- Gemini Hydrogen: provider `agy`, model `gemini-4-hydrogen-high`, effort high, edit transport. Session `8f216498-fddb-4be1-8284-d4a922832a86`. Independent draft completed. Its suggestion to call `scheduleLookup` on init was not accepted.
- Grok: provider `grok`, model `grok-4.7`, effort high. Session `26887d46-b0c0-4fa9-8216-14c08234879f`. Independent draft completed. The static note now shows for every eligible code, including a refused lookup, which was the supported part of that draft. Its advice not to retry a refused code until the normalized value changes was not accepted, because a stuck `activeCode` was a confirmed reason a later edit never asked again. Its advice not to restart the local preview was not accepted; the user required that restart.
- Claude Opus: provider `agy`, model `claude-opus-5-5-high`, effort high. Session `cd655825-b338-4dd6-b32e-0732f8a7aac8` failed immediately with `RESOURCE_EXHAUSTED`. Native Claude was unavailable. Opus was not retried.
- Worksheet logging could not append because Jam Session's Windows `fcntl` import failed. Session ids are recorded here instead.
- The formal resume challenge was not sent. The Grok process had not exited, and the Hydrogen session was past 250k tokens. This is one pair of independent drafts plus owner integration, not a completed resume round.

## Diagnosis
On `b6eece248aaf8b9adb1447f353591f78f335b11a`, an open-access tester with a stored message did show that message after an 800 ms pause. The fullscreen note was hidden unless the personal message was non-empty, and it stayed hidden while access was closed. A refused lookup also left `activeCode` set, so typing the same letters again did not ask. The session poll did not refresh a replaced CSRF token.

## Validation
- `node --check scripts/isquared-beta/public/login.js`
- `git diff --check`
- `npx jest --testPathPattern "scripts/__tests__/isquared-beta-" --forceExit --no-coverage`: 7 suites, 144 tests, all passed
- `npx expo-doctor`: 21/21 checks passed
- Headless Chrome at `http://127.0.0.1:41731/iSquared/` against the disposable database `C:/Users/DJLeg/AppData/Local/Temp/isquared-local-preview/data/beta.sqlite`:
  - Slow entry of `NOTEDEMO` shows the fullscreen note at five characters, before any lookup, then the demo personal message after the pause. One lookup.
  - Paste of `OTHERDEMO` clears the first message immediately and then shows the second message. Returning to `NOTEDEMO` restores it from the page cache with no new lookup.
  - `NOBODY7` shows only the fullscreen note. `ABCD` and an empty field show neither.
  - Refresh hides both until the code is entered again.
  - With access off, `NOTEDEMO` shows the badge, the closed sentence, and the fullscreen note, sends no personal-message request, and the response is `{ message: null, closed: true }` with no demo text. At 390px the badge stays inside the card.
  - Access was turned back on. `NOTEDEMO` shows both notes again.

## Local preview
- URL: `http://127.0.0.1:41731/iSquared/`
- Synthetic tester: Fullscreen Demo, code `NOTEDEMO`, message "This demo note is only for the local fullscreen check."
- Second synthetic tester: Second Demo, code `OTHERDEMO`, message "A second demo note with different text."
- The preview process serves this worktree and the disposable database. `dist/` in the hotfix worktree is a gitignored junction to the existing preview build so `server.js` can pass its build check. The iSquared page and `login.js` come from this hotfix.
- Tester access was left on. The scheduled task `DavidsPortfolio-iSquared-local-preview` was already disabled and was not changed.

## Publication
- Pull request: https://github.com/DavidJGrimsley/DavidsPortfolio/pull/88 against `main`. Not merged. Production was not deployed.

## Limits
- A refused lookup still hides the personal message. Login-failure buckets can still suppress lookups.
- The page does not look up a code on its own after refresh.
- Opus was unavailable. The Jam Session resume round was not completed.
- The hotfix worktree has no production `dist` of its own. The junction is local only.
