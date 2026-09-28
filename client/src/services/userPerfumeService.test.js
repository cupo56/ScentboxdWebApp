import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({ supabase: {} }));

import { supabase } from '../lib/supabaseClient';
import { createSupabaseMock } from '../test/supabaseMock';
import {
  getUserPerfumeStatus,
  togglePerfumeStatus,
  getUserPerfumesByStatus,
  USER_PERFUME_COLUMNS,
} from './userPerfumeService';

// SCE-141: purchase_price, bottle_size und fill_level sollen spaltenweise
// gesperrt werden. Jeder Lesezugriff muss deshalb eine feste Spaltenliste
// ohne diese Spalten nutzen — ein "*" scheitert nach der Sperre.
const PRIVATE_COLUMNS = ['purchase_price', 'bottle_size', 'fill_level'];

let mock;

beforeEach(() => {
  mock = createSupabaseMock();
  Object.assign(supabase, mock.supabase);
  supabase.auth.getSession = vi.fn(() =>
    Promise.resolve({ data: { session: { user: { id: 'user-1' } } } })
  );
});

function selectedColumns(builder) {
  return builder.calls.select.map(([columns]) => columns);
}

describe('USER_PERFUME_COLUMNS', () => {
  it('lists no private column and no wildcard', () => {
    expect(USER_PERFUME_COLUMNS).not.toContain('*');
    for (const column of PRIVATE_COLUMNS) {
      expect(USER_PERFUME_COLUMNS).not.toContain(column);
    }
  });
});

describe('getUserPerfumeStatus', () => {
  it('reads the own row with the explicit column list', async () => {
    const builder = mock.mockFrom('user_perfumes', { data: { is_owned: true }, error: null });

    await getUserPerfumeStatus('perfume-1');

    expect(selectedColumns(builder)).toEqual([USER_PERFUME_COLUMNS]);
  });
});

describe('togglePerfumeStatus', () => {
  it('reads the existing row and returns the inserted row with explicit columns', async () => {
    const lookup = mock.mockFrom('user_perfumes', { data: null, error: null });
    const insert = mock.mockFrom('user_perfumes', { data: { is_favorite: true }, error: null });

    await togglePerfumeStatus('perfume-1', 'is_favorite');

    expect(selectedColumns(lookup)).toEqual([USER_PERFUME_COLUMNS]);
    expect(insert.calls.insert).toHaveLength(1);
    expect(selectedColumns(insert)).toEqual([USER_PERFUME_COLUMNS]);
  });

  it('updates only the toggled field of an existing row', async () => {
    mock.mockFrom('user_perfumes', { data: { is_owned: false }, error: null });
    const update = mock.mockFrom('user_perfumes', { error: null });

    const result = await togglePerfumeStatus('perfume-1', 'is_owned');

    expect(update.calls.update).toEqual([[{ is_owned: true }]]);
    expect(result.is_owned).toBe(true);
  });
});

describe('getUserPerfumesByStatus', () => {
  it('joins the perfume but reads no private collection column', async () => {
    const builder = mock.mockFrom('user_perfumes', { data: [], error: null });

    await getUserPerfumesByStatus('user-2', 'is_owned');

    const [columns] = selectedColumns(builder);
    expect(columns).toContain(USER_PERFUME_COLUMNS);
    expect(columns).toContain('perfumes(');
    expect(columns.replace(/perfumes\([^)]*\)/, '')).not.toContain('*');
  });
});
