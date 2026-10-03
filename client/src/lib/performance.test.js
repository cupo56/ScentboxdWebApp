import { describe, it, expect } from 'vitest';
import { longevityFromCode, sillageFromCode, ratingToPercent } from './performance';

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
  });
});
