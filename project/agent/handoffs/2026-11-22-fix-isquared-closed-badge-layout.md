# Closed-for-changes badge placement

status: COMPLETE

Task mapping: Unmapped

## Source

Direct user bug request, 2026-11-22. The "Closed for changes." notice sat on the top border of the private preview card. It must sit inside that card, near the top right, on desktop and mobile. Orange-red appearance and access-switch behavior stay as they are. Wrap-up commits this change, pushes the branch, and opens a pull request against `test`. It does not merge.

## Base

- Branch: `fix/isquared-closed-badge-layout`
- Worktree: `F:/ReactNativeApps/DavidsPortfolio-i2Workspace/DavidsPortfolio-fix-isquared-closed-badge-layout`
- Base: freshly fetched `origin/test` at `471c325c6c956b8472e6e929128689913c1c2ab5` (Merge pull request #84). `git ls-remote origin refs/heads/test` returned that same SHA.
- `origin/main` is `70d21650640a04f86407c65a0c067b02dceb1ddf`. `git diff origin/test origin/main` is empty. This branch is not a production hotfix. The pull request targets `test`.
- No donor `.env` files existed in the source checkout. Examples were not copied. Env files copied: 0.
- Pre-existing worktrees and the source checkout were not edited. Local branches whose upstream is gone were left in place.

## Change

The notice was already the first element inside `#access-view`, with `position: absolute`. The shell fade keeps a transform, so the badge was positioned against the shell and crossed the card border. `.card-access` is now `position: relative`, which makes the card the containing block. Color `#ff7a4a`, border, inset, and the closed padding that clears the header are unchanged. `login.js` and the access-switch markup were not edited.

## Evidence

- `npx --yes -p jest@29.7.0 jest --config <temp node config with transform disabled> --runInBand --forceExit` from this worktree: `scripts/__tests__/isquared-beta-access-layout-test.js` passed, 4 tests. `git diff --check` reported no whitespace errors.
- After `npm ci` in this worktree, `mds doctor --ci` finished with 0 errors, 6 pre-existing warnings, 13 passes, and 1 skipped full-build profile. Lint, typecheck, `npm run test`, Expo doctor, and `npm run build:web:deploy` passed. The web build used the public CI value `EXPO_PUBLIC_QUANTUM_API_BASE_URL=https://davidjgrimsley.com/public-facing/api/quantum/v1`. The first Doctor run failed only because dependencies were absent, and the second failed only because that public URL was unset.
- Headless Chrome rendered `renderLoginPage` with `testerAccessEnabled: false` and synthetic agreement text. No production database. CSS viewport results:
  - 1280×1000: badge inside the card, 11.1px above the brand, no overlap. Text `Closed for changes.`
  - 390×844: badge inside the card, 24.5px above the brand, no overlap. Text `Closed for changes.`
  - 320×900: badge inside the card while the brand wraps, 24.5px gap, no overlap.
- Screenshots: `C:\Users\DJLeg\AppData\Local\Temp\isquared-closed-badge-desktop.png`, `isquared-closed-badge-mobile.png`, `isquared-closed-badge-narrow.png`.

## Limitations

- Task mapping is Unmapped, so `todo.md` was not changed.
- This wrap-up does not merge the pull request or enable auto-merge.
- Screenshots use the rendered access page and CSS with synthetic closed-access data. A local measurement node used for geometry is not part of the page.
- `public/sitemap.xml` and `uniwind-types.d.ts` showed stat changes after the web build and were left unstaged.
