# V4: exact source-recording identities, evidence and the two-million gap

## What this milestone is — and is not

This is a **recording-metadata** milestone, not a lyric-rights or lyric-pair delivery. Counts are distinct canonical MusicBrainz Recording MBIDs, not compositions, releases, track appearances, acoustic submissions, or independently audio-fingerprinted performances. This pack imports **zero cleared native-script + romanized lyric pairs**. The lyric-pair gap remains **2,000,000**. It does not guarantee every source recording is a different acoustic master or a verified Indian-origin song.

The preserved live baseline is 123,252 source recording IDs: immutable v2's 123,244 plus the eight newer Nov 7 work-export recording IDs absent from the older Nov 4 core. V3 role evidence remains an additive overlay and must not be replaced by the v4 full catalogue snapshot. Baseline work-language and release-text associations are retained with their limitations; they are NOT newly reverified sung languages or national origins.

## Actual bounded acquisition and global census

Resource budget was checked before work: approximately 67 GiB free on the 128 GiB workspace volume. Reused the pinned official MusicBrainz core snapshot `20261104-002222`, SHA256 `fa3ed54bb6371c1737959f3631c8e5001a79e72c2376433697950c1185470cf1`. No additional world dump was downloaded. Only `l_area_area` (7,231,336 bytes) was selectively extracted from the existing archive, with a finite nine-minute deadline and 200 MB table cap; extraction actually took approximately 63 seconds. Existing raw cache was not duplicated.

The finite standard-library pipeline streams **all 40,826,836 core recording rows**, cached work/language/performance relations, artist credits and exact musical role relations. This is an actual global source census, not a handpicked title list. It records per-table SHA256, row counts, exact eligibility/identity exclusions and completed checkpoints. Processing capacity is not the bottleneck: verified India-associated evidence and legitimate distinct identities are.

## Eligibility buckets — do not conflate them

1. **Explicit musical-work language:** exact recording-to-work `performance` relationship UUID `a3005666-a872-32c3-ad06-98af558e99b0`; linked work declares a configured Indian/subcontinental language and has a source musical work type. Song, Aria, Soundtrack and other explicit musical types are eligible. Unknown, Poem, Prose, Play and Audio drama are not silently treated as musical works. A work's declared language is NOT proof that words are sung in each recording; instrumental covers and medleys exist. A language can be spoken in multiple countries and never establishes nationality or geographic origin.

2. **Primary artist's explicit India area PLUS same-recording musical performance:** the FIRST source artist-credit position is an artist whose source `artist.area` is India or has a current explicit containment path to India. That SAME artist must have a source `vocal` or `instrument` relationship to THAT recording. Mere artist seeds, secondary composer/producer credits, birthplaces, name/ethnicity guesses, or unrelated credits never qualify. Spoken-vocal/word qualifiers are excluded. Rap is music and is not excluded. Source vocal and instrument role UUIDs are preserved.

   Source `artist.area` means the area with which an artist is primarily identified, often but not always a birth/formation country. **It is not nationality.** These records must be labelled India-associated primary musical artist, not verified country of recording, citizenship, exclusive Indian origin, or Hindi language. A collaboration or an English-language performance can legitimately have this explicit primary-artist association; it is not included merely because a foreign release sold in India.

3. **Review only:** India artist area alone, unknown/nonmusical work type, or an India-market release alone does not qualify a NEW preferred recording here. The complete cached census counts these candidates, but only a bounded 1,000-row sample is exported for review. Review rows can overlap existing baseline records and must not be imported as additions or used to delete existing baseline evidence.

Area containment uses source type UUID `de7cc874-8b1b-3a05-8272-f3834c968fb7`: parent has part child. Ended links are excluded; a deterministic path is retained for each of 401 India-associated areas. All referenced area nodes, relation row IDs, link IDs and provenance are supplied. This represents source geographic associations, not a new claim about sovereignty or ethnicity. India’s numeric area ID is derived from the source ISO-3166 table, not hardcoded.

## Identity deduplication and limits

- Exact MBID set difference against the entire 123,252 live baseline; no repeated source IDs.
- Quarantine new records sharing an ISRC with existing/new MBIDs. Shared ISRC can be a source error or multiple versions, so it is not automatically merged or counted as another confirmed performance.
- Quarantine a new exact title/duration/ordered-artist fingerprint collision against existing or already selected records. Such fingerprints are an ambiguity safeguard, NOT a robust identity crosswalk.
- Quarantine new video recordings because video/performance identity could overlap audio.
- Retain all 15 excluded IDs and reasons in a separate review file. No title-only merges and no counting different source IDs as proven independent performances.
- Unknown duplicate performances may remain inside MusicBrainz itself; MBID uniqueness is not an acoustic dedup guarantee. Existing baseline identity problems are not erased or silently reclassified.
- No Discogs appearance, Wikidata composition, unnamed regional row, MIDI file, or AcousticBrainz submission is added to the recording count.

