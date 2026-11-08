# Source-led India catalogue pipeline

## What is actually shipped

The existing 18-entry **curated reading** catalogue remains separate. The new bulk index contains **14,884 MusicBrainz compositions**, **17,130 explicitly linked recordings**, and **212 accepted Wikidata song/single entities**: **32,226 source entities, NOT 32,226 unique songs**. Cross-source overlap and covers are not reconciled. **2,446 Wikidata artist profiles** are separate from **3,059 referenced track/work credit identities**; neither sum is a unique-person count. The source work subset references 2,892 MusicBrainz credit entities; these are not automatically singers or Indian nationals.

The 213th Wikidata row has no supplied title and is quarantined rather than assigned an invented title. The source reports **19 matching Indian-language codes** in the preferred composition selection. Additional languages on multilingual works are retained. There are **32,085 unknown years**, **17,154 unknown-language entities**, **17,332 work→recording edges**, and **zero unresolved work targets** in this accepted snapshot. Languages overlap. A recording does not inherit its composition's language, writers, singer or release date.

Snapshot inputs, compressed/uncompressed SHA256 and counts: `data/cc0/manifest.json`. Exact source selection/rights/coverage: `data/cc0/source-coverage.json`, `RIGHTS_AND_SOURCE_RESEARCH.md`, and reproduction scripts/queries. **No 677 MB mixed-licence raw archive, 7.85 GB extraction, commercial lyrics, audio, art, annotations, tags, ratings or noncommercial supplementary data is committed.** Four normalized deterministic gzip inputs total about 3.23 MB. API service terms are distinct from CC0 data rights; the default path makes zero network requests.

## Run, stop and resume (Python 3.11+ with SQLite FTS5)

```sh
npm ci
npm run catalogue:bootstrap
npm run build
# Full static catalogue works even without Python running after deployment:
npm run preview
# Optional mutable local/read-only server on another port:
python3 -m backend.server --db var/catalogue.sqlite --port 4180
```

Open the site and **Open India index**. Search actual native titles (`எஞ்சாய்` finds sourced Enjoy Enjaami metadata), composer names, roles, languages and entity types; select an artist credit, explore a composition's linked recordings, or browse source artist profiles. Artist occupations are not song-level credits. Unknown fields remain unknown. Bulk metadata never opens a copyrighted lyric reader.

Bootstrap verifies both hashes and row counts **before staging an input**, caches normalized data under ignored `var/imports`, then stages/publishes transactionally. Rerun the same command to resume; unchanged external identities/fingerprints are no-ops. Checkpoint byte offset/line and staging updates commit together every 200 rows. Quarantine retains only safe reason/line/hash, not rejected lyric/private payload. Original compressed source stays available for authorized editorial audit. Derived caches, databases, raw source and recordings are ignored by Git. Schema version 1 refuses an incompatible schema rather than dropping data.

For a new allowlisted core-CC0 JSONL batch:

```sh
python3 -m backend.cli --db var/catalogue.sqlite init
python3 -m backend.cli --db var/catalogue.sqlite stage reviewed.jsonl --dry-run
python3 -m backend.cli --db var/catalogue.sqlite stage reviewed.jsonl --max-records 100000
# Use the returned run_id; repeat bounded publish until remaining=0:
python3 -m backend.cli --db var/catalogue.sqlite publish RUN_ID --limit 1000
python3 -m backend.cli --db var/catalogue.sqlite coverage
```

The dry run makes no DB/run/staging changes. Retain an immutable input while staging; file SHA256 identifies the run. `--max-records` bounds each invocation (up to one million); resume seeks to its durable byte offset after verifying input hash. A final EOF checkpoint may require another invocation at an exact batch boundary. One operator writer is recommended; WAL allows concurrent readers and publishing takes a write transaction. This is not an unbounded background queue or a promise of 24-hour execution.

## Import contract / rights

Required: `source` (`musicbrainz` / `wikidata`), canonical UUID/Q `source_id`, exact matching HTTPS `source_url`, `license: CC0-1.0`, allowlisted `license_url`, actual zoned `retrieved_at`, `title`, explicit `kind`, `scope_basis`. Optional: source aliases/languages/countries, integer year or null, album or null, role-labelled credits with source artist IDs and nullable names, duration, explicit composition links and bounded provenance/revision/snapshot/hash. The validator in `backend/catalogue.py` is authoritative. `docs/bulk-metadata.example.json` is an explicitly SYNTHETIC fixture, accepted only in a separate synthetic-mode database.

Unknown fields, untrusted provenance URLs, unsupported sources/licences, invalid IDs, future retrievals, oversized rows, lyric/translation/audio fields and unknown taxonomy values are rejected. Allowlisting/assertion checks cannot independently establish every submitted fact or legal right: use reviewed source adapters, preserve evidence and editorial review. Metadata permission **never grants lyric/translation/recording/art rights**. No lyric ingestion/publication endpoint exists.

MusicBrainz work/recording IDs have distinct namespaces; generic writer remains writer, composer remains composer, performer/credited artist is not silently a singer. Name-only identities stay scoped to a source record, not merged by spelling. Wikidata native labels/aliases remain source text, not automatically licensed lyric translations. Only explicit source cross-IDs link artist profiles to credit records; source-name coincidences never establish identity.

## Sources and acquisition

Preferred path: pinned official CC0 core dumps / reviewed label feeds. `data/cc0/reproduction/scripts` preserves the source worker's bounded fetch, pinned SHA256 streaming dump import, preferred subset and validation logic; its root is `data/cc0/reproduction`, with included seed/crosswalk files. Raw dumps belong in its ignored `raw/`, not Git. Optional Wikidata fetching uses `requests`; the application/backend/bootstrap itself uses only the standard library. Reproduction may change source results; the committed snapshot is immutable evidence, not a live catalogue claim.

`python3 -m backend.fetch_musicbrainz --out-dir var/fetch --query 'country:IN' --pages 1 --acknowledge-api-terms` is a **bounded optional research adapter**, not permission for free commercial API crawling. Review current service terms/permission first. It uses a meaningful public project User-Agent, one locked fetcher per output directory, ≥1.1 seconds between requests, persistent cooldown, bounded retries, numeric/date Retry-After handling, response/page bounds and atomic page journals. A completed journal is replayed without another request; an incomplete run resumes its offset. Other fetchers must coordinate the source-wide rate limit. Query country may concern release distribution, not recording origin; no nationality/language/singer is inferred. Default builds do not call this API. Do not scrape commercial lyric sites or download the ~23 GB release dump blindly.

The source-quality anomaly involving Narada Michael Walden citizenship/dedication links is excluded from the preferred Song + explicit-language selection unless independent language evidence exists. Source labels are community claims, not guaranteed musicological truth.
