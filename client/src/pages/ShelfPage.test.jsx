import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/userPerfumeService', () => ({ getUserPerfumesByStatus: vi.fn() }));
vi.mock('../components/perfume/PerfumeCard', () => ({
  default: ({ perfume }) => <div data-testid="card">{perfume.name}</div>,
}));

vi.mock('../store/toastStore', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { toast } from '../store/toastStore';
import { useAuth } from '../hooks/useAuth';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import ShelfPage from './ShelfPage';

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { id: 'u1' } });
});

const renderPage = (status) => render(<MemoryRouter><ShelfPage status={status} /></MemoryRouter>);

describe('ShelfPage', () => {
  it('loads the collection and shows a card per perfume', async () => {
    getUserPerfumesByStatus.mockResolvedValue([
      { perfumes: { id: 'p1', name: 'Layton' } },
      { perfumes: { id: 'p2', name: 'Oud Wood' } },
      { perfumes: null },
    ]);

    renderPage('owned');

    expect(await screen.findAllByTestId('card')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Collection' })).toBeInTheDocument();
    expect(screen.getByText('2 fragrances')).toBeInTheDocument();
    expect(getUserPerfumesByStatus).toHaveBeenCalledWith('u1', 'is_owned');
  });

  it('loads favorites with the favorite flag', async () => {
    getUserPerfumesByStatus.mockResolvedValue([{ perfumes: { id: 'p1', name: 'Layton' } }]);

    renderPage('favorite');

    await screen.findByTestId('card');
    expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument();
    expect(screen.getByText('1 fragrance')).toBeInTheDocument();
    expect(getUserPerfumesByStatus).toHaveBeenCalledWith('u1', 'is_favorite');
  });

  it('shows an empty state with a link to the catalog', async () => {
    getUserPerfumesByStatus.mockResolvedValue([]);

    renderPage('favorite');

    expect(await screen.findByText(/No favorites yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /catalog/i })).toHaveAttribute('href', '/catalog');
  });

  it('shows a toast and the empty state when loading fails', async () => {
    getUserPerfumesByStatus.mockRejectedValue(new Error('boom'));

    renderPage('owned');

    expect(await screen.findByText(/Nothing in your collection yet/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to load collection: boom');
  });

  it('shows skeletons again and refetches when the status changes', async () => {
    let resolveFavorites;
    getUserPerfumesByStatus
      .mockResolvedValueOnce([{ perfumes: { id: 'p1', name: 'Layton' } }])
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFavorites = resolve; }));

    const { rerender } = renderPage('owned');
    await screen.findByText('1 fragrance');

    rerender(<MemoryRouter><ShelfPage status="favorite" /></MemoryRouter>);

    expect(screen.queryByText('1 fragrance')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument();
    expect(getUserPerfumesByStatus).toHaveBeenLastCalledWith('u1', 'is_favorite');

    await act(async () => { resolveFavorites([]); });
    expect(await screen.findByText(/No favorites yet/)).toBeInTheDocument();
  });
});
