# PowerWords · Every word, a world.

A distinctive, local-first Indian music discovery and multilingual reading foundation. Warm paper, after-hours themes, original record-inspired artwork, source-led listening paths, quiet reading folios, rich filters and private karaoke practice. **Working software with sourced credits and reusable ancient text—not a complete licensed commercial lyrics business.**

## Run the finished production version

Node **22.12+** (Node 24 recommended), npm. No paid service, account, API key or database required.

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

## What actually works

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

Default builds use the honest preview origin `http://localhost:4173`, `noindex,follow` and robots `Disallow: /`. No fictional production domain is shipped. Copy `.env.example` to `.env`, set **your actual HTTPS root origin** as `SITE_URL`, review rights/content/operator readiness, and only then explicitly set `ALLOW_INDEXING=true` and rebuild.

`dist/sitemap.xml`, `dist/robots.txt`, canonical/OG/hreflang and `dist/build-manifest.json` derive from the configured origin. Fictional-only routes **always stay noindex and outside the sitemap**, even when indexing is enabled. See [SEO](docs/SEO.md) and [deployment](docs/DEPLOYMENT.md). These mechanisms do not promise rankings, rich results, AdSense approval or revenue.

## Architecture and project map

React 19 + strict TypeScript + Vite; no application backend. One shared component tree is rendered to static HTML at build time, then client-rendered for personalised preferences without hydration mismatch. Local font assets (Inter and Noto Tamil/Devanagari/Telugu; OFL notices in `docs/licenses/`) and generated art make no runtime CDN calls. Catalogue operations run in memory. Only `pw:` preferences/IDs persist; imported catalogue/media stay in session memory.

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

No complete discography, commercial lyric licence, broad independent catalogue, backend/editorial admin, cross-device account sync, provider integration, full fuzzy/semantic search or live ads. Search is Unicode-normalised terms and known aliases; related-album recovery is labelled. Filters are single exact selections, not ranges/multiselect. Native-language writing/renderings need human editorial review. Automated axe/Chromium tests are not screen-reader certification, real-device QA or a zero-bug guarantee. Static metadata-only pages and a small text edition do not make the business launch-ready.

The owner/account is now verified as **Paulraj916 / Paul Raj**, not the initially active Navina0 CLI identity. Correct connected-account searches returned 45 owner repositories but no PowerWords variant; the exact `Paulraj916/PowerWords` check returned HTTP 404. This may require the correct existing URL or a permission grant; it is not a reason to create a remote or use someone else's same-name project. The parent handles CLI login; no duplicate account switch is performed here. **No remote repository was created, unrelated repository cloned, code pushed or PR opened.** See [current research](docs/PAULRAJ_TARGET_RESEARCH.md).

Continue with: **“Read AI_HANDOVER.md and NEXT_STEPS.md, run the checks, preserve existing work, and implement the next unblocked item without inventing facts or licences.”**

Code: [MIT](LICENSE). Original project demo text and new project renderings: CC0-1.0; ancient underlying Tamil text and edition caveats: [rights](docs/REAL_CATALOGUE.md). No third-party music/recording/trademark rights are granted.
