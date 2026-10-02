import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/userPerfumeService', () => ({ getUserPerfumesByStatus: vi.fn() }));
vi.mock('../components/perfume/PerfumeCard', () => ({
  default: ({ perfume }) => <div data-testid="card">{perfume.name}</div>,
}));

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
});
