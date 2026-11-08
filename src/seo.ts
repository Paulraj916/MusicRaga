import { CATALOGUE, isDemo } from './realCatalogue';
import {
  artistPath,
  ALL_ROUTES,
  contributors,
  indexableRoute,
  resolveRoute,
  routeSongs,
  songPath,
} from './routes';
import type { Route } from './routes';
import { lyricLanguage } from './lib';
export interface SeoConfig {
  baseUrl: string;
  allowIndexing: boolean;
  reviewedPaths: string[];
}
export function siteConfig(
  baseUrl = 'http://localhost:4173',
  allowIndexing = false,
  reviewedPaths: string[] = [],
): SeoConfig {
  const u = new URL(baseUrl);
  if (
    !['http:', 'https:'].includes(u.protocol) ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !/^\/(?:[A-Za-z0-9_-]+\/?)*$/.test(u.pathname)
  )
    throw new Error(
      'SITE_URL must be a HTTP(S) origin with an optional simple project path, without credentials, query or fragment.',
    );
  if (
    allowIndexing &&
    (u.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))
  )
    throw new Error('ALLOW_INDEXING requires an explicit real HTTPS origin, not localhost.');
  if (reviewedPaths.some((path) => !ALL_ROUTES.includes(path)))
    throw new Error('Reviewed indexing paths must be actual curated routes.');
  return {
    baseUrl: u.origin + u.pathname.replace(/\/$/, ''),
    allowIndexing,
    reviewedPaths: [...new Set(reviewedPaths)],
  };
}
export function pageSeo(path: string, config: SeoConfig) {
  const route = resolveRoute(path);
  const canonical = config.baseUrl + (path === '/' ? '/' : path.replace(/\/*$/, '/'));
  let title = 'PowerWords — Every word, a world.';
  let description =
    'Explore sourced Indian song credits, public-domain Tamil verse and clearly labelled original multilingual demos. A quiet place for the words behind music.';
  let lang = 'en';
  if (route.kind === 'song') {
    const s = route.song;
    const suffix =
      route.variant === 'translation'
        ? 'English rendering'
        : route.variant === 'transliteration'
          ? 'Latin transliteration'
          : s.rights.status === 'metadata-only'
            ? 'credits & sources'
            : s.kind === 'verse'
              ? 'Tamil text & sources'
              : 'original demo lyrics';
    title = `${s.title} — ${suffix} | PowerWords`;
    description =
      s.description?.slice(0, 190) ??
      `Read ${s.title}, a fictional ${s.language} original demo by ${s.artist}. Explore original script, English and Latin text. Not a real commercial release.`;
    if (route.variant !== 'original')
      description = `${route.variant === 'translation' ? 'Project-created English rendering' : 'Readable Latin transliteration'} of ${s.title}. ${s.rights.status === 'public-domain' ? 'Underlying ancient text is public domain; the new rendering is CC0.' : 'Original fictional demo text, shared under CC0.'}`;
    lang = s.rights.status === 'metadata-only' ? 'en' : lyricLanguage(s.language, route.variant);
  }
  if (route.kind === 'artist') {
    title = `${route.name} — songs & credited roles | PowerWords`;
    const list = routeSongs(route);
    description = `Explore ${list.length} ${list.every(isDemo) ? 'fictional demo' : 'catalogued'} entries crediting ${route.name}. Browse songs, albums and credited roles with individual source and lyric-rights notes.`;
  }
  if (route.kind === 'language') {
    title = `${route.name} — song credits & readable texts | PowerWords`;
    description = `Browse ${route.name} recordings and texts in the PowerWords catalogue. Distinguish sourced metadata, public-domain verse and original fictional demos before opening a reader.`;
  }
  if (route.kind === 'not-found') {
    title = 'Page not found | PowerWords';
    description =
      'This catalogue page does not exist. Return to discovery to find a sourced song, artist or language.';
  }
  const alternates =
    route.kind === 'song' && route.song.lyrics.original
      ? (['original', 'translation', 'transliteration'] as const)
          .filter((v) => route.song.lyrics[v])
          .map((v) => ({
            lang: lyricLanguage(route.song.language, v),
            url: config.baseUrl + songPath(route.song, v),
          }))
      : [];
  return {
    title,
    description,
    lang,
    canonical,
    robots:
      config.allowIndexing && config.reviewedPaths.includes(path) && indexableRoute(route)
        ? 'index,follow'
        : 'noindex,follow',
    alternates,
    structured: structuredData(route, canonical, config),
  };
}
export function structuredData(
  route: Route,
  url: string,
  config: SeoConfig,
): Record<string, unknown> {
  const webpage: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    name:
      route.kind === 'song'
        ? route.song.title
        : route.kind === 'artist'
          ? route.name
          : route.kind === 'language'
            ? `${route.name} catalogue`
            : 'PowerWords',
  };
  if (route.kind === 'home')
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PowerWords',
      url: config.baseUrl + '/',
      description:
        'Sourced song metadata, ancient public-domain verse and explicitly fictional original demos.',
      inLanguage: ['en', 'ta', 'hi', 'te'],
    };
  if (route.kind === 'song') {
    const s = route.song;
    if (isDemo(s))
      return {
        ...webpage,
        description: 'Explicitly fictional original demonstration; not a commercial recording.',
      };
    const work: Record<string, unknown> = {
      '@type': s.kind === 'verse' ? 'CreativeWork' : 'MusicComposition',
      name: s.title,
      alternateName: s.nativeTitle,
      inLanguage: lyricLanguage(s.language, s.kind === 'verse' ? route.variant : 'original'),
      description: s.description,
      citation: s.sources?.map((source) => source.url),
      isAccessibleForFree: true,
    };
    const composer = contributors(s).filter((c) => c.role === 'composer');
    const lyricist = contributors(s).filter((c) => c.role === 'lyricist');
    if (composer.length)
      work.composer = composer.map((c) => ({
        '@type': 'Person',
        name: c.name,
        url: config.baseUrl + artistPath(c.name),
      }));
    if (lyricist.length)
      work[s.kind === 'verse' ? 'author' : 'lyricist'] = lyricist.map((c) => ({
        '@type': 'Person',
        name: c.name,
      }));
    if (s.rights.status === 'public-domain') {
      work.copyrightNotice =
        'Ancient underlying Tamil verse: public domain. New PowerWords renderings: CC0-1.0. No modern recording or adaptation rights conveyed.';
      work.text = s.lyrics[route.variant]?.map((l) => l.text).join('\n');
    }
    return { ...webpage, mainEntity: work };
  }
  if (route.kind === 'artist' || route.kind === 'language')
    return {
      ...webpage,
      '@type': 'CollectionPage',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: routeSongs(route).map((s, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: s.title,
          url: config.baseUrl + songPath(s),
        })),
      },
    };
  return webpage;
}
export const curatedSongs = CATALOGUE.filter((s) => !isDemo(s));
