import { describe, it, expect } from 'vitest';
import { pickOfTheDay, buildWhyText } from './today';

const trending = [{ id: 't1' }, { id: 't2' }];
const wantToTry = [{ id: 'w1' }, { id: 'w2' }, { id: 'w3' }];

describe('pickOfTheDay', () => {
  it('prefers the want-to-try list and is stable within a day', () => {
    const date = new Date('2026-10-03T08:00:00Z');
    const a = pickOfTheDay({ trending, wantToTry, date });
    const b = pickOfTheDay({ trending, wantToTry, date: new Date('2026-10-03T22:00:00Z') });

    expect(a).toEqual({ id: expect.stringMatching(/^w/), source: 'want_to_try' });
    expect(b).toEqual(a);
  });

  it('rotates through the want-to-try list from day to day', () => {
    const ids = [1, 2, 3].map((d) => pickOfTheDay({ trending, wantToTry, date: new Date(`2026-10-0${d}T12:00:00Z`) }).id);

    expect(new Set(ids).size).toBe(3);
  });

  it('falls back to the top trending perfume', () => {
    expect(pickOfTheDay({ trending, wantToTry: [] })).toEqual({ id: 't1', source: 'trending' });
  });

  it('returns null without any candidates', () => {
    expect(pickOfTheDay({ trending: [], wantToTry: [] })).toBeNull();
  });
});

describe('buildWhyText', () => {
  const perfume = {
    longevity: 'Long',
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
      'Gourmand with Mocha, Sandalwood and Coffee up top. Long-lasting, good for a full day.'
    );
  });

  it('handles a single note and moderate longevity', () => {
    const p = { longevity: 'Moderate', perfume_notes: [{ note_type: 'top', notes: { name: 'Iris', family: 'Floral' } }] };

    expect(buildWhyText(p)).toBe('Floral with Iris up top. Moderate longevity, easy to re-apply.');
  });

  it('falls back to a generic line without notes or longevity', () => {
    expect(buildWhyText({ perfume_notes: [] })).toBe('Rated highly by the community this week.');
  });
});
