import type { Song, LyricLine } from './catalogue';
export type Filters = Record<string, string>;
export const normalize = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export function valueFor(song: Song, key: string): string {
  const direct: Record<string, string> = {
    artist: song.artist,
    composer: song.composer,
    lyricist: song.lyricist,
    album: song.album,
    year: song.year === null ? '' : String(song.year),
    language: song.language,
  };
  return direct[key] ?? song.metadata[key] ?? '';
}
export function valuesFor(song: Song, key: string): string[] {
  const role =
    key === 'artist'
      ? 'singer'
      : key === 'composer'
        ? 'composer'
        : key === 'lyricist'
          ? 'lyricist'
          : null;
  const names = role ? song.credits?.filter((c) => c.role === role).map((c) => c.name) : [];
  if (role && song.credits) return names ?? [];
  return [valueFor(song, key)].filter(Boolean);
}
export function filterSongs(
  songs: Song[],
  query: string,
  filters: Filters,
  sort: string = 'newest',
): Song[] {
  const terms = normalize(query)
    .split(/\s+/)
    .filter((term) => term && !['song', 'songs', 'lyrics', 'பாடல்', 'வரிகள்'].includes(term));
  return songs
    .filter((song) => {
      const haystack = normalize(
        [
          song.title,
          song.nativeTitle,
          song.album,
          song.artist,
          song.composer,
          song.lyricist,
          song.language,
          ...Object.values(song.metadata),
          ...(song.aliases ?? []),
          ...(song.credits?.map((c) => c.name) ?? []),
          ...Object.values(song.lyrics).flatMap((lines) => lines?.map((l) => l.text) ?? []),
        ].join(' '),
      );
      return (
        terms.every((term) => haystack.includes(term)) &&
        Object.entries(filters).every(
          ([key, value]) => !value || valuesFor(song, key).includes(value),
        )
      );
    })
    .sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      if (a.year === null) return b.year === null ? a.title.localeCompare(b.title) : 1;
      if (b.year === null) return -1;
      return (
        (sort === 'oldest' ? a.year - b.year : b.year - a.year) || a.title.localeCompare(b.title)
      );
    });
}
export function optionsFor(songs: Song[], key: string): string[] {
  return [...new Set(songs.flatMap((s) => valuesFor(s, key)).filter(Boolean))].sort();
}
/** Partial contextual recovery is explicit: an album match never verifies an unknown lyric quote. */
export function discoverMatches(
  songs: Song[],
  query: string,
  filters: Filters,
  sort = 'newest',
): { songs: Song[]; related: boolean; message: string } {
  const exact = filterSongs(songs, query, filters, sort);
  if (exact.length || !query.trim()) return { songs: exact, related: false, message: '' };
  const compact = (v: string) => normalize(v).replace(/\s+/g, '');
  const q = compact(query);
  const albums = [...new Set(songs.map((s) => s.album))].filter(
    (album) => compact(album).length >= 5 && q.includes(compact(album)),
  );
  if (!albums.length) return { songs: [], related: false, message: '' };
  const related = filterSongs(
    songs.filter((s) => albums.includes(s.album)),
    '',
    filters,
    sort,
  );
  return {
    songs: related,
    related: related.length > 0,
    message: related.length
      ? `No exact match for the full phrase. Related ${albums.join(', ')} entries follow; the quoted words have not been verified.`
      : '',
  };
}

