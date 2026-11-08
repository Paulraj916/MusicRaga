# AI / developer continuation handover

**Current user-selected brand: Music Raga** (formerly PowerWords). Canonical repo: https://github.com/Paulraj916/MusicRaga ; project preview target: https://paulraj916.github.io/MusicRaga/ . Same history/data/PR preserved; verify the release deployment/HTTP before claiming live. Old Pages path may NOT redirect. Read `docs/RELEASES.md`.

## Active v3 role evidence + v4 additive snapshot

Read `docs/V3_V4_RELEASE.md` first. Built snapshot: **127,064 distinct MusicBrainz recordings**, **21,096 works**, **212 Wikidata music entities** = **148,372 source music entities**, plus **21,406 source artist profiles**. These are not additive unique songs/people or a census of Indian music. The eight older recording IDs remain. Recording-level composer evidence covers **20,893** and lyricist **17,787**; within the original preferred v2 universe those counts are **20,887 / 17,781**. Explicit vocals: **13,902 recordings / 2,464 source artist IDs**. Roles overlap and unknown fields remain unknown.

V3 is now integrated from the legacy-named `data/pending-v3` directory, not pending. **61,158** v3 proof chains plus retained baseline chains are durable in SQLite (**93,168 total**). Empty overlays never delete older assertions; the two newer baseline-only composer records are preserved. Source relationship versions/qualifiers and crosswalk candidates are retained separately; no name-only merges. V4 adds **3,812** recordings, **141** works and **179** profiles; 15 ambiguous identities are excluded. Six implausible source duration fields become unknown, with original facts retained, not guessed units.

Visible actual recording-linked native + romanized lyric pairs: **0**. Pair goal **2,000,000**, pair gap **2,000,000**, metadata gap **1,872,936**. Romanization (Tanglish/Hinglish) is not English translation; fictional demos and ancient verse are excluded. No clearance import is enabled. Metadata CC0 never clears lyrics/audio. Work language, edition text and primary-artist geography are distinct evidence, never sung-language/nationality claims.

Source release builds and publishes through the existing PR/workflow; verify actual Pages bytes before claiming the latest snapshot live. Same main/history are preserved. AdSense stays OFF, noindex stays ON, no paid deployment or Google ranking promise. No uninterrupted 24h process exists.

## Start here

Read `README.md`, `NEXT_STEPS.md`, `docs/PROGRESS.md`, `docs/REAL_CATALOGUE.md`, `docs/SEO.md`, `docs/CONTENT_RIGHTS.md`, `docs/ADS_AND_PRIVACY.md`, then `docs/CATALOGUE.md` and `docs/PUBLICATION.md`. Repository research files are historical.

## Historical v1 scalable catalogue checkpoint (superseded above)

Read SOURCE_PIPELINE, SCALABLE_ARCHITECTURE, FREE_HOSTING_SEARCH_ADS and 24_HOUR_CHECKPOINT_PLAN first for the current expansion. Backend code: `backend/` (stdlib Python/SQLite FTS5), optional paged API and CLI; `IndiaIndex.tsx`/`staticCatalogue.ts` provide both API and free-static sharded discovery. `data/cc0` contains hash-pinned compressed normalized CC0 exports plus source scripts/rights, NOT a raw mixed-licence dump. Standard build requires Python and makes complete static shards in dist; curated-only build remains Node-only. Bootstrap caches/checkpoints live in ignored directories, never Git.

Historical v1 accepted bulk entities: 14,884 works + 17,130 linked recordings + 212 Wikidata song/single entities = 32,226 source entities, not unique songs; 2,446 separate source profiles, 3,059 credit identities with possible source overlaps. One missing-title source row quarantined. Never infer nationality from language, singer from writer/occupation, recording language from its work, or unique people from source counts. Namespaced MusicBrainz work/recording identity and explicit graph edges must be preserved. No commercial lyrics or audio are added. The following 18-entry/96-filter description is the retained **curated reader**, not the bulk-index size.

Use the existing feature branch/PR for this substantial upgrade, preserve published main. Run frontend + backend + ads + build/SEO + browser checks. See exact benchmark and coverage artifacts; synthetic data is isolated, not added to real data. No continuous 24h job exists. Live ads stay blocked; no guaranteed ranking or ad approval. Existing demo video describes the prior reader checkpoint, not a demonstration of these new bulk features.

## Intent and current state

The owner wants a premium multilingual Indian lyrics/music discovery service: composer → singer/collaborator → album → present-to-oldest, mainstream + independent coverage, Tamil/native + English/Thanglish, local personalisation/karaoke and non-obstructive advertising. They favour autonomous implementation and excellent continuation documentation. Do not promise complete coverage, zero bugs, licences, rankings, AdSense approval or paid resources.

This is working **frontend + static-prerender foundation**, not a complete licensed business. React/TS/Vite. 18 entries: 5 individually cited factual recordings (3 Rahman, 2 Vada Chennai/Santhosh Narayanan), 1 ancient Tirukkural verse edition with new project English/Latin renderings, 12 fictional CC0 demos. 96 filter dimensions with truthful availability. Source-led clean pages and static SEO; local library, themes and practice; import/export. No account/OAuth, live provider sync, ad SDK, analytics or commercial lyrics/audio.

## Reproduce

