import { describe, it, expect } from 'vitest';
import { songSearchQuery } from './SongSearchHome';
describe('simple song-search intent', () => {
  it('keeps a source album while removing generic music intent', () =>
    expect(songSearchQuery(' Alaipayuthey songs lyrics ')).toBe('Alaipayuthey'));
  it('preserves native words and strips only the generic Tamil noun', () =>
    expect(songSearchQuery('முன்பே வா பாடல்')).toBe('முன்பே வா'));
  it('does not invent a transliteration, translation or spelling correction', () =>
    expect(songSearchQuery('Alipayதே song')).toBe('Alipayதே'));
  it('leaves substantive artist and song words in order', () =>
    expect(songSearchQuery('A. R. Rahman SONGS')).toBe('A. R. Rahman'));
});
