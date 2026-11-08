# PowerWords · Every word, a world.

A polished, local-first foundation for a multilingual Indian music discovery and lyrics website. Warm-paper and after-hours themes, original generative cover art, meaningful discovery filters, a distraction-free lyric room, and local karaoke practice. **Working demo, not a licensed commercial music catalogue.**

## Run it

Requirements: **Node.js 22.12+** (Node 24 recommended) and npm. No account, API key, database, paid service, or `.env` is needed.

```sh
npm ci
npm run dev -- --port 4173
# http://localhost:4173
```

```sh
npm test                 # unit tests
npm run typecheck        # strict TypeScript
npm run build            # production files → dist/
npx playwright install chromium
npm run test:e2e          # desktop + mobile Chromium; axe checks; screenshots
npm run preview -- --port 4173  # serve an existing production build
npm audit
```

Playwright starts a dev server automatically on 4173 unless one is already running. CI starts a clean one. Test reports are in `playwright-report/`; visual evidence is in `artifacts/`. Screenshot tests are visual-review aids, **not pixel-baseline assertions**. Never expose Vite dev/preview servers as a production service.

## What actually works

- Responsive discovery: title, original-script title, artist, composer, lyricist, album, language and metadata search; newest/oldest/title sorting; exact multi-dimensional AND filters.
- **96 distinct metadata dimensions** across 8 groups. 48 populated dimensions filter the bundled demo; 48 are unavailable until data is supplied. Missing raga, film, collaborator and other metadata is **disabled with an honest explanation**, not fabricated. This is not a claim that all 96 have complete production data.
- 12 explicitly **fictional** tracks across Tamil, Hindi and Telugu. Original project writing, English translations and readable Latin transliteration; Tamil’s Latin tab is called Thanglish. The same short lyric exercise is reused intentionally. Other Indian languages are supported by the Unicode data model, not populated in this demo.
- Accessible native-modal lyric reader: language tabs, arrow-key tab navigation, adjustable text size, copy, click-to-seek lines, and no ads inside the reader.
- Silent timed karaoke rehearsal; local audio import up to 50 MB; local `.lrc` import up to 256 KB / 500 lines / 4 hours; manual −10…+10 second sync offset. **No copyrighted audio, microphone access, recording, or streaming.**
- Saved songs and named collections in browser local storage, including reload persistence. Add a song to a collection in its reader.
- Light/dark theme and reader font-size persistence; reduced-motion support; keyboard shortcut `/` for discovery search; skip link, focus styles, modal Escape/focus restoration, mobile navigation trap.
- Spotify, YouTube and Apple Music **external search links** only. Fictional titles may have no results. No account linkage or live synchronisation is claimed.
- Validated session-only JSON catalogue import/export in **Make it yours**; rights assertions required. Validation is a technical gate, not proof of a licence.
- Non-interruptive, clearly labelled **disabled advertising placeholder** below discovery, outside reading and playback controls. No ad SDK, auto ads, overlays, autoplay ad, fake publisher ID, tracking or CMP is loaded.
- Privacy/content-rights/about views; scoped local-data reset; bounded file inputs; render-error recovery screen; React text escaping; restrictive example security headers; web metadata and generic WebSite JSON-LD.
- Direct demo reader links: `/#song=a-little-light`. These are client-side links, **not production indexable song routes**.

## Honest boundaries

This is a tested frontend MVP, not the complete all-India catalogue or an “AdSense-approved” business. No real-artist credits, lyrics, licensed translation, full recordings, backend, OAuth, accounts, cross-device sync, editorial workflow, server search, payments or ad network integration are included. Searching A.R. Rahman deliberately returns an explanation, not invented results. Content is **noindex** and robots-blocked pending real content and launch review. Translation/native typography deserves a native-language editorial pass. Browser and assistive-technology testing is not exhaustive; zero bugs cannot be guaranteed.

## Project map

| Location                                | Purpose                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `src/App.tsx`                           | Discovery, navigation, library, reader, karaoke, import and informational views  |
| `src/catalogue.ts`                      | Typed Song/LyricLine model, 96 filter registry, explicit fictional demos         |
| `src/lib.ts`                            | Pure discovery, LRC parsing, storage safety and catalogue validation             |
| `src/styles.css`                        | Design tokens, generated artwork, responsive layouts, themes, motion/print rules |
| `src/lib.test.ts`                       | Data integrity, search/filter/sort, timing and import validation tests           |
| `tests/app.spec.ts`                     | Chromium desktop/mobile workflows, accessibility and screenshots                 |
| `docs/CATALOGUE.md`                     | Import contract and supported metadata                                           |
| `docs/catalogue.schema.json`            | Machine-readable draft-2020-12 import schema                                     |
| `docs/catalogue.example.json`           | Small importable original example (unique ID)                                    |
| `docs/CONTENT_RIGHTS.md`                | Source, rights, translations and takedown requirements                           |
| `docs/ADS_AND_PRIVACY.md`               | Safe monetisation plan and consent boundaries                                    |
| `docs/DEPLOYMENT.md`                    | Static-host setup and launch checklist                                           |
| `AI_HANDOVER.md`, `NEXT_STEPS.md`       | Continue with any developer or AI                                                |
| `docs/DECISIONS.md`, `docs/PROGRESS.md` | Architecture rationale and delivery status                                       |
| `.github/workflows/ci.yml`              | Reproducible build, tests, audit and browser checks                              |

## Architecture

React + TypeScript + Vite; no server to operate. Lucide icons; all illustration/cover art is CSS-generated. Inter and Noto Tamil/Devanagari/Telugu fonts are bundled locally (OFL licences in `docs/licenses/`). There are **no runtime CDN fonts or image requests**. Catalogue/filter operations run in memory. Persistent preferences use only keys prefixed `pw:`; imported catalogue and media are session memory only. Local audio uses revocable object URLs, never a file upload.

Current filter matching is exact equality; search combines whitespace-separated terms across the text metadata, not the lyric body. This avoids pretending to offer semantic search or fuzzy credit resolution. Imported array limits are per batch; use a backend search index and publication workflow before scaling. A production credit model should use stable contributor IDs and many-to-many roles instead of the intentionally small demo’s display strings.

## Deploy or hand over

`npm run build` produces a static `dist/` folder that can be hosted on an HTTPS static host. Read [deployment](docs/DEPLOYMENT.md) before publishing. Nothing is deployed or bought by this repository. Security headers in `public/_headers` require a host supporting that file format or equivalent host configuration; Vite does not apply them by itself.

Start a continuation with: **“Read AI_HANDOVER.md and NEXT_STEPS.md. Preserve existing work, run the tests, and implement the next unblocked item without inventing catalogue facts or licences.”**

Repository integration is intentionally pending confirmation of the exact PowerWords GitHub URL. Never overwrite an existing repository to install this standalone app; use a feature branch and preserve its history.

## Licences

Code: [MIT](LICENSE). Original demo lyric text and its project-created translations/transliterations: CC0-1.0 dedication described in [content rights](docs/CONTENT_RIGHTS.md). Third-party dependencies retain their own licences. Real music, artist branding and copyrighted lyrics are not sublicensed by this project.
