import { describe, expect, it } from 'vitest';
import { CATALOGUE, PUBLIC_VERSE, REAL_RECORDINGS } from './realCatalogue';
import { DEMO_SONGS } from './catalogue';
import { discoverMatches, filterSongs, normalize, optionsFor, validateCatalogue } from './lib';
import { ALL_ROUTES, artistPath, indexableRoute, resolveRoute, songPath } from './routes';
import { pageSeo, siteConfig } from './seo';
const local = siteConfig();
describe('reviewed real metadata and ancient text', () => {
  it('validates every bundled record against runtime import contract', () =>
    expect(validateCatalogue(CATALOGUE)).toHaveLength(18));
  it('commercial entries have no text and individually bounded HTTPS sources', () => {
    expect(REAL_RECORDINGS).toHaveLength(5);
    for (const song of REAL_RECORDINGS) {
      expect(song.lyrics).toEqual({});
      expect(song.rights.status).toBe('metadata-only');
      expect(song.sources?.length).toBeGreaterThanOrEqual(2);
      song.sources?.forEach((source) => expect(source.url).toMatch(/^https:\/\//));
    }
  });
  it('does not attribute Vada Chennai to Rahman', () => {
    const list = REAL_RECORDINGS.filter((s) => s.album === 'Vada Chennai');
    expect(list).toHaveLength(2);
    expect(list.every((s) => s.composer === 'Santhosh Narayanan')).toBe(true);
  });
  it('represents ancient verse honestly without an invented release date', () => {
    expect(PUBLIC_VERSE.year).toBeNull();
    expect(PUBLIC_VERSE.kind).toBe('verse');
    expect(PUBLIC_VERSE.lyrics.original).toHaveLength(6);
    expect(PUBLIC_VERSE.sources).toHaveLength(3);
  });
  it('supports exact native title and readable ancient Tamil text queries', () => {
    expect(filterSongs(CATALOGUE, 'முன்பே வா lyrics', {}).map((s) => s.id)).toEqual(['munbe-vaa']);
    expect(filterSongs(CATALOGUE, 'அகர முதல', {}).map((s) => s.id)).toEqual([
      'tirukkural-invocation',
    ]);
  });
  it('normalises punctuation without stripping Indic vowel signs', () => {
    expect(normalize('முன்பே வா!')).toBe(normalize('முன்பே வா'));
    expect(normalize('முன்பே')).not.toBe(normalize('முன்ப'));
  });
  it('gives explicitly related album results, never a false lyric match', () => {
    const r = discoverMatches(CATALOGUE, 'Vadachennai ஏன் ஏன் கதை கேட்கிற song', {});
    expect(r.related).toBe(true);
    expect(r.songs).toHaveLength(2);
    expect(r.songs.every((s) => s.album === 'Vada Chennai')).toBe(true);
    expect(r.message).toContain('quoted words have not been verified');
    expect(JSON.stringify(REAL_RECORDINGS)).not.toContain('கதை கேட்கிற');
  });
  it('supports compact native album aliases', () =>
    expect(filterSongs(CATALOGUE, 'வடசென்னை', {})).toHaveLength(2));
  it('individual duet singers combine with real composer and album filters', () => {
    expect(
      filterSongs(CATALOGUE, '', {
        composer: 'A. R. Rahman',
        artist: 'Sujatha Mohan',
        album: 'Roja',
      }).map((s) => s.id),
    ).toEqual(['pudhu-vellai-mazhai']);
    expect(optionsFor(CATALOGUE, 'artist')).toContain('Naresh Iyer');
  });
  it('sorts known years chronologically and leaves ancient unknown dates last', () => {
    expect(filterSongs(REAL_RECORDINGS, '', {}, 'newest')[0].year).toBe(2018);
    expect(filterSongs(REAL_RECORDINGS, '', {}, 'oldest')[0].year).toBe(1992);
    expect(filterSongs([PUBLIC_VERSE, ...REAL_RECORDINGS], '', {}, 'oldest').at(-1)?.id).toBe(
      PUBLIC_VERSE.id,
    );
  });
  it('rejects commercial text disguised as metadata-only', () => {
    const row = structuredClone(REAL_RECORDINGS[0]);
    row.lyrics.original = [{ time: 0, text: 'A forbidden imported excerpt' }];
    expect(() => validateCatalogue([row])).toThrow();
  });
  it('rejects unsafe source URLs and invalid contributor roles', () => {
    const row = structuredClone(REAL_RECORDINGS[0]);
    row.sources![0].url = 'javascript:alert(1)';
    expect(() => validateCatalogue([row])).toThrow();
    const bad = structuredClone(REAL_RECORDINGS[0]);
    (bad.credits![0] as { role: string }).role = 'invented';
    expect(() => validateCatalogue([bad])).toThrow();
  });
});
describe('real prerender route SEO', () => {
  it('routes every generated address, including all available script variants', () => {
    expect(new Set(ALL_ROUTES).size).toBe(ALL_ROUTES.length);
    ALL_ROUTES.forEach((path) => expect(resolveRoute(path).kind).not.toBe('not-found'));
  });
  it('has distinct server titles and descriptions for clean routes', () => {
    const titles = ALL_ROUTES.map((p) => pageSeo(p, local).title);
    expect(new Set(titles).size).toBe(titles.length);
    const descriptions = ALL_ROUTES.map((path) => pageSeo(path, local).description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    ALL_ROUTES.forEach((path) =>
      expect(pageSeo(path, local).description.length).toBeGreaterThan(30),
    );
  });
  it('keeps local/default builds non-indexable without a fake production domain', () => {
    expect(local.baseUrl).toBe('http://localhost:4173');
    expect(pageSeo('/songs/munbe-vaa/', local).robots).toBe('noindex,follow');
  });
  it('requires an explicit real HTTPS root origin before enabling indexing', () => {
    for (const url of [
      'http://localhost:4173',
      'https://localhost',
      'https://user:pass@site.test',
      'https://site.test/path',
      'https://site.test/?q=a',
      'ftp://site.test',
    ])
      expect(() => siteConfig(url, true)).toThrow();
    expect(siteConfig('https://site.test', true).allowIndexing).toBe(true);
  });
  it('demos and fictional-only artists never become indexable', () => {
    const cfg = siteConfig('https://site.test', true);
    expect(pageSeo(songPath(DEMO_SONGS[0]), cfg).robots).toBe('noindex,follow');
    expect(indexableRoute(resolveRoute(artistPath(DEMO_SONGS[0].composer)))).toBe(false);
    expect(pageSeo('/songs/munbe-vaa/', cfg).robots).toBe('index,follow');
  });
  it('emits only available reciprocal language/script alternates', () => {
    const seo = pageSeo(songPath(PUBLIC_VERSE, 'translation'), local);
    expect(seo.alternates.map((a) => a.lang)).toEqual(['ta', 'en', 'ta-Latn']);
    expect(pageSeo('/songs/munbe-vaa/', local).alternates).toEqual([]);
    expect(seo.canonical).toBe('http://localhost:4173/songs/tirukkural-invocation/translation/');
  });
  it('structured metadata uses factual composition roles and never copies protected lyrics', () => {
    const data = pageSeo('/songs/ennadi-maayavi-nee/', local).structured;
    const entity = data.mainEntity as Record<string, unknown>;
    expect(entity['@type']).toBe('MusicComposition');
    expect(JSON.stringify(entity.composer)).toContain('Santhosh Narayanan');
    expect(entity.text).toBeUndefined();
    expect(entity.aggregateRating).toBeUndefined();
  });
  it('ancient text structured data is not a claimed modern music recording', () => {
    const data = pageSeo(songPath(PUBLIC_VERSE), local).structured;
    const e = data.mainEntity as Record<string, unknown>;
    expect(e['@type']).toBe('CreativeWork');
    expect(e.text).toContain('அகர முதல');
    expect(e.datePublished).toBeUndefined();
    expect(e.composer).toBeUndefined();
  });
  it('unknown, unsupported variants and malformed escapes resolve to noindex 404', () => {
    for (const path of ['/missing/', '/songs/munbe-vaa/translation/', '/%E0%A4%A']) {
      expect(resolveRoute(path).kind).toBe('not-found');
      expect(pageSeo(path, local).robots).toBe('noindex,follow');
    }
  });
});
it('never turns the ancient author into a singer or composer filter', () => {
  expect(optionsFor([PUBLIC_VERSE], 'artist')).toEqual([]);
  expect(optionsFor([PUBLIC_VERSE], 'composer')).toEqual([]);
  expect(optionsFor([PUBLIC_VERSE], 'lyricist')).toEqual(['Thiruvalluvar (attributed)']);
});
it('rejects blank text and invalid kind while preserving bounded citations', () => {
  const row = structuredClone(PUBLIC_VERSE);
  row.lyrics.original![0].text = ' ';
  expect(() => validateCatalogue([row])).toThrow();
  const other = structuredClone(PUBLIC_VERSE);
  (other as { kind: string }).kind = 'invented';
  expect(() => validateCatalogue([other])).toThrow();
});
