import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({ supabase: {} }));

import { supabase } from '../lib/supabaseClient';
import { createSupabaseMock } from '../test/supabaseMock';
import { getNoteDisplayNames } from './noteService';

let mock;

beforeEach(() => {
  mock = createSupabaseMock();
  Object.assign(supabase, mock.supabase);
});

describe('getNoteDisplayNames', () => {
  it('maps the German note name to the English display name', async () => {
    mock.mockRpc('get_note_names', {
      data: { Mokka: 'Mocha', Acacia: 'Acacia' },
      error: null,
    });

    await expect(getNoteDisplayNames('en')).resolves.toEqual({ Mokka: 'Mocha', Acacia: 'Acacia' });
    expect(supabase.rpc).toHaveBeenCalledWith('get_note_names', { p_locale: 'en' });
  });

  it('falls back to an empty map when the RPC fails', async () => {
    mock.mockRpc('get_note_names', { data: null, error: { message: 'missing function' } });

    await expect(getNoteDisplayNames('en')).resolves.toEqual({});
  });
});
