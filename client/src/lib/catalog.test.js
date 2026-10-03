import { describe, it, expect } from 'vitest';
import { LONGEVITY_OPTIONS, longevityLabel, longevityRpcLabel, SORT_OPTIONS, sortLabel } from './catalog';

describe('catalog vocabulary', () => {
  it('lists longevity codes in order with English labels', () => {
    expect(LONGEVITY_OPTIONS.map((o) => o.code)).toEqual(['moderate', 'long', 'very_long']);
    expect(longevityLabel('very_long')).toBe('Very long');
    expect(longevityLabel('unknown')).toBe('unknown');
  });

  it('maps codes to the German label the notes RPC still filters on', () => {
    expect(longevityRpcLabel('long')).toBe('Langhaltend');
    expect(longevityRpcLabel('')).toBeNull();
  });

  it('knows the sort options', () => {
    expect(SORT_OPTIONS.map((o) => o.value)).toEqual(['performance', 'newest', 'name', 'name_desc']);
    expect(sortLabel('performance')).toBe('Best rated');
    expect(sortLabel('nope')).toBe('nope');
  });
});
