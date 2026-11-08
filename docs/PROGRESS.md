# Current scalable catalogue checkpoint · 09 November 2026 (IST)

New work is on `feat/scalable-india-catalogue`, preserving published main `7bbb59650f3e0b864c13a1da3169ec26cc9bc327`. Actual implementation: durable SQLite FTS5 core/staging/provenance/identities/graph/profiles; optional read-only API; immutable free-static query/page/facet shards; source rights and bounded fetch tooling; all-India language taxonomy with observed/unknown coverage; original reader/SEO retained.

Real accepted bulk index: **14,884 compositions; 17,130 linked recordings; 212 Wikidata song/single entities; 2,446 source artist profiles**. These are not additive unique songs/people. 19 matching source-selection languages, 3,059 source credit identities, 17,332 graph edges, zero missing work targets, 32,085 unknown years and 17,154 unknown-language entities. One missing-title source item is quarantined. Actual reports: `artifacts/catalogue-real-coverage.json` and compressed-source manifest. Original curated 18 entries are separate and can overlap.

Validation for this checkpoint: **58 frontend unit tests**, **29 backend integration tests**, **4 ad-config tests + 4 production indexing policy tests**, **61 browser passes + one expected desktop skip**, 68 prerendered-route SEO audit, build/typecheck/format/audit and independent synthetic scale evidence. See final delivery/CI for the final exact statuses; local browser run after integration passed in 19.7s. New browser coverage exercises real native `எஞ்சாய்` discovery, A. R. Rahman source profile → MusicBrainz credit works → linked recordings, plus source API mocks, honest unavailable state and mobile/axe bounds. No live Google ad requests occur; ad configuration and ads.txt are inert/default-empty.

`npm run build` needs Python and emits real sharded data for free root-host static deployment; no running API required. Original 68 HTML routes and text/SEO gates remain. No thin bulk song pages, fabricated metadata, protected lyrics/audio/art, paid service or deployment. Full details: SOURCE_PIPELINE, SCALABLE_ARCHITECTURE, FREE_HOSTING_SEARCH_ADS and 24_HOUR_CHECKPOINT_PLAN. The 100,000-row benchmark is explicitly **synthetic**, separate from real counts, and not concurrent-production certification: staging 5.378s, publication 15.827s, 50 warm full-count + 25-result queries p50 164.092ms / p95 183.536ms, database 282,959,872 bytes. No all-India completion, perpetual 24-hour execution, ranking, indexing, ad approval or earnings guarantee.

Preview: http://localhost:4173/ (static shards); http://localhost:4180/ (actual optional SQLite API + same frontend). Local QA, not public hosting. Prior reviewed video covers the previous reader checkpoint, not this expansion. New screenshot/test evidence and PR are reported at delivery.

## Historical previous delivery (preserved)

# Current delivery status · 09 November 2026, 00:11 IST

## Corrective follow-up completed

The owner is **Paulraj916 / Paul Raj**, not Navina0. Parent videoReview rejected the first mobile recording; it is superseded by the files below. Original source/history/deliveries are preserved.

### Actual mobile investigation / fix

- Inspected rejected frame stills/contact sheet and reproduced actual home/drawer/native search/credits/reader states. Actual page scale stayed **1**, document width stayed **412px**, and reader/header bounds stayed within the phone. The grey/enlarged frames correlated with screenshot APIs resizing the active high-DPR mobile recording surface; no steady production extreme-zoom/header-crop state was reproduced.
- Recorder now has matched even **412×892** CSS/screen/video dimensions, DPR 1, a guard forbidding mobile screenshots during live capture, real settled SPA navigation and deliberate page/room scrolling. Screenshots run separately. Standalone mobile is native portrait; combined footage uses contain/padding with a 24px margin and **one H.264 encode**, never crop/fill/zoom or stream-copy segment joins.
- Independently fixed reader details: unknown ancient year displays “Ancient text”, and the native heading has the appropriate language tag.
- Added browser viewport/scale/sticky-header/artwork/playback reachability regressions and `npm run test:video`: final real mobile frame versus independent non-recording UI reference, SSIM **0.992297** ≥0.93. No screenshots mutate the captured mobile surface.
- Investigation/evidence: MOBILE_CAPTURE_REVIEW.md, `artifacts/mobile-review/viewport-diagnostics.json`, rejected/revised contact sheets, final/reference frame PNGs and `video-regression.json`.

### Current video — corrected recording passed parent videoReview

Combined: `/workspace/powerwords-upgraded-20261108-demo-1794160112232.mp4`

Native portrait mobile: `/workspace/powerwords-upgraded-20261108-mobile-1794160112232.mp4`

Combined codec: **H.264, 1280×900, 30 fps, 65.30s**, silent. Mobile is **412×892**. Shots: desktop discovery/curated paths, Rahman chronology+album+singer, protected-commercial rights/source pages, Tamil related search, Tamil/English/Latin reading, silent seeking/sync, library/theme; then mobile drawer/native search/full source heading/rights gate/text folio/intact reader/scroll to playback/return to header. Actual local interaction, no generated footage or copyrighted audio.

