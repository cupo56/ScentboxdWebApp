import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/supabaseClient', () => ({ supabase: { auth: {} } }));
vi.mock('../../services/adminService', () => ({
  isCurrentUserAdmin: vi.fn(),
  signInAsAdmin: vi.fn(),
}));

import { supabase } from '../../lib/supabaseClient';
import { isCurrentUserAdmin, signInAsAdmin } from '../../services/adminService';
import MaintenanceGate from './MaintenanceGate';

let authListener;

function withSession(session) {
  supabase.auth.getSession = vi.fn(() => Promise.resolve({ data: { session } }));
}

beforeEach(() => {
  vi.clearAllMocks();
  withSession(null);
  supabase.auth.onAuthStateChange = vi.fn((cb) => {
    authListener = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
});

const renderGate = () =>
  render(
    <MaintenanceGate>
      <p>Die App</p>
    </MaintenanceGate>
  );

describe('MaintenanceGate', () => {
  it('shows the maintenance screen without a session', async () => {
    renderGate();

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Wir bauen gerade an Scentboxd');
    expect(screen.queryByText('Die App')).toBeNull();
    expect(isCurrentUserAdmin).not.toHaveBeenCalled();
  });

  it('opens for an existing admin session', async () => {
    withSession({ user: { id: 'u1' } });
    isCurrentUserAdmin.mockResolvedValue(true);

    renderGate();

    expect(await screen.findByText('Die App')).toBeInTheDocument();
  });

  it('stays locked for a non-admin session', async () => {
    withSession({ user: { id: 'u1' } });
    isCurrentUserAdmin.mockResolvedValue(false);

    renderGate();

    await vi.waitFor(() => expect(isCurrentUserAdmin).toHaveBeenCalled());
    expect(screen.queryByText('Die App')).toBeNull();
  });

  it('opens after a successful admin login', async () => {
    signInAsAdmin.mockResolvedValue({ ok: true, error: null });
    const user = userEvent.setup();
    renderGate();

    await user.click(screen.getByRole('button', { name: 'Admin' }));
    await user.type(screen.getByLabelText('E-Mail'), 'a@b.c');
    await user.type(screen.getByLabelText('Passwort'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Einloggen' }));

    expect(await screen.findByText('Die App')).toBeInTheDocument();
    expect(signInAsAdmin).toHaveBeenCalledWith('a@b.c', 'secret123');
  });

  it('shows the error of a failed login', async () => {
    signInAsAdmin.mockResolvedValue({ ok: false, error: 'Dieser Account hat keinen Admin-Zugang.' });
    const user = userEvent.setup();
    renderGate();

    await user.click(screen.getByRole('button', { name: 'Admin' }));
    await user.type(screen.getByLabelText('E-Mail'), 'a@b.c');
    await user.type(screen.getByLabelText('Passwort'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Einloggen' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('keinen Admin-Zugang');
    expect(screen.queryByText('Die App')).toBeNull();
  });

  it('locks again after signing out', async () => {
    withSession({ user: { id: 'u1' } });
    isCurrentUserAdmin.mockResolvedValue(true);
    renderGate();
    await screen.findByText('Die App');

    act(() => authListener('SIGNED_OUT', null));

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('Die App')).toBeNull();
  });
});
