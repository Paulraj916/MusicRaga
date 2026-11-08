# Expansion v2 integration milestone — 2026-11-09T01:10:21.211390+05:30 (IST)

## Finished, isolated and validated

Directory: `/workspace/powerwords-india-data-20261109/expansion-v2`. No website repo edits or pushes; no paid resources/credentials. All finite downloads/imports finished. Source snapshots and normalized exports hash-verified. All 15 JSONL exports passed identity/provenance/rights/reference checks; preferred graph references and primary gzip roundtrip additionally passed.

## Default preferred catalogue: 123,244 DISTINCT MusicBrainz recording IDs

Use `distribution/preferred-india-associated-recordings-v2.jsonl.gz` (14,762,319 bytes compressed), or its `data/` JSONL equivalent. Companion default graph files: `preferred-india-associated-tracks-v2.jsonl`, `preferred-india-associated-releases-v2.jsonl`, `preferred-india-associated-artists-v2.jsonl` (compressed versions also in `distribution/`).

- Recordings: **123,244**; preferred edition-track appearances: **154,937**.
- Preferred releases: **25,574**; release groups: **21,629** (not all are albums).
- Preferred credited/related artist IDs: **17,475**; these are not automatically Indian nationals or singers.
- **106,122 genuinely additional recording IDs** beyond the previous 17,130-recording work-linked baseline; overlap **17,122**. Eight old baseline IDs are absent from this older 4-Nov core snapshot: **upsert, do not delete them**. Retaining those eight gives 123,252 IDs across old+new preferred snapshots, not a separate batch to double-count.
- Preferred tier split: **17,122 work-language-associated** + **106,122 additional release-text-language-associated**. Composition language and release-text language do **not** independently prove actual sung language. `languages` remains null; evidence fields are distinct.
- Release-text associations include Tamil **15,913**, Hindi **47,160**, Telugu **8,100**, Punjabi **13,834**, Bengali **11,158**, Malayalam **3,204**. These are recording association occurrences, not licensed lyric counts.
- Exact vocal relationship occurrences: **17,315**; **2,411** distinct vocal-credited artists across **10,956** preferred recordings. Generic artist-credit is NOT inferred singer/composer. Attributes are retained.

## Wider candidate inventory — NOT default “Indian songs”

`india-release-associated-recordings-v2.jsonl`: **444,818 distinct recording IDs**, with **515,928 edition-track appearances**, **70,394 releases**, **63,532 release groups**, **105,627 credited/related artist IDs**. This includes **321,574 India-release-market-only** recordings, which may be foreign works/artists and non-song material. Do not advertise all 444,818 as Indian-origin songs. Default to the preferred graph above.

The actual core scan processed **58,809,976 global track rows**, selected 515,957 appearances, then excluded 29 data-track appearances. This is ID-deduplicated bulk metadata, not hand-invented titles or artificially repeated release entries.

## Independent additional source: Discogs CC0

- Source snapshot `20261101`, complete SHA256 verification.
- **68,907 India-market releases**, **466,989 release-track appearances**, **88,958 credited artist IDs**.
- **281,017 appearances** additionally carry an explicit Indian-music style on an India-market release.
- Discogs appearance IDs are `(release, leaf-track ordinal)` keys, NOT global recording/song IDs. **Do not add them to MusicBrainz recordings as new unique songs**; cross-source song reconciliation is not claimed.
- Files: `discogs-india-market-track-occurrences.jsonl`, `discogs-india-style-track-occurrences.jsonl`, corresponding release/artist files; all have compressed distribution copies.
- Wikidata supplies **708 source-asserted MusicBrainz↔Discogs artist crosswalks** with native labels, from a bounded 1,320-existing-artist Action API export. No name-only artist merges are made.

## Rights and unknowns

All published normalized fields are **CC0** with per-row source URL, snapshot, timestamp and licence. MusicBrainz supplementary annotations/genres/ratings/tags are excluded; Discogs styles come from its explicitly CC0 monthly dump. No lyric text, translations, audio or artwork is imported/published. Source metadata permission is not lyric/media permission.

Source first-release-date table is absent from the actual core archive; original recording dates stay unknown rather than guessed. Edition release events/dates remain available separately. The composition baseline remains the earlier **14,884 works**; do not equate 123,244 recordings with 123,244 independently verified compositions.

## Reproduce / continue

README and `docs/RIGHTS_AND_METHOD_V2.md` document pinned official public downloads, schema checks, resource decisions and licence evidence. Exact counts/hashes: `data/v2-coverage-report.json`; source/tiers: `data/musicbrainz-v2-coverage.json`; quality/examples: `data/v2-quality-audit.json`; compressed hashes: `distribution/manifest.json`.

This isolated expansion currently uses approximately **33.63GB** including world-source archives, selected global table cache, normalized and compressed outputs; the initial free disk budget was checked (~102GB). Do not commit raw archives/global tables. Main import should consume compressed preferred exports and index/paginate rather than ship the whole world or create mass duplicate thin pages. Treat titles/credits as untrusted text and render escaped.

Useful next data milestone without downloading again: join cached core `l_recording_work`, `l_artist_work`, `work`, `work_language`, `link`, `link_type` and attribute tables to expand composition/writer relationships for selected recordings. Preserve exact role/performance attributes; do not infer lyrics rights, nationality or vocal language. Dataset completeness, AdSense acceptance and SEO first-place ranking are not guaranteed.
