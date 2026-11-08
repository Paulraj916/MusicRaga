# Free hosting, search indexing and honest monetisation

## A usable zero-paid-service preview

The full build includes sharded public CC0 metadata discovery, artist profiles and original curated reading: **no running database/API is required on a static host**. Use an actual **root-hosted** free static-site origin (for example a Render Static Site / Cloudflare Pages free tier, after checking current quotas/terms); build `npm ci && npm run build`, output `dist`, Node 24 + Python 3.11+ available at build. No account/deployment/payment was created by this upgrade. Local `npm run preview` is free QA, not a public hosting URL or uptime guarantee. The optional mutable SQLite API needs separately operated runtime/storage; free ephemeral services are not durable databases.

GitHub repository publication is not GitHub Pages activation. A project Pages URL under `/PowerWords/` requires **additional base-path routing/canonical/asset support**; do not claim this root-oriented application is already deployed there. An owned custom root domain or a root-hosted static provider avoids that issue; buying a domain is not required for a free provider preview. Pages also has host-specific 404/header/ads.txt-root limitations. Never turn on a paid plan or claim unlimited storage/traffic. The large mixed-licence raw archive and private local files must never be uploaded.

## Search Console / rankings

1. Deploy at a real HTTPS origin and review helpful substantive content, native facts, rights, operator/about/privacy/takedown details, mobile/a11y and actual response headers/404s. Bulk metadata alone is not a complete licensed lyrics destination.
2. Set the real `SITE_URL`, initially keep `ALLOW_INDEXING=false`; verify canonical/OG/hreflang/sitemap/robots on that deployment. Never use the GitHub source URL as the website origin.
3. Only after review, enable indexing for appropriate **existing curated pages**. Fictional demos stay noindex/excluded. Search result JSON, API endpoints and bulk shards are not tens of thousands of SEO pages. Avoid thin pages, keyword stuffing, invented native aliases or protected lyric snippets.
4. In the owner's Google Search Console, add the actual URL-prefix/domain property and complete the verification Google actually supplies (HTML file/meta or DNS as applicable). No verification, account access or submission is performed here. Do not fabricate a verification token.
5. Submit the **actual deployed** `/sitemap.xml`, inspect representative curated URLs and monitor indexing/coverage/performance. Submission is discovery, not guaranteed indexing. Page quality, relevance and competition affect rankings; **#1, instant indexing or traffic cannot be promised**.

Official guidance opened for this checkpoint: https://developers.google.com/search/docs/fundamentals/creating-helpful-content . It prioritises helpful original people-first content and warns against mass-produced search-engine-first pages and deceptive authorship. Original tools, source curation and meaningful analysis matter more than a fabricated page count.

## AdSense configuration: inert by default

`node scripts/prepare-ads.mjs` runs during builds. Default output `ads.txt` is comments only, `ads-config.json` declares `active:false`, and the app's labelled ad area remains outside reading/karaoke. No advertising SDK, auto-ads, overlay, audio ad, deceptive placement, cookie or third-party ad request is loaded. Existing local privacy preferences are **not** a certified CMP and cannot activate ads.

`public/ads.txt.example` is a commented template, not an actual seller. After an actual owner publisher ID is supplied, `ADS_TXT_ENABLED=true ADSENSE_PUBLISHER_ID=<actual-own-public-ID>` validates syntax and writes the official seller line at build root. No placeholder/zero publisher ID is accepted. `ADSENSE_SLOT_ID` is an optional syntactically checked public configuration value; it does not activate a slot. Environment values are supplied to the build process, not automatically read from the example file.

`ADSENSE_REQUESTS_ENABLED=true` **fails closed**: live SDK loading is intentionally not implemented until actual account/site approval, publisher ID, jurisdiction/consent handling, a maintained certified-CMP adapter, host CSP and user-safe placement review exist. No account/form/submission/contact or approval claim is made. AdSense approval/earnings are not guaranteed; copyright restrictions remain even if ads are approved. Do not encourage clicks or disguise ads as navigation/lyrics.

Official ads.txt guidance: https://support.google.com/adsense/answer/7532444?hl=en — use the actual own publisher ID and publish at the domain root; a project subdirectory may not control that root. Official consent requirements: https://support.google.com/adsense/answer/13554116 and https://support.google.com/adsense/answer/9804260?hl=en-GB — certified TCF CMP requirements apply to personalised ads in EEA/UK/Switzerland, with current TCF v2.3 transition requirements; storage/access consent matters even for non-personalised requests. Review actual territories and current policies/legal obligations, not a homemade checkbox. Missing publisher ID, approval, CMP/privacy and production-origin review are **activation blockers**, not reasons to block the rest of the free site.

Production indexing now also requires explicit `REVIEWED_INDEX_PATHS` (comma-separated real curated routes). `ALLOW_INDEXING=true` alone is insufficient: builds fail without a reviewed list; client navigation and sitemap enforce the same per-page list. Defaults remain noindex. Do not put bulk JSON or fabricated metadata pages in this list.

## New v2/project-host clarification

`docs/V2_LAKH_CATALOGUE.md` supersedes the smaller v1 counts and earlier project-base-path limitation: root and `/PowerWords/` builds now work. The free Pages preview is configured through the CI-gated `free-pages-preview` job, with actual live status checked at delivery. It is an ad-free default-noindex project demonstration, not a commercial hosting/AdSense promise; Pages ignores `_headers`, cannot serve this project's root-level publisher ads.txt or run Python, and has documented size/bandwidth/usage limits. Actual origin/operator/content/indexing/privacy/advertising review still required. Pending v3 sidecars are preserved but not active; do not count their role gains yet.
