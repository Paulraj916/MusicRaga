> Historical source-worker layout. This repository ships four normalized gzip snapshots in `data/cc0`; ordinary setup uses `backend.bootstrap` and does not download raw dumps. Source regeneration scripts use `data/cc0/reproduction` as their root and produce ignored local raw/JSONL outputs. See docs/SOURCE_PIPELINE.md for current application paths and exact accepted counts.

# PowerWords India metadata research pack

All work is isolated in `/workspace/powerwords-india-data-20261109`. This worker did not edit or push the website repository.

## Integrate safely

Use `data/*.jsonl` (UTF-8, one entity per line), `data/coverage-report.json`, the scripts and this documentation. **Do not commit `raw/work.tar.xz`** (677M, mixed licences), `.partial` outputs or Python caches. Raw Wikidata JSON is CC0, useful for audit, but optional in the application repository. Do not load all bulk data into a frontend JavaScript bundle: import into indexed server-side storage/search and expose paginated catalogue endpoints.

- `wikidata-artists.jsonl`: 2,446 Indian-citizen artists, direct occupation statements, Wikidata/optional MusicBrainz artist IDs and provenance. Partial bounded subset, not all Indian artists. `roles` are occupations, NOT track-level performance credits.
- `wikidata-songs.jsonl`: 213 distinct source song/single entities, multilingual labels/aliases, explicit P175 performer/P86 composer/P676 lyricist claims, source revision, date precision and CC0 provenance. Languages/countries can be absent. A single can include more than one recording; do not equate every row with a recording.
- **Preferred for discovery:** `indian-language-song-works.jsonl` and `indian-language-song-recordings.jsonl`: subset requiring explicit source work type `Song` AND a listed Indian-language code. This excludes artist-only associations/non-song compositions. See coverage report for counts; still includes cross-border language communities and overseas recordings.
- `musicbrainz-india-associated-works.jsonl`: offline full-snapshot-filtered compositions with exact typed writing relationships, languages, aliases, ISWCs, MBIDs and India-association evidence. **Not track/recording rows.** May include non-song compositions; check `workType` before displaying a song-only filter.
- `musicbrainz-india-associated-recordings.jsonl`: distinct recording MBIDs linked by explicit performance relationships to those works. Known title/duration and associated composition IDs; singer/release date/language deliberately unknown unless separately verified. These can include overseas covers of Indian works; association does not mean original Indian recording.
- `language-crosswalk.json`: source-verified ISO 639-1/2/3 code statements for the 15 languages present in the Wikidata song subset.
- `musicbrainz-indian-artist-seeds.json`: 1,377 unique MusicBrainz IDs reconciled from the bounded Wikidata artists.
- `musicbrainz-import-checkpoint.json`: fixed official snapshot URL/hash, scanned/selected counts and completion flag.
- `coverage-report.json`: machine-measured counts, languages/unknowns, role coverage, file hashes and examples. **Use this file for final measured counts, not guesses.** Language totals can exceed entity count for multilingual works.

For provenance display: “Metadata: MusicBrainz / Wikidata (CC0); lyrics not available — rights not cleared”. Preserve per-row links. Unknown is not zero, no credits, or instrumental. `zxx` is source-declared no linguistic content, not a missing value. `mul` is multiple languages. Do not silently turn these into Hindi/English.

### Recommended database keys

Primary key `id` already carries the source/entity type (`wd:Q…`, `mb-work:UUID`, `mb-recording:UUID`). Keep a separate cross-source reconciliation table. Never join by song title or sum works+recordings+Wikidata rows as a unique-song total. Artist lookup: join work credit `artist.id` to seed map MBID→Wikidata ID and then Wikidata artist records if present; retain related source artists without a matching seed too.

All lyrics fields are null. Dates in Wikidata use source precision/calendar; do not make an invented complete release date from a year. MusicBrainz work `credits` preserve exact relationship names/UUIDs (composer/lyricist/writer/arranger/etc.). Generic writer is not a singer or automatically both a composer and lyricist.

## Reproduce

Python 3.10+; `requests` is needed only for Wikidata fetching. The bulk importer uses only Python's standard library.

```
python3 scripts/fetch_wikidata.py        # caches six bounded saved query results
python3 scripts/enrich_wikidata.py      # 213 known song IDs; <=50/request
python3 scripts/normalize_wikidata.py
bash scripts/download_work_dump.sh     # fixed ~677M archive, resumable, four-minute network bound
python3 scripts/import_musicbrainz_work_dump.py
python3 scripts/create_preferred_subset.py
python3 scripts/coverage_report.py
```

The MusicBrainz importer scans a single pinned dump, streams the ~7.85GB uncompressed member (no extraction), emits only whitelisted CC0 core fields, verifies SHA256 before reading, and atomically replaces final works output on completion. It records periodic progress. If interrupted, re-run from the verified local archive: it restarts the local scan to avoid inconsistent compressed offsets; it does not redownload or hammer a public API. `.partial` files are not import-ready. Check `complete: true` before integrating.

`raw/*query.rq` plus saved request URLs document the exact selection rules. The source result set may change when a query is rerun later. For this run, cache files are the snapshot; source revision numbers on enriched songs provide further auditability.

## Rights and scale

Read `docs/RIGHTS_AND_SOURCE_RESEARCH.md` before copying data. CC0 core metadata is compatible with an ad-supported catalogue; MusicBrainz annotations/genre associations/tags/ratings are CC BY-NC-SA 3.0 and were explicitly excluded. A metadata API/dump is **not permission to publish lyric text, translations, audio or artwork**.

For lakh-scale recording/album discovery, use the official core PostgreSQL mirror (recommended by MetaBrainz) or the ~23G release JSON dump plus artist/work dumps on adequately budgeted infrastructure. The small recording dump is standalone-only, not the complete song catalogue. The current pack is substantive bounded coverage, not a claim to contain all Indian songs, a promise of future background runtime or an invented complete catalogue.

## Quality audit warning

A source citizenship anomaly was found: Wikidata Q542681 (Narada Michael Walden) contains BOTH US and India citizenship claims. We preserved source evidence rather than invent a correction; `raw/artist-audit-Q542681.json` records it. Artist-only associations are research candidates, not verified Indian-song classifications. The broader work export also includes dedication links (for example a song dedicated to Asha Bhosle), which do not establish Indian authorship. **Use the preferred explicit-language + Song subset for initial public discovery; quarantine artist-only candidates for review.** Community metadata is provenance-checked, not independently musicologically verified.