export function formatTime(t: number): string {
  const n = Math.max(0, Math.floor(Number.isFinite(t) ? t : 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}
export function parseLrc(text: string): LyricLine[] {
  const result: LyricLine[] = [];
  for (const line of text.split(/\r?\n/)) {
    const stamps = [...line.matchAll(/\[(\d{1,3}):([0-5]\d)(?:[.:](\d{1,3}))?\]/g)];
    const content = line.replace(/\[[^\]]*\]/g, '').trim();
    if (!content) continue;
    for (const m of stamps)
      result.push({
        time: Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(`0.${m[3]}`) : 0),
        text: content,
      });
  }
  return result.sort((a, b) => a.time - b.time);
}
export function activeLine(lines: LyricLine[], time: number, offset: number): number {
  let active = -1;
  lines.forEach((line, i) => {
    if (line.time <= time + offset) active = i;
  });
  return active;
}
export function safeLoad<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(fallback))
      return (
        Array.isArray(value) && value.every((v) => typeof v === 'string') ? value : fallback
      ) as T;
    return typeof value === typeof fallback ? value : fallback;
  } catch {
    return fallback;
  }
}
export function saveLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function validateCatalogue(raw: unknown): Song[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 500)
    throw new Error('Import a JSON array of 1–500 songs.');
  const ids = new Set<string>();
  return raw.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) throw new Error('Every song must be an object.');
    const s = item as Song;
    for (const key of [
      'id',
      'title',
      'nativeTitle',
      'album',
      'artist',
      'composer',
      'lyricist',
      'language',
      'color',
    ])
      if (
        typeof s[key as keyof Song] !== 'string' ||
        !(s[key as keyof Song] as string).trim() ||
        (s[key as keyof Song] as string).length > 300
      )
        throw new Error(`Invalid or missing ${key}.`);
    if (!/^[a-z0-9-]{1,80}$/.test(s.id) || ids.has(s.id))
      throw new Error('Song IDs must be unique lowercase slugs.');
    ids.add(s.id);
    if (s.year !== null && (!Number.isInteger(s.year) || s.year < 1800 || s.year > 2100))
      throw new Error('Year must be between 1800 and 2100.');
    if (!Number.isFinite(s.duration) || s.duration < 1 || s.duration > 14400)
      throw new Error('Duration must be 1–14400 seconds.');
    if (!['sun', 'wave', 'moon', 'petal'].includes(s.artwork) || !/^#[0-9a-f]{6}$/i.test(s.color))
      throw new Error('Use a supported artwork and six-digit hex color.');
    if (
      !s.rights ||
      !['licensed', 'original-demo', 'metadata-only', 'public-domain'].includes(s.rights.status) ||
      typeof s.rights.holder !== 'string' ||
      !s.rights.holder.trim() ||
      s.rights.holder.length > 300 ||
      typeof s.rights.evidence !== 'string' ||
      !s.rights.evidence.trim() ||
      s.rights.evidence.length > 4000
    )
      throw new Error('Rights holder and licence evidence are required.');
    if (
      !s.lyrics ||
      typeof s.lyrics !== 'object' ||
      Array.isArray(s.lyrics) ||
      (!Object.keys(s.lyrics).length && s.rights.status !== 'metadata-only')
    )
      throw new Error('At least one lyric variant is required.');
    if (s.rights.status === 'metadata-only' && Object.keys(s.lyrics).length)
      throw new Error('Metadata-only entries must not include lyric text.');
    if (
      s.aliases &&
      (!Array.isArray(s.aliases) ||
        s.aliases.length > 30 ||
        s.aliases.some((a) => typeof a !== 'string' || a.length > 300))
    )
      throw new Error('Invalid search aliases.');
    if (
      s.credits &&
      (!Array.isArray(s.credits) ||
        s.credits.length > 30 ||
        s.credits.some(
          (c) =>
            !c ||
            !['singer', 'composer', 'lyricist'].includes(c.role) ||
            typeof c.name !== 'string' ||
            !c.name.trim() ||
            c.name.length > 300,
        ))
    )
      throw new Error('Invalid contributor roles.');
    if (
      s.sources &&
      (!Array.isArray(s.sources) ||
        s.sources.length > 20 ||
        s.sources.some((source) => {
          try {
            const url = new URL(source.url);
            return (
              url.protocol !== 'https:' ||
              typeof source.url !== 'string' ||
              source.url.length > 2000 ||
              !!url.username ||
              !!url.password ||
              typeof source.label !== 'string' ||
              !source.label.trim() ||
              source.label.length > 300 ||
              typeof source.supports !== 'string' ||
              !source.supports.trim() ||
              source.supports.length > 1000 ||
              !/^\d{4}-\d{2}-\d{2}$/.test(source.checked)
            );
          } catch {
            return true;
          }
        }))
    )
      throw new Error('Invalid source citations; use HTTPS URLs and checked dates.');
    if (s.kind !== undefined && !['recording', 'verse'].includes(s.kind))
      throw new Error('Invalid work kind.');
    if (
      s.description !== undefined &&
      (typeof s.description !== 'string' || s.description.length > 2000)
    )
      throw new Error('Invalid description.');
    for (const [key, lines] of Object.entries(s.lyrics)) {
      if (
        !['original', 'translation', 'transliteration'].includes(key) ||
        !Array.isArray(lines) ||
        !lines.length ||
        lines.length > 500
      )
        throw new Error('Invalid lyric variant.');
      let last = -1;
      for (const line of lines) {
        if (
          typeof line?.text !== 'string' ||
          !line.text.trim() ||
          line.text.length > 2000 ||
          !Number.isFinite(line.time) ||
          line.time < 0 ||
          line.time > s.duration ||
          line.time < last
        )
          throw new Error(
            'Lyrics must contain bounded text and sorted timestamps within duration.',
          );
        last = line.time;
      }
    }
    if (
      !s.metadata ||
      typeof s.metadata !== 'object' ||
      Array.isArray(s.metadata) ||
      Object.entries(s.metadata).some(
        ([k, v]) => k.length > 80 || typeof v !== 'string' || v.length > 300,
      )
    )
      throw new Error('Metadata must map keys to short strings.');
    return s;
  });
}

/** Conservative language tags: never label an unknown original as a different language. */
export function lyricLanguage(
  language: string,
  variant: 'original' | 'translation' | 'transliteration',
): string {
  const tags: Record<string, string> = {
    Tamil: 'ta',
    Hindi: 'hi',
    Telugu: 'te',
    Malayalam: 'ml',
    Kannada: 'kn',
    Bengali: 'bn',
    Marathi: 'mr',
    Gujarati: 'gu',
    Punjabi: 'pa',
    Urdu: 'ur',
    Odia: 'or',
    Assamese: 'as',
    Sanskrit: 'sa',
    Kashmiri: 'ks',
    Sindhi: 'sd',
    Nepali: 'ne',
    Konkani: 'kok',
    Manipuri: 'mni',
    Bodo: 'brx',
    Dogri: 'doi',
    Maithili: 'mai',
    Santali: 'sat',
    English: 'en',
  };
  if (variant === 'translation') return 'en';
  const code = tags[language] ?? 'und';
  return variant === 'transliteration' ? `${code}-Latn` : code;
}
