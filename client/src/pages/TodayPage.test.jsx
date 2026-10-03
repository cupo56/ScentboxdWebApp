import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useActivityFeed', () => ({ useActivityFeed: vi.fn() }));
vi.mock('../hooks/useNoteName', () => ({ useNoteName: () => (n) => n }));
vi.mock('../services/perfumeService', () => ({ getTrendingPerfumes: vi.fn(), getPerfumeById: vi.fn() }));
vi.mock('../services/reviewService', () => ({ getLatestReviews: vi.fn(), getReviewCountByUser: vi.fn() }));
vi.mock('../services/userPerfumeService', () => ({ getUserPerfumesByStatus: vi.fn() }));
vi.mock('../services/blockService', () => ({ getBlockedIds: vi.fn() }));

import { useAuth } from '../hooks/useAuth';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { getTrendingPerfumes, getPerfumeById } from '../services/perfumeService';
import { getLatestReviews, getReviewCountByUser } from '../services/reviewService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getBlockedIds } from '../services/blockService';
import TodayPage from './TodayPage';

const trending = [
  { rank: 1, id: 't1', name: 'Layton', brand_name: 'PdM', image_url: null },
  { rank: 2, id: 't2', name: 'Oud Wood', brand_name: 'Tom Ford', image_url: null },
];
const detail = (id, name) => ({
  id, name, concentration: 'EDP', longevity_code: 'long', brands: { name: 'Brand' },
  perfume_notes: [{ note_type: 'top', notes: { name: 'Mocha', family: 'Gourmand' } }],
});
const review = (id, text, user_id = 'u9') => ({
  id, text, rating: 5, user_id, created_at: '2026-09-30T10:00:00Z',
  profiles: { username: `user${id}` }, perfumes: { id: `p${id}`, name: `Perfume ${id}` },
});

beforeEach(() => {
  vi.clearAllMocks();
  useActivityFeed.mockReturnValue({ items: [review('a', 'x')], personalized: false, loading: false, hasMore: false });
  getTrendingPerfumes.mockResolvedValue(trending);
  getPerfumeById.mockImplementation((id) => Promise.resolve(detail(id, id === 't1' ? 'Layton' : 'Wanted')));
  getLatestReviews.mockResolvedValue([review('1', 'Great stuff'), review('2', ''), review('3', 'Lovely', 'blocked'), review('4', 'Fine')]);
  getBlockedIds.mockResolvedValue(['blocked']);
  getUserPerfumesByStatus.mockResolvedValue([]);
  getReviewCountByUser.mockResolvedValue(0);
});

const renderPage = () => render(<MemoryRouter><TodayPage /></MemoryRouter>);

describe('TodayPage', () => {
  it('shows the top trending perfume as the pick for visitors, without a stats strip', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, profilePath: '/login', loading: false });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Layton' })).toBeInTheDocument();
    expect(screen.getByText('Trending #1')).toBeInTheDocument();
    expect(screen.getByText(/Gourmand, opening with Mocha/)).toBeInTheDocument();
    expect(screen.queryByText('Collection')).toBeNull();
    expect(getUserPerfumesByStatus).not.toHaveBeenCalled();
  });

  it('shows reviews with text, skipping blocked users', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'me' }, profilePath: '/profile/me', loading: false });
    renderPage();

    expect(await screen.findByText('Great stuff')).toBeInTheDocument();
    expect(screen.getByText('Fine')).toBeInTheDocument();
    expect(screen.queryByText('Lovely')).toBeNull();
  });

  it('prefers a want-to-try perfume and shows the stats strip when signed in', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'me' }, profilePath: '/profile/me', loading: false });
    getUserPerfumesByStatus.mockImplementation((_, field) =>
      Promise.resolve(field === 'is_want_to_try' ? [{ perfumes: { id: 'w1', name: 'Wanted' } }] : [{ perfumes: { id: 'o1' } }, { perfumes: { id: 'o2' } }])
    );
    getReviewCountByUser.mockResolvedValue(3);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Wanted' })).toBeInTheDocument();
    expect(screen.getByText('From your list')).toBeInTheDocument();
    expect(getPerfumeById).toHaveBeenCalledWith('w1');
    expect(screen.getByRole('link', { name: /2\s*Collection/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1\s*Want to try/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /3\s*Reviews/ })).toBeInTheDocument();
  });

  it('renders the trending carousel and the community feed', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, profilePath: '/login', loading: false });
    renderPage();

    expect(await screen.findByRole('link', { name: /Oud Wood/ })).toHaveAttribute('href', '/perfume/t2');
    expect(screen.getByRole('link', { name: 'usera' })).toHaveAttribute('href', '/profile/usera');
    expect(screen.getByRole('link', { name: 'All reviews →' })).toHaveAttribute('href', '/community');
  });

  it('falls back to the trending row when the perfume detail fails to load', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, profilePath: '/login', loading: false });
    getPerfumeById.mockRejectedValue(new Error('boom'));
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Layton' })).toBeInTheDocument();
    expect(screen.getByText('Trending #1')).toBeInTheDocument();
    expect(screen.queryByText(/Nothing to recommend yet/)).toBeNull();
  });

  it('waits for the session before loading', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, profilePath: '/login', loading: true });
    renderPage();

    expect(getTrendingPerfumes).not.toHaveBeenCalled();
  });
});
