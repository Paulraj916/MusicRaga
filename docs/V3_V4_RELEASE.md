# V3/V4: evidence is useful; permission is a different milestone

## Exact built snapshot, 09 November 2026 IST

| Unit                                                |                Count | Meaning                                                                                                                             |
| --------------------------------------------------- | -------------------: | ----------------------------------------------------------------------------------------------------------------------------------- |
| Distinct MusicBrainz recording IDs                  |              127,064 | 123,244 preferred v2 + eight retained newer IDs +3,812 additions; not guaranteed distinct acoustic performances or all Indian songs |
| Source works                                        |               21,096 | 14,884 baseline +6,071 v3 sidecar additions +141 v4 work references                                                                 |
| Wikidata song/single entities                       |                  212 | Overlap with MusicBrainz possible, not extra unique songs                                                                           |
| Total indexed music entities                        |              148,372 | Do not advertise as unique songs                                                                                                    |
| Source artist profiles                              |               21,406 | 19,921 +1,306 v3 +179 v4; not deduplicated people or all singers                                                                    |
| Recording composer coverage                         |               20,893 | 20,887 within preferred v2; six further retained older recording IDs                                                                |
| Recording lyricist coverage                         |               17,787 | 17,781 within preferred v2; six further retained older recording IDs                                                                |
| Recording generic writer coverage                   |                  881 | 880 preferred; not promoted to composer or lyricist                                                                                 |
| Recording explicit vocal coverage                   |               13,902 | 2,464 source artist IDs; v4 adds2,946 recording IDs, not2,948 role occurrences                                                      |
| Versioned v3 credit proofs                          |               61,158 | Source assertion chains; roles and versions overlap                                                                                 |
| All credit proofs including baseline                |               93,168 | Not performances, people, or licences                                                                                               |
| Cleared real-recording native+romanized lyric pairs |                    0 | No lyric-clearance importer is enabled                                                                                              |
| Pair goal                                           |            2,000,000 | Goal, not achieved coverage                                                                                                         |
| Metadata gap / cleared-pair gap                     | 1,872,936 /2,000,000 | Demos and ancient verse excluded                                                                                                    |

`artifacts/catalogue-v3-v4-coverage.json` is the SQL-derived local snapshot report. A source/build report is not live deployment proof: verify the current hosted `catalogue/manifest.json` and actual pages after CI. Release remains on `feat/scalable-india-catalogue`, existing PR1; main and all history are preserved.

## Offline import and preservation

`npm run build` runs `backend.bootstrap`: baseline compressed CC0 manifest → source adapters → durable staging/publish → **v3** → **v4** → name resolution → static export. `npm run catalogue:bootstrap` performs the data steps alone. No network requests occur in these bundled import steps.

V3's directory is still named `data/pending-v3` to preserve portable source paths; it is now **active**, not pending. All seven compressed and uncompressed source hashes/row counts are checked before data import, as is the pinned preferred-v2 target SHA256 and exact recording universe. Artists and work facts precede versioned relationship evidence, then recording credit proofs. Empty arrays mean no new evidence, never deletion. Original full recordings are not replaced by role overlays. Two Nov7 baseline-only composers absent in the older Nov4 core are retained:

- `484d6c3b-4cb0-4d53-9c1a-5107f94f63f7`
- `5eacee10-33cd-44a4-ab6c-877157ed824f`

Separate SQLite tables retain source facts, exact versioned source relationship IDs, complete qualifiers/dates/credited-as fields, optional crosswalk candidates and proof/version IDs. Display credits deduplicate artist/role, while bounded proof previews expose composition context and overlapping source assertions. The two-step recording→work→artist chain is checked, as are focal role UUIDs. Generic artist credit, performer, writer or occupation never becomes a vocalist/composer/lyricist guess. Later base revisions rematerialize separately stored proof-backed roles instead of erasing them. Work-language claims never overwrite recording language. Known profile fields persist; aliases are search hints, not verified new names.

V4 uses **only the six small normalized CC0 delta/support files** in `data/cc0-v4`, not its127,064-row union/replacement or global raw caches. Artist profiles are an independently resumable validated phase; recording/work additions publish in one transaction. Existing recording identity collisions abort instead of replacing richer v3 records. The15 ambiguity-review rows are excluded from the track index. Geographic primary-artist musical association is labelled distinctly from work/release-text language and never as citizenship or recording origin. See the bundled original HANDOFF_V4 and METHOD_RIGHTS_FEASIBILITY_V4.

