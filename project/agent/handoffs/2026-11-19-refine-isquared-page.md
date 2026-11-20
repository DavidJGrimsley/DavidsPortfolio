# Refine iSquared access and info pages — immutable implementation handoff

Task mapping: Unmapped. Exact task is the direct user request in this chat; no roadmap checkbox or heading has been invented or changed.
Control repository: F:/ReactNativeApps/DavidsPortfolio-i2Workspace/project
Control remote: git@github.com:DavidJGrimsley/DavidsPortfolio-project.git
Control roadmap: [todo.md](https://github.com/DavidJGrimsley/DavidsPortfolio-project/blob/bd3582c20325fa95052307710ed1e46fe62d8b56/todo.md)
Source repository: https://github.com/DavidJGrimsley/DavidsPortfolio
Branch: refine-isquared-page
Worktree: F:/ReactNativeApps/DavidsPortfolio-i2Workspace/DavidsPortfolio-refine-isquared-page
Chosen task base: origin/test
Immutable base SHA: 7e6ce8d940fc4e97f076ed24de4a373e5d91668f
Manifest final-base default: origin/main (observed 16a200028058345058ab3a6c53aa3576456c31c7)
Task dependencies: existing private-beta router and external hosted prototype archive. No prerequisite PR head selected. Base commit subject references PR #81, but no independent PR provenance claim is needed or made for this direct user task.
Goal: make the access screen concise and revisitable, with separate public information and protected prototype addresses.

Recommended worker: Tier 2 — Anthropic Claude Opus 5.5 medium — bounded implementation from a completed cross-family PPP plan, preserving access-control contracts; continue the existing source-informed session.

## Planning provenance
One complete PPP round: OpenAI/Codex gpt-6.1-sol high session 01a1f5a6-0631-7cf3-9491-4015db6b51e9 provided an independent draft from verified supplied excerpts and challenged the candidate; Anthropic/Claude Opus 5.5 high session d9f8fa5a-513e-403b-8faf-a741f1d7ad87 independently inspected source and integrated supported corrections.
Final decision owner: coordinator in current chat.
Material resolution: omit an extra signed-in identity/signout panel on the main page to honor the user's minimal-content requirement.
Final correction to the integrating draft's code snippet: protected-navigation forms without fixed data-next must call window.location.reload(), literally, rather than assemble pathname + search.

## Accepted implementation
- Keep /iSquared/ as a public access document for GET/HEAD, even authenticated and regardless of Accept.
- Unauthenticated main: existing logo/brand i2 | Infinite Intelligence; heading "iSquared Agentic IDE Private Preview"; exact plain caption "iSquared will be open source. For now, I’m sharing this prototype with a small number of people."; code input inline with pledge checkbox on desktop, responsive stacking; submit below shared row; More info button below section. Remove Access code section heading and redundant introductory lead. Keep accessible associated label, escaped pledge, hidden agreement/CSRF attributes, personal-message/fullscreen notes and errors.
- Authenticated main: same header/caption and Continue to prototype link plus More info; no code re-entry or new pledge requirement, no automatic auth redirect.
- /iSquared/Info is public and preserves complete About this prototype, Explore the code, all repository/portfolio links and inspiration modal. Back to access page link.
- /iSquared/Prototype is explicitly protected entry-document delivery; authenticate before filesystem resolution, then reuse resolvePrototypeFile('/') and sendPrototypeFile. Do not rely on HTML Accept SPA fallback.
- Preserve source absence503 versus missing index404, and authenticated GET-only visit recording; root, Info, HEAD and assets do not count visits.
- Canonicalize reserved Info/Prototype suffixes plus mount case in a single308, preserve query, and never lowercase asset suffixes. Recognized document aliases must reject unsupported methods405 with Allow: GET, HEAD before redirect.
- Root form data-next is fixed /iSquared/Prototype; successful login replaces to that fixed path plus current query. Existing protected-navigation forms omit data-next and use literal location.reload().
- Authenticated Continue may preserve current query only as constant prototype path + URL.search, escaped into HTML.
- Keep /iSquared/ as asset/API/cookie base. Preserve legacy protected /assets, index.html, SPA fallback, admin, signout, simulator and all security headers, CSRF/agreement/session rules.
- Move inspiration modal initialization out of access-form guard, preserving open, close, Escape/backdrop and iframe-src cleanup behavior. Signout Back to prototype link becomes /iSquared/Prototype.

## Owned files and exclusions
Allowed implementation files:
- scripts/isquared-beta/routes.cjs
- scripts/isquared-beta/pages.cjs
- scripts/isquared-beta/public/login.js
- scripts/isquared-beta/public/beta.css
- scripts/__tests__/isquared-beta-routes-test.js
- scripts/__tests__/isquared-beta-login-test.js
- docs/isquared-private-beta.md

No server.js change is required; its existing mount receives all paths.
Do not change config, service, database/schema, agreement files, simulator, external prototype repository/archive, package dependencies, global test setup, project/TODO.md or control roadmap.
Do not read .env, credentials, private beta databases, unrelated repositories or provider stores.
No deployment/push/merge/implementation commit authority. Preserve the bootstrap commit, worksheet, immutable handoff and ignored fixtures. Do not recursively delegate.
Stop on unexpected foreign edits, Git conflicts/locks, or missing authority; preserve state.

## Validation and expected completion evidence
Baseline: 7 focused Node suites, 102 tests passed. Default Expo Jest setup fails before tests on missing react-native-worklets/lib/module/mock; do not fix unrelated setup.
Existing dependencies are available through ignored node_modules junction. Coordinator supplied ignored temp/isquared-jest.config.cjs and temp/isquared-preview.cjs.
Commands:
- node --check scripts/isquared-beta/routes.cjs
- node --check scripts/isquared-beta/pages.cjs
- node --check scripts/isquared-beta/public/login.js
- node node_modules/jest/bin/jest.js --config temp/isquared-jest.config.cjs --runInBand
- node node_modules/eslint/bin/eslint.js scripts/isquared-beta/routes.cjs scripts/isquared-beta/pages.cjs scripts/isquared-beta/public/login.js scripts/__tests__/isquared-beta-routes-test.js scripts/__tests__/isquared-beta-login-test.js
- git -C "F:/ReactNativeApps/DavidsPortfolio-i2Workspace/DavidsPortfolio-refine-isquared-page" diff --check

Meaningful tests: root unauth/auth/no-Accept, minimal/moved content, fixed root continuation/query and literal deep reload, Info no form/CSRF cookie and modal works without form, case/trailing slash/query and unsupported alias methods, Prototype GET/HEAD/no-Accept, missing archive/entry distinction behind auth, root/Info visits excluded, protected assets/traversal/SPA fallback/admin/simulator retained, signout link.
Coordinator will independently inspect full diff, compare moved content, run tests/checks and desktop/mobile browser flow with synthetic tester/in-memory DB, plus task-base three-dot summary and direct final-base comparison.

## External compatibility limit
Known source default archive path is absent. The hosted build is documented with /iSquared/ absolute asset base and state in memory/query, supporting document aliasing. Fixtures cannot prove all runtime navigation in the actual external prototype works at /Prototype. Real-archive initial load, refresh, internal links, query state and simulator smoke remain pending before deployment. Do not claim that check passed or add a server-side browser-history shim.
