# Next steps — scalable catalogue checkpoint

Current expansion is documented in SOURCE_PIPELINE / SCALABLE_ARCHITECTURE. Review its feature PR before merging; source dataset/caches/test evidence must remain separate. Immediate work: resolve the one missing-title source row from a real revision; independently review source occupations/citizenship, native labels and duplicate work/recording identities; extend permissioned feeds and underrepresented languages; load release/album/actual performer/date facts through licensed sources, not inferred credits. Measure real concurrency and static shard budgets before increasing catalogue scale. See 24_HOUR_CHECKPOINT_PLAN for finite resumable checkpoints, not an always-running promise.

The full static build needs no paid runtime/API and supports real metadata discovery. Deploy only on an explicitly selected free root-hosted static service, with an actual origin and indexing disabled until substantive-content/operator/rights review. GitHub Pages project-subpath support is a remaining adaptation. Search Console ownership/submission and AdSense publisher ID/approval/CMP are not completed; never promise ranking or revenue. Live ad requests remain intentionally blocked.

## Retained product backlog

# Earlier product backlog: turn the foundation into a real service

## P0 — exact repository and preservation

- Continue from the confirmed public https://github.com/Paulraj916/PowerWords repository (`main`); inspect its current history and use feature branches/PRs for future work.
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
