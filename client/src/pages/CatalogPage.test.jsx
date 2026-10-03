import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/perfumeService', () => ({
  getPerfumes: vi.fn(),
  getConcentrations: vi.fn(),
  getNoteFamilies: vi.fn(),
  getLongevityLevels: vi.fn(),
  getTrendingPerfumes: vi.fn(),
}));
vi.mock('../components/perfume/PerfumeCard', () => ({ default: ({ perfume }) => <div data-testid="card">{perfume.name}</div> }));
vi.mock('../components/perfume/PerfumeRow', () => ({ default: ({ perfume }) => <div data-testid="row">{perfume.name}</div> }));
vi.mock('../components/today/TrendingCarousel', () => ({ default: ({ items }) => <div data-testid="trending">{items.length}</div> }));

import { getPerfumes, getConcentrations, getNoteFamilies, getLongevityLevels, getTrendingPerfumes } from '../services/perfumeService';
import CatalogPage from './CatalogPage';

const perfumes = [{ id: 'a', name: 'Layton' }, { id: 'b', name: 'Oud Wood' }];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getPerfumes.mockResolvedValue({ perfumes, total: 2 });
  getConcentrations.mockResolvedValue(['EDP', 'EDT']);
  getNoteFamilies.mockResolvedValue(['Woody']);
  getLongevityLevels.mockResolvedValue(['moderate', 'long']);
  getTrendingPerfumes.mockResolvedValue([{ id: 't1', rank: 1, name: 'T' }]);
});

const renderAt = (entry = '/catalog') => render(<MemoryRouter initialEntries={[entry]}><CatalogPage /></MemoryRouter>);

describe('CatalogPage', () => {
  it('renders the grid by default with the search box, trending and a brands link', async () => {
    renderAt();

    expect(await screen.findAllByTestId('card')).toHaveLength(2);
    expect(screen.getByRole('searchbox', { name: 'Search the catalog' })).toBeInTheDocument();
    expect(await screen.findByTestId('trending')).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: /Browse by brand/ })).toHaveAttribute('href', '/brands');
    expect(screen.getByText('2 fragrances')).toBeInTheDocument();
  });

  it('shows longevity options with English labels and sets the code in the URL', async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findAllByTestId('card');

    const panel = screen.getByRole('complementary', { name: 'Filters' });
    await user.click(within(panel).getByRole('button', { name: 'Long' }));

    expect(getPerfumes).toHaveBeenLastCalledWith(expect.objectContaining({ longevity: 'long' }));
    expect(screen.getByRole('button', { name: /Long ✕/ })).toBeInTheDocument();
  });

  it('reads filters from the URL and lets you clear a chip', async () => {
    const user = userEvent.setup();
    renderAt('/catalog?q=oud&concentration=EDP&longevity=very_long');
    await screen.findAllByTestId('card');

    expect(getPerfumes).toHaveBeenCalledWith(expect.objectContaining({ search: 'oud', concentration: 'EDP', longevity: 'very_long' }));
    expect(screen.getByRole('button', { name: /Very long ✕/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /EDP ✕/ }));
    expect(getPerfumes).toHaveBeenLastCalledWith(expect.objectContaining({ concentration: '' }));
  });

  it('switches sort from the toolbar select and view to rows', async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findAllByTestId('card');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'newest');
    expect(getPerfumes).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'newest' }));

    await user.click(screen.getByRole('button', { name: 'Row view' }));
    expect(await screen.findAllByTestId('row')).toHaveLength(2);
    expect(localStorage.getItem('scentboxd:catalogView')).toBe('rows');
  });

  it('collapses trending and remembers it', async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByTestId('trending');

    await user.click(screen.getByRole('button', { name: 'Hide trending' }));
    expect(screen.queryByTestId('trending')).toBeNull();
    expect(localStorage.getItem('scentboxd:catalogTrending')).toBe('hidden');
  });
});
