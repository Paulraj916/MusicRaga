# Catalogue contract

Use **Make it yours → Import catalogue JSON**, select `docs/catalogue.example.json`, and close settings. A thirteenth original exercise appears for the session. Imported IDs must not duplicate any existing record; exports include the demos, so edit IDs/remove existing entries before reimporting an export into the same session. Refresh discards imports. Do not import confidential licence contracts; evidence should be an opaque reference if any export might be shared.

## Required fields

The authoritative TypeScript contract is `Song` in `src/catalogue.ts`. `docs/catalogue.schema.json` is a portable draft-2020-12 structural schema; `validateCatalogue` adds sorted/in-duration timestamp and within-batch unique-ID checks. The UI additionally applies a 2 MB per-file and existing-ID collision check. The schema does not establish copyright permission or enforce jurisdiction-specific rights.

- `id`: unique lowercase `a-z`, digits or hyphen, 1–80 chars.
- Nonempty strings, ≤300 chars: `title`, `nativeTitle`, `album`, `artist`, `composer`, `lyricist`, `language`.
- `year`: integer 1800–2100; `duration`: number 1–14,400 seconds.
- `artwork`: `sun`, `wave`, `moon`, `petal`; `color`: six-digit hex only.
- `lyrics`: one or more of `original`, `translation`, `transliteration`. Each is 1–500 objects `{ "time": 0, "text": "Original text" }`; times are nonnegative, ascending (equal times permitted), within duration; each text ≤2000 chars. HTML is never rendered.
- `metadata`: object of keys ≤80 chars and string values ≤300 chars. Missing means **unknown**, not “No”.
- `rights`: `status` is `original-demo` or `licensed`; `holder` and `evidence` are nonempty strings. **These are uploader assertions only.** Production should replace this lightweight model with a server-reviewed, territory/expiry/variant-aware record.

All text is Unicode. Language is currently a human-readable string. `lyricLanguage` maps common Indian language names to BCP 47 tags and appends `-Latn` for transliteration; unknown originals use `und` rather than a false language claim. Production should store explicit BCP 47 identifiers plus display labels. Extra language fonts rely on device support unless bundled.

## Core and metadata dimensions

There are 96 unique dimensions. `artist`, `composer`, `lyricist`, `album`, `year`, `language` read directly from core fields; all others read `metadata[key]`. A metadata value cannot override a core field. All populated dimensions share exact-value filtering with AND between dimensions. Sort supports newest, oldest and title A–Z. Search terms are AND-matched against metadata/credit/title fields, not the lyric body.

The dimension registry groups: People & credits; Release & catalogue; Language & region; Sound & composition; Words & reading; Context & discovery; Versions & access; Rights & provenance. It includes contributor roles, release versions, region/dialect/script, raga/tala/instrument/key/BPM, lyric structure/themes, occasion/activity, film/director/award, audio/karaoke capability, territory and rights. See `FILTER_DIMENSIONS` for the exact keys rather than duplicating a divergent list here. Unpopulated fields are disabled. Imported verified values automatically enable corresponding controls. Filter options reflect the entire current catalogue, not only currently matching rows.

A future database must normalise many-to-many credits and release identities. This demo uses one display string per core contributor role and is not sufficient to represent all artists on a production recording.

## LRC

Supported format: `[mm:ss.xx]text`, `mm:ss.xxx` and multiple timestamps per text line. Metadata rows are ignored; text lines are sorted by time. Offset metadata, word-level enhanced LRC, embedded styling and inline audio are not supported. UI sync offset is in seconds: positive means highlight sooner, negative means later. Click a line to seek to its unadjusted timestamp; offset only changes highlight selection.

The silent demo has 24 seconds of synthetic timing, four lines at 0/6/12/18. A loaded local audio file becomes the playback clock. The browser determines playable codecs. Media/LRC are not uploaded or stored. Importing a new LRC pauses playback and rewinds; switching lyric variant clears the local LRC. Closing the reader discards local media.

## Source-led upgrade

The built-in catalogue now has 18 entries: 5 real metadata-only recordings, 1 ancient verse and 12 original demos. `realCatalogue.ts` holds individually reviewed source assertions; see REAL_CATALOGUE.md. `year` may be null for unknown ancient dates; null is not a fabricated modern release. Optional `kind`, `description`, `aliases`, role-specific `credits` and HTTPS `sources` are validated and described by the portable schema. `metadata-only` requires empty lyrics; public-domain/other text statuses require actual text. Uploader rights assertions remain unverified, including an uploader's public-domain claim.

`valuesFor` returns individual singer/composer/lyricist credits, never attributes the verse's author as its singer. Core fields use actual recorded credits; unknown extended values remain absent. Both film album fields and source-specific rights/availability dimensions are populated only where stated. Search now includes known aliases, credited people and permitted text; native marks survive normalisation. Generic song/lyrics words are ignored. Related album recovery never verifies an unknown quote and applies the same active filters.

Public built-in song/artist/language routes are prebuilt from the reviewed catalogue. Session imports have no durable public URLs, sitemap entries or automatic publication; their title buttons open local preview only. An imported metadata-only entry has no lyric room. Source URLs must be HTTPS but are not automatically fetched; a human must verify what each source supports and the right to use each asset.
