# Search-first Music Raga release — 9 November 2026

## User-facing change

The default `/` now opens a large, immediately visible song/album/artist search, not the technical discovery workspace. Search Tamil source titles, English-letter titles, artist credits and source edition names; common “songs”/“lyrics” words are removed from the query. For example, `Alaipayuthey songs` finds **28 source recordings** in this pinned release. These are recording IDs/versions, not 28 distinct compositions. No invented title translations or phonetic aliases are added.

Results explicitly label **Lyrics not yet available** before opening. A result opens a simple readable entry with clear return-to-search navigation, adjustable type, source/credit details and honest native/romanized availability. Tanglish/Hinglish means Latin-letter native words, not English translation. Actual real-song cleared pairs remain **0**. The design does not supply missing content or licence permissions. The historical Bengali reading research is NOT attached to recording cards or counted as lyric pairs; no new historical section was added.

Only the five existing individually reviewed entries can show their already-cited Spotify album destination, where supplied. Bulk entries have no fabricated listening URLs, embeds or empty play controls. Optional audio chosen on the device uses a revocable blob URL, never uploads, and never unlocks lyrics. This new local preview accepts files below 100 MB; the retained practice studio retains its own documented 50 MB gate. Both are session-only.

`More tools` opens the retained advanced workspace (`/?workspace=1`), where role evidence, filters, legacy reading editions, original fictional practice exercises and the detailed coverage counters remain available. The root links to clearly labelled original practice only as a secondary footer action. Real song search never mixes fictional demos or ancient verse into recording results.

## Data and bounded static search

- Catalogue remains **127,064 source recording IDs**, 21,096 works and 212 Wikidata song/single entities; **148,372 entities are not 148,372 unique songs**.
- V2/V3/V4 core records and role proofs are unchanged. Earlier eight recordings and two baseline-only composer evidence records are preserved.
- A pinned **25,574-release CC0 metadata** source bridge in `data/cc0-editions/` supplies source edition titles for album-name discovery. These releases are NOT added to recording totals. Release names/dates do not establish original album/date, sung language, nationality or lyric rights. At most ten edition titles per recording are exposed/indexed in this bounded export; it is not a complete album discography.
- Hashes, uncompressed digest, source URLs and licence statements are verified before export. The bridge is additive to static search, not a replacement/import of the core database. The optional raw SQLite API has not gained this edition-name search; the new root intentionally consumes the same static shards on local preview and free Pages.
- SHA-256-bucketed identity lookups resolve shared `?song=<source-ID>` links to one page, without downloading all rows or scanning all pages. Refreshing a song URL works under `/MusicRaga/` too.
- Static JSON is about 366 MB on the host, NOT an initial download. Existing bounded query/page cache applies. Root search remains a static-JavaScript feature; curated clean pages remain server-visible. `build:curated` alone does not create catalogue shards: run full `npm run build`, or reuse the verified catalogue artifact as CI does.

## Publishing constraints unchanged

Free GitHub Pages preview; ads OFF, no publisher ID or live SDK; indexing disabled, no Search Console verification/submission or ranking claim. Two-million goals remain goals. Cleared-pair gap **2,000,000**; metadata gap **1,872,936**. No paid hosting, accounts, lyric scraping, commercial audio or lyric romanization was added.

## Regression evidence

`tests/search-first.spec.ts` covers immediate search visibility, Tamil and Romanized queries, artist/album discovery, unavailable readers, type sizing, local-only audio, empty/clear, browser back, secondary tools, deep-link refresh and accessibility on desktop/mobile. Existing advanced regressions explicitly request `workspace=1`; this is intentional coverage of preserved secondary features, not a claim they remain the default homepage. `scripts/check-project-host.mjs` now verifies the real prefixed root search → album result → reader → reload flow, as well as retained role proofs and clean routes.

Actual screenshots: `artifacts/search-first-*-home.png`, `*-results.png`, `*-reader.png` and `search-first-project-*.png`. Screenshots are test artifacts, not pixel-baseline tests. Final validation outcomes are recorded in the release handover after execution.

## Executed validation for this release

- Full production build and strict typecheck: PASS.
- Vitest: **63 passed**; Python backend/source/rights/import suite: **54 passed**.
- Broad Playwright desktop/mobile suite: **75 passed, 1 intentionally skipped** (the existing mobile-only regression skips its desktop duplicate). Includes 10 new default-root cases across the two viewports, light/dark axe checks, 320px layout, Tamil/romanized/artist/album/empty searches, source reader refresh and local-only audio.
- Exact `/MusicRaga/` project build: **desktop and mobile passed**, root album search → source recording → reload, zero axe violations/runtime errors, retained clean-route reload/canonical checks and real composer proofs/zero-pair counters.
- SEO: **68 prerendered routes** passed; **4 indexing-policy tests** and **4 disabled-ad configuration tests** passed.
- Formatting and diff checks: PASS. `npm audit --audit-level=moderate`: **0 vulnerabilities**.
- Reviewed actual desktop and mobile homepage/reader screenshots and corrected an inherited footer layout; no new video was required.

The current ~366 MB static export fits the present preview budget; the 2-million goal will require another storage/search strategy, not an assertion that a full 2-million export fits GitHub Pages. Tests validate this release, not universal catalogue completeness or bug-free operation.
