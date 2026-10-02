import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }));
import { useAuth } from '../../hooks/useAuth';
import RequireAuth from './RequireAuth';

const renderGuard = (props) =>
  render(
    <MemoryRouter initialEntries={['/collection']}>
      <Routes>
        <Route path="/collection" element={<RequireAuth {...props}><p>Protected</p></RequireAuth>} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => vi.clearAllMocks());

describe('RequireAuth', () => {
  it('shows a spinner while auth is loading', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: true });
    const { container } = renderGuard();
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('redirects to /login by default', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    renderGuard();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows a sign-in prompt instead of redirecting when one is given', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    renderGuard({ prompt: { title: 'Your collection', text: 'Sign in to see it.' } });

    expect(screen.getByRole('heading', { name: 'Your collection' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to see it.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByText('Protected')).toBeNull();
  });

  it('renders children when signed in', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    renderGuard({ prompt: { title: 'x', text: 'y' } });
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});
