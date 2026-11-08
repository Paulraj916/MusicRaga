# AI/developer handover

## Read first

`README.md`, `NEXT_STEPS.md`, `docs/CONTENT_RIGHTS.md`, `docs/ADS_AND_PRIVACY.md`, then `docs/CATALOGUE.md` and `docs/DECISIONS.md`.

## Product intent

Build an excellent multilingual Indian lyrics/music-discovery experience: composer → singer/collaborator → album → present-to-oldest; eventually mainstream and independent musicians across languages; original/English/transliteration including Thanglish; strong personalisation/karaoke; ads that never obstruct the lyrics. The user prefers autonomous implementation and extensive documentation, not repeated preference questions. Never fabricate licences, real song metadata, approval or a promise of zero bugs.

## Current implementation

A complete runnable **frontend demo foundation**, not a complete licensed music business. React + TS + Vite, 12 clearly fictional songs, 96 dimensions with truthful unavailable states, script reader, timed-text/local-media practice, saved library/collections, themes and validated catalogue import/export. No backend, remote account, analytics or ad SDK. Do not describe external search links as provider integration.

## Start working

```sh
npm ci
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev -- --port 4173
```

Node 24 recommended. Test results are recorded in `docs/PROGRESS.md`. View screenshots in `artifacts/`. Browser tests are functional/a11y tests plus screenshot capture, not a visual-diff baseline. Import tests operate on local, original, bounded fixtures. No secrets are in `.env.example`; `VITE_` values would be public.

## Important code invariants

- `Song` contains plain text only. Never render imported lyrics as HTML. `color` must be a six-digit hex code. No arbitrary remote image/audio URLs are used.
- `FILTER_DIMENSIONS` is the single dimension registry. `valueFor` resolves top-level core fields before metadata. `filterSongs` applies all terms and exact active filters with AND, then a stable deterministic sort. Unknown metadata returns `''`, never a guessed value.
- Import rejects duplicate/bad IDs, missing identity fields/rights assertions, invalid colours, invalid/sorted/out-of-duration lyric timestamps, bad metadata, arrays outside 1–500. UI file limit is 2 MB per batch. Rights assertions are not a legal clearance.
- Local browser persistence is defensive and namespaced. No imported audio/LRC/catalogue is persisted or uploaded. Save IDs and collection names remain local. Audio object URLs must be revoked.
- Reader is a native modal with focus containment, Escape and return focus. Tabs support arrow/Home/End keys. No ad component may ever be inserted into reader, timed lyrics or playback controls.
- Synthetic years, credits and sonic fields are explicitly demo-only. Keep originals/translated/transliterated text rights separate for actual songs.
- Hash links only open built-in demo songs after reload; imported session songs are not durable URLs. Current search/filter/view state is not encoded in URL.
- All sources require human provenance/rights review before publication. The noindex/robots block is deliberate, not a bug to remove to boost demo SEO.

## Known trade-offs

App components are colocated for a small frontend and could now be split. Filters are single-value exact selections, not full ranges/multi-select. All enabled dimensions are technically functional, but many have only one synthetic value and are not useful for narrowing until real data exists. Demo short texts are reused; translated writing and native glyph fallbacks need native editorial/device QA. Clock-based silent rehearsal is approximate, not sample-accurate. Browser media codecs vary. There are no server licences/territory rules or trusted import publisher boundaries. Automated axe is not a legal accessibility certification.

## GitHub integration status

Parent checked authenticated gh as Navina0. Owned and collaborator/organisation accessible repo listings had no PowerWords match; `Navina0/PowerWords` was 404. The owner’s exact URL is being requested separately. **Do not create an unsolicited remote repo, clone a different project, push to a guessed target, or overwrite existing work.** Work is standalone in a unique `/workspace/powerwords-*` folder. Integrate on a non-destructive branch only after target confirmation. Local Git history/source archive may be transferred independently.

## Continuation prompt

“Continue from AI_HANDOVER.md. First run the documented tests. Confirm the exact repository before remote writes. Preserve existing source. Prioritise a verified, licensed small catalogue and production publication model, then server search/SEO, then consent-safe ads. Report actual outcomes, not planned work as completed.”
