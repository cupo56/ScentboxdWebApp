import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({ supabase: {} }));

import { supabase } from '../lib/supabaseClient';
import { createSupabaseMock } from '../test/supabaseMock';
import {
  getProfileById,
  getProfileByUsername,
  updateProfile,
  PROFILE_COLUMNS,
} from './profileService';

// SCE-141: preferred_locale soll spaltenweise gesperrt werden.
let mock;

beforeEach(() => {
  mock = createSupabaseMock();
  Object.assign(supabase, mock.supabase);
  supabase.auth.getSession = vi.fn(() =>
    Promise.resolve({ data: { session: { user: { id: 'user-1' } } } })
  );
});

describe('PROFILE_COLUMNS', () => {
  it('lists the fields the app shows, without preferred_locale or a wildcard', () => {
    for (const column of ['id', 'username', 'avatar_url', 'bio', 'is_public', 'created_at']) {
      expect(PROFILE_COLUMNS).toContain(column);
    }
    expect(PROFILE_COLUMNS).not.toContain('preferred_locale');
    expect(PROFILE_COLUMNS).not.toContain('*');
  });
});

describe('profile reads', () => {
  it('getProfileById uses the explicit column list', async () => {
    const builder = mock.mockFrom('profiles', { data: { id: 'user-2' }, error: null });

    await getProfileById('user-2');

    expect(builder.calls.select).toEqual([[PROFILE_COLUMNS]]);
  });

  it('getProfileByUsername uses the explicit column list', async () => {
    const builder = mock.mockFrom('profiles', { data: { id: 'user-2' }, error: null });

    await getProfileByUsername('someone');

    expect(builder.calls.select).toEqual([[PROFILE_COLUMNS]]);
  });

  it('updateProfile returns the row with the explicit column list', async () => {
    const builder = mock.mockFrom('profiles', { data: { id: 'user-1' }, error: null });

    await updateProfile({ bio: 'Hallo' });

    expect(builder.calls.select).toEqual([[PROFILE_COLUMNS]]);
  });
});
