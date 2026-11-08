import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ALL_ROUTES, resolveRoute, indexableRoute } from '../.prerender/entry-prerender.js';
const manifest = JSON.parse(await readFile('dist/build-manifest.json', 'utf8'));
const titles = new Set();
const descriptions = new Set();
let count = 0;
for (const path of ALL_ROUTES) {
  const html = await readFile(`dist${path}index.html`, 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert(title);
  assert(!titles.has(title), `duplicate title ${path}`);
  titles.add(title);
  assert(html.includes('<h1'), `missing H1 ${path}`);
  assert(html.includes('id="main"'));
  assert(html.includes(`rel="canonical" href="${manifest.baseUrl}${path}"`));
  assert(html.includes('property="og:title"'));
  assert(html.includes('name="description"'));
  const description = html.match(/<meta name="description" content="([^"]+)"/s)?.[1];
  assert(description);
  assert(!descriptions.has(description), `duplicate description ${path}`);
  descriptions.add(description);
  const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
  assert(json);
  assert(JSON.parse(json)['@context'] === 'https://schema.org');
  if (!manifest.indexingEnabled || !indexableRoute(resolveRoute(path)))
    assert(html.includes('content="noindex,follow"'));
  count++;
}
const real = await readFile('dist/songs/ennadi-maayavi-nee/index.html', 'utf8');
assert(real.includes('Santhosh Narayanan'));
assert(real.includes('Credits open. Lyrics protected.'));
assert(!real.includes('page-poem'));
const verse = await readFile('dist/songs/tirukkural-invocation/index.html', 'utf8');
assert(verse.includes('அகர முதல'));
assert(verse.includes('hreflang="ta-Latn"'));
const xml = await readFile('dist/sitemap.xml', 'utf8');
assert(!xml.includes('a-little-light'));
assert(xml.includes(`${manifest.baseUrl}/songs/munbe-vaa/`));
const robots = await readFile('dist/robots.txt', 'utf8');
assert(robots.includes(manifest.indexingEnabled ? 'Allow: /' : 'Disallow: /'));
assert(robots.includes(`${manifest.baseUrl}/sitemap.xml`));
console.log(
  `PASS: ${count} prerendered routes: unique titles, descriptions, canonical/OG, structured JSON, server-visible H1, noindex policy; real credit gate, Tamil text/hreflang, configured sitemap and robots.`,
);
