# Deployment guide (no deployment performed)

## Static host

1. Node 24, `npm ci`, run the checks in README, `npm run build`.
2. Publish **only `dist/`**, not source/node_modules/private files, using an HTTPS static host. Standard build command: `npm ci && npm run build`; publish directory: `dist`.
3. Prefer a root-domain deployment for this configuration. Subpath hosting needs Vite `base` plus adjusted favicon/navigation URLs and browser tests at the real path.
4. This demo uses a single HTML page and hash reader links. A single root document is sufficient. Do not claim per-song server-rendered SEO or a real backend.
5. Apply the headers from `public/_headers` through the host's supported configuration. This file is copied into `dist` but is not automatically enforced on every provider, including Vite preview, generic object storage and some static-host platforms.
6. Cache fingerprinted `/assets/*` immutably; serve `index.html` with revalidation so new bundles are discovered. Use compression. Prevent directory listing.
7. Review real deployed network/console behaviour, MIME types, CSP, font loads, favicons, keyboard controls, Tamil/Devanagari/Telugu shaping, local audio and persistence under HTTPS.

Cloudflare Pages/Netlify-style static hosts can use `_headers`. Other providers need equivalent settings. GitHub Pages cannot set all response headers from this file; do not assume they are enforced. A Render static site could host this app once explicitly requested, but this task creates no Render resource or paid service. No deployment YAML is supplied that might accidentally create billing resources.

## CSP

Default production template allows only self resources, data images (generated SVG noise), blob local audio, and inline CSS required by React artwork/font-size style props. Inline JavaScript/eval, third-party media, frames, objects and cross-origin requests are not allowed. JSON-LD is non-executable structured data, not an excuse to permit inline executable scripts. `frame-ancestors 'none'` and `X-Frame-Options DENY` protect framing; Permissions-Policy denies camera/mic/geolocation. Vite development requires websocket/module tooling and does not use the production CSP.

If enabling legitimate services later, adjust only the needed directive/domain after consent/security review. Do not replace CSP with `*` or `unsafe-eval`. Move source-only private licence evidence out of any public build/export.

## Indexing and real launch

The demo intentionally has `noindex,nofollow` and a robots block, with truthful generic WebSite JSON-LD. Do not remove them while the content is a small synthetic demonstration. Real catalogue launch needs canonical routes, accurate titles/descriptions/structured metadata, a sitemap/hreflang strategy, meaningful 404s, server-controlled rights gates and licensed content. Hash URLs are not an SEO substitute.

## Production release gate

- [ ] Exact repository/owner confirmed; feature branch reviewed; CI passed.
- [ ] Licensed original/substantial catalogue, native-language quality and credits verified.
- [ ] Operator details, real support/takedown contact and legally reviewed privacy/rights pages.
- [ ] Publication/admin permissions, evidence, expiry/territory enforcement, audit trail, backup and rollback.
- [ ] HTTPS, actual security headers, access-log retention and environment/secrets review.
- [ ] Cross-browser, screen reader, 200–400% zoom, reduced motion and real-device audio tests.
- [ ] Real per-song routes/SEO prepared before changing demo indexing flags.
- [ ] Advertising stays off until publisher approval/consent/privacy policies and implementation are verified.
- [ ] Real monitoring chosen without silent tracking and with an operator maintenance plan.

No checklist or test suite guarantees approval, complete security, accessibility conformance or zero bugs.
