# Crawlable architecture and SEO boundaries

## Build, not just browser metadata

`npm run build` builds the Vite client, a React server-render entry, then calls `scripts/prerender.mjs`. The shared `App` and `CataloguePage` render every address in `ALL_ROUTES` to a physical `dist/<route>/index.html`; a separate `404.html` is generated. The rendered body has a semantic main, one H1, real anchors, source/rights notes and permitted text. This is static prerendering, not a hosted SSR service or a client-only SEO promise.

`src/seo.ts` is shared between build and browser navigation: unique title/descriptions, canonical, OG URL/title/description/image, robots, actual reciprocal script/language alternates and JSON-LD. `seoBrowser.ts` updates the head when an enhanced anchor changes routes. `createRoot` replaces prebuilt markup using the same component tree, allowing local preferences to differ without hydration mismatch. No JavaScript is needed to follow clean links/read the prebuilt text; interactive filters/library/practice require it.

## Routes

- `/songs/<reviewed-id>/` — sourced metadata or actual available original text.
- `/songs/<id>/translation/` and `/transliteration/` — **only if that text exists**. Commercial metadata entries do not generate empty translation pages.
- `/artists/<stable-current-slug>/` — role-labelled credited works; currently name slugs, not a production identity database.
- `/languages/<language-slug>/` — truthful language collection, not automatically a translated UI.
- Legacy `/#song=<readable-id>` remains a practice shortcut, not an indexable content route.

The supplied static preview redirects missing trailing slashes (308) and returns real HTTP 404 for unknown paths. Deploy hosts must serve directory index files and preserve missing-file status, **not rewrite every path to root HTML**. See deployment guide.

## Origin and indexing

`.env` / `.env.production` are read with Vite `loadEnv`; explicit process environment wins. `SITE_URL` must be a root HTTP(S) origin with no credentials/path/query/hash. Default is the actual local preview address `http://localhost:4173`, not a fictitious production site. `ALLOW_INDEXING=true` requires an explicit non-localhost HTTPS origin. Build using the final actual production origin; subpath deployments are not supported without changes.

Default output: `noindex,follow` and robots `Disallow: /`. This is deliberate preview safety; robots blocking can prevent a crawler from seeing a noindex tag, so do not use blocked previews as a strategy for deindexing an already public site. At a real launch, first review readiness, then explicitly enable crawling/indexing for reviewed real/ancient content. Fictional song/fictional-only artist/language routes **always remain noindex and excluded from sitemap**, even when real pages are enabled. These are technical candidates, not a claim thin metadata pages deserve ranking.

The XML sitemap contains configured absolute eligible URLs, including actual text variants. Reciprocal `ta`, `en`, `ta-Latn` hreflang is emitted on the verse's corresponding available pages; commercial pages have none because no translated lyrics are offered. Languages with only demos do not enter the launch sitemap. All canonical URLs correspond to actual generated clean paths. `build-manifest.json` records the origin, indexing flag and route totals so deploy reviewers can inspect the result.

## Structured facts

- Root `WebSite`, no fake SearchAction backend, rankings or claimed account service.
- Real recording pages `WebPage` → `MusicComposition`: only sourced title/native label/composer/lyricist/citations; no commercial lyric body, guessed release date, invented ratings or aggregate counts.
- Ancient verse `CreativeWork`, attributed author, permitted underlying text and separate rendering copyright notice; not a `MusicRecording` and no fabricated modern year/composer.
- Artist/language `CollectionPage` + `ItemList`, not an invented Person biography or complete discography.
- Fictional demos `WebPage` explicitly described as fictional, always noindex.

## Search quality, not keyword stuffing

Native Unicode marks are retained; terms include known native titles, manually sourced aliases, individual credits and permitted text only. Generic `song/lyrics` query words do not prevent a native title match. Compound filters use exact known values. If an unknown phrase contains a known album anchor, related results are clearly labelled and the words are explicitly unverified. No unverified quote is inserted into titles, metadata, aliases or a protected lyric. This is not semantic/fuzzy/transliteration generation or a promise to identify every sung phrase.

## Verification

`npm run test:seo` audits every built HTML file, unique titles, metadata/canonical/OG, JSON syntax, semantic content, noindex gates, commercial text absence, native verse, hreflang, configured sitemap and robots. Browser tests disable JavaScript to follow/read real text, exercise reload/back, native/related search, 404/slash status, response headers and light/dark mobile accessibility. No claim of search ranking, rich-result eligibility, Google indexing or AdSense approval follows from passing tests. Production needs actual host/Search Console/robots/canonical/network checks after an explicitly authorised deployment.
