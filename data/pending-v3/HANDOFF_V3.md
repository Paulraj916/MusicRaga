# HANDOFF V3 — READY: additive role evidence, not a replacement catalogue

Directory: `/workspace/powerwords-india-data-20261109/expansion-v3`

## Milestone

Zero-download enrichment for the SAME **123,244** preferred v2 recording IDs. **0 new recordings**; v2 is unchanged. **25,420** recordings (20.6258%) have included role evidence. **23,822** recordings (19.3291%) bind to **20,784** works through explicit performance relationships.

**5,460** distinct source artist IDs; only **4,199** are source-typed Person. Other source types: {'Unknown': 1081, 'Person': 4199, 'Group': 166, 'Choir': 11, 'Other': 3}. **1,306** role-associated artist IDs are not in v2's preferred artist sidecar: import the v3 artist sidecar, not just the credit rows.

All percentages below divide by **123,244 recordings**, NOT people, releases or lyric texts. Artist and person counts overlap across roles.

| Role       | v3 recordings | Coverage | Distinct artist IDs | Source Person IDs | Newly covered recordings vs baseline | Nondeleting union recordings |
| ---------- | ------------: | -------: | ------------------: | ----------------: | -----------------------------------: | ---------------------------: |
| composer   |        20,885 | 16.9461% |               1,673 |             1,191 |                                4,936 |                       20,887 |
| lyricist   |        17,781 | 14.4275% |               2,026 |             1,508 |                                4,357 |                       17,781 |
| writer     |           880 |   0.714% |                 314 |               291 |                                  205 |                          880 |
| authorship |             0 |     0.0% |                   0 |                 0 |                                    0 |                            0 |
| vocal      |        10,956 |  8.8897% |               2,411 |             2,027 |                                    0 |                       10,956 |
| performer  |         1,254 |  1.0175% |                 360 |               331 |                                    0 |                        1,254 |

Composer gains: **4,936** recordings; lyricist gains: **4,357**; generic writer gains: **205**. These sets overlap; do NOT sum. Vocal/performer evidence matches v2 exactly (no claimed improvement). Keep the **2 baseline-only composer recordings** listed in `data/coverage-diff-v2-v3.json`: older Nov 4 core must not erase newer Nov 7 cached assertions. Nondeleting composer union is **20,887 (16.9477%)**.

## Import files — all gzip JSONL, CC0 factual metadata

| File in `distribution/`                 | Exact rows | Compressed bytes |
| --------------------------------------- | ---------: | ---------------: |
| `artist-recording-evidence-v3.jsonl.gz` |     18,785 |          817,102 |
| `artist-work-evidence-v3.jsonl.gz`      |     36,395 |        1,366,695 |
| `recording-role-enrichment-v3.jsonl.gz` |    123,244 |        9,117,093 |
| `recording-work-evidence-v3.jsonl.gz`   |     24,268 |        1,541,686 |
| `role-artist-crosswalk-v3.jsonl.gz`     |        442 |           29,730 |
| `role-artists-v3.jsonl.gz`              |      5,460 |          358,407 |
| `role-works-v3.jsonl.gz`                |     20,784 |        1,020,221 |

Total compressed data: **14,250,934 bytes**. Per-file compressed/uncompressed SHA256 hashes: `distribution/manifest.json`. Overlay SHA256: `702ae5ed1bb535c3a3d24dcd77de1beff433e01deeb7656c8aa08a4b4f31a456`.

## Safe integration order

1. Verify `distribution/manifest.json` hashes. Verify the existing recording universe is the v2 preferred IDs pinned by `checkpoints/build-manifest.json`; do not substitute the wider India-market-only dataset.
2. Upsert `role-artists-v3` and `role-works-v3` as **source facts** by namespaced UUID. Keep existing known fields; never overwrite recording languages from work-language declarations. Do not display alias type 3 as a verified name.
3. Upsert the three normalized relationship-evidence files by exact versioned evidence `id`. They contain source table/row/link IDs, endpoints, role UUID, dates, credited-as strings, qualifiers and provenance. Every referenced work/artist is supplied.
4. Stream `recording-role-enrichment-v3`: target `id` is the existing `mb-recording:<UUID>`. Store overlay/evidence separately or merge ONLY role fields. Do NOT replace full recording records or erase existing credits when arrays are empty. `focalRolesWithoutEvidenceInThisSnapshot` is local evidence status, not a deletion or global absence statement.
5. Merge credit proofs by `credit.id`. For UI dedup use `(recordingId, artistId, roleTypeId, workId-or-null)` while retaining all proof/version IDs and qualifiers. For existing v2 direct vocal/perf rows, compatibility key is `(l_artist_recording, sourceRelationshipId, 20261104-002222)`, NOT numeric ID alone; avoid showing the same v2 credit twice.
6. Optional artist crosswalk: 442 source-asserted MB-to-Wikidata/Discogs candidate rows, deduped/versioned. No name-only or conflicting-ID automatic merges.
7. Keep v2 release/track/recording cardinalities unchanged. Cache search facets from explicit roles; do not infer vocalist from artist-credit or generic performer; do not turn generic writer/arranger into composer or lyricist.

Streaming example (standard library):

```python
import gzip, json
with gzip.open("distribution/recording-role-enrichment-v3.jsonl.gz", "rt", encoding="utf-8") as stream:
    for line in stream:
        overlay = json.loads(line)
        # merge_credit_proofs(existing_recording_id=overlay["id"], overlay=overlay)
        # Empty arrays never delete existing source evidence.
```

## Audits / rights / reproduction

- `data/validation-report-v3.json`: independent target/evidence/role/attribute/CC0/coverage validation; all checks pass.
- `data/role-coverage-v3.json`: exact role/Person/artist counts, all denominators and excluded relationship types.
- `data/coverage-diff-v2-v3.json`: role gains, baseline-only recording IDs and safe unions.
- `data/coverage-details-v3.json`: source work-language and alias-locale counts; these are NOT verified sung languages.
- `checkpoints/build-manifest.json`: source hashes, exact input table counts, role UUIDs, original target SHA256, v2 immutability checks.
- `docs/METHOD_AND_RIGHTS_V3.md`: source URLs, CC0-vs-NC-SA boundary, known gaps and rebuild commands.
- `RELEASE_MANIFEST.json` / `SHA256SUMS`: sealed output/code/docs hashes.

Core MusicBrainz facts and reused Wikidata claims are CC0; supplementary NC-SA annotations/tags/genres/ratings excluded. No lyric text, translations, audio or artwork. Metadata is NOT lyric/media permission. Source Person typing is not independently verified identity; no nationality guessed. Many records still lack explicit roles. Role relationships carry composition context, not proof that words were sung (instrumentals/covers exist). Attribute free-text/attribute credited-as source tables were not cached and are not claimed complete. No claims of all-India completeness, ranking guarantees, AdSense approval, or uninterrupted 24h execution.

All work stayed in this v3 directory; no website repository edits, pushes, messages or deployments.
