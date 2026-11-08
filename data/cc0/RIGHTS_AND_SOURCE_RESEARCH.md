# Metadata sources and rights — checked 9 November 2026 (IST)

## Conclusions for an ad-supported site

- **Wikidata structured entity data is CC0**; commercial reuse is permitted, attribution is appreciated rather than required. Wikipedia prose is NOT the same dataset. Commons artwork/audio each has its own rights; none was downloaded.
- **MusicBrainz core database data is CC0**, including artist names/aliases, recordings, works, release data, relationships and URLs. Its **supplementary data is CC BY-NC-SA 3.0**, not simply CC BY-SA: annotations, tags, genre-to-entity associations, ratings, derived statistics, search indexes, edits and editor data. Do not integrate these supplementary fields into the ad-supported catalogue without a separate appropriate commercial agreement.
- MusicBrainz's dataset summary calls JSON dumps CC0, but **the detailed JSON dump documentation explicitly excludes `annotation`, `genres`, `rating`, and `tags`**. This importer uses a positive whitelist and emits none of them. The raw downloaded archive DOES contain them: do not redistribute it as a CC0-only asset.
- CC0 does not legally require attribution/sharealike for the exported factual core fields. Voluntary source links and per-row provenance are retained. Supplementary NC-SA reuse would require attribution, noncommercial use and sharealike; attribution alone does not resolve the commercial restriction.
- **Metadata permissions are not lyrics permissions.** No lyrics, translations, transliterations, commercial audio or cover art were collected. Every exported work/recording has `lyrics: null` and `lyricsRights: "not-cleared"`. Even an old/traditional composition does not automatically clear a modern arrangement, recording, translation, edition or transcription.

## Official documents read this turn

1. https://www.wikidata.org/wiki/Wikidata:Licensing — structured namespaces CC0; other namespace prose CC BY-SA 4.0.
2. https://www.wikidata.org/wiki/Wikidata:Data_access — choose dumps for large data, narrow WDQS queries; meaningful User-Agent; maxlag for Action API; stop on 429 and respect Retry-After.
3. https://www.wikidata.org/wiki/Wikidata:Database_download — recommended JSON export, one complete entity per line in a top-level array; weekly exports; hundreds-of-GB-scale global dataset, not a sensible emergency download on a small web host.
4. https://musicbrainz.org/doc/About/Data_License
5. https://musicbrainz.org/doc/MusicBrainz_Database — exact core/supplementary split.
6. https://musicbrainz.org/doc/MusicBrainz_Database/Download — PostgreSQL import, checksums/signatures, core-only dump distinction. This older page uses bz2 names, whereas the current dataset portal says XZ: discover actual filenames from the official index rather than hardcoding legacy extensions.
7. https://musicbrainz.org/doc/Development/JSON_Data_Dumps — actual JSON contents and licence exclusions; **recording dump contains standalone recordings only**. Non-standalone recordings reside in the release dump. Works-to-recordings relationships must be read from the work dump.
8. https://metabrainz.org/datasets/postgres-dumps — recommended PostgreSQL/Docker mirror, twice-weekly dumps, JSON option; commercial support strongly urged even for CC0.
9. https://musicbrainz.org/doc/MusicBrainz_API and https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting — API free for noncommercial use; commercial usage requires appropriate arrangements; meaningful User-Agent and no more than one request/second/IP absent agreement. **We made no MusicBrainz API calls.** This commercial-facing project instead uses the officially downloadable CC0 core fields offline.
10. https://musicbrainz.org/doc/MusicBrainz_Database/Schema — schema v31 (2026); work vs recording vs release/track; writers via artist-work and recording-work links, artist credit is not proof of a singer/composer role.

## Actual acquisition and load bounds

Six successful bounded Wikidata SPARQL SELECTs were cached, plus five 50-or-fewer-entity Action API batches for 213 song entities and one 15-language entity batch for ISO-code reconciliation, maxlag=5, one serial request at a time. Two broader SPARQL queries hit upstream 504/timeouts; they were abandoned in favour of narrower scoped queries, not paginated/brute-forced. A single exploratory entity-name search was also made. These are snapshots, not a live runtime dependency.

