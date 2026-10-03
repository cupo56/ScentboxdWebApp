import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useNoteName', () => ({ useNoteName: () => (n) => n }));
vi.mock('../services/perfumeService', () => ({ getPerfumeById: vi.fn(), getSimilarPerfumes: vi.fn() }));
vi.mock('../services/reviewService', () => ({ getReviewsByPerfume: vi.fn(), getPerfumeRatingSummary: vi.fn(), deleteReview: vi.fn() }));
vi.mock('../services/blockService', () => ({ getBlockedIds: vi.fn() }));
vi.mock('../components/perfume/ActionTiles', () => ({ default: () => <div data-testid="tiles" /> }));
vi.mock('../components/review/ReviewCard', () => ({ default: ({ review }) => <div data-testid="review">{review.text}</div> }));
vi.mock('../components/review/ReviewForm', () => ({ default: () => <div data-testid="form" /> }));

import { useAuth } from '../hooks/useAuth';
import { getPerfumeById, getSimilarPerfumes } from '../services/perfumeService';
import { getReviewsByPerfume, getPerfumeRatingSummary } from '../services/reviewService';
import { getBlockedIds } from '../services/blockService';
import PerfumeDetailPage from './PerfumeDetailPage';

const perfume = {
  id: 'p1', name: 'Layton', concentration: 'EDP', desc: 'Sweet apple and vanilla.', brand_id: 'b1', image_url: 'https://x/l.png',
  longevity_code: 'long', sillage_code: 'moderate', avg_bottle_rating: 4.2, avg_value_rating: 3.8,
  brands: { id: 'b1', name: 'Parfums de Marly' },
  perfume_notes: [{ note_type: 'top', notes: { name: 'Apple' } }, { note_type: 'base', notes: { name: 'Vanilla' } }],
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ isAuthenticated: false, user: null });
  getPerfumeById.mockResolvedValue(perfume);
  getReviewsByPerfume.mockResolvedValue({ reviews: [{ id: 'r1', text: 'Lovely', user_id: 'u9' }, { id: 'r2', text: 'Hidden', user_id: 'blocked' }], total: 2 });
  getPerfumeRatingSummary.mockResolvedValue({ avg_rating: 4.3, review_count: 12, avg_longevity: 70, avg_sillage: null });
  getSimilarPerfumes.mockResolvedValue([{ id: 's1', name: 'Herod', brands: { name: 'Parfums de Marly' } }]);
  getBlockedIds.mockResolvedValue(['blocked']);
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/perfume/p1']}>
      <Routes><Route path="/perfume/:id" element={<PerfumeDetailPage />} /></Routes>
    </MemoryRouter>
  );

describe('PerfumeDetailPage', () => {
  it('renders header, pills, pyramid, performance, description and similar perfumes', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Layton' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Parfums de Marly' })).toHaveAttribute('href', '/brand/b1');
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(await screen.findByText('4.3')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
    expect(screen.getByTestId('tiles')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fragrance pyramid' })).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Performance' })).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Sweet apple and vanilla.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'More from Parfums de Marly' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Herod/ })).toHaveAttribute('href', '/perfume/s1');
  });

  it('lists reviews without blocked users for signed-in users and shows the form', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'me' } });
    renderPage();

    expect(await screen.findByText('Lovely')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).toBeNull();
    expect(screen.getByTestId('form')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /12 reviews/ })).toBeInTheDocument();
  });

  it('offers sign-in instead of the form to visitors', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'Sign in to write a review' })).toHaveAttribute('href', '/login');
    expect(screen.queryByTestId('form')).toBeNull();
  });

  it('shows an error state with a way back', async () => {
    getPerfumeById.mockRejectedValue(new Error('nope'));
    renderPage();

    expect(await screen.findByText('nope')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Catalog' })).toHaveAttribute('href', '/catalog');
  });

  it('drops the previous rating summary when navigating to another perfume', async () => {
    getPerfumeRatingSummary.mockImplementation((perfumeId) => Promise.resolve(perfumeId === 'p1'
      ? { avg_rating: 4.3, review_count: 12, avg_longevity: 70, avg_sillage: null }
      : { avg_rating: 2.1, review_count: 1, avg_longevity: 20, avg_sillage: null }));
    getPerfumeById.mockImplementation((perfumeId) => Promise.resolve({ ...perfume, id: perfumeId, name: perfumeId === 'p1' ? 'Layton' : 'Herod' }));
    const { unmount } = render(
      <MemoryRouter initialEntries={['/perfume/p1']}>
        <Routes><Route path="/perfume/:id" element={<PerfumeDetailPage />} /></Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('4.3')).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={['/perfume/p2']}>
        <Routes><Route path="/perfume/:id" element={<PerfumeDetailPage />} /></Routes>
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Herod' })).toBeInTheDocument();
    expect(await screen.findByText('2.1')).toBeInTheDocument();
    expect(screen.queryByText('4.3')).toBeNull();
  });
});