Capture reports **0 external requests and 0 runtime page errors**; chapter measurements assert scale 1 and bounds. Representative extracted stills/contact sheets were inspected, **not a claimed full video viewing**. The parent subsequently reported that this corrected recording passed videoReview. Any newly recorded replacement needs a fresh review.

## Whole-site foundation retained

- **68 physically prerendered clean routes + 404.html**, unique server-visible titles/descriptions/OG/canonical, actual available-version hreflang, factual JSON-LD, semantic content and no-JavaScript text/links.
- Configured actual `SITE_URL`, sitemap/robots/build manifest; localhost/noindex default; **24 curated sitemap candidates**, fictional-only pages always noindex/excluded. No fake production domain or ranking promise.
- **18 entries**: 5 cited real metadata-only recordings (3 A. R. Rahman; 2 Vada Chennai / Santhosh Narayanan), 1 ancient Tirukkural verse edition with new project English/Latin renderings, 12 explicitly fictional original CC0 demos. No protected commercial text/art/audio. Per-item citations/native-title checks/source disagreements and India/US/edition rights reasoning: REAL_CATALOGUE.md.
- Native-script/alias/permitted-text search, honest related-album recovery for the unverified mixed Vadachennai quote; exact AND contributor/album filtering, chronology and unknown ancient dates last.
- **96 dimensions: 50 populated / 46 unavailable**, without inventing real raga/collaborators/sonic metadata.
- Premium warm-paper/after-hours design, responsive shelves/folios/rights gates/source ledgers; local favourites/collections and source-page save actions; private audio/LRC/silent practice/manual sync; validated session imports/unverified metadata inspector; scoped privacy; disabled non-intrusive advertising outside reading.
- README, AI_HANDOVER, NEXT_STEPS, deployment/SEO/rights/import/decisions/docs and CI remain comprehensive and current.

## Current measured validation

| Check                                      | Result                                                                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Strict typecheck                           | Passed                                                                                                                                   |
| Unit/data/search/rights/SEO tests          | **57 passed**, 2 files                                                                                                                   |
| Production build                           | Passed; **68 static routes + 404**                                                                                                       |
| Every-route static SEO audit               | Passed titles/descriptions/canonical/OG/JSON/H1/index gates/text/rights/hreflang/sitemap/robots                                          |
| Desktop/mobile Chromium browser tests      | **55 passed + 1 expected desktop skip**, 56 total, **16.9s**                                                                             |
| Selected WCAG2 A/AA and WCAG2.1 AA axe     | **0 detected violations** in tested light/dark discovery, reader, library, filters, karaoke and clean source/text/artist/language routes |
| Narrow/enlarged and reported mobile states | 320px overflow checks, 36px text, scale-1/header/artwork/playback bounds passed                                                          |
| Native mobile video regression             | **SSIM 0.992297**, passed; actual 412×892 surface                                                                                        |
| Formatting / diff whitespace               | Passed                                                                                                                                   |
| npm audit                                  | **0 vulnerabilities**                                                                                                                    |

Node 24.22.1 / npm 11.21.1; locked dependencies unchanged. Prior full clean `npm ci` passed. Only skip: mobile-only drawer case on desktop; it passed on mobile. Screenshots are evidence, not pixel-baseline certification. Tests/native-language/manual screen-reader/browser/physical-device/legal coverage are not exhaustive; zero bugs is not promised.

## Confirmed public repository

The owner explicitly approved: create a **public Paulraj916/PowerWords repository and push the website code**. Live `gh api user --jq .login` returned **Paulraj916**. The pre-create exact repository check returned HTTP 404; approved `gh repo create Paulraj916/PowerWords --public --source=. --remote=origin` succeeded. Public source: **https://github.com/Paulraj916/PowerWords**. Local/default publication branch is **main**, with every original commit retained. No unrelated clone, paid service, deployment, force push or history rewrite.

The earlier wrong-account and correct-account absent-repository searches are historical; see PUBLICATION.md for the current audit/publication procedure and repository research files for literal earlier errors. GitHub Actions results must be checked live, not inferred from local validation.

## Local continuation / portability

Source `/workspace/powerwords-20261108-standalone`, branch `main`. Preview remains **http://localhost:4173/** on 0.0.0.0; source/text/artist clean paths work. Temporary local QA service, not public hosting or an uptime guarantee. Updated ZIP, full history bundle, checksums and commit are reported with this delivery; previous artifacts are retained. Original foundation: FOUNDATION_PROGRESS.md; first upgrade (superseded video/account findings): UPGRADE_PROGRESS_BEFORE_MOBILE_REVIEW.md.

Remaining production blockers: substantial permissioned catalogue, source-terms/jurisdiction/variant/expiry publishing model, native/editorial/legal review, real operator/takedown/privacy/terms, trusted backend/admin/search/account/provider architecture, actual HTTPS deployment/live headers/SEO review, broader manual/device testing, consent-safe approved advertising and ongoing operations. Static SEO is implemented, not an unfinished placeholder. No paid resources or deployment were created.