The artist query is deliberately capped at 3,000 occupation rows BEFORE optional cross-IDs; multiple MBIDs can expand its final row count. It is not the population of all Indian musicians. Main criteria are citizenship India (P27), with direct occupations singer, musician, composer, songwriter or singer-songwriter. Playback-only subclasses, diaspora without this citizenship statement, bands and missing statements can be absent.

The actual official MusicBrainz snapshot index was read:
https://data.metabrainz.org/pub/musicbrainz/data/json-dumps/20261107-001001/

It lists artist ~2G, release ~23G, work ~677M, standalone recording ~34M (server rounded sizes). Downloading only the 677M work archive gives a useful bounded composition catalogue with artist-writing relationships and linked recording identifiers. The checked work archive expands to a 7,852,039,713-byte JSONL work file, which is streamed without extracting it. SHA256 is checked before import. No account, token or internal/private endpoint is involved.

## Scalable route to hundreds of thousands

1. Pin an official snapshot, download SHA256SUMS plus signature, verify integrity (and signature authenticity using the documented MusicBrainz key before a production ingestion). This run validates SHA256; it does NOT claim independent signature/key verification.
2. Start with the work import provided here for compositions and linked recording metadata. It is a full scan of one bounded official archive, not a series of public-API scans.
3. For a real lakh-scale track catalogue, use the **core PostgreSQL dump** and the official musicbrainz-docker import workflow on appropriately provisioned infrastructure, OR stream the **release JSON dump** (~23G compressed in this snapshot), artist and work dumps. Disk, memory and bandwidth must be budgeted first. Do not mistake the 34M standalone-recording dump for the whole recording catalogue.
4. Build artist association sets from artist areas/country and Wikidata citizenship links; use work languages, release events in India and specific recording relationships as separate evidence. Query IN release country alone misses exports/diaspora and includes foreign artists; language alone includes Bangladesh, Pakistan, Nepal and Sri Lanka. Artist country alone is not song language/origin.
5. Read work languages for lyrical language. Release `text-representation.language` concerns the release text and is NOT reliable sung-language evidence. Keep unknown, multiple and instrumental/no-lyrics values explicit. Do not infer Tamil from Tamil-looking romanisation.
6. Deduplicate by **entity-type + MBID**, follow redirects/merges. A work/composition, a recording, a release-group/album and a track on one edition are different entities. ISRC/ISWC help reconciliation but can be missing or misentered. Never merge by title alone, and never report work+recording counts as unique songs.
7. Keep composers, lyricists, arrangers, performers and recording artist credits separate. A soundtrack credited to a composer does not establish who sang each recording. Preserve relation attributes such as additional/partial and source relationship UUIDs. Generic writer is not automatically composer or lyricist. This work-only subset intentionally leaves singer credits unknown.
8. For ongoing sync, evaluate documented replication/live feed terms; commercial API/live-feed use is a separate service agreement question from CC0 reuse rights. Full occasional snapshots remain a documented option.

No source guarantees complete Indian independent/regional/older-film catalogues; no measured count here warrants a claim to contain every Indian song. Reconciliation and rights-cleared lyric supply are separate ongoing workstreams.

## Observed quality limitation (not theoretical)

An audit of first matches found Wikidata Q542681 (Narada Michael Walden) has both Q30/US and Q668/India citizenship statements. The raw entity was read and cached; no nationality correction was guessed. Also, a MusicBrainz dedication-to-Asha relationship is sufficient to enter the broad candidate set but is not an authorship credit. Consequently a separate preferred subset explicitly requires `workType == Song` and a listed Indian-language match. Artist-only and non-song candidates should not be automatically presented as verified Indian songs. Cross-border languages and overseas covers remain transparently in scope as language-associated music.