## Other sources: real licence checks, no inflated totals

Exact primary URLs, pinned GitHub licence/README revisions, identity units and import decisions are in `docs/source-registry-v4.json`.

- **MusicBrainz core:** CC0; core archive's own COPYING text preserved. Supplementary derived annotations/tags/genre associations/ratings are CC BY-NC-SA 3.0 and excluded. Offline CC0 reuse is separate from commercial API/live-feed service terms.
- **Wikidata:** structured data CC0. It does not turn a composition into a sound recording. A bounded language-country query returned HTTP 500; no country/language claims were invented and no unbounded retries made.
- **AcousticBrainz:** official CC0 features/JSON dumps, but 29,460,584 are submissions with duplicate MBID offsets, not new India-scoped recordings. Automatic classifications do not establish Indian origin. No unnecessary large feature dump downloaded.
- **Indian Regional Music Dataset:** the actual 16.9 kB workbook was downloaded and source MD5 verified. It contains exactly 340 anonymous source rows, 68 artist indexes and 17 language labels, under CC BY 4.0. It lacks titles, artist names, MBIDs and ISRCs. A separate attribution-preserving audit export is provided; **zero rows count as proven new catalogue recordings**. No 5.4 GB feature archive or audio fetched. Attribution and modifications must accompany reuse.
- **Europeana:** official metadata guidelines establish CC0; attribution/provider links are requested as goodwill, not a licence condition. Documented OAI-PMH bulk access is available, but a narrow music-provider set and robust recording crosswalk must be verified before harvesting. Cultural-object IDs or institution countries are not proof of distinct Indian song recordings. Media rights remain separate.
- **Saraga/Dunya:** actual pinned Saraga licence is CC BY-NC 4.0 for audio and manual/automatic annotations, not the NC-SA licence claimed by one secondary loader. Direct NC data is excluded from ad-supported use. The paper states recording metadata is in MusicBrainz, so that metadata belongs in the existing MB identity universe rather than an additional 357 recordings. Dunya open access requires a token and does not alone establish commercial reuse permission; none obtained.
- **57,005-row MIT-labelled Bollywood repository:** actual README and MIT text read. Its UUIDv5 identity is album + track position + title, i.e. an appearance, not a robust sound-recording crosswalk. Upstream scraping rights are not verified. Zero imported and no unsupported addition to totals.
- **SANGEET:** actual README describes 116 notated compositions. Paper CC BY 4.0 is not automatically a grant for every dataset lyric/edition; inspected root/README contains no dataset licence grant. No lyric XML fetched. Any lyric-rights worker must independently verify the dataset/underlying edition and native/romanized pairing.
- **Open Music Archive:** primary FAQ explicitly warns that UK public-domain status differs elsewhere; no global media clearance or verified bulk metadata grant assumed.
- **Smithsonian:** an institutional open-access programme is a candidate, but exact Folkways track-level CC0 membership/crosswalk was not established; developer-page fetch timed out. No catalogue scraped or API key requested.
- **Cached Discogs:** 466,989 India-market track appearances are not distinct sound recordings. Existing broader MusicBrainz India-market candidates can contain foreign music. Neither is added to the preferred count just to approach two million.

CC0 source links are retained even though CC0 does not require attribution under its waiver/fallback licence. CC BY metadata needs the specified attribution, licence link and modification statement. No metadata licence supplies permission for lyric text, translations/transliterated lyric editions, audio, album art, photographs or video. Data is supplied without accuracy/completeness warranties.

## Concrete continuation

From this directory, the completed finite adapters can be rerun using the same pinned cache:

```
python3 scripts/extract_area_containment.py
python3 scripts/build_v4.py
python3 scripts/export_regional_audit.py
python3 scripts/source_registry.py
python3 scripts/validate_v4.py
python3 scripts/package_v4.py
```

No new credentials, paid service or source-app state is required. Outputs are atomic; the archive extraction checkpoint is checksum-verified on reuse. Each run is finite and writes a completed manifest, not an unattended endless download. The global recording scan and MBID/ISRC safeguards provide an existing source-backed importer path. New owner-permissioned label/library CSV/JSON exports should retain original recording IDs, ISRC, credit roles, Indian-association evidence, per-field licence/provenance and correction history; cross-source identities remain quarantined until robustly matched. Increasing a configured target or downloading global data cannot manufacture missing eligibility or lyric permissions.

No verified free dataset researched here establishes two million distinct Indian musical recordings with both cleared lyric forms. That is a constraint of verified evidence and permissions in this milestone, not proof that such recordings do not exist. No all-India completeness, search-ranking, monetisation approval or uninterrupted 24-hour execution is promised. Website edits, deployments and scheduling remain the integration worker's responsibility.
