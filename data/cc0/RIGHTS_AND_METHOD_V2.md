# Additional source checks and evidence semantics — 9 November 2026 (IST)

## Independent sources actually acquired

### MusicBrainz core PostgreSQL-format snapshot

- Official directory: https://data.metabrainz.org/pub/musicbrainz/data/fullexport/20261104-002222/
- Exact source archive: `mbdump.tar.bz2`, 7,701,074,497 bytes; SHA256 pinned in manifests/scripts from official `SHA256SUMS`.
- Rights checked: https://musicbrainz.org/doc/MusicBrainz_Database/Download and https://musicbrainz.org/doc/MusicBrainz_Database . Core factual fields and relationships CC0. The archive's own `COPYING` was read and copied into `docs/SOURCE_CC0_LICENSE.txt`.
- We chose this 7.7GB core dump over the 24,278,240,708-byte release JSON alternative after checking actual HEAD Content-Length and free disk (~102GB initially available). The alternative was genuinely budgeted, not dismissed arbitrarily. Core data avoids supplementary NC-SA JSON fields and repeats less embedded data.
- Schema documentation checked https://musicbrainz.org/doc/MusicBrainz_Database/Schema ; cached official CreateTables.sql, hashed it, checked schema sequence and validate every consumed row width. This is a selective offline reader, not an undocumented server API.
- One finite resumable bulk download; serial streaming decompression while it downloads; selected metadata tables spooled only. **World track table is not extracted**: tracks are filtered to explicit selected release/media IDs before storage. Final exports require complete verified source SHA256.
- API limits checked previously and remain relevant: https://musicbrainz.org/doc/MusicBrainz_API and https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting . No MusicBrainz API calls made. Commercial API service use is not the same as commercial reuse of CC0 offline core facts.

### Discogs monthly data dump — a genuinely additional source

- Official index read: https://data.discogs.com/?prefix=data%2F2026%2F . It explicitly states monthly XML dumps are CC0. Official docs independently confirm this: https://www.discogs.com/developers . The public index's actual `?download=` links are used, not a guessed/private storage endpoint.
- Exact snapshot: `discogs_20261101_releases.xml.gz`; official checksum file downloaded through its corresponding public index link. Expected SHA256 is pinned in downloader/importer.
- Only release country `India` is selected, using parsed XML country after a byte prefilter. No global artist-name keyword search or incidental artist seed is used to label releases Indian.
- Exported factual fields: titles, track positions/durations, source artist IDs/names/credits, release dates/country, catalogue numbers, formats and source music-style classifications. Styles here come from the CC0 Discogs dump, not MusicBrainz supplementary genre tags.
- No images, videos, audio, marketplace/user data, free-text notes or profiles are exported. Source metadata archives may contain notes; nothing here grants rights to any third-party lyrics that might have been quoted in a source note. Import is whitelist-only; no lyric text is imported/published, and no commercial lyric/audio/artwork endpoint is requested.
- Discogs API docs currently specify 25 unauthenticated/60 authenticated requests per minute. No Discogs API calls were made; the public monthly bulk download is used instead. The separate support terms page returned 403 to WebFetch; the two accessible official pages explicitly establish the monthly dump's CC0 licence, so no unsupported claim about restricted API content is needed.

### Wikidata artist crosswalk

- Existing known artist IDs only; official Action API batches <=50, meaningful User-Agent, maxlag=5, 1.2 seconds between uncached batches. See https://www.wikidata.org/wiki/Wikidata:Data_access and https://www.wikidata.org/wiki/Wikidata:Licensing . Structured claims/labels CC0.
- A wider SPARQL crosswalk query timed out and was abandoned. A finite known-ID export is not a retry storm or a world query scrape. Checkpoint captures exact count and batching.
- MusicBrainz artist ID P434 / Discogs artist ID P1953 are source-asserted links. Keep multiple IDs and provenance; do not blindly merge artist entities based on a shared name or assume each community cross-link is correct.

## Do not confuse the evidence tiers

1. `work-language-associated`: a recording has an explicit MusicBrainz performance relationship to a source-labelled Song work with a listed Indian language. The language belongs to the composition. This does NOT independently prove the language actually sung in every recording (instrumental covers exist).
2. `release-text-language`: a recording occurs on a release whose metadata's text language is an Indian-language code. This is release-text evidence, **not sung-language proof**. It is weaker but real, documented India-language association.
3. `india-release-market`: a recording occurs on a release explicitly distributed in India. It can include foreign artists, compositions, spoken material and overseas music; it is **not a declaration of Indian origin**. Keep this tier separate or excluded by default from an Indian-music-only view.

The preferred MusicBrainz export combines tiers 1–2. The wider export also contains tier 3 for transparent India-release discovery. Do not market the wider count as “all Indian songs”. All actual recording `languages` stay null; associated work and release-text languages have their own explicit fields.

Discogs IDs in track exports are locally namespaced `(release ID, source leaf-track ordinal)` identifiers. They count **track appearances on editions**, not globally distinct recordings/compositions. A separate style subset requires an explicit Indian-music style (Bollywood/Hindustani/Indian Classical/Carnatic/Bhangra/Ghazal/Qawwali) AND India release market. Cross-border music is still possible; these are source classifications, not nationalities. Heading/unpositioned entries are excluded.

## Deduplication and known unknowns

- Distinct MusicBrainz recording MBIDs are the principal canonical recording count. Track MBIDs are edition appearances. Work MBIDs are compositions. Release-group MBIDs are album/single groups, release MBIDs are editions.
- Do not add these entity counts, add overlapping tier files, or add Discogs appearances to MusicBrainz recordings as unique songs. Artist crosswalks help reconciliation; they are not recording-level duplicate resolution. No title-only cross-source merge is claimed.
- Generic credited artist is not automatically singer/composer. Exact recording relationships and their attributes are stored separately. Lyrics remain null/uncleared, even for old/traditional works. Audio/art licensing is entirely separate.
- Old 7-Nov work snapshots and the 4-Nov core snapshot differ. Missing old-work-linked recording IDs in the earlier core snapshot are reported, not silently fabricated/reconciled.
- Coverage is bounded by source contributions; independent, regional, historical, diaspora and newly released catalogues can remain absent. No claim of 100% Indian coverage or guaranteed search rankings follows from this dataset.

## Resource and execution notes

All files stay isolated in `expansion-v2`. No website repo edits, pushes, external messages, credentials or paid resources used. A parallel decompressor package installation was attempted but the OS package repository returned HTTP 500/unsigned-index errors; trust checks were not bypassed. The already working Python standard-library bzip2/gzip streaming readers were used. Every pipeline has finite download/follow deadlines, progress checkpoints, cache/resume recipes and checksum gates; no promise of unattended 24-hour uptime is made.
