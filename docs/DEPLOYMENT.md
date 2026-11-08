# Deployment guide (no deployment performed)

## Build and static hosting

1. Use Node 24, `npm ci`; run README checks. No paid account or backend is required.
2. For a preview, keep `ALLOW_INDEXING=false`; default origin is `http://localhost:4173`. For production set `SITE_URL` to **your actual HTTPS root origin** in build environment or `.env.production`; enable indexing only after content/operator review. No fictional production domain is configured.
3. `npm run build` produces the client and **68 clean route HTML pages plus 404**, sitemap/robots and a build manifest. Route totals are derived automatically and change with the catalogue.
4. Publish **only `dist/`** on an HTTPS static host. Build command `npm ci && npm run build`, output directory `dist`. Do not publish source, node_modules, private licence contracts or environment files.
5. Serve `/songs/id/`, `/artists/name/`, `/languages/tamil/` as their physical directory `index.html` files. Redirect missing slash to the slash URL. Serve `404.html` with **status 404** for unknown paths. **Do not add an SPA wildcard `/index.html` 200 rewrite**: it destroys route-specific crawlability and real 404s. Verify direct loads and no-JavaScript text after deployment.
6. Root-origin hosting is supported. A subpath/GitHub-project Pages deployment needs coordinated Vite base, asset paths, route/canonical and preview changes; it is not claimed to work unchanged.
7. Apply `public/_headers` through a host that supports it, or equivalent provider configuration. The Node preview `scripts/serve.mjs` enforces the same security intent; a generic static host does not automatically do so. Configure MIME types for HTML/JS/CSS/fonts/XML.
8. Cache fingerprinted `/assets/*` immutably; revalidate HTML, sitemap and robots. Enable compression, HTTPS and no directory listing. Inspect `dist/build-manifest.json` for the final origin/indexing flag.

Cloudflare Pages/Netlify-style hosts may use `_headers`; test provider-specific directory and 404 handling. GitHub Pages cannot apply arbitrary response headers from that file. A Render static site is an option only after explicit deployment authorisation; this task creates **no cloud resource or billing commitment**. No auto-deploy template silently creates services.

## Local production QA

```sh
npm run build
npm run test:seo
npm run preview -- --host 0.0.0.0 --port 4173
# clean routes, security headers and real 404s; not the Vite editing server
```

The preview is a small development/test static server, **not a hardened public application service**. It rejects methods other than GET/HEAD, constrains paths to `dist`, redirects directory slashes and never falls back unknown paths to the homepage. Use a maintained HTTPS static host/CDN for real traffic.

## CSP / privacy

Self-hosted scripts/fonts/images only; data images for original art; blob local audio; inline CSS for React artwork/font sizing. No inline executable scripts/eval, cross-origin fetch, frame, object or third-party media is permitted. JSON-LD is non-executable data. Frame protection and Permissions-Policy deny framing/camera/microphone/geolocation. Vite development requires tooling not covered by this production policy. If adding any third-party integration, review terms/consent and allow only the exact necessary origins/directives—never `*` or `unsafe-eval` as a shortcut.

## Launch checklist

- [ ] Exact GitHub target confirmed, existing project preserved, reviewed feature branch/CI.
- [ ] Actual HTTPS `SITE_URL`, source/rights/editorial review and operator decision before `ALLOW_INDEXING=true`; demo pages stay noindex.
- [ ] Operator-owned real support/takedown channel, truthful privacy/terms, access-log retention and maintenance responsibility.
- [ ] Licensed substantial text catalogue or carefully reviewed PD/consenting independent content; private evidence, jurisdiction/expiry gates and publication audit trail for a real service.
- [ ] Actual host headers, MIME/cache/compression, direct clean routes, slash/404 status, canonical/hreflang/sitemap/robots and no-JS rendered text checked live.
- [ ] Manual native-language/screen-reader, zoom, reduced motion and physical-device/audio/cross-browser QA.
- [ ] Advertising remains off until publisher approval, source-terms, consent/CMP and privacy obligations are met. No approval or revenue guarantee.
- [ ] Backups, monitoring without silent tracking, rollback and ongoing source/dependency review.

Passing automated checks does not guarantee legal compliance, security, accessibility conformance, search rankings or zero bugs.

## Full free static catalogue build

Standard build now also needs Python 3.11+/SQLite FTS5 and emits versioned query shards/pages from bundled compressed CC0 metadata, so optional Python runtime/API is not required for static discovery. No raw dump/database should be deployed. Follow FREE_HOSTING_SEARCH_ADS.md for root-host/free-tier limitations, real SITE_URL, indexing review and intentionally blocked live ads. GitHub Pages project subpaths require separate adaptation. No paid service or live deployment is created by this upgrade.
