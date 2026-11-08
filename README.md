# PowerWords · Every word, a world.

A distinctive, local-first Indian music discovery and multilingual reading foundation. Warm paper, after-hours themes, original record-inspired artwork, source-led listening paths, quiet reading folios, rich filters and private karaoke practice. **Working software with sourced credits and reusable ancient text—not a complete licensed commercial lyrics business.**

## Run the finished production version

Node **22.12+** (Node 24 recommended), npm, and **Python 3.11+ with SQLite FTS5** for the full catalogue build. No paid service/account/API key is required. `npm run build:curated` remains the smaller Node-only reading build.

```sh
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
# http://localhost:4173/
```

`npm run dev -- --port 5173` is the fast editing server. Use the production preview above for crawlable HTML, security headers, directory routes and genuine HTTP 404 testing.

```sh
npm test                        # pure unit/data/rights/search/SEO checks
npm run typecheck               # strict TypeScript
npm run build                   # client + React static prerender → dist/
npm run test:seo                # every generated HTML page + sitemap/robots
npx playwright install chromium
npm run test:e2e -- --workers=4  # production desktop/mobile workflows + axe
npm audit                       # lockfile vulnerability check
npm run record:demo             # actual local browser-action recording; ffmpeg required
npm run test:video              # native mobile frame vs independent intact UI reference
```

Playwright starts the production preview on 4173 if needed; build first. An already running preview must serve this build. Reports: `playwright-report/`; screenshots: `artifacts/`. Screenshots are review evidence, not pixel-baseline assertions. See [progress](docs/PROGRESS.md) for measured results and [recording](docs/DEMO_RECORDING.md) for the actual capture.

## Explore

- `/artists/a-r-rahman/` — 3 sourced recordings, newest/oldest, album and individual singer filtering.
- `/artists/santhosh-narayanan/` — Vada Chennai credits, correctly attributed to Santhosh Narayanan.
- `/songs/ennadi-maayavi-nee/` — factual credits, citations and a transparent commercial-lyrics rights gate.
- `/songs/tirukkural-invocation/` — ancient Tamil verse, with separate `/translation/` and `/transliteration/` pages.
- `/languages/tamil/` — language collection; Hindi/Telugu contain labelled original demos.
- `/songs/a-little-light/` — an explicitly fictional CC0 practice exercise.

Every listed route is an actual prebuilt HTML file. Titles, descriptions, OG, canonical, reciprocal text-version hreflang and factual JSON-LD are present **before JavaScript**. Real links/text work with JavaScript disabled. Interactive filters, saved library and practice require JavaScript. Unknown paths return 404 in the supplied preview; static hosts must preserve that behaviour.

## Retained curated reader — what works

- **18 entries:** 5 individually sourced real recording metadata pages, 1 ancient public-domain verse edition, 12 clearly fictional original demos. No commercial lyric, audio, translation, transliteration or album artwork is bundled. [Per-item facts and rights](docs/REAL_CATALOGUE.md).
- Native-script/title/alias/credit and permitted-text search. Tamil query `முன்பே வா lyrics` finds Munbe Vaa. A query containing `Vadachennai` plus an unverified quote returns **explicitly related album entries**, never a fabricated lyric identification. No ranking guarantee or keyword stuffing.
- **96 schema-driven dimensions** in 8 groups. **50 currently have values; 46 remain unavailable.** All use real matching when values exist; unavailable fields are disabled and marked unknown. Populated demo fields are not claimed to be verified real-song attributes. Contributor filters match individual duet singers; active selections combine with AND.
- Root collections: All entries / Sources first / Read freely / Original demos. Artist collection chronology, album and singer controls. Unknown ancient dates remain last, not disguised as a modern year.
- Mobile-first source-led collection pages, music-credit pages and line-numbered reading folios, plus a distraction-free native-dialog practice room.
- Original/English/Latin tabs (Thanglish for Tamil), keyboard tab navigation, text sizing, copy, line seeking, focus restoration and reduced-motion support.
- Silent timed rehearsal; local audio ≤50 MB; LRC ≤256 KB / 500 lines / 4 hours; manual −10…+10 second sync. Files never upload and are discarded on close. No included copyrighted audio, microphone, recording or streaming.
- Local saved songs and named collections (including real credit-page actions), persistent themes/font settings; scoped privacy reset. Session-only validated catalogue JSON import/export. **Imported rights are uploader assertions, not clearance or publication.**
- External provider search links only; real entries also link their actual cited catalogue listing. No OAuth/account sync is claimed.
- Clearly labelled **disabled** advertising area outside reading; no SDK, overlay, audio ad, fake publisher ID, tracking or CMP. [Ads/privacy](docs/ADS_AND_PRIVACY.md).
- Semantic HTML, local fonts, defensive file validation, React text escaping, error recovery, supplied restrictive response headers, CI, unit/browser/a11y regressions.

