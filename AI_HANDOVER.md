# AI / developer continuation handover

## Start here

Read `README.md`, `NEXT_STEPS.md`, `docs/PROGRESS.md`, `docs/REAL_CATALOGUE.md`, `docs/SEO.md`, `docs/CONTENT_RIGHTS.md`, `docs/ADS_AND_PRIVACY.md`, then `docs/CATALOGUE.md` and `docs/REPOSITORY_ACCESS.md`.

## Intent and current state

The owner wants a premium multilingual Indian lyrics/music discovery service: composer → singer/collaborator → album → present-to-oldest, mainstream + independent coverage, Tamil/native + English/Thanglish, local personalisation/karaoke and non-obstructive advertising. They favour autonomous implementation and excellent continuation documentation. Do not promise complete coverage, zero bugs, licences, rankings, AdSense approval or paid resources.

This is working **frontend + static-prerender foundation**, not a complete licensed business. React/TS/Vite. 18 entries: 5 individually cited factual recordings (3 Rahman, 2 Vada Chennai/Santhosh Narayanan), 1 ancient Tirukkural verse edition with new project English/Latin renderings, 12 fictional CC0 demos. 96 filter dimensions with truthful availability. Source-led clean pages and static SEO; local library, themes and practice; import/export. No backend, account/OAuth, live provider sync, ad SDK, analytics or commercial lyrics/audio.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run test:seo
npx playwright install chromium
npm run test:e2e -- --workers=4
npm audit
npm run preview -- --host 0.0.0.0 --port 4173
# optional actual local browser recording: npm run record:demo (ffmpeg needed)
```

Node 24 recommended. Browser suite uses **production files**, not a dev-only SPA. If a server already uses 4173 ensure it is the supplied static preview and current dist. CI builds first and starts its own preview. See progress for exact measured results; screenshot captures are not pixel-diff baselines. The recorder drives only this local app, never signed-in services. Video is a real interaction artifact, not generated footage or a claim an AI watched it.

## Architecture / invariants

- `catalogue.ts`: typed model + registry + explicitly fictional demos. `realCatalogue.ts`: per-item reviewed facts/permissions/citations. Keep them separate. No factual claim is inferred from an artwork or user query.
- `routes.ts`: route manifest for static song/available text versions/artist/language pages. `CataloguePage.tsx`: shared semantic route content. Current artist slugs are name-based; use stable IDs before production-scale identity merging.
- `seo.ts`: pure shared metadata. `entry-prerender.tsx` + `prerender.mjs`: one shared React tree into every route HTML, per-page head, configured sitemap/robots. `seoBrowser.ts`: update head during enhanced client navigation. Client re-renders rather than hydrates, so browser-local preferences do not mismatch static HTML. Keep server-visible content and no-JS reading tests.
- Default actual preview origin is localhost; build environment `SITE_URL` / `ALLOW_INDEXING` control reviewed launch pages. No fake production domain. Demo-only routes always noindex and excluded from sitemap. Keep static directory files and true 404s; never blanket SPA-rewrite to root.
- Unicode search preserves Indic marks and searches known titles/aliases/credits/permitted text. `discoverMatches` may return explicitly labelled related album entries when a full quote is unknown. Never mark the user's unverified phrase as a verified lyric or add it to SEO aliases.
- `valuesFor` resolves individual contributor roles; filters combine exact values with AND. Unknowns remain absent. Ancient verse `year: null` sorts last; never invent a modern release.
- Metadata-only entries **must have no lyric variants** and expose no practice button. The Tirukkural is ancient verse, not a modern recorded adaptation; its new English/Latin text is project-created CC0. Edition/India-US caveats are in REAL_CATALOGUE.
- Plain text only; no imported HTML, remote art/audio or arbitrary CSS. Colour must be bounded hex; imports validate identity/rights/bounds/credits/HTTPS citations/timestamps. Schema acceptance is not legal verification. Imported rights remain unverified and session-only; they have no durable public routes.
- Local persistence touches only `pw:` keys. Imported audio/LRC/catalogue never upload or persist. Revoke media object URLs. Local files do not grant distribution or sync rights.
- Modal reader traps focus, restores it, supports Escape and arrow/Home/End tab controls. Keep reader/playback/lyrics entirely ad-free. Respect reduced motion and light/dark contrast.
- `serve.mjs` is a local QA server with security headers, traversal bounds, slash redirects, real 404s; not a production service. A maintained HTTPS static host must enforce equivalent settings.

## Known trade-offs / unfinished production work

App.tsx is still large; extract tested feature modules gradually. Filters are single values, not multi-select/ranges; many demo fields have one synthetic value. Search is not a scalable index or semantic engine. Metadata-only pages are intentionally small; they do not prove launch/ranking/monetisation readiness. Native/classical-language text quality needs human editorial review. Silent rehearsal is approximate, not sample-accurate; media codecs vary. Automated Chromium/axe checks are not manual screen-reader or physical-device certification. There is no editorial backend, trusted publication/territory/expiry enforcement, verified business/takedown contact, privacy-law implementation for tracking, account sync or operator support system.

## GitHub / preservation

Local source: `/workspace/powerwords-20261108-standalone`, branch `feat/powerwords-foundation`. Upgrade commit attribution uses a command-scoped Grok Bot / non-deliverable localhost build identity; it is not verified owner GitHub attribution and no global identity was changed. Initial foundation commit `4785f04cdd11e18a656224def290f96df6291ade`; upgrade is a separate subsequent commit (read `git log`, do not amend). Original delivery ZIP/bundle are preserved; upgraded archive/history use new names.

The owner explicitly corrected the account to **Paulraj916 / Paul Raj**, verified by the connected GitHub profile; Navina0 was the wrong owner assumption. Correct-account connector searches returned 45 owned repositories and no PowerWords variant. A direct correct-account `Paulraj916/PowerWords` root lookup returned HTTP 404; see `docs/PAULRAJ_TARGET_RESEARCH.md` for exact calls/errors and unrelated same-name candidates that were not selected. The parent handles the authorised CLI login/switch; do not initiate a duplicate flow, remove an existing account, read credentials or create an unsolicited remote. No matching target with write permission has been established, so no clone/push/PR.

Only after exact target confirmation: inspect its current files/history, clone into a separate unique workspace, use a fresh feature branch, adapt instead of overwrite (a prototype/ subdirectory may be appropriate), preserve licences/tests, run all checks, then push to the confirmed repo/open PR as authorised. Never force push, reset hard, skip hooks, auto-merge or manufacture a remote.

## Continuation prompt

“Read AI_HANDOVER and NEXT_STEPS; run unit/build/static-SEO/browser/audit checks. Preserve current source/history. Confirm exact repository before any remote write. Prioritise independent-artist permissions, native editorial review and a trusted publication model. Existing prerender SEO is implemented; extend it without fake metadata or protected text. Keep demos clearly marked/noindex and ads outside reading. Report measured outcomes and remaining blockers.”

## Mobile capture correction

The first combined video was rejected for transient grey/cropped mobile frames. This was a capture-surface mutation from screenshot APIs in the same high-DPR recording context, not a reproduced production layout zoom: actual viewport scale stayed 1 and modal/header bounds were inside the phone. See MOBILE_CAPTURE_REVIEW.md. The recorder now uses matched even 412×892 CSS/video/device dimensions, DPR 1, a screenshot guard, settled SPA navigation, contain/padding only and one combined H.264 encode. Standalone mobile stays native portrait. `npm run test:video` compares its final frame against a separate non-recording UI reference; keep this regression. Never take screenshots during active mobile recording or use zoom/cropping to conceal a real UI issue. Parent/human videoReview remains necessary.
