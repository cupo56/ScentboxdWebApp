import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({ supabase: {} }));

import { supabase } from '../lib/supabaseClient';
import { createSupabaseMock } from '../test/supabaseMock';
import { isCurrentUserAdmin, signInAsAdmin } from './adminService';

let mock;

beforeEach(() => {
  mock = createSupabaseMock();
  Object.assign(supabase, mock.supabase);
  supabase.auth.signInWithPassword = vi.fn(() => Promise.resolve({ error: null }));
  supabase.auth.signOut = vi.fn(() => Promise.resolve({ error: null }));
});

describe('isCurrentUserAdmin', () => {
  it('returns true when the RPC says so', async () => {
    mock.mockRpc('is_admin', { data: true, error: null });

    await expect(isCurrentUserAdmin()).resolves.toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('is_admin');
  });

  it('returns false when the RPC fails', async () => {
    mock.mockRpc('is_admin', { data: null, error: { message: 'boom' } });

    await expect(isCurrentUserAdmin()).resolves.toBe(false);
  });
});

describe('signInAsAdmin', () => {
  it('succeeds for an admin and keeps the session', async () => {
    mock.mockRpc('is_admin', { data: true, error: null });

    await expect(signInAsAdmin('a@b.c', 'secret123')).resolves.toEqual({ ok: true, error: null });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secret123' });
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('signs a non-admin straight back out', async () => {
    mock.mockRpc('is_admin', { data: false, error: null });

    const result = await signInAsAdmin('a@b.c', 'secret123');

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/keinen Admin-Zugang/);
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('reports wrong credentials without checking the role', async () => {
    supabase.auth.signInWithPassword = vi.fn(() =>
      Promise.resolve({ error: { message: 'Invalid login credentials' } })
    );

    const result = await signInAsAdmin('a@b.c', 'wrong');

    expect(result).toEqual({ ok: false, error: 'E-Mail oder Passwort ist falsch.' });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
