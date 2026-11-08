# Real interaction demo recording

`npm run record:demo` requires a running production preview at `http://127.0.0.1:4173`, Chromium installed by Playwright and local `ffmpeg` / `ffprobe`. It records **actual browser actions on this local application only**, not generated footage, motion-graphics simulation or a signed-in external service. Non-local network requests are blocked and fail the recording. No copyrighted audio is played; the demo is silent.

The recorder writes a uniquely named combined H.264/yuv420p/30fps MP4 under `/workspace/powerwords-upgraded-20261108-demo-<timestamp>.mp4` and a separate mobile MP4. The combined file contains desktop 1280×900 followed by an actual 412×915 phone viewport pillarboxed into that canvas. Paths, video metadata and action timestamps are recorded in `artifacts/demo-recording.json`; original WebM captures stay in ignored `recordings/`. FFmpeg performs codec conversion/concatenation, not fictional UI synthesis.

## Shots/actions

1. Warm-paper root design and source-led Rahman / Vada Chennai / Tamil-room shelves.
2. Clean Rahman artist page; present-to-oldest, oldest-to-present, album and individual duet-singer filters.
3. Real sourced recording credits, explicit commercial-lyrics gate and per-item source ledger.
4. Mixed Tamil `Vadachennai` query: clearly related album results, unverified quote warning; Santhosh Narayanan attribution.
5. Ancient Tamil text page, actual English and Latin/Thanglish clean URLs.
6. Ad-free local practice: English text, seeking, live silent clock, active line and manual offset.
7. Saved favourite, named local collection and after-hours theme.
8. Mobile home/navigation drawer, native-title search, real metadata rights gate, dark text folio and practice room.

Screenshots from real capture actions are also saved under `artifacts/upgraded-demo-*`. Automated capture success and ffprobe metadata prove that a file was produced, not that someone watched or editorially approved it. Parent/human video review is required before delivery; no claim of watching is made. This is test/demo evidence, not a claim that all browsers/devices are certified or every possible UI state is bug-free.
