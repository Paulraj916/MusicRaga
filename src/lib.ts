import type { Song, LyricLine } from './catalogue';
export type Filters = Record<string, string>;
export const normalize = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
export function valueFor(song: Song, key: string): string {
  const direct: Record<string, string> = {
    artist: song.artist,
    composer: song.composer,
    lyricist: song.lyricist,
    album: song.album,
    year: String(song.year),
    language: song.language,
  };
  return direct[key] ?? song.metadata[key] ?? '';
}
export function filterSongs(
  songs: Song[],
  query: string,
  filters: Filters,
  sort: string = 'newest',
): Song[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
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
        ].join(' '),
      );
      return (
        terms.every((term) => haystack.includes(term)) &&
        Object.entries(filters).every(([key, value]) => !value || valueFor(song, key) === value)
      );
    })
    .sort((a, b) =>
      sort === 'oldest'
        ? a.year - b.year
        : sort === 'title'
          ? a.title.localeCompare(b.title)
          : b.year - a.year || a.title.localeCompare(b.title),
    );
}
export function optionsFor(songs: Song[], key: string): string[] {
  return [...new Set(songs.map((s) => valueFor(s, key)).filter(Boolean))].sort();
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
    if (!Number.isInteger(s.year) || s.year < 1800 || s.year > 2100)
      throw new Error('Year must be between 1800 and 2100.');
    if (!Number.isFinite(s.duration) || s.duration < 1 || s.duration > 14400)
      throw new Error('Duration must be 1–14400 seconds.');
    if (!['sun', 'wave', 'moon', 'petal'].includes(s.artwork) || !/^#[0-9a-f]{6}$/i.test(s.color))
      throw new Error('Use a supported artwork and six-digit hex color.');
    if (
      !s.rights ||
      !['licensed', 'original-demo'].includes(s.rights.status) ||
      typeof s.rights.holder !== 'string' ||
      !s.rights.holder.trim() ||
      typeof s.rights.evidence !== 'string' ||
      !s.rights.evidence.trim()
    )
      throw new Error('Rights holder and licence evidence are required.');
    if (!s.lyrics || typeof s.lyrics !== 'object' || !Object.keys(s.lyrics).length)
      throw new Error('At least one lyric variant is required.');
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
