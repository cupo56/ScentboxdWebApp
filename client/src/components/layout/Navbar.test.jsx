import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../services/perfumeService', () => ({ getPerfumes: vi.fn(() => Promise.resolve({ perfumes: [] })) }));
vi.mock('./AccountMenu', () => ({ default: () => <div data-testid="account-menu" /> }));

import { useAuth } from '../../hooks/useAuth';
import Navbar from './Navbar';

const renderNav = () => render(<MemoryRouter><Navbar /></MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('Navbar', () => {
  it('links to the five sections', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    renderNav();

    const expected = [['Today', '/'], ['Catalog', '/catalog'], ['Favorites', '/favorites'], ['Collection', '/collection'], ['Community', '/community']];
    for (const [name, href] of expected) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('shows a sign-in button for visitors and the account menu when signed in', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    const { unmount } = renderNav();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByTestId('account-menu')).toBeNull();
    unmount();

    useAuth.mockReturnValue({ isAuthenticated: true });
    renderNav();
    expect(screen.getByTestId('account-menu')).toBeInTheDocument();
  });
});
