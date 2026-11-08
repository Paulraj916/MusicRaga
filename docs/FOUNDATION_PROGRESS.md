> Historical foundation snapshot. Superseded by PROGRESS.md; retain as an implementation record, not current feature status.

# Delivery status · 8 November 2026 (Asia/Kolkata)

## Completed and exercised

- Working responsive React/TypeScript application with premium warm-paper/terracotta artwork, locally bundled Inter/Noto fonts, dark theme and reduced-motion support.
- Discovery, Unicode/native-title search, exact compound filtering, chronological/title sorting, truthful no-results views and an explicit no-real-artist-catalogue explanation.
- 96 unique meaningful dimensions: **48 populated/enabled in this demo, 48 unavailable/disabled**. All 96 run through the same tested filtering engine when values exist.
- 12 original, clearly fictional catalogue tracks across Tamil/Hindi/Telugu with three lyric variants; shared four-line original exercise, artificial timing, no commercial audio/lyrics or fabricated real credits.
- Focus-managed lyric reader, accessible tab keyboard interaction, readable script fonts, adjustable size, clipboard action and direct demo song links.
- Silent karaoke practice, tested generated local WAV playback, metadata-driven duration, timed LRC loading, seeking and manual sync offsets. Local files never uploaded.
- Local favourites, named collections, add/remove collection membership, theme/font persistence and scoped privacy reset.
- Validated catalogue JSON import/export, machine-readable schema, importable original sample, explicit unverified-import provenance.
- Disabled non-intrusive advertising placeholder, rights/privacy/about/settings views, example security headers, conservative noindex/robots and truthful generic WebSite metadata.
- Render-error fallback, bounded inputs, safe storage handling, production static build and CI workflow.
- README, rights/licensing/source policy, architecture decisions, catalogue contract, deployment checklist, monetisation/consent plan, AI handover and concrete production backlog.

## Reproducible validation

Toolchain exercised on Node **24.22.1**, npm **11.21.1**; exact dependencies are pinned in the lockfile. Current direct build/test tools: Vite 8.3.6, Vitest 5.1.0, TypeScript 5.9.x. Runtime is React 19. The locked dependencies, not a claim of evergreen versions, define this delivery.

| Command/check                            | Observed result                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`                                 | Clean installation passed                                                                                                      |
| `npm run format:check`                   | Passed                                                                                                                         |
| `npm run typecheck`                      | Passed, including tests and Vite/Playwright configs                                                                            |
| `npm test`                               | **34 passed**, 1 test file; includes all 96 registered filter dimensions and sample import validation                          |
| `npm run build`                          | Passed; static `dist/` created                                                                                                 |
| `npm audit --audit-level=moderate`       | **0 vulnerabilities** reported                                                                                                 |
| `npm run test:e2e` on development server | **27 passed, 1 expected skip**                                                                                                 |
| `npm run test:e2e` on production preview | **27 passed, 1 expected skip**, 9.2-second Playwright run                                                                      |
| Production preview HTTP smoke            | HTTP **200** at root                                                                                                           |
| Axe automated checks                     | No detected selected WCAG2 A/AA and WCAG2.1 AA violations on tested light/dark discovery and reader in desktop/mobile Chromium |
| Console/runtime capture                  | No page errors in tested visual-capture flows                                                                                  |
| Local-media privacy                      | Generated original silent WAV played; no cross-origin HTTP requests observed during the exercised flow                         |
| Layout                                   | Desktop/mobile no-horizontal-overflow assertion passed                                                                         |

The one skip is the **mobile-only navigation drawer test on the desktop project**; it ran and passed on mobile. Tests cover discovery/filter/sort/reset, script switching/timing/focus restoration, persistence/collections, theme, LRC invalid/valid cases, catalogue import invalid/valid cases, direct song URL, light/dark accessibility, generated WAV playback, privacy reset, mobile keyboard dismissal and screenshot capture. These are not exhaustive browser/device, screen-reader, native-editor or legal reviews. No Lighthouse score or pixel-diff/visual-baseline claim is made.

Build evidence: main JS approximately **275.15 kB / 87.77 kB gzip**, CSS approximately **43.66 kB / 9.79 kB gzip**, plus locally bundled subset font assets. These are build sizes, not a network-performance benchmark.

## Visual evidence

Programmatic Playwright screenshots, inspected during implementation:

- `artifacts/desktop-chromium-discovery.png`
- `artifacts/desktop-chromium-reader.png`
- `artifacts/mobile-chromium-discovery.png`
- `artifacts/mobile-chromium-reader.png`

Full-page discovery captures plus viewport reader captures; no copyrighted cover photos. During testing, contrast, focus restoration, same-document hash navigation, font fallback and loaded-audio duration issues were found and fixed, then suites rerun successfully. The browser report remains in local `playwright-report/` (ignored from Git; regenerated by tests).

## Running preview and GitHub status

Production preview is launched with `npm run preview -- --host 0.0.0.0 --port 4173 --strictPort`. On the shared box, open **http://localhost:4173/**; direct reader **http://localhost:4173/#song=a-little-light**. This process is a temporary inspection server, not a public production deployment or uptime promise. Restart it with the same command if needed.

Standalone source lives under `/workspace/powerwords-20261108-standalone`. No unrelated repository was cloned or changed. No remote repository, account, deployment or paid service was created. Authenticated account Navina0 had no accessible PowerWords match and the guessed owner/name returned 404. Exact target confirmation is still required before a push or PR; none is claimed. Local Git history and a portable source/build archive are deliverables, not a substitute for integrating into the owner's confirmed repository.

## Production blockers

Exact GitHub target; real licensed catalogue and authoritative credits; variant-specific/territory/expiry rights model; native-language editorial review; real operator contact/takedown/privacy pages; backend publication/search/account security; canonical indexable routes and SEO; verified advertising publisher/consent controls; cross-browser/manual accessibility/real-device tests; operating/deployment approval. See `NEXT_STEPS.md` for prioritised work.