## SEO launch configuration

Default builds use the honest preview origin `http://localhost:4173`, `noindex,follow` and robots `Disallow: /`. No fictional production domain is shipped. Copy `.env.example` to `.env`, set **your actual HTTPS origin and optional simple project path** as `SITE_URL`, review rights/content/operator readiness, and only then explicitly set `ALLOW_INDEXING=true` **and `REVIEWED_INDEX_PATHS` to an individually reviewed list of substantive eligible routes** and rebuild. An enabled indexing build without that list fails closed.

`dist/sitemap.xml`, `dist/robots.txt`, canonical/OG/hreflang and `dist/build-manifest.json` derive from the configured origin. Fictional-only routes **always stay noindex and outside the sitemap**, even when indexing is enabled. See [SEO](docs/SEO.md) and [deployment](docs/DEPLOYMENT.md). These mechanisms do not promise rankings, rich results, AdSense approval or revenue.

## Architecture and project map

React 19 + strict TypeScript + Vite, complemented by a stdlib Python/SQLite catalogue backend and free-static shard exporter. No runtime backend is required for the full static build. One shared component tree is rendered to static HTML at build time, then client-rendered for personalised preferences without hydration mismatch. Local font assets (Inter and Noto Tamil/Devanagari/Telugu; OFL notices in `docs/licenses/`) and generated art make no runtime CDN calls. The retained 18-entry reader operates in memory; the bulk index fetches only query-specific shards or paged API responses. Only `pw:` preferences/IDs persist; imported catalogue/media stay in session memory.

