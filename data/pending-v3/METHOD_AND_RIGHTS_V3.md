# Method, scope and rights — role overlay v3

## Reproducible, bounded, zero-download enrichment

This build reads the existing official MusicBrainz CC0 relational core snapshot `20261104-002222`, the immutable v2 preferred recording IDs, and the earlier cached Song-work JSON metadata. It makes **zero network requests**. No API scraping, credentials, paid service, supplementary dump, audio, artwork, or commercial lyric source is involved. It neither modifies v2 nor adds recordings. Python 3 standard library only; output directory is this v3 directory.

`checkpoints/build-manifest.json` pins the source archive SHA256, schema, scanned table SHA256s/row counts, role UUID contracts, target artifact hash, and before/after v2 input hashes. The source archive SHA256 is `fa3ed54bb6371c1737959f3631c8e5001a79e72c2376433697950c1185470cf1`. Source retrieval timestamps in rows are reused from the pinned cached acquisitions, not presented as new downloads. Checkpoint times are IST (+05:30).

Tables streamed: recording, link_type, l_recording_work, l_artist_work, l_artist_recording, link, link_attribute_type, link_attribute, work_type, work, language, work_language, artist_type, artist, artist_alias. Only relationships touching the fixed 123,244 preferred recordings and their linked works are exported. The input cache is shared read-only; it is not duplicated.

Composition role evidence requires BOTH an explicit `recording -> work` **performance** relationship and a typed `artist -> work` creator relationship. Publishing (12) and dedication (2) relationships are excluded. Creator roles other than composer/lyricist/writer/authorship remain in `otherCompositionCredits`, preserving exact source roles. Generic writer/authorship do not imply composer or lyricist. Work arrangement does not imply recording arrangement. Vocal arranger does not imply vocalist. Direct `artist -> recording` vocal and generic performer relationships are separate. An artist-credit alone never establishes singing, composition, nationality, or language.

The overlay preserves source relationship row IDs, table names, link IDs, snapshot, relationship type UUID, dates, credited-as endpoint strings, and cached link-attribute type UUID/name qualifiers. `link_attribute_credit` and `link_attribute_text_value` are not present in the extracted cache: attribute-specific credited-as/free-text values are **not asserted complete**. Endpoint source credits ARE present. Relationship dates are relationship-validity dates, not release dates.

`role-works-v3` contains linked works of their original source work types (including unknowns), NOT an invented set of new songs. Declared work languages describe compositions, not necessarily words sung in each performance; instrumental versions, covers, translations, and medleys exist. They must never replace v2 recording language associations. No new nationality or recording-language fields are inferred.

`role-artists-v3` preserves source names, sort names, source artist type and aliases. Source type **Person** counts are separated from Group, Choir, Other and Unknown. Distinct artist IDs are NOT necessarily distinct people; source duplicate identities may remain. Source aliases are not generated translations; locale is nullable. Alias type 3 is a search hint, not a verified native display name. `primaryForLocale` is only the source assertion.

Cached Wikidata crosswalk claims are filtered to role-associated artists and deduplicated by MB artist and source Wikidata identity. Candidates and versioned evidence are preserved, NOT resolved by name matching or automatically merged. Crosswalk rows add neither new recordings nor independently verified nationality.

## Versioned identity and additive merging

- Target recording: `mb-recording:<MB UUID>` — identical v2 IDs.
- Artist/work IDs: `mb-artist:<UUID>`, `mb-work:<UUID>`.
- Relationship evidence: `mb-rel:<table>:<numeric-row-id>@20261104-002222`.
- Credit proof: `mb-credit:20261104-002222:<recording-UUID>:<table>:<row-id>`.
- Crosswalk evidence: `wd-artist-crosswalk:<QID>@<source-retrieval-timestamp>`.

Do not dedup relations by numeric ID alone: tables have independent numeric ID spaces. Evidence identity includes source table and snapshot. Repeated work credits for multiple performances are contextual proof chains, not additional people or songs. Display credit identities can group `(recordingId, artistId, roleTypeId, workId-or-null)`, while retaining ALL versioned proof identities and qualifiers.

