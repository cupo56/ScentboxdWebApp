import { describe, it, expect } from 'vitest';
import { longevityFromCode, sillageFromCode, ratingToPercent, ratingToStars, starsToPercent } from './performance';

describe('performance vocabulary', () => {
  it('maps longevity codes to a percent and an English label', () => {
    expect(longevityFromCode('moderate')).toEqual({ percent: 50, label: 'Moderate' });
    expect(longevityFromCode('very_long')).toEqual({ percent: 90, label: 'Very long' });
    expect(longevityFromCode('nope')).toBeNull();
  });

  it('maps sillage codes', () => {
    expect(sillageFromCode('light')).toEqual({ percent: 30, label: 'Light' });
    expect(sillageFromCode('enormous')).toEqual({ percent: 95, label: 'Enormous' });
    expect(sillageFromCode(null)).toBeNull();
  });

  it('turns a 0–5 rating into a percent', () => {
    expect(ratingToPercent(4.5)).toBe(90);
    expect(ratingToPercent(null)).toBeNull();
    expect(ratingToPercent('3')).toBe(60);
    expect(ratingToPercent(72)).toBe(72);
    expect(ratingToPercent(140)).toBe(100);
  });

  it('converts stored percents back to stars and stars to percents', () => {
    expect(ratingToStars(72)).toBe(3.6);
    expect(ratingToStars(4)).toBe(4);
    expect(ratingToStars(null)).toBeNull();
    expect(starsToPercent(4)).toBe(80);
    expect(starsToPercent(0)).toBeNull();
  });
});
