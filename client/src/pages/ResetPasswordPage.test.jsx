import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      verifyOtp: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import { supabase } from '../lib/supabaseClient';
import ResetPasswordPage from './ResetPasswordPage';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ResetPasswordPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
});

describe('ResetPasswordPage', () => {
  // Reset-Mails verlinken token_hash statt eines PKCE-Codes, damit auch
  // Resets aus der iOS-App (PKCE, Schluessel liegt auf dem iPhone) hier landen.
  it('verifies a token_hash link and shows the password form', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({ data: {}, error: null });

    renderAt('/reset-password?token_hash=abc123&type=recovery');

    expect(await screen.findByText('Set a new password')).toBeInTheDocument();
    expect(supabase.auth.verifyOtp).toHaveBeenCalledTimes(1);
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'abc123',
      type: 'recovery',
    });
  });

  it('shows the expired state when the token_hash is rejected', async () => {
    supabase.auth.verifyOtp.mockResolvedValue({
      data: {},
      error: { message: 'Token has expired or is invalid' },
    });

    renderAt('/reset-password?token_hash=old&type=recovery');

    expect(await screen.findByText('Invalid or expired link')).toBeInTheDocument();
  });

  it('keeps the session check for links without token_hash', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: {} } } });

    renderAt('/reset-password');

    expect(await screen.findByText('Set a new password')).toBeInTheDocument();
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });
});