The Nov 4 relational snapshot is older than the earlier Nov 7 Song-work export. Two preferred recordings have baseline composer evidence absent from the older v3 snapshot. KEEP that evidence. Empty credit arrays and `focalRolesWithoutEvidenceInThisSnapshot` mean **no evidence here**, not an assertion that the role does not exist. The correct nondeleting composer union is 20,887 recordings, rather than replacing the previous data with 20,885.

## Rights and source documentation

Official source documentation checked in the prior acquisition phase of this same research task and retained in v2 rights documentation:

- https://musicbrainz.org/doc/MusicBrainz_Database/Download
- https://musicbrainz.org/doc/MusicBrainz_Database
- https://musicbrainz.org/doc/MusicBrainz_Database/Schema
- https://musicbrainz.org/doc/Development/JSON_Data_Dumps
- https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
- https://www.wikidata.org/wiki/Wikidata:Data_access
- https://www.wikidata.org/wiki/Wikidata:Licensing

MusicBrainz **core factual metadata and relationships are CC0-1.0**. The archive's own CC0 COPYING text is preserved as `docs/SOURCE_CC0_LICENSE.txt`. CC0 permits commercial reuse without an attribution requirement under its waiver/fallback licence; maintain source links/acknowledgement for transparency and correction. It does not supply warranties or clear unrelated third-party rights, personality/privacy or trademark rights.

MusicBrainz supplementary annotations, tags/genres and ratings are separately CC BY-NC-SA 3.0 and excluded. No such fields are recursively imported. Wikidata structured claims/labels are CC0; only the already-cached source-asserted crosswalk facts are reused. No Discogs track data is added by this milestone; Discogs IDs in Wikidata claims are identifiers, not a second song count.

**Metadata permission is not permission for lyric text, translations of lyrics, audio, recordings, album art, photographs or video.** Composer/lyricist credits are factual assertions, not rights grants for the compositions. No lyric text/media is contained in these exports. They do not establish completeness of Indian music, singer identity for uncredited records, search ranking, or monetisation approval.

## Exact audit outputs and known gaps

`data/role-coverage-v3.json`: unique recording and artist-ID counts, source Person counts, typed roles and relationship totals, denominator percentages. Role counts overlap and must not be summed.

`data/coverage-diff-v2-v3.json`: independently checked baseline, gains, baseline-only IDs, nondeleting unions, and distinct artist-ID gains. Composer/lyricist/writer baseline joins v2 associatedWorkIds to the earlier Song-work export. Vocal/performer baseline is the same-snapshot v2 direct relationships, so the v3 coverage MUST and DOES match rather than claiming a gain.

`data/coverage-details-v3.json`: exact source work-language counts, overlapping recording-to-work-language association counts, source alias locale coverage, and artist-sidecar overlap. No recording sung-language inference.

Most target recordings have no explicit role relationships in this snapshot. Unknowns remain unknown. Missing roles need new permissioned factual sources or source curation, not artist-credit guessing. This milestone improves evidence depth, not catalogue cardinality.

## Rebuild

From this directory, with the existing sibling cache and pinned v2 inputs:

```
python3 scripts/build_role_overlay.py
python3 scripts/coverage_details.py
python3 scripts/validate_role_overlay.py
python3 scripts/compress_role_exports.py
python3 scripts/seal_release.py
```

Build/validation use RAM for the selected graph, not the whole worldwide dump. Compression is deterministic (`mtime=0`, empty gzip filename). `distribution/manifest.json` lists compressed SHA256, uncompressed SHA256, bytes and exact line counts. Decompression is independently roundtrip-hashed. Validation checks target equality, uniqueness, relationship endpoints/proof chains, typed roles/attributes, recursive forbidden-field exclusion and CC0 provenance, source Person counts, percentages, and baseline union arithmetic. Release hashes additionally cover code, docs, audit JSON and compressed exports.
