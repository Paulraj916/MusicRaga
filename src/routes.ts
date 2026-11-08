import { CATALOGUE, isDemo } from './realCatalogue';
import type { Song, Variant } from './catalogue';
export const slug = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export const songPath = (song: Song, variant: Variant = 'original') =>
  `/songs/${song.id}/${variant === 'original' ? '' : variant + '/'}`;
export const artistPath = (name: string) => `/artists/${slug(name)}/`;
export const languagePath = (name: string) => `/languages/${slug(name)}/`;
export const contributors = (s: Song) =>
  s.credits?.length
    ? s.credits
    : [
        { name: s.artist, role: 'singer' as const },
        { name: s.composer, role: 'composer' as const },
        { name: s.lyricist, role: 'lyricist' as const },
      ];
export const artists = [
  ...new Set(CATALOGUE.flatMap((s) => contributors(s).map((c) => c.name))),
].sort();
export const languages = [...new Set(CATALOGUE.map((s) => s.language))].sort();
export type Route =
  | { kind: 'home' }
  | { kind: 'song'; song: Song; variant: Variant }
  | { kind: 'artist'; name: string }
  | { kind: 'language'; name: string }
  | { kind: 'not-found' };
export function resolveRoute(path: string): Route {
  let p: string;
  try {
    p = decodeURI(path.split('?')[0]).replace(/\/+$/, '') || '/';
  } catch {
    return { kind: 'not-found' };
  }
  if (p === '/') return { kind: 'home' };
  const parts = p.split('/').filter(Boolean);
  if (parts[0] === 'songs' && parts.length >= 2 && parts.length <= 3) {
    const song = CATALOGUE.find((s) => s.id === parts[1]);
    const variant = (parts[2] ?? 'original') as Variant;
    if (
      song &&
      ['original', 'translation', 'transliteration'].includes(variant) &&
      (!parts[2] || song.lyrics[variant])
    )
      return { kind: 'song', song, variant };
  }
  if (parts[0] === 'artists' && parts.length === 2) {
    const name = artists.find((n) => slug(n) === parts[1]);
    if (name) return { kind: 'artist', name };
  }
  if (parts[0] === 'languages' && parts.length === 2) {
    const name = languages.find((n) => slug(n) === parts[1]);
    if (name) return { kind: 'language', name };
  }
  return { kind: 'not-found' };
}
export function routeSongs(route: Route): Song[] {
  return route.kind === 'song'
    ? [route.song]
    : route.kind === 'artist'
      ? CATALOGUE.filter((s) => contributors(s).some((c) => c.name === route.name))
      : route.kind === 'language'
        ? CATALOGUE.filter((s) => s.language === route.name)
        : CATALOGUE;
}
export function indexableRoute(route: Route): boolean {
  return (
    route.kind === 'home' ||
    (route.kind !== 'not-found' && routeSongs(route).some((s) => !isDemo(s)))
  );
}
export const ALL_ROUTES = [
  '/',
  ...CATALOGUE.flatMap((s) => [
    songPath(s),
    ...(['translation', 'transliteration'] as const)
      .filter((v) => s.lyrics[v])
      .map((v) => songPath(s, v)),
  ]),
  ...artists.map(artistPath),
  ...languages.map(languagePath),
];
