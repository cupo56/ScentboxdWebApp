import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useNoteName', () => ({ useNoteName: () => (n) => ({ Mokka: 'Mocha' }[n] || n) }));
vi.mock('../../hooks/usePerfumeStatus', () => ({ usePerfumeStatus: vi.fn() }));

import { usePerfumeStatus } from '../../hooks/usePerfumeStatus';
import PerfumeCard from './PerfumeCard';

const perfume = {
  id: 'p1', name: 'Layton', image_url: 'https://x/l.png', concentration: 'EDP', performance: 4.26,
  brands: { name: 'Parfums de Marly' },
  perfume_notes: [
    { note_type: 'base', notes: { name: 'Vanille' } },
    { note_type: 'top', notes: { name: 'Mokka' } },
    { note_type: 'top', notes: { name: 'Apfel' } },
  ],
};

const renderCard = (p = perfume) => render(<MemoryRouter><PerfumeCard perfume={p} /></MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('PerfumeCard', () => {
  it('shows rating, serif name, brand, translated top notes and concentration', () => {
    usePerfumeStatus.mockReturnValue({ isAuthenticated: false, status: {}, toggle: vi.fn() });
    renderCard();

    expect(screen.getByRole('link', { name: /Layton/ })).toHaveAttribute('href', '/perfume/p1');
    expect(screen.getByText('★ 4.3')).toBeInTheDocument();
    expect(screen.getByText('Parfums de Marly')).toBeInTheDocument();
    expect(screen.getByText('Mocha · Apfel')).toBeInTheDocument();
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows heart and star for signed-in users and toggles through the hook', async () => {
    const toggle = vi.fn();
    usePerfumeStatus.mockReturnValue({ isAuthenticated: true, status: { is_favorite: true, is_owned: false }, toggle });
    const user = userEvent.setup();
    renderCard();

    const heart = screen.getByRole('button', { name: 'Remove from favorites' });
    expect(heart).toHaveAttribute('aria-pressed', 'true');
    await user.click(heart);
    expect(toggle).toHaveBeenCalledWith('is_favorite');

    await user.click(screen.getByRole('button', { name: 'Add to collection' }));
    expect(toggle).toHaveBeenCalledWith('is_owned');
  });

  it('falls back when data is missing', () => {
    usePerfumeStatus.mockReturnValue({ isAuthenticated: false, status: {}, toggle: vi.fn() });
    renderCard({ id: 'p2', name: 'Mystery' });

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByText(/★/)).toBeNull();
  });
});
