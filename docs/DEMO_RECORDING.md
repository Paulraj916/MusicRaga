> Publication update: the parent reported that the corrected final `1794160112232` recording passed videoReview. Videos are local delivery artifacts, not hosted in GitHub; source is https://github.com/Paulraj916/PowerWords. Earlier pending-review wording below records the capture-time state.

# Real interaction demo recording

`npm run record:demo` requires a running production preview at `http://127.0.0.1:4173`, Chromium installed by Playwright and local `ffmpeg` / `ffprobe`. It records **actual browser actions on this local application only**, not generated footage, motion-graphics simulation or a signed-in external service. Non-local network requests are blocked and fail the recording. No copyrighted audio is played; the demo is silent.

The recorder writes a uniquely named combined H.264/yuv420p/30fps MP4 under `/workspace/powerwords-upgraded-20261108-demo-<timestamp>.mp4` and a separate native 412×892 portrait mobile MP4. The combined file contains desktop 1280×900 followed by an actual 412×892 phone viewport contained/padded into that canvas with a 24px safety margin. Paths, video metadata and action timestamps are recorded in `artifacts/demo-recording.json`; original WebM captures stay in ignored `recordings/`. FFmpeg performs codec conversion/concatenation, not fictional UI synthesis.

## Shots/actions

1. Warm-paper root design and source-led Rahman / Vada Chennai / Tamil-room shelves.
2. Clean Rahman artist page; present-to-oldest, oldest-to-present, album and individual duet-singer filters.
3. Real sourced recording credits, explicit commercial-lyrics gate and per-item source ledger.
4. Mixed Tamil `Vadachennai` query: clearly related album results, unverified quote warning; Santhosh Narayanan attribution.
5. Ancient Tamil text page, actual English and Latin/Thanglish clean URLs.
6. Ad-free local practice: English text, seeking, live silent clock, active line and manual offset.
7. Saved favourite, named local collection and after-hours theme.
8. Mobile home/navigation drawer, native-title search, real metadata rights gate, dark text folio and practice room.

Screenshots from real UI actions (mobile in a separate non-recording pass to avoid mutating capture geometry) are also saved under `artifacts/upgraded-demo-*`. Automated capture success and ffprobe metadata prove that a file was produced, not that someone watched or editorially approved it. The parent reported that the corrected final recording passed videoReview; this executor makes no claim of watching. New recordings require fresh parent/human review. This is test/demo evidence, not a claim that all browsers/devices are certified or every possible UI state is bug-free.

## Revised capture safety

See MOBILE_CAPTURE_REVIEW.md: the rejected first mobile recording had screenshot-induced surface changes. Live mobile capture now prohibits screenshot APIs, matches even CSS/video dimensions at DPR 1, asserts scale/header bounds and uses one combined H.264 encode without cropping. After `npm run record:demo`, run `npm run test:video` for the independent real-UI frame similarity regression. The standalone mobile MP4 is native portrait, not the padded desktop canvas. No UI bug is hidden with a crop.
