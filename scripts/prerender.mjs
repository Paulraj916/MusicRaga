import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { loadEnv } from 'vite';
const env = loadEnv('production', process.cwd(), '');
import {
  render,
  CATALOGUE,
  FILTER_DIMENSIONS,
  optionsFor,
  ALL_ROUTES,
  pageSeo,
  siteConfig,
  indexableRoute,
  resolveRoute,
} from '../.prerender/entry-prerender.js';
const allow = env.ALLOW_INDEXING === 'true';
if (allow && !env.SITE_URL)
  throw new Error('Set the actual SITE_URL explicitly before enabling indexing.');
const reviewedPaths = (env.REVIEWED_INDEX_PATHS ?? '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
if (allow && !reviewedPaths.length)
  throw new Error(
    'ALLOW_INDEXING requires explicit REVIEWED_INDEX_PATHS after substantive-content/rights review.',
  );
if (allow && reviewedPaths.some((path) => !indexableRoute(resolveRoute(path))))
  throw new Error('Reviewed paths must exclude unknown/demo-only routes.');
const config = siteConfig(env.SITE_URL ?? 'http://localhost:4173', allow, reviewedPaths);
const template = await readFile('dist/index.html', 'utf8');
const escape = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
for (const path of [...ALL_ROUTES, '/404/']) {
  const seo = pageSeo(path, config);
  const head = `<title>${escape(seo.title)}</title><meta name="description" content="${escape(seo.description)}"><meta name="robots" content="${seo.robots}"><meta name="powerwords-base-url" content="${escape(config.baseUrl)}"><meta name="powerwords-indexing" content="${allow}"><meta name="powerwords-reviewed-paths" content="${escape(JSON.stringify(config.reviewedPaths))}"><meta property="og:title" content="${escape(seo.title)}"><meta property="og:description" content="${escape(seo.description)}"><meta property="og:url" content="${escape(seo.canonical)}"><meta property="og:type" content="website"><meta property="og:image" content="${escape(config.baseUrl)}/social-card.png"><meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${escape(seo.canonical)}">${seo.alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${escape(a.url)}">`).join('')}<script type="application/ld+json">${JSON.stringify(seo.structured).replace(/</g, '\\u003c')}</script>`;
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<meta\s+(?:name="(?:description|robots)"|property="og:[^"]+")[^>]*>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace('</head>', head + '</head>')
    .replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`);
  if (!html.includes('id="main"')) throw new Error(`Prerender missing semantic main: ${path}`);
  const file =
    path === '/404/' ? resolve('dist/404.html') : resolve('dist', `.${path}`, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}
const urls = ALL_ROUTES.filter(
  (path) => indexableRoute(resolveRoute(path)) && (!allow || config.reviewedPaths.includes(path)),
);
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${escape(config.baseUrl + path)}</loc></url>`).join('')}</urlset>`,
);
await writeFile(
  'dist/robots.txt',
  `User-agent: *\n${allow ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${config.baseUrl}/sitemap.xml\n`,
);
await writeFile(
  'dist/build-manifest.json',
  JSON.stringify(
    {
      baseUrl: config.baseUrl,
      indexingEnabled: allow,
      reviewedIndexPaths: config.reviewedPaths,
      prerenderedRoutes: ALL_ROUTES.length,
      sitemapRoutes: urls.length,
      catalogueEntries: CATALOGUE.length,
      filterDimensions: {
        total: FILTER_DIMENSIONS.length,
        withData: FILTER_DIMENSIONS.filter((d) => optionsFor(CATALOGUE, d.key).length).length,
        unavailable: FILTER_DIMENSIONS.filter((d) => !optionsFor(CATALOGUE, d.key).length).length,
      },
      generatedFrom: 'Reviewed local catalogue; demo-only routes excluded from sitemap',
    },
    null,
    2,
  ),
);
console.log(
  `Prerendered ${ALL_ROUTES.length} routes + 404. Sitemap: ${urls.length} curated routes. Origin ${config.baseUrl}; indexing ${allow ? 'enabled' : 'disabled'}.`,
);
