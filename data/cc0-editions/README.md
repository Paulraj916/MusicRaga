# Verified release-edition metadata bridge

This is the normalized CC0 MusicBrainz release export from the already-reviewed V2 distribution, not the mixed-licence raw database dump. `manifest.json` pins the exact compressed and uncompressed SHA-256, row count, source snapshot and licence evidence. `backend.build_static.load_editions` verifies those before use and requires each source release URL and CC0 assertion to match.

Purpose: join recording `association_evidence.release_ids` to actual release-edition titles for static album-name discovery. The 25,574 source releases are NOT additional songs/recordings. Source edition names are not proof of an original album/date, sung language or lyric/audio permission. The original normalized provenance rows remain in this compressed file; output contains bounded title/source links only. No lyrics, audio or artwork are supplied.

See `docs/SEARCH_FIRST_RELEASE.md`. The underlying V2 importer and records are unchanged.