Six source durations exceed the accepted24h metadata bound. Their normalized durations remain **unknown**, original values remain in source facts, and the importer records field-quarantine IDs. No unit conversion or duration guess is made. All3,812 source recording identities remain eligible under the other checked evidence. Identity exclusions and invalid-duration fields are different counts.

## Frontend, bounded data and proof lookup

`IndiaIndex.tsx` now has a mobile-first coverage panel showing recording IDs, cleared native+romanized pairs, goal and both gaps. Tanglish/Hinglish = native words in Latin letters, **not English translation**. Unknown/restricted rights, fictional examples and ancient verse cannot inflate real recording-pair totals. A local review-state table exists for a future rights workflow, but no automatic clearance/lyrics importer is supplied.

Composer/lyricist filters now operate on actual recording-level materialized facts, alongside work/source/artist/language-evidence filters. Open a result's **Provenance and availability → View credit evidence** for an on-demand, bounded20-proof source preview. Full source relationship IDs, versions and qualifiers remain in SQLite and bundled source sidecars. No giant catalogue or proof list is bundled into JavaScript.

Static export retains100-record pages, query-specific Unicode/facet shards,16-entry/8MiB decoded-JSON client cache and256 hash-distributed proof buckets. Version fingerprints include credits, work links, profile facts, source digests and proof payloads; changing evidence cannot silently reuse an old content version. Exact Unicode tokens plus final-term prefixes remain intentionally non-semantic. No protected lyric search is claimed. Optional read-only API adds `/api/v1/evidence?recording=musicbrainz:recording:<UUID>`, fixed20-item preview, with no write/CORS/account endpoint.

Measured initial local export:3,175 JSON files /332,569,437 bytes; largest shard954,924 bytes. Recheck the final export report after content-address changes. Further growth requires compact ID registries/postings, not linear verbose JSON replication. Do not assume the two-million target fits current free-host constraints. Confirm the host's current official quotas/terms before expanding. No paid deployment is configured.

## Tests, rights and launch gates

Backend regressions cover source hash/target mismatch, missing/mismatched proof chains and UUIDs, rollback, empty-overlay retention, later base revisions, lyric-payload rejection, role/unknown-language separation, additive v4 idempotency/collisions and invalid durations. Browser tests exercise actual composer evidence, native search, exact counters, mobile widths and selected axe rules. Project-prefix tests cover clean reloads, canonicals, static search, proof fetch and counters on desktop/mobile. Existing curated reader/collections/karaoke/ads/SEO tests remain.

MusicBrainz core metadata: https://musicbrainz.org/doc/About/Data_License . Wikidata structured facts: https://www.wikidata.org/wiki/Wikidata:Licensing . Supplementary NC-SA tags/ratings/annotations are excluded. These licences do **not** clear lyrics, transliterations, translations, audio or artwork. No commercial text/audio imported. Source language/geography association does not prove national origin. This is a finite tested checkpoint, not a universal catalogue or uninterrupted subscription-independent24h job.

Free GitHub Pages remains an **ad-free open-source preview**, default noindex. Ads stay OFF with empty publisher ID; no Google verification/submission/approval, ranking or earnings promise. Never upload publisher credentials, user media or archives into source. The last working hosted release remains until verification/project-prefix tests and deployment succeed.

## Final local validation checkpoint

An independent clean bootstrap/export completed in127.2 seconds on the development box. Exact entity/artist/role/pair counts and sorted content hashes of tracks, materialized credits, profiles and proof payloads match the preserved-state import. This is a measured local rebuild, not a two-million-record benchmark or hosting SLA. Root final build,68-route SEO audit, TypeScript and format checks passed. Frontend59 tests, backend50 tests, ads4 and indexing-policy4 passed;65 browser passes plus one expected desktop skip, and both project-prefix viewports with zero selected axe violations/runtime errors. Dependency audit reported zero vulnerabilities. These checks are automated Chromium coverage, not a guarantee of no bugs or manual screen-reader certification.
