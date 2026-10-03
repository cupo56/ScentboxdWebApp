import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useActivityFeed', () => ({ useActivityFeed: vi.fn() }));

import { useAuth } from '../hooks/useAuth';
import { useActivityFeed } from '../hooks/useActivityFeed';
import CommunityPage from './CommunityPage';

const review = (id) => ({
  id,
  rating: 5,
  created_at: '2026-09-30T10:00:00Z',
  profiles: { username: `user${id}` },
  perfumes: { id: `p${id}`, name: `Perfume ${id}` },
});

beforeEach(() => {
  vi.clearAllMocks();
  useActivityFeed.mockReturnValue({ items: [review(1), review(2)], personalized: false, loading: false, hasMore: false });
});

const renderPage = () => render(<MemoryRouter><CommunityPage /></MemoryRouter>);

describe('CommunityPage', () => {
  it('lists the activity feed for visitors without a scope switch', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    renderPage();

    expect(screen.getByRole('heading', { name: 'Community' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Perfume 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Following' })).toBeNull();
    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 20, scope: 'everyone' });
  });

  it('lets signed-in users switch between following and everyone', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    const user = userEvent.setup();
    renderPage();

    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 20, scope: 'following' });
    await user.click(screen.getByRole('button', { name: 'Everyone' }));
    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 20, scope: 'everyone' });
  });

  it('loads more by raising the limit', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    useActivityFeed.mockReturnValue({
      items: Array.from({ length: 20 }, (_, i) => review(i)),
      personalized: false,
      loading: false,
      hasMore: true,
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 40, scope: 'everyone' });
  });

  it('hides "Load more" when the feed has no more rows', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    renderPage();

    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('marks the pressed scope chip and resets the limit on switch', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useActivityFeed.mockReturnValue({ items: [review(1)], personalized: true, loading: false, hasMore: true });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 40, scope: 'following' });

    await user.click(screen.getByRole('button', { name: 'Everyone' }));
    expect(screen.getByRole('button', { name: 'Everyone' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Following' })).toHaveAttribute('aria-pressed', 'false');
    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 20, scope: 'everyone' });
  });

  it('shows an empty state', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useActivityFeed.mockReturnValue({ items: [], personalized: true, loading: false, hasMore: false });
    renderPage();

    expect(screen.getByText(/Nobody you follow has posted yet/)).toBeInTheDocument();
  });
});