| Location                                                       | Responsibility                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/App.tsx`, `src/styles.css`                                | Discovery, library, practice, personalisation, responsive design               |
| `src/CataloguePage.tsx`                                        | Crawlable collection, source/credit and multilingual text folios               |
| `src/catalogue.ts`                                             | Song model, 96 dimensions, explicitly fictional demos                          |
| `src/realCatalogue.ts`                                         | Reviewed metadata, ancient verse, per-item source ledger                       |
| `src/routes.ts`, `src/seo.ts`, `src/seoBrowser.ts`             | Clean route manifest, shared factual SEO, client navigation updates            |
| `src/lib.ts`                                                   | Unicode search, honest related recovery, exact filters, validation/LRC/storage |
| `scripts/entry-prerender.tsx`, `scripts/prerender.mjs`         | React prerender, per-route head, sitemap and robots generation                 |
| `scripts/serve.mjs`                                            | Local static preview, canonical slash redirects, real 404s, security headers   |
| `scripts/check-prerender.mjs`, `scripts/record-demo.mjs`       | Static SEO audit and reproducible real-action demo capture                     |
| `src/*.test.ts`, `tests/*.spec.ts`                             | Unit/data/SEO and desktop/mobile/browser/a11y regressions                      |
| `docs/CATALOGUE.md`, `docs/catalogue.schema.json`              | Safe session import contract and example                                       |
| `docs/REAL_CATALOGUE.md`, `docs/CONTENT_RIGHTS.md`             | Individual provenance and rights reasoning                                     |
| `docs/SEO.md`, `docs/DEPLOYMENT.md`, `docs/ADS_AND_PRIVACY.md` | Production setup and honest launch gates                                       |
| `AI_HANDOVER.md`, `NEXT_STEPS.md`, `docs/PROGRESS.md`          | Continuation, backlog and verified delivery status                             |
| `docs/REPOSITORY_ACCESS.md`                                    | Literal read-only GitHub discovery commands/results                            |
| `.github/workflows/ci.yml`                                     | Reproducible validation workflow                                               |

## Honest boundaries / continuation

No complete discography, commercial lyric licence, broad independent catalogue, production editorial/admin system, cross-device account sync, provider integration, full fuzzy/semantic search or live ads. Search is Unicode-normalised terms and known aliases; related-album recovery is labelled. Filters are single exact selections, not ranges/multiselect. Native-language writing/renderings need human editorial review. Automated axe/Chromium tests are not screen-reader certification, real-device QA or a zero-bug guarantee. Static metadata-only pages and a small text edition do not make the business launch-ready.

## Growing India catalogue — active lakh-scale v2 checkpoint

**123,252 distinct MusicBrainz recordings**, **14,884 source compositions**, **212 Wikidata music entities**, and **19,921 separate source artist profiles** are available through **Open India index**, above the curated shelf. These are not additive unique-song/unique-person counts, nationality proof, licensed lyrics or all Indian music. Eight older recording IDs are preserved. **10,956 recordings / 2,411 source artist IDs** have explicit vocal evidence; generic credited artists are not inferred singers or composers.

The **Language association (not sung language)** filter distinguishes work/release-text association from actual unknown recording language. Source roles/attributes/proofs, artist credit filtering, native aliases and work→recording exploration work on paged API or **free static query-specific shards**, without a giant client catalogue array. Standard full builds require Python; default bootstrap is offline and hash-verified. See [exact v2 scope/metrics/deferred work](docs/V2_LAKH_CATALOGUE.md).

Configured ad-free project preview target: **https://paulraj916.github.io/PowerWords/**. Actual availability depends on a successful `free-pages-preview` job, not this README alone. Project-prefix clean routes/assets/native discovery have a dedicated desktop/mobile regression. Default builds remain root-host compatible; `.env.example` describes `VITE_BASE_PATH`. HTML indexing and live ads remain off.

```sh
npm run catalogue:bootstrap          # optional local SQLite catalogue
npm run catalogue:serve              # optional actual read-only API, port 4180
npm run test:backend                 # source/rights/import/native-search regressions
npm run test:ads                     # empty/default-off publisher validation
npm run test:project-host            # separate /PowerWords/ local build on port 4174
```

Read [SOURCE_PIPELINE](docs/SOURCE_PIPELINE.md), [SCALABLE_ARCHITECTURE](docs/SCALABLE_ARCHITECTURE.md), [24-hour checkpoints](docs/24_HOUR_CHECKPOINT_PLAN.md), [free hosting/search/ads](docs/FREE_HOSTING_SEARCH_ADS.md) and V2_LAKH_CATALOGUE. Actual v2 report: `artifacts/catalogue-v2-coverage.json`. The separate **100,000-row SYNTHETIC benchmark** is capacity evidence, never real song coverage. Pending v3 evidence is preserved portably in `data/pending-v3` but is NOT active and its role gains are not claimed.

No all-India completion, uninterrupted subscription-independent 24-hour run, #1 ranking, instant indexing, AdSense approval or earnings guarantee. GitHub Pages is an ad-free open-source preview, not a commercial-hosting promise; its terms/limits, project-root ads.txt and header restrictions are documented. No paid resources/accounts or Google submissions were created. Real operator/legal/native review, protected-lyrics permissions and approved consent-safe publisher setup remain.

## Public source repository

**https://github.com/Paulraj916/PowerWords** · default/source branch **`main`**. The owner explicitly approved creating this public repository and publishing the website. Authenticated CLI identity was verified as Paulraj916; the exact repository was absent before approved creation. The complete original local commit history is retained; no force push or history rewrite is needed. Historical discovery failures are preserved and labelled in the repository research docs, not current blockers.

```sh
git clone https://github.com/Paulraj916/PowerWords.git
cd PowerWords
npm ci
npm run build
npm run preview
```

GitHub is the **source** URL, not a deployed website or production canonical origin. Keep `SITE_URL`/indexing conservative until an actual HTTPS deployment is reviewed. `package.json` has `private: true` to prevent accidental npm publishing; that does not make the GitHub repository private. See [publication and audit notes](docs/PUBLICATION.md). Demo videos remain local delivery artifacts with paths in [recording notes](docs/DEMO_RECORDING.md); no hosted video download is claimed.

Continue with: **“Read AI_HANDOVER.md and NEXT_STEPS.md, run the checks, preserve existing work, and implement the next unblocked item without inventing facts or licences.”**

Code: [MIT](LICENSE). Original project demo text and new project renderings: CC0-1.0; ancient underlying Tamil text and edition caveats: [rights](docs/REAL_CATALOGUE.md). No third-party music/recording/trademark rights are granted.

Production indexing now also requires explicit `REVIEWED_INDEX_PATHS` (comma-separated real curated routes). `ALLOW_INDEXING=true` alone is insufficient: builds fail without a reviewed list; client navigation and sitemap enforce the same per-page list. Defaults remain noindex. Do not put bulk JSON or fabricated metadata pages in this list.
