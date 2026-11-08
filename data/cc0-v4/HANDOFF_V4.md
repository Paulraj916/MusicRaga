# HANDOFF V4 — verified metadata delta ready

Root: `/workspace/powerwords-india-data-20261109/expansion-v4`

## Exact milestone and honest target gaps

**3,812 additional distinct source recording MBIDs**. Combined union: **127,064** = 123,244 v2 + eight preserved newer IDs + 3,812 additions. Recording-metadata gap to 2,000,000: **1,872,936**.

**Cleared native-script + romanized lyric pairs added: 0. Lyric-pair gap: 2,000,000.** This is NOT a lyric delivery and not a claim of 127,064 verified lyric-bearing Indian songs. Identity unit is canonical MusicBrainz Recording MBID, not composition or release appearance; unknown duplicate acoustic performances can remain in the source.

New evidence buckets: **117** recordings have explicit musical-work language/performance evidence; **3,790** have an India-associated PRIMARY artist AND that same artist's explicit vocal/instrument relationship on that recording; **95 overlap**, giving 3,812 total. Disjoint tiers: work-language preferred **117**, geographic-musical-only **3,695**. Unknown sung language, nationality, recording location and release dates stay unknown. Artist area means primarily identified area, not citizenship.

Sidecar: **428 artist IDs**, of which **179** are not in the prior v2/v3 artist sidecars. **152** recording-work performance relations to **147 distinct musical works**; **400** geographic containment relations and **401** source area entities. These entity/relationship totals must NOT be added to recording counts. Explicit new musical role occurrences: {'vocal': 2948, 'instrument': 944}.

**15** identity ambiguities excluded: two shared-ISRC cases, eight exact title/duration/artist fingerprint collisions, five video identities. Source artist area alone was NOT used to bulk-promote candidates.

## Recommended site import: DELTA ONLY

1. Verify hashes in `distribution/manifest.json` and `SHA256SUMS`.
2. Upsert `distribution/additional-artists-v4.jsonl.gz` (428 source artist objects). Preserve existing richer fields and v3 source roles.
3. Store `india-associated-areas-v4.jsonl.gz` + `india-geographic-containment-evidence-v4.jsonl.gz` as optional source-proof sidecars; store `recording-work-evidence-v4.jsonl.gz` for the work-language proof chains.
4. Upsert `distribution/additional-preferred-recordings-v4.jsonl.gz` — exactly **3,812**, all IDs absent from the 123,252 live baseline. New records have ordinary v2-compatible title/externalIds/duration/artistCredit/explicitArtistRelationships fields plus explicit association evidence. Do not infer a singer from generic artistCredit; typed vocal/instrument facts are separate.
5. Retain ALL existing live records, including the newer eight, and all previously imported v3 composer/lyricist evidence. No deletion/replacement required. Continue marking lyrics not cleared and lyric text unavailable.

`distribution/preferred-india-associated-recordings-v4.jsonl.gz` is the complete 127,064-object UNION for audit/rebuild only. It preserves the v2/eight source objects but does NOT materialize v3 role overlay into those objects: do not overwrite the richer live catalogue with it. Reapply/retain v3 separately.

`distribution/preserved-newer-recordings-v4.jsonl.gz` contains the eight existing newer source records; they are not new additions.

## Artifact row counts

| File in distribution/                               | Exact rows | Use                           |
| --------------------------------------------------- | ---------: | ----------------------------- |
| `additional-preferred-recordings-v4.jsonl.gz`       |      3,812 | preferred DELTA               |
| `additional-artists-v4.jsonl.gz`                    |        428 | source support/artist objects |
| `recording-work-evidence-v4.jsonl.gz`               |        152 | source support/artist objects |
| `india-geographic-containment-evidence-v4.jsonl.gz` |        400 | source support/artist objects |
| `india-associated-areas-v4.jsonl.gz`                |        401 | source support/artist objects |
| `identity-review-v4.jsonl.gz`                       |         15 | EXCLUDED review/audit only    |
| `scope-review-sample-v4.jsonl.gz`                   |      1,000 | EXCLUDED review/audit only    |
| `preserved-newer-recordings-v4.jsonl.gz`            |          8 | existing newer baseline       |
| `regional-dataset-audit-rows-v4.jsonl.gz`           |        340 | EXCLUDED review/audit only    |
| `preferred-india-associated-recordings-v4.jsonl.gz` |    127,064 | union audit/rebuild           |

## Substantive bulk/source research completed

Scanned **40,826,836** cached global MusicBrainz recording rows. Exact evidence census: **20,081** recording IDs touch configured work-language declarations of any source work type; **138,236** have an India-associated primary credited artist; their union is **142,607**. Most lack enough additional musical evidence for NEW admission. **117,835** union candidates are NOT promoted by this stricter new-evidence filter. A bounded 1,000-row review sample is supplied; it can overlap old baseline records and is not a deletion list.

This proves the pipeline can process the world core while preserving a narrow evidence filter. It does NOT establish two million eligible Indian recordings. Do NOT inflate the target with 444,818 broader MB market candidates, 466,989 Discogs appearances, AcousticBrainz repeated submissions, or Wikidata works.

Other actual acquisition: 340 CC-BY-4.0 regional dataset rows from a checksum-verified 16.9 kB workbook. It has no titles, artist names or recording IDs, so overlap cannot be resolved and **zero count as new recordings**. Its segregated audit export preserves required attribution; do not load it into the song index. No 5.4 GB features, commercial audio, artwork or lyric source downloaded.

Licences checked this milestone for MusicBrainz, Wikidata, AcousticBrainz, Europeana, the regional dataset, Saraga and a publisher-MIT-labelled Bollywood repository; detailed source and rejection decisions are in `docs/source-registry-v4.json`. SANGEET is 116 compositions, not recordings; paper licence is not verified lyric/dataset clearance. Rights worker may inspect that lead independently, but this pack contains no lyric XML and no claimed lyric pairs.

## Validation / reproducibility / constraints

- `data/coverage-v4.json`: exact source identity counts, target gap, disjoint tiers, global census and source inputs.
- `data/validation-report-v4.json`: unchanged baseline/eight, unique IDs, identity safeguards, source endpoints, exact musical role and geographic proof chains, recursive excluded-field checks, licence separation and gap arithmetic.
- `checkpoints/build-manifest.json`: per-table SHA256/rows, source/target hashes, v2 unchanged; final packaging also rehashes the source archive and verifies the full immutable v3 release.
- `distribution/manifest.json`: deterministic gzip bytes, line counts, licences, purpose and SHA256 for compressed and original bytes; decompression roundtrip verified.
- `RELEASE_MANIFEST.json` / `SHA256SUMS`: sealed code, data, docs and provenance hashes.
- `docs/METHOD_RIGHTS_FEASIBILITY_V4.md`: exact criteria, archive extraction budget, licence boundaries and concrete finite rerun commands.

Only cached core facts/relations enter the preferred additions, under CC0. The regional CC-BY audit is deliberately separate. Metadata does not clear lyrics, translations/transliterated lyric editions, audio or art. No guessed ethnicity/nationality, no unknown language converted to Hindi, no new release-date guesses. Baseline release-text language remains weaker than recording language; source artist geography remains weaker than independently proven musical origin. No claims of all-India completeness, perfect acoustic deduplication, ranking or monetisation approval.

No website edits, repo writes, pushes, deployments or external messages. Existing v2/v3 outputs remain immutable. All jobs are finite and complete at this milestone; no unattended endless download or 24-hour runtime promise.
