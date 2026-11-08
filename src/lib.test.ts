import { describe, expect, it } from 'vitest';
import importExample from '../docs/catalogue.example.json';
import { DEMO_SONGS, FILTER_DIMENSIONS } from './catalogue';
import {
  activeLine,
  filterSongs,
  formatTime,
  normalize,
  lyricLanguage,
  optionsFor,
  parseLrc,
  safeLoad,
  saveLocal,
  validateCatalogue,
  valueFor,
} from './lib';
const clone = () => structuredClone(DEMO_SONGS);
describe('catalogue integrity', () => {
  it('has more than 80 unique meaningful dimensions', () => {
    expect(FILTER_DIMENSIONS.length).toBeGreaterThan(80);
    expect(new Set(FILTER_DIMENSIONS.map((d) => d.key)).size).toBe(FILTER_DIMENSIONS.length);
  });
  it('validates all original demo content', () => {
    expect(validateCatalogue(DEMO_SONGS)).toHaveLength(12);
  });
  it('contains no invented real-artist credit', () => {
    expect(JSON.stringify(DEMO_SONGS)).not.toMatch(/Rahman|Ilaiyaraaja|Arijit/);
  });
  it('shows unknown fields as unavailable', () => {
    expect(optionsFor(DEMO_SONGS, 'raga')).toEqual([]);
  });
  it('has all three reader variants for the demo', () => {
    for (const s of DEMO_SONGS) expect(Object.keys(s.lyrics)).toHaveLength(3);
  });
});
describe('discovery', () => {
  it('normalizes Latin diacritics without losing Tamil script', () => {
    expect(normalize('  MÍRA தமிழ் ')).toBe('mira தமிழ்');
  });
  it('combines search terms across fields', () => {
    const rows = filterSongs(DEMO_SONGS, 'mira tamil', {});
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((s) => s.language === 'Tamil')).toBe(true);
  });
  it('finds native-script titles', () => {
    expect(filterSongs(DEMO_SONGS, 'சின்ன ஒளி', {}).map((s) => s.id)).toContain('a-little-light');
  });
  it('composes exact artist, language and album filters', () => {
    const rows = filterSongs(DEMO_SONGS, '', {
      artist: 'Mira Vaan',
      language: 'Tamil',
      album: 'Paper Skies',
    });
    expect(rows.length).toBe(3);
  });
  it('filters composers separately from singers', () => {
    expect(
      filterSongs(DEMO_SONGS, '', { composer: 'Mira Vaan' }).every(
        (s) => s.composer === 'Mira Vaan',
      ),
    ).toBe(true);
  });
  it('filters advanced metadata', () => {
    expect(filterSongs(DEMO_SONGS, '', { mood: 'Hopeful', independent: 'Yes' }).length).toBe(6);
  });
  it('returns zero for absent real artists', () => {
    expect(filterSongs(DEMO_SONGS, 'A.R. Rahman', {})).toEqual([]);
  });
  it('sorts chronologically in both directions', () => {
    const desc = filterSongs(DEMO_SONGS, '', {}, 'newest');
    const asc = filterSongs(DEMO_SONGS, '', {}, 'oldest');
    expect(desc[0].year).toBe(2026);
    expect(asc[0].year).toBe(2019);
  });
  it('sorts by title without mutating input', () => {
    const before = DEMO_SONGS.map((s) => s.id);
    const rows = filterSongs(DEMO_SONGS, '', {}, 'title');
    expect(rows[0].title).toBe('A little light');
    expect(DEMO_SONGS.map((s) => s.id)).toEqual(before);
  });
  it('treats unknown as unknown, not an invented value', () => {
    expect(valueFor(DEMO_SONGS[0], 'raga')).toBe('');
    expect(filterSongs(DEMO_SONGS, '', { raga: 'Bhairavi' })).toEqual([]);
  });
  it('uses the correct decade for the oldest demo', () => {
    expect(filterSongs(DEMO_SONGS, '', { decade: '2010s' })).toHaveLength(1);
  });
});
describe('timed lyrics', () => {
  it('parses LRC milliseconds and multiple timestamps', () => {
    expect(parseLrc('[00:01.50][01:02.005]Hello')).toEqual([
      { time: 1.5, text: 'Hello' },
      { time: 62.005, text: 'Hello' },
    ]);
  });
  it('sorts lines and ignores metadata / bad seconds', () => {
    expect(parseLrc('[ar:Demo]\n[00:04]Later\n[00:02]First\n[00:80]Bad')).toEqual([
      { time: 2, text: 'First' },
      { time: 4, text: 'Later' },
    ]);
  });
  it('has no active line before the first timestamp', () => {
    expect(activeLine([{ time: 3, text: 'Hi' }], 0, 0)).toBe(-1);
  });
  it('supports positive and negative sync offsets', () => {
    const lines = [
      { time: 0, text: 'A' },
      { time: 6, text: 'B' },
    ];
    expect(activeLine(lines, 5, 1)).toBe(1);
    expect(activeLine(lines, 6, -1)).toBe(0);
  });
  it('formats bounded times safely', () => {
    expect(formatTime(61.9)).toBe('1:01');
    expect(formatTime(-4)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
  });
});
describe('safe catalogue import', () => {
  it('rejects empty and non-array imports', () => {
    expect(() => validateCatalogue({})).toThrow();
    expect(() => validateCatalogue([])).toThrow();
  });
  it('rejects duplicate identifiers', () => {
    expect(() => validateCatalogue([DEMO_SONGS[0], DEMO_SONGS[0]])).toThrow(/unique/);
  });
  it('rejects missing rights assertions', () => {
    const songs = clone();
    songs[0].rights.evidence = '';
    expect(() => validateCatalogue(songs)).toThrow(/Rights/);
  });
  it('rejects broken timestamps', () => {
    const songs = clone();
    songs[0].lyrics.original![1].time = -1;
    expect(() => validateCatalogue(songs)).toThrow(/timestamps/);
  });
  it('rejects unordered timestamps', () => {
    const songs = clone();
    songs[0].lyrics.original![1].time = 20;
    expect(() => validateCatalogue(songs)).toThrow(/timestamps/);
  });
  it('rejects unsupported lyric variants', () => {
    const songs = clone();
    Object.assign(songs[0].lyrics, { html: [{ time: 0, text: 'x' }] });
    expect(() => validateCatalogue(songs)).toThrow(/variant/);
  });
  it('rejects injected CSS colors', () => {
    const songs = clone();
    songs[0].color = 'url(https://bad.example)';
    expect(() => validateCatalogue(songs)).toThrow(/hex/);
  });
  it('rejects malformed text metadata', () => {
    const songs = clone();
    Object.assign(songs[0].metadata, { raga: { nested: true } });
    expect(() => validateCatalogue(songs)).toThrow(/Metadata/);
  });
  it('rejects out-of-bounds years and durations', () => {
    const songs = clone();
    songs[0].year = 0;
    expect(() => validateCatalogue(songs)).toThrow(/Year/);
    songs[0].year = 2026;
    songs[0].duration = 0;
    expect(() => validateCatalogue(songs)).toThrow(/Duration/);
  });
  it('handles unavailable browser storage gracefully', () => {
    expect(safeLoad('missing', [])).toEqual([]);
    expect(saveLocal('unavailable', 'test')).toBe(false);
  });
});

describe('language tags', () => {
  it('tags original, translation and transliteration correctly', () => {
    expect(lyricLanguage('Tamil', 'original')).toBe('ta');
    expect(lyricLanguage('Tamil', 'transliteration')).toBe('ta-Latn');
    expect(lyricLanguage('Hindi', 'translation')).toBe('en');
    expect(lyricLanguage('English', 'original')).toBe('en');
    expect(lyricLanguage('Unknown', 'original')).toBe('und');
  });
});

describe('schema expansion', () => {
  it('all 96 registered dimensions use the actual filter engine', () => {
    for (const dimension of FILTER_DIMENSIONS) {
      const song = structuredClone(DEMO_SONGS[0]);
      const core = ['artist', 'composer', 'lyricist', 'album', 'year', 'language'].includes(
        dimension.key,
      );
      if (!core) song.metadata[dimension.key] = 'Example value';
      const value = valueFor(song, dimension.key);
      expect(optionsFor([song], dimension.key)).toContain(value);
      expect(filterSongs([song], '', { [dimension.key]: value })).toHaveLength(1);
      expect(filterSongs([song], '', { [dimension.key]: 'Definitely absent' })).toHaveLength(0);
    }
  });
  it('ships a valid importable example with a nonconflicting ID', () => {
    const example = validateCatalogue(importExample);
    expect(example).toHaveLength(1);
    expect(DEMO_SONGS.some((s) => s.id === example[0].id)).toBe(false);
  });
});
