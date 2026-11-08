# Lakh-scale real metadata checkpoint · 09 November 2026 (IST)

## Active source-backed catalogue

- **123,252 distinct MusicBrainz recording IDs** = 123,244 preferred v2 IDs plus eight older work-linked baseline IDs absent in the older core snapshot. Upsert, not replacement or deletion.
- **14,884 compositions** and **212 Wikidata song/single entities** remain separate: **138,348 source music entities total**, NOT that many unique songs.
- **19,921 source profiles** = 17,475 MusicBrainz profiles + 2,446 Wikidata profiles; not deduplicated people or proven Indian nationals. 18,010 referenced source credit identities.
- **10,956 recordings** have explicit source `vocal` relationships involving **2,411 artist IDs**. Generic `credited_artist` is NOT singer/composer evidence. Exact source role IDs/relationship IDs and performance attributes are retained. Source assertions are not independently verified musical facts.
- Preferred associations: 17,122 work-language-associated, 106,122 release-text-language-associated. These are NOT necessarily sung language or Indian origin. Actual `languages` stays unknown for recordings where not explicitly supplied. The UI exposes an independent **Language association (not sung language)** filter.
- 138,207 unknown original years; 123,276 unknown-language entities. Edition dates are not recording first-release dates. 17,332 baseline work links, zero missing baseline work targets. Native aliases and exact same-source IDs may resolve missing names; no name-only identity merge.
- No commercial lyrics, translations, audio or artwork. CC0 applies to normalized source metadata, not media rights.

## Bounded static publishing

The measured v2 export is **2,775 JSON files / 249,838,391 bytes**, with largest JSON 881,935 bytes and largest Unicode-token shard 716,600 bytes. Query-specific files and 100-record pages are fetched, not the entire index. Cache holds at most 16 entries and an 8 MiB decoded UTF-8 JSON budget (not a total browser-heap guarantee). Sources are compressed and hash-checked at build, not fetched live. Generated output is ignored by Git and uploaded as a Pages artifact; raw/global dumps are never published.

Original 68 source-led HTML routes remain. No 123k thin/duplicated SEO song pages are generated. Search terms index actual titles, aliases and supplied credits, not unlicensed lyric lines. No guaranteed ranking/indexing/AdSense approval or all-India completeness.

## Preferred source scope and deferred graph

Pinned core: https://data.metabrainz.org/pub/musicbrainz/data/fullexport/20261104-002222/mbdump.tar.bz2 . Earlier work snapshot and per-row timestamps/URLs/hashes remain in manifests. Source rights/method: data/cc0/RIGHTS_AND_METHOD_V2.md and original rights docs. Only two preferred v2 payloads (recordings and artists) enter the active catalogue; baseline exports remain intact.

The worker also produced 154,937 edition appearances, 25,574 releases/21,629 groups, wider India-market-only candidates, Discogs occurrences and crosswalks. These are NOT extra unique recordings and are NOT silently loaded into active discovery. Associated edition IDs link to actual MusicBrainz sources, but album/edition-track browsing remains follow-up work. Raw ~33.6 GB worker state is excluded. Reproduction scripts are preserved separately and may need explicit large source downloads; ordinary bootstrap/build makes zero network requests.

## Free project preview, not a monetised production launch

Configured target: **https://paulraj916.github.io/PowerWords/**. Check the actual successful `free-pages-preview` job before asserting it is live. The feature branch can publish a default-noindex open-source preview after the verify job and desktop/mobile project-prefix regression pass; main remains unchanged until reviewed. Source/API/asset links and clean route reloads honour `/PowerWords/`. Original root-host builds still work.

GitHub Pages ignores `_headers`, does not run the Python API and does not offer custom response-header controls. Metadata-only JSON is not promoted through an indexable bulk sitemap. HTML noindex is explicit. Provider logs may retain requests/IPs; no library/audio uploads occur. A production host must supply real header/security/privacy review.

GitHub Pages is for this ad-free open-source project preview, **not a free commercial-business hosting promise**: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits . Current site size is below its 1 GB published-site limit; bandwidth/rate limits still apply. Live advertising is blocked. AdSense needs an eligible operator/site, real publisher ID, approval, certified CMP where required, privacy/CSP and review. Root-level ads.txt on a project-subpath host also needs a separate production solution. No paid resource, new external account, Search Console/AdSense submission or rank/earnings guarantee.

## Pending v3: preserved, NOT active

`data/pending-v3` holds seven compressed CC0 evidence exports (14,250,934 bytes) and exact handoff/hashes for portable continuation. It enriches the SAME 123,244 recording IDs, not new songs. Composer/lyricist improvements must NOT be claimed in v2 until the ordered sidecar/proof/overlay integration and regression are completed. See its README and HANDOFF_V3.md; preserve the two older composer-only recordings and never erase existing evidence through empty arrays. No continuous 24-hour worker is scheduled.

## Measured validation for v2

59 frontend unit tests, 34 backend tests, four ad-config tests, four production indexing-policy tests, 63 browser passes plus one expected desktop skip (64 total), 68-route SEO audits of root and project-prefix builds, and separate real desktop/mobile project-host flows with zero detected selected axe violations/runtime errors. Typecheck, format, production build, mobile-video frame regression (0.992297) and npm audit (zero known vulnerabilities) passed locally. The initial real empty-evidence-object renderer regression was caught by the new tests and fixed; missing metadata is now guarded. Hosted CI/deployment results must be checked for the published commit. Previous benchmark is explicitly synthetic, not a real music count or production-load certification.