```sh
npm ci
npm test
npm run test:backend
npm run test:ads
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
- Default actual preview origin is localhost; build environment `SITE_URL` / `ALLOW_INDEXING` / mandatory explicit `REVIEWED_INDEX_PATHS` control individually reviewed substantive launch pages. No fake production domain. Demo-only routes always noindex and excluded from sitemap. Keep static directory files and true 404s; never blanket SPA-rewrite to root.
- Unicode search preserves Indic marks and searches known titles/aliases/credits/permitted text. `discoverMatches` may return explicitly labelled related album entries when a full quote is unknown. Never mark the user's unverified phrase as a verified lyric or add it to SEO aliases.
- `valuesFor` resolves individual contributor roles; filters combine exact values with AND. Unknowns remain absent. Ancient verse `year: null` sorts last; never invent a modern release.
- Metadata-only entries **must have no lyric variants** and expose no practice button. The Tirukkural is ancient verse, not a modern recorded adaptation; its new English/Latin text is project-created CC0. Edition/India-US caveats are in REAL_CATALOGUE.
- Plain text only; no imported HTML, remote art/audio or arbitrary CSS. Colour must be bounded hex; imports validate identity/rights/bounds/credits/HTTPS citations/timestamps. Schema acceptance is not legal verification. Imported rights remain unverified and session-only; they have no durable public routes.
- Local persistence touches only `pw:` keys. Imported audio/LRC/catalogue never upload or persist. Revoke media object URLs. Local files do not grant distribution or sync rights.
- Modal reader traps focus, restores it, supports Escape and arrow/Home/End tab controls. Keep reader/playback/lyrics entirely ad-free. Respect reduced motion and light/dark contrast.
- `serve.mjs` is a local QA server with security headers, traversal bounds, slash redirects, real 404s; not a production service. A maintained HTTPS static host must enforce equivalent settings.

## Known trade-offs / unfinished production work

App.tsx is still large; extract tested feature modules gradually. Filters are single values, not multi-select/ranges; many demo fields have one synthetic value. The retained curated quick search is simple; scalable bulk discovery uses the separately tested SQLite/static-shard index, not a semantic engine. Metadata-only pages are intentionally small; they do not prove launch/ranking/monetisation readiness. Native/classical-language text quality needs human editorial review. Silent rehearsal is approximate, not sample-accurate; media codecs vary. Automated Chromium/axe checks are not manual screen-reader or physical-device certification. There is no editorial backend, trusted publication/territory/expiry enforcement, verified business/takedown contact, privacy-law implementation for tracking, account sync or operator support system.

## GitHub / preservation

Canonical public source: **https://github.com/Paulraj916/MusicRaga**, branch **`main`**. Local working source remains `/workspace/powerwords-20261108-standalone`; current expansion branch is `feat/scalable-india-catalogue`, pending PR review/merge into main. The owner explicitly approved public creation and code publication; CLI identity was verified as Paulraj916, then the absent exact repository was created. `origin` is the HTTPS URL of that repository. Initial foundation `4785f04cdd11e18a656224def290f96df6291ade`, sourced upgrade `08a475c35964689a621f38f6d31e601beb59678c`, and mobile correction `06d0014af3e05e089f22e01ed478f56a66cd24b3` are retained unchanged. Use `git log` / `git rev-parse HEAD` for the latest publication documentation commit.

Commit attribution uses a command-scoped Grok Bot / non-deliverable localhost build identity, not verified owner authorship; global identity was not changed. All reachable historical blobs and tracked publication files were audited for accidental secrets/private data before publication; see PUBLICATION.md for scope/limitations. Do not add `.env`, credential stores, local imported files, raw recordings or delivery ZIPs. Existing UI screenshots are deterministic local test artifacts, not personal sessions.

Previous wrong-account/404 research is historical, not an active access blocker. Future changes should inspect current remote state, preserve history, use feature branches and reviewed pull requests, and run all checks. Never force push, reset hard, skip hooks or silently upload user library/audio/imports. Public source does not establish lyric rights, deployment, production readiness or AdSense approval. Delivery archives/bundles preserve history and the reviewed local demo; no hosted demo-video URL is implied.

## Continuation prompt

“Read AI_HANDOVER and NEXT_STEPS; run unit/build/static-SEO/browser/audit checks. Preserve current source/history. Use the confirmed Paulraj916/MusicRaga repository; inspect its current remote state before changes. Prioritise independent-artist permissions, native editorial review and a trusted publication model. Existing prerender SEO is implemented; extend it without fake metadata or protected text. Keep demos clearly marked/noindex and ads outside reading. Report measured outcomes and remaining blockers.”

## Mobile capture correction

The first combined video was rejected for transient grey/cropped mobile frames. This was a capture-surface mutation from screenshot APIs in the same high-DPR recording context, not a reproduced production layout zoom: actual viewport scale stayed 1 and modal/header bounds were inside the phone. See MOBILE_CAPTURE_REVIEW.md. The recorder now uses matched even 412×892 CSS/video/device dimensions, DPR 1, a screenshot guard, settled SPA navigation, contain/padding only and one combined H.264 encode. Standalone mobile stays native portrait. `npm run test:video` compares its final frame against a separate non-recording UI reference; keep this regression. Never take screenshots during active mobile recording or use zoom/cropping to conceal a real UI issue. The parent reported that the corrected final recording passed videoReview before public-source publication. New recordings still need fresh review.
