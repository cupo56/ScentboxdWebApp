import { describe, it, expect } from 'vitest';
import { pickOfTheDay, buildWhyText } from './today';

const trending = [{ id: 't1' }, { id: 't2' }];
const wantToTry = [{ id: 'w1' }, { id: 'w2' }, { id: 'w3' }];

describe('pickOfTheDay', () => {
  it('prefers the want-to-try list and is stable within a day', () => {
    const a = pickOfTheDay({ trending, wantToTry, date: new Date(2026, 9, 3, 9, 0) });
    const b = pickOfTheDay({ trending, wantToTry, date: new Date(2026, 9, 3, 21, 0) });

    expect(a).toEqual({ id: expect.stringMatching(/^w/), source: 'want_to_try' });
    expect(b).toEqual(a);
  });

  it('rotates through the want-to-try list from day to day', () => {
    const ids = [1, 2, 3].map((d) => pickOfTheDay({ trending, wantToTry, date: new Date(2026, 9, d, 12, 0) }).id);

    expect(new Set(ids).size).toBe(3);
  });

  it('falls back to the top trending perfume', () => {
    expect(pickOfTheDay({ trending, wantToTry: [] })).toEqual({ id: 't1', source: 'trending' });
  });

  it('returns null without any candidates', () => {
    expect(pickOfTheDay({ trending: [], wantToTry: [] })).toBeNull();
  });

  it('works without arguments', () => {
    expect(pickOfTheDay()).toBeNull();
  });
});

describe('buildWhyText', () => {
  const perfume = {
    longevity_code: 'long',
    perfume_notes: [
      { note_type: 'base', notes: { name: 'Moschus', family: 'Musky' } },
      { note_type: 'top', notes: { name: 'Mokka', family: 'Gourmand' } },
      { note_type: 'top', notes: { name: 'Sandelholz', family: 'Woody' } },
      { note_type: 'mid', notes: { name: 'Kaffee', family: 'Gourmand' } },
    ],
  };

  it('names the family, the first three notes in pyramid order and the longevity', () => {
    const translate = (n) => ({ Mokka: 'Mocha', Sandelholz: 'Sandalwood', Kaffee: 'Coffee' }[n] || n);

    expect(buildWhyText(perfume, translate)).toBe(
      'Gourmand, opening with Mocha, Sandalwood and Coffee. Long-lasting, good for a full day.'
    );
  });

  it('handles a single note and moderate longevity', () => {
    const p = { longevity_code: 'moderate', perfume_notes: [{ note_type: 'top', notes: { name: 'Iris', family: 'Floral' } }] };

    expect(buildWhyText(p)).toBe('Floral, opening with Iris.');
  });

  it('describes very long and weak longevity', () => {
    const notes = [{ note_type: 'top', notes: { name: 'Oud', family: 'Woody' } }];
    expect(buildWhyText({ longevity_code: 'very_long', perfume_notes: notes })).toBe('Woody, opening with Oud. Very long-lasting, carries into the next day.');
    expect(buildWhyText({ longevity_code: 'weak', perfume_notes: notes })).toBe('Woody, opening with Oud. Light wear, best re-applied.');
  });

  it('handles notes without a family and a family without notes', () => {
    expect(buildWhyText({ perfume_notes: [{ note_type: 'top', notes: { name: 'Iris' } }] })).toBe('Opens with Iris.');
    expect(buildWhyText({ perfume_notes: [{ note_type: 'top', notes: { family: 'Floral' } }] })).toBe('A floral fragrance.');
  });

  it('ignores the German longevity text and unknown codes', () => {
    expect(buildWhyText({ longevity: 'Moderat', longevity_code: 'something_else', perfume_notes: [] })).toBe('Rated highly by the community this week.');
  });

  it('falls back to a generic line without notes or longevity', () => {
    expect(buildWhyText({ perfume_notes: [] })).toBe('Rated highly by the community this week.');
  });
});
