# Public source publication

Updated 09 November 2026, 00:11 IST.

## Confirmed target and approval

- Canonical source: **https://github.com/Paulraj916/PowerWords**.
- Visibility: **public**, explicitly approved by the owner along with code publication.
- Branch: **main**. Existing local branch was renamed, not rewritten; all three original implementation commits remain ancestors.
- Live authenticated CLI identity: **Paulraj916**. No duplicate login/account removal or credential-store access was performed by this executor.
- Pre-create `gh api repos/Paulraj916/PowerWords` returned HTTP 404. `gh repo create Paulraj916/PowerWords --public --description <project-description> --source=. --remote=origin` succeeded. Historical research/404 files remain clearly labelled.
- Normal publication command: `git push -u origin main`. No force push, hook bypass, destructive reset, unrelated clone or paid resource. The final delivery report supplies the verified remote HEAD and actual Actions status rather than predicting them here.

## Pre-publication audit

The audit covered all **138 unique reachable historical Git blobs** across the three implementation commits, current tracked files, commit author metadata, tracked path names and asset sizes. It checked GitHub/cloud/service-token shapes, private-key headers, credential-bearing URLs, obvious secret assignments, sensitive file names and private-network addresses. One match was a deliberately invalid credential-bearing URL at a reserved `.test` origin in a negative validation unit-test fixture, not a live credential. No actual secret/private credential or sensitive tracked file was found. No credential values are included in the audit report.

Reviewed screenshots/evidence are generated from the local demo/test UI, not signed-in services, personal messages, user audio, uploaded libraries or vault content. Only fictional demo names, licensed project text and sourced public song facts are present. Commit emails are non-deliverable localhost build attribution, not personal contact addresses. Historical repository names/account handles are public project-discovery metadata, not tokens. No history rewrite or file removal was necessary.

Largest existing historical asset is approximately **3.66 MB**: a local mobile UI PNG, below GitHub's per-file limit. Existing screenshot history is retained; no raw video, ZIP/bundle, dependency tree, `.env`, vault data or credential file is added. `.env.example` contains safe defaults/placeholders only. The scanner is a scoped pattern/manual review, not a guarantee against every possible secret encoding or a formal security certification; re-audit future imports and commits.

## Reproduce and verify

```sh
git clone https://github.com/Paulraj916/PowerWords.git
cd PowerWords
npm ci
npm run format:check
npm run typecheck
npm test
npm run build
npm run test:seo
npx playwright install --with-deps chromium
npm run test:e2e
npm audit
# Inspect the public source/default branch and compare to git rev-parse HEAD:
gh api repos/Paulraj916/PowerWords --jq '{html_url,visibility,default_branch}'
gh api repos/Paulraj916/PowerWords/commits/main --jq .sha
gh run list --repo Paulraj916/PowerWords --limit 5
```

CI is `.github/workflows/ci.yml`: locked install, formatting, strict types, unit tests, build, static SEO audit, dependency audit, Chromium/axe/regressions, evidence upload. Local validation is not a claim that hosted Actions already succeeded. Demo/video regression additionally needs ffmpeg and the local recording artifact; it is intentionally not a CI download of an invented hosted file.

## Portability / not a deployment

README, AI_HANDOVER, NEXT_STEPS, source/rights/SEO/deployment/import docs and CI are committed. New final ZIP/history bundle/checksums are delivered separately, preserving earlier originals. Reviewed demo paths: `/workspace/powerwords-upgraded-20261108-demo-1794160112232.mp4` and `/workspace/powerwords-upgraded-20261108-mobile-1794160112232.mp4`; these box paths are not public download URLs. Regenerate with `npm run record:demo` (Playwright and ffmpeg); review every replacement.

GitHub source publication is not website hosting. No production origin was invented and no GitHub Pages/Render/paid service was activated. `SITE_URL` remains a real configured deployment origin requirement, with noindex-by-default safety. Remaining blockers include substantial licensed catalogue, native/editorial/jurisdiction review, actual operator/takedown/privacy terms, trusted editorial/backend/search/provider design, HTTPS deployment/device testing, consent-safe approved advertising and operations. Never distribute protected lyrics/audio merely because source code is public.
