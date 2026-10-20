# Recent portfolio case studies

Research and validation recorded October 20, 2026. Changes are in the prepared `feature/add-recent-portfolio-projects` worktree. No other project source, package identifiers, or deployment configuration was changed.

## Editorial decisions

- Nine focused case studies use the existing category/detail layout. Quasicombo is the only homepage feature; the two previous featured entries remain in the portfolio.
- The Unreal and AR Qubit versions have separate pages and correct source/download links. XR Showcase, Medimagen, Neo, and AR Qubit currently share the XR repository and TestFlight build.
- Football Game is a separate ReactVision Studio scene. Its page does not claim it is in XR Showcase or link it to the shared TestFlight build.
- iSquared (name pending) covers the delivered MDS tools and clearly labels broader environment screenshots as design prototypes. Example project metrics and sessions in those screenshots are illustrative.
- Medimagen describes anatomy and scan-slice work separately from the experimental GPU volume renderer, which remains unverified on iPhone.
- New case studies do not show the legacy unfinished-portfolio-page banner. Product prototype/development status is explained in their narratives. Existing entries retain their original progress flags.

## Evidence and integration wording

- Quasicombo: [public project description](https://github.com/DavidJGrimsley/Quasicombo/blob/main/Project/Info.md), [credits](https://github.com/DavidJGrimsley/Quasicombo/blob/main/Project/credits.md), source gameplay/music controllers, local captures, and both supplied jam records. Route crossings form an ordered braid; Quantum API evaluation influences boss/QTE setup, and time evolution supports changes during combat. The Moth Blur engine was used for processed piano variants; this is not described as a live Moth API call during gameplay.
- Quasicombo credits: David Grimsley (game development), Toka Abdelaziz / Taika Iltiqat (narrative and graphics), Yoshi (background music), s1gnal (sound effects), Maja (quantum consultation). Licensed editable assets are excluded from the public source; the Windows runtime is separately downloadable.
- Time2Pay: current source README, database provider/tour implementation, project notes, and owner-supplied demo images. Avoided pricing claims because older project notes and newer implementation differ.
- XR experiences: source README, experience catalog, AR/session code, arena multiplayer controllers, medical asset transforms, Quantum SDK service and round controller, project notes, and the organizer’s Ctrl+Space gallery.
- Qubit: simulator rotation/measurement and asynchronous hardware-job flows are distinguished. Unreal uses the Unreal plugin; AR uses the TypeScript SDK. No new measurements or paid hardware jobs were submitted for this portfolio task.
- Awards: the Ctrl+Space organizer gallery identifies Neo as second place, Medimagen and AR Qubit as finalists, and Football Game as Best No-Code (Studio). The game-jam and Moth records confirm submissions, not awards.

## Per-project link inventory

HTTP checks returned 200 for 22 of 23 unique external destinations. HTTP reachability does not prove installation availability, video playback on every device, or access inside a signed-in Studio session. Time2Pay failed TLS verification with `CERT_HAS_EXPIRED`; no bypass or hosting change was made.

### Time2Pay

Portfolio route: `/portfolio/mobile-apps/time2pay`.

- [Open Time2Pay](https://time2pay.app) — CERT_HAS_EXPIRED.
- [View source on GitHub](https://github.com/DavidJGrimsley/time2pay) — HTTP 200.

### XR Showcase

Portfolio route: `/portfolio/mobile-apps/xr-showcase`.

- [View source on GitHub](https://github.com/DavidJGrimsley/xr-showcase) — HTTP 200.
- [Try XR Showcase on TestFlight](https://testflight.apple.com/join/4UugyD8Y) — HTTP 200.
- [View the Ctrl+Space gallery](https://separated-cornet-eaf.notion.site/fcc70ea37156823b9026015194acaf43?v=37670ea37156826f9686882e2e3624fd) — HTTP 200.

### Medimagen

Portfolio route: `/portfolio/mobile-apps/medimagen`.

- [View the shared XR Showcase source](https://github.com/DavidJGrimsley/xr-showcase) — HTTP 200.
- [Try XR Showcase on TestFlight](https://testflight.apple.com/join/4UugyD8Y) — HTTP 200.
- [Watch the Medimagen demo](https://www.youtube.com/shorts/TQKk3C_ra0Q) — HTTP 200.
- [View the finalist entry](https://separated-cornet-eaf.notion.site/Medimagen-24470ea3715683e4aff301d0a34edf21) — HTTP 200.

### Guess the Qubit — AR

Portfolio route: `/portfolio/mobile-apps/guess-the-qubit-ar`.

- [View the AR source in XR Showcase](https://github.com/DavidJGrimsley/xr-showcase) — HTTP 200.
- [Try XR Showcase on TestFlight](https://testflight.apple.com/join/4UugyD8Y) — HTTP 200.
- [Watch the AR demo](https://www.youtube.com/shorts/vVACYtnPqNc) — HTTP 200.
- [View the finalist entry](https://separated-cornet-eaf.notion.site/Guess-the-Qubit-f1670ea3715683088c3e01f7901276c5) — HTTP 200.

### Quasicombo

Portfolio route: `/portfolio/game-design/quasicombo`.

- [Get Quasicombo on itch.io](https://mrdj2u.itch.io/quasicombo) — HTTP 200.
- [View source on GitHub](https://github.com/DavidJGrimsley/Quasicombo) — HTTP 200.
- [Download the Windows release](https://github.com/DavidJGrimsley/Quasicombo/releases/tag/release-2026-10-10) — HTTP 200.
- [View the Quantum Game Jam entry](https://itch.io/jam/quantum-game-jam-2026/rate/5061244) — HTTP 200.
- [View the Moth Hack entry](https://airtable.com/appfaqE6MpACGX3LN/shrKxNCu6BKEnDRVs?bEHV2=allRecords&detail=eyJwYWdlSWQiOiJwYWdoWnN1YzFERmRxeVFweiIsInJvd0lkIjoicmVjcU42WXlZVlBUNVJOWjEiLCJzaG93Q29tbWVudHMiOmZhbHNlLCJxdWVyeU9yaWdpbkhpbnQiOnsidHlwZSI6InBhZ2VFbGVtZW50IiwiZWxlbWVudElkIjoicGVsQ0pZYlE0ZGhBTmJqZ0wiLCJxdWVyeUNvbnRhaW5lcklkIjoicGVsNEVPbWVZZFhDYkVIVjIifX0) — HTTP 200.
- [Watch the Moth Hack demo](https://youtu.be/EUcPGIPwvgI) — HTTP 200.

### Neo Rock ’Em Sock ’Em Robots

Portfolio route: `/portfolio/game-design/neo-rock-em-sock-em-robots`.

- [View the shared XR Showcase source](https://github.com/DavidJGrimsley/xr-showcase) — HTTP 200.
- [Try XR Showcase on TestFlight](https://testflight.apple.com/join/4UugyD8Y) — HTTP 200.
- [Watch the robot boxing demo](https://youtu.be/eoelgVtbo08) — HTTP 200.
- [View the second-place entry](https://separated-cornet-eaf.notion.site/Neo-Rock-Em-Sock-Em-Robots-3df70ea37156832d901f81a25e851ad5) — HTTP 200.

### Guess the Qubit — Unreal

Portfolio route: `/portfolio/game-design/guess-the-qubit-unreal`.

- [View source on GitHub](https://github.com/DavidJGrimsley/guess-the-qubit) — HTTP 200.
- [Download the Windows demo](https://github.com/DavidJGrimsley/guess-the-qubit/releases/tag/v0.1.0-demo) — HTTP 200.

### Football Game

Portfolio route: `/portfolio/game-design/football-game`.

- [Watch the Football Game demo](https://youtu.be/f1O2cW_A6hY) — HTTP 200.
- [Open the ReactVision Studio scene](https://studio.reactvision.xyz/scene/0f433f69-2f26-4b13-ba18-1c715406e47e) — HTTP 200.
- [View the award entry](https://separated-cornet-eaf.notion.site/Football-Game-d6f70ea3715683cd864401c4feb623b2) — HTTP 200.

### iSquared (name pending)

Portfolio route: `/portfolio/software-development/isquared`.

- [Explore Mr. DJ’s Dev Suite on GitHub](https://github.com/DavidJGrimsley/mrdj-dev-suite) — HTTP 200.

## Image provenance

All delivered media is local WebP under `public/img/recent-projects/`. Original owner files remain intact. Images were resized without enlargement and window borders were cropped where appropriate. The logo recording is represented by a still; galleries advance through explicit, keyboard-accessible image buttons.

| Delivered image | Source |
| --- | --- |
| quasicombo-menu.webp | Local Unreal capture: `Quasicombo-HUD/Saved/MenuValidation/home-1080p.png` (window border cropped) |
| quasicombo-customization.webp | Local Unreal capture: `Quasicombo-HUD/Saved/MenuValidation/customize-swatches-1080p.png` (window border cropped) |
| quasicombo-gameplay.webp | Local Unreal capture: `Quasicombo-time-evolution/Saved/BossApproachValidation/RouteTimestamp/Rendered/clean_gameplay_hud.png` (window border cropped) |
| quasicombo-boss.webp | Local Unreal capture: `Quasicombo-time-evolution/Saved/BossApproachValidation/Rendered/transformation_finished.png` |
| quasicombo-qte.webp | Local Unreal capture: `Quasicombo-level-design/Saved/BossFixValidation/NormalViewport.png` (window border cropped) |
| time2pay-sessions.webp | Owner supplied: `temp/Pics/Time2pay/Screenshot 2026-10-20 135132.png` |
| time2pay-milestones.webp | Owner supplied: `temp/Pics/Time2pay/Screenshot 2026-10-20 135418.png` |
| time2pay-logo.webp | Owner supplied: `temp/Pics/Time2pay/Recording 2026-10-20 135236.gif` |
| qubit-unreal.webp | Owner supplied: `temp/Pics/GuessTheQubit/UnrealEngineQubit.png` |
| medimagen-alignment.webp | Owner supplied: `temp/Pics/Medimagen/AligningIn3dSlicer.png` |
| medimagen-brain-preparation.webp | Owner supplied: `temp/Pics/Medimagen/BrainIn3dSlicer.png` |
| medimagen-skull-preparation.webp | Owner supplied: `temp/Pics/Medimagen/CleaningUpSkull3dSlicer.png` |
| medimagen-anatomy.webp | Local XR workspace: `temp/medical-brain-both-preview.png` (prepared-model preview) |
| neo-assets.webp | Owner supplied: `temp/Pics/rockemSockem/AppropriatingAssetsAndAnimationsToWorkWithReactVision.png` |
| neo-menu.webp | Owner supplied: `temp/Pics/rockemSockem/StarMenu.png` |
| isquared-home.webp | Local MDS workspace: `i2-phase1-home-desktop.png` (design prototype / artwork) |
| isquared-project.webp | Local MDS workspace: `i2-phase1-project-desktop.png` (design prototype / artwork) |
| isquared-session.webp | Local MDS workspace: `i2-phase1-session-app-desktop.png` (design prototype / artwork) |
| isquared-mobile.webp | Local MDS workspace: `i2-phase1-home-mobile.png` (design prototype / artwork) |
| infie.webp | Local MDS workspace: `generated/infie-prototype/renders/infie-hero.png` (design prototype / artwork) |
| neo-ar.webp | Published demo [thumbnail](https://i.ytimg.com/vi/eoelgVtbo08/maxresdefault.jpg), [video](https://www.youtube.com/watch?v=eoelgVtbo08). |
| medimagen-ar.webp | Published demo [thumbnail](https://i.ytimg.com/vi/TQKk3C_ra0Q/maxresdefault.jpg), [video](https://www.youtube.com/watch?v=TQKk3C_ra0Q). |
| qubit-ar.webp | Published demo [thumbnail](https://i.ytimg.com/vi/vVACYtnPqNc/maxresdefault.jpg), [video](https://www.youtube.com/watch?v=vVACYtnPqNc). |
| football-ar.webp | Published demo [thumbnail](https://i.ytimg.com/vi/f1O2cW_A6hY/maxresdefault.jpg), [video](https://www.youtube.com/watch?v=f1O2cW_A6hY). |
| quasicombo-card.webp | Square crop of the locally captured `transformation_finished.png` for the featured/category card. |

## Validation

- `npm ci`: passed with the existing lockfile. npm reported 82 dependency advisories (2 low, 18 moderate, 60 high, 2 critical); dependency upgrades are outside this content change.
- `npm run lint` and `npm run typecheck`: passed.
- `npm run test:ci -- --runInBand`: 27 suites, 146 tests passed. Coverage includes new link labels, canonical/explicit related destinations, image selection, web embeds, all nine entries, assets, and homepage selection.
- `npx expo-doctor`: 20/21 checks passed. Its existing SDK patch-version check expects expo ~57.0.30 (installed 57.0.25), expo-constants ~57.0.22 (57.0.19), expo-linking ~57.0.13 (57.0.11), expo-router ~57.0.28 (57.0.23), expo-splash-screen ~57.0.10 (57.0.9), and jest-expo ~57.0.6 (57.0.5). No dependency changes were made.
- `npm run build:web:deploy`: passed using process-only public configuration: `EXPO_PUBLIC_QUANTUM_API_BASE_URL=https://davidjgrimsley.com/public-facing/api/quantum/v1` and `EXPO_PUBLIC_SITE_ORIGIN=https://davidjgrimsley.com`. The first attempt without the required public API setting failed; no private env file was created or read.
- Generated sitemap contains all nine new routes (42 URLs total).
- Production preview: all nine details, homepage, and three affected category indexes returned HTTP 200 at 1440×1000 and 390×844, with one H1 per page, correct canonical/OG metadata, no horizontal scrolling, and no application JavaScript errors.
- Real keyboard checks: Tab advances through labeled external links; Enter follows related Quantum API and iSquared links. Gallery selection changes the displayed image and its accessible description.
- Visual checks covered supplied screenshots, optimized images, responsive titles, readable stacked mobile buttons, and web video sizing. The browser video path now uses a titled responsive YouTube embed rather than a native message-bridge wrapper.
- `git diff --check`: passed. Existing case-study fields were compared to the baseline; only requested featured flags, related-link repairs, and invalid JSON escapes changed in those entries.
- Pre-commit MDS Doctor (fast profile, scripts disabled): zero errors, five warning groups concerning existing project-memory, route architecture/safety, API CORS, and motion-budget findings. Script validation is recorded separately above. The memory warning inspects the legacy source-local project folder; canonical memory remains in the sibling workspace control repository.
- Native device rendering and third-party app installation were not tested. Deployment and merging are separate actions from submitting these changes for review.
