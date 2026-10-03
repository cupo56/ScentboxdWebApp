import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({ supabase: {} }));

import { supabase } from '../lib/supabaseClient';
import { createSupabaseMock } from '../test/supabaseMock';
import {
  getPerfumes,
  getPerfumeById,
  getConcentrations,
  getNoteFamilies,
  getLongevityLevels,
  getSimilarPerfumes,
  getPerfumeCount,
  getTrendingPerfumes,
} from './perfumeService';

let mock;

beforeEach(() => {
  mock = createSupabaseMock();
  Object.assign(supabase, mock.supabase);
});

describe('getPerfumes', () => {
  it('queries the perfumes table and returns { perfumes, total } when no filters are set', async () => {
    const rows = [{ id: '1', name: 'Aventus' }];
    mock.mockFrom('perfumes', { data: rows, error: null, count: 1 });

    const result = await getPerfumes();

    expect(result).toEqual({ perfumes: rows, total: 1 });
    expect(supabase.from).toHaveBeenCalledWith('perfumes');
  });

  it('throws when the query errors', async () => {
    mock.mockFrom('perfumes', { data: null, error: new Error('boom'), count: null });

    await expect(getPerfumes()).rejects.toThrow('boom');
  });

  it('matches perfumes by name OR by a brand whose name matches the search term', async () => {
    mock.mockFrom('brands', { data: [{ id: 'brand-1' }], error: null });
    const perfumesBuilder = mock.mockFrom('perfumes', { data: [], error: null, count: 0 });

    await getPerfumes({ search: 'Dior' });

    expect(perfumesBuilder.calls.or).toEqual([
      ['name.ilike.%Dior%,brand_id.in.("brand-1")'],
    ]);
  });

  it('falls back to a plain name search when no brand matches the search term', async () => {
    mock.mockFrom('brands', { data: [], error: null });
    const perfumesBuilder = mock.mockFrom('perfumes', { data: [], error: null, count: 0 });

    await getPerfumes({ search: 'Xyz123' });

    expect(perfumesBuilder.calls.or).toBeUndefined();
    expect(perfumesBuilder.calls.ilike).toEqual([['name', '%Xyz123%']]);
  });

  it('resolves note names for the family and calls the get_perfumes_by_notes RPC instead of filtering client-side', async () => {
    mock.mockFrom('notes', {
      data: [{ name: 'Bergamotte' }, { name: 'Grapefruit' }],
      error: null,
    });
    const rpcRows = [
      { id: 'p1', name: 'Citrus Fresh', total_count: 2 },
      { id: 'p2', name: 'Citrus Bold', total_count: 2 },
    ];
    mock.mockRpc('get_perfumes_by_notes', { data: rpcRows, error: null });

    const result = await getPerfumes({ noteFamily: 'Citrus', sortBy: 'newest', page: 2, pageSize: 24 });

    expect(supabase.rpc).toHaveBeenCalledWith('get_perfumes_by_notes', expect.objectContaining({
      p_notes: ['Bergamotte', 'Grapefruit'],
      p_sort_column: 'created_at',
      p_sort_ascending: false,
      p_limit: 24,
      p_offset: 24, // page 2 => offset = (page - 1) * pageSize
      p_count_only: false,
    }));
    // total_count is read from the first row and stripped from each returned perfume
    expect(result.total).toBe(2);
    expect(result.perfumes).toEqual([
      { id: 'p1', name: 'Citrus Fresh' },
      { id: 'p2', name: 'Citrus Bold' },
    ]);
  });

  it('returns an empty result without calling the RPC when the family has no notes', async () => {
    mock.mockFrom('notes', { data: [], error: null });

    const result = await getPerfumes({ noteFamily: 'DoesNotExist' });

    expect(result).toEqual({ perfumes: [], total: 0 });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('filters by longevity_code', async () => {
    const builder = mock.mockFrom('perfumes', { data: [], error: null, count: 0 });

    await getPerfumes({ longevity: 'long' });

    expect(builder.calls.eq).toEqual([['longevity_code', 'long']]);
  });

  it('passes the German label to the notes RPC when a family and longevity are set', async () => {
    mock.mockFrom('notes', { data: [{ name: 'Oud' }], error: null });
    mock.mockRpc('get_perfumes_by_notes', { data: [], error: null });

    await getPerfumes({ noteFamily: 'Woody', longevity: 'long' });

    expect(supabase.rpc).toHaveBeenCalledWith('get_perfumes_by_notes', expect.objectContaining({ p_longevity: 'Langhaltend' }));
  });

  it('drops a longevity value that is not a known code', async () => {
    const builder = mock.mockFrom('perfumes', { data: [], error: null, count: 0 });

    await getPerfumes({ longevity: 'Langhaltend' });

    expect(builder.calls.eq ?? []).toEqual([]);
  });
});

describe('getPerfumeById', () => {
  it('fetches a single perfume by id', async () => {
    const perfume = { id: '42', name: 'Sauvage' };
    mock.mockFrom('perfumes', { data: perfume, error: null });

    await expect(getPerfumeById('42')).resolves.toEqual(perfume);
  });

  it('throws when the perfume is not found', async () => {
    mock.mockFrom('perfumes', { data: null, error: new Error('not found') });

    await expect(getPerfumeById('missing')).rejects.toThrow('not found');
  });
});

describe('filter option helpers', () => {
  it('getConcentrations returns unique, sorted, non-null values', async () => {
    mock.mockFrom('perfumes', {
      data: [{ concentration: 'EDP' }, { concentration: 'EDT' }, { concentration: 'EDP' }, { concentration: null }],
      error: null,
    });

    await expect(getConcentrations()).resolves.toEqual(['EDP', 'EDT']);
  });

  it('getNoteFamilies returns unique, sorted, non-null values', async () => {
    mock.mockFrom('notes', {
      data: [{ family: 'Woody' }, { family: 'Citrus' }, { family: 'Woody' }],
      error: null,
    });

    await expect(getNoteFamilies()).resolves.toEqual(['Citrus', 'Woody']);
  });

  it('getLongevityLevels returns the distinct codes in vocabulary order', async () => {
    mock.mockFrom('perfumes', {
      data: [{ longevity_code: 'long' }, { longevity_code: 'moderate' }, { longevity_code: 'long' }, { longevity_code: null }],
      error: null,
    });

    await expect(getLongevityLevels()).resolves.toEqual(['moderate', 'long']);
  });
});

describe('getSimilarPerfumes', () => {
  it('queries by brand, excluding the current perfume, with a limit', async () => {
    const builder = mock.mockFrom('perfumes', { data: [{ id: 'other' }], error: null });

    await getSimilarPerfumes('brand-1', 'perfume-1', 3);

    expect(builder.calls.eq).toEqual([['brand_id', 'brand-1']]);
    expect(builder.calls.neq).toEqual([['id', 'perfume-1']]);
    expect(builder.calls.limit).toEqual([[3]]);
  });
});

describe('getPerfumeCount', () => {
  it('returns the exact count', async () => {
    mock.mockFrom('perfumes', { data: null, error: null, count: 2960 });

    await expect(getPerfumeCount()).resolves.toBe(2960);
  });
});

describe('getTrendingPerfumes', () => {
  it('reads the trending view ordered by rank', async () => {
    const rows = [{ rank: 1, id: 'a', name: 'Layton' }, { rank: 2, id: 'b', name: 'Oud Wood' }];
    const builder = mock.mockFrom('trending_perfumes', { data: rows, error: null });

    await expect(getTrendingPerfumes()).resolves.toEqual(rows);
    expect(supabase.from).toHaveBeenCalledWith('trending_perfumes');
    expect(builder.order).toHaveBeenCalledWith('rank', { ascending: true });
  });

  it('throws when the query errors', async () => {
    mock.mockFrom('trending_perfumes', { data: null, error: new Error('boom') });

    await expect(getTrendingPerfumes()).rejects.toThrow('boom');
  });
});
