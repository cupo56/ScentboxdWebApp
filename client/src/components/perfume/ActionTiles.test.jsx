import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/usePerfumeStatus', () => ({ usePerfumeStatus: vi.fn() }));
vi.mock('./AddToListButton', () => ({ default: () => <button type="button" className="action-tile">Add to list</button> }));

import { usePerfumeStatus } from '../../hooks/usePerfumeStatus';
import ActionTiles from './ActionTiles';

beforeEach(() => vi.clearAllMocks());

describe('ActionTiles', () => {
  it('shows a sign-in link for visitors', () => {
    usePerfumeStatus.mockReturnValue({ isAuthenticated: false, status: {}, toggle: vi.fn() });
    render(<MemoryRouter><ActionTiles perfumeId="p1" /></MemoryRouter>);

    expect(screen.getByRole('link', { name: /Sign in to track this fragrance/ })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders four tiles, marks active ones and toggles', async () => {
    const toggle = vi.fn();
    usePerfumeStatus.mockReturnValue({ isAuthenticated: true, status: { is_want_to_try: true, is_owned: false, is_favorite: false }, toggle });
    const user = userEvent.setup();
    render(<MemoryRouter><ActionTiles perfumeId="p1" /></MemoryRouter>);

    expect(screen.getByRole('button', { name: 'Want to try' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Collection' }));
    expect(toggle).toHaveBeenCalledWith('is_owned');
    await user.click(screen.getByRole('button', { name: 'Favorite' }));
    expect(toggle).toHaveBeenCalledWith('is_favorite');
    expect(screen.getByRole('button', { name: 'Add to list' })).toBeInTheDocument();
  });
});
