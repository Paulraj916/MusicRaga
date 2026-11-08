# Next steps — scalable catalogue checkpoint

## Latest: search-first root (9 November 2026)

Read `docs/SEARCH_FIRST_RELEASE.md` first. Default root is now direct song/album/artist search and a clear unavailable-lyrics reader. Advanced tools moved behind More tools / `?workspace=1`; real recording-linked native + romanized pairs remain **0**. Album-name static discovery uses a verified 25,574-release metadata bridge; recordings stay **127,064**, not extra songs. Ads OFF, preview noindex. Run full build (or reuse verified shards) before browser tests; `build:curated` alone removes/does not rebuild the catalogue.

**Current user-selected brand: Music Raga** (formerly PowerWords). Canonical repo: https://github.com/Paulraj916/MusicRaga ; project preview target: https://paulraj916.github.io/MusicRaga/ . Same history/data/PR preserved; verify the release deployment/HTTP before claiming live. Old Pages path may NOT redirect. Read `docs/RELEASES.md`.

## Active v3 role evidence + v4 additive snapshot

Read `docs/V3_V4_RELEASE.md` first. Built snapshot: **127,064 distinct MusicBrainz recordings**, **21,096 works**, **212 Wikidata music entities** = **148,372 source music entities**, plus **21,406 source artist profiles**. These are not additive unique songs/people or a census of Indian music. The eight older recording IDs remain. Recording-level composer evidence covers **20,893** and lyricist **17,787**; within the original preferred v2 universe those counts are **20,887 / 17,781**. Explicit vocals: **13,902 recordings / 2,464 source artist IDs**. Roles overlap and unknown fields remain unknown.

V3 is now integrated from the legacy-named `data/pending-v3` directory, not pending. **61,158** v3 proof chains plus retained baseline chains are durable in SQLite (**93,168 total**). Empty overlays never delete older assertions; the two newer baseline-only composer records are preserved. Source relationship versions/qualifiers and crosswalk candidates are retained separately; no name-only merges. V4 adds **3,812** recordings, **141** works and **179** profiles; 15 ambiguous identities are excluded. Six implausible source duration fields become unknown, with original facts retained, not guessed units.

Visible actual recording-linked native + romanized lyric pairs: **0**. Pair goal **2,000,000**, pair gap **2,000,000**, metadata gap **1,872,936**. Romanization (Tanglish/Hinglish) is not English translation; fictional demos and ancient verse are excluded. No clearance import is enabled. Metadata CC0 never clears lyrics/audio. Work language, edition text and primary-artist geography are distinct evidence, never sung-language/nationality claims.

Source release builds and publishes through the existing PR/workflow; verify actual Pages bytes before claiming the latest snapshot live. Same main/history are preserved. AdSense stays OFF, noindex stays ON, no paid deployment or Google ranking promise. No uninterrupted 24h process exists.

## Retained product backlog

# Earlier product backlog: turn the foundation into a real service

## P0 — exact repository and preservation

- Continue from the confirmed public https://github.com/Paulraj916/MusicRaga repository (`main`); inspect its current history and use feature branches/PRs for future work.
- Inspect its tree/configuration read-only. If an existing app is present, adapt rather than overwrite; a `prototype/` subdirectory may be safer initially.
- Work on a fresh feature branch; preserve existing history, files, tests and attribution. Re-run this project’s checks after integration. Push only to the confirmed target. Do not force-push, skip hooks or auto-merge.

## P0 — rights and credible catalogue

- Choose a focused initial licensed catalogue, e.g. a handful of consenting independent Tamil artists, before all-India coverage.
- Obtain real lyric-display, translation, transliteration, timed-text, art and audio permissions as applicable. Do not scrape commercial lyric sites.
- Expand the 3 sourced A. R. Rahman and 2 sourced Vada Chennai metadata-only entries using reviewed role-specific sources. Current small coverage is not a complete discography. Never add protected text without separate permission.
- Implement a server-controlled publication queue, private evidence records, territory/expiry checks and operator contact/takedown route.
- Ask native editors to review Tamil, Hindi, Telugu, translations and transliteration conventions.

## P1 — persistent production system

- Stable work/recording/release/contributor IDs and many-to-many roles; distinguish composer, music director, arranger, producer, performer and lyricist. Fields such as raga must have source provenance.
- Database migrations, server-authorised admin roles, review/audit trail, backups, rate limits and input validation.
- Search index, pagination, fuzzy matching, aliases and transliteration-aware matching; determine facet counts under current filters.
- Extend the implemented static song/artist/language routes, true 404s, configured canonical/sitemap/robots and real text-version hreflang to a future trusted backend/album model. Existing SEO is implemented, not a remaining placeholder. Set actual SITE_URL and review launch eligibility before enabling real pages; demos always stay noindex.
- Split `App.tsx` into feature modules while preserving tested behaviour. Add translation/i18n UI labels and structured error monitoring without silent tracking.
- Optional account sync with security/retention/privacy design. Existing local library must not be silently uploaded.

## P1 — monetisation only after readiness

- Follow `docs/ADS_AND_PRIVACY.md`; no approval/revenue guarantee.
- Real publisher settings, certified CMP as required, consent withdrawal, ads.txt, restrictive per-service CSP, no-fill/failure testing and reserved ad dimensions. Keep lyric and karaoke views ad-free.

## P2 — deeper music experience

- Accessible native multi-select contributor filters and range filters where justified. Current filters are single exact values combined with AND.
- Optional approved provider OAuth via server-side secure token storage; no current live connections. Respect provider licences, embedding and developer terms.
- Word-level karaoke timing only with licensed data; native audio/cross-browser format testing, media duration sync, recording only via a separately approved privacy flow.
- Broader language catalogue and UI localisation, transliteration display standards, screen-reader/native-script and 200–400% zoom QA.
- Tests in Firefox/WebKit and real mobile Safari/Android, manual screen reader validation, performance budgets and end-to-end deployment checks.
- Catalogued source/rights evidence, dependency update automation and tested backups before a public launch.

## Not needed to run today

No ad account, OAuth secret, paid deployment, backend or commercial lyric copy is required to inspect and use the working original demo.
