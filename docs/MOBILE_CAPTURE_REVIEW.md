# Rejected mobile recording: investigation and correction

## Report and evidence

Parent videoReview accepted desktop but rejected transient mostly-grey/cut navigation near 00:47 and enlarged/cropped Lyric Room around 00:52–53. The rejected final artifact was `powerwords-upgraded-20261108-demo-1794159527860.mp4` (retained, not the revised delivery).

We inspected extracted stills and the mobile frame contact sheet, not a claimed full video viewing. `artifacts/mobile-review/mobile-contact-sheet.png` exposes the late enlarged/cut mobile frames. Individual 47/52-second frames alone were insufficient because the damage is transient and some frames look normal. The old native WebM was 412×914 although the requested odd-height CSS/video profile was 412×915 at DPR 2.625.

## Actual UI versus recording defect

`scripts/diagnose-mobile.mjs` reproduces home, drawer, native search, real credits/rights gate and reader top/playback states in separate browser contexts. Measurements are in `artifacts/mobile-review/viewport-diagnostics.json`; screenshots are beside them. The original high-DPR profile's actual `innerWidth/innerHeight` stayed **412×915**, visual viewport scale **1**, document width **412**. Reader bounds were **x19/y12, 374×891** with header **x20/y13, width372/height55**, entirely within the device. Text legitimately extends below a portrait viewport and can be scrolled; the sticky close/header and playback controls remain reachable. No production extreme-zoom/cropped-header state was reproduced.

The recording script was calling `page.screenshot()` in the **same live mobile recording context**, including a full-page credits capture and a final high-DPR reader capture. Screenshot tooling temporarily changes Chromium's capture surface/device metrics; those transient surfaces leaked into screencast frames. The old contact sheet shows the final enlargement at the screenshot step even though subsequent page measurements return normal. This is a real recording defect, not something to fix by hiding a web-layout bug.

Two independently noticed product details were corrected: the ancient reader now says “Ancient text” instead of a dangling separator with null year, and its native heading has the correct script language tag. No CSS clipping/zoom was added to disguise the reported problem.

## Fix

- Matched even **412×892** viewport/screen/recording dimensions; capture DPR **1**. This changes capture rasterisation, not CSS content size or browser zoom.
- **No screenshot calls during active mobile recording**; an explicit guard throws if one is added. Evidence screenshots use separate, non-recording contexts.
- Wait for actual fonts/UI settlement; mobile uses real SPA links instead of full reloads where practical, and deliberate page/room scrolling rather than sudden detached-looking jumps.
- Demonstrate full source-page heading, rights gate, intact reader/header/artwork/tabs, reachable playback and return to the reader top. Scrolling is shown, not hidden.
- Native standalone mobile output remains **412×892 portrait**. Combined output uses aspect-preserving contain/padding with a 24px safety margin around the phone, not crop/fill/enlargement.
- Combined desktop/mobile footage is encoded once as H.264 rather than stream-copy concatenating separately encoded segment headers. No synthetic UI or generated footage is introduced.

## Regression checks

- Browser tests at 412×892 assert visual viewport scale **1**, no horizontal overflow, intact header bounds before/after scroll, sticky reachable close, visible artwork after return, playback reachability, ancient-date label and Tamil heading tag.
- Recorder logs measurements for every mobile chapter; dimensions, scale and header bounds are asserted during actual capture.
- `npm run test:video` extracts the final native mobile frame and compares the real modal area with the same UI in a **separate non-recording** browser context. Current SSIM **0.992297**, required ≥0.93; crop/extreme zoom would fail. Geometry is 412×892, DPR 1, scale 1. Evidence: `artifacts/mobile-review/video-regression.json`, `revised-mobile-final.png`, `revised-mobile-reference.png`.
- `revised-mobile-contact-sheet.png` covers the revised native mobile sequence; representative extracted stills were inspected, with no screenshot-induced enlargement/grey surface observed.

The revised MP4 still needs **parent/human videoReview before delivery**. Frame/image regression and codec validation do not claim someone watched or approved the full video, nor certify every device/browser.
