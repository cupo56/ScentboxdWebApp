import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/reviewService', () => ({
  getLatestReviews: vi.fn(),
  getReviewsByUserIds: vi.fn(),
}));
vi.mock('../services/followService', () => ({ getFollowingIds: vi.fn() }));
vi.mock('../services/blockService', () => ({ getBlockedIds: vi.fn() }));

import { getLatestReviews, getReviewsByUserIds } from '../services/reviewService';
import { getFollowingIds } from '../services/followService';
import { getBlockedIds } from '../services/blockService';
import { loadActivity } from './useActivityFeed';

const review = (id, user_id) => ({ id, user_id });

beforeEach(() => {
  vi.clearAllMocks();
  getBlockedIds.mockResolvedValue([]);
  getFollowingIds.mockResolvedValue([]);
  getLatestReviews.mockResolvedValue([review('g1', 'x'), review('g2', 'y')]);
  getReviewsByUserIds.mockResolvedValue([]);
});

describe('loadActivity', () => {
  it('uses the global feed for visitors without touching follow or block data', async () => {
    const result = await loadActivity({ userId: null, limit: 4, scope: 'auto' });

    expect(result).toEqual({ items: [review('g1', 'x'), review('g2', 'y')], personalized: false, hasMore: false });
    expect(getFollowingIds).not.toHaveBeenCalled();
    expect(getBlockedIds).not.toHaveBeenCalled();
    expect(getLatestReviews).toHaveBeenCalledWith(4);
  });

  it('prefers reviews from followed users', async () => {
    getFollowingIds.mockResolvedValue(['a', 'b']);
    getReviewsByUserIds.mockResolvedValue([review('f1', 'a')]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'auto' });

    expect(result).toEqual({ items: [review('f1', 'a')], personalized: true, hasMore: false });
    expect(getReviewsByUserIds).toHaveBeenCalledWith(['a', 'b'], 4);
    expect(getLatestReviews).not.toHaveBeenCalled();
  });

  it('falls back to the global feed when followed users posted nothing', async () => {
    getFollowingIds.mockResolvedValue(['a']);
    getReviewsByUserIds.mockResolvedValue([]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'auto' });

    expect(result.personalized).toBe(false);
    expect(result.items).toHaveLength(2);
  });

  it('keeps the following scope even when it is empty', async () => {
    getFollowingIds.mockResolvedValue(['a']);
    getReviewsByUserIds.mockResolvedValue([]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'following' });

    expect(result).toEqual({ items: [], personalized: true, hasMore: false });
    expect(getLatestReviews).not.toHaveBeenCalled();
  });

  it('returns an empty personalized feed for the following scope when the user follows nobody', async () => {
    getFollowingIds.mockResolvedValue([]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'following' });

    expect(result).toEqual({ items: [], personalized: true, hasMore: false });
    expect(getLatestReviews).not.toHaveBeenCalled();
  });

  it('reports hasMore from the raw row count, before blocked users are removed', async () => {
    getBlockedIds.mockResolvedValue(['y']);

    const result = await loadActivity({ userId: 'me', limit: 2, scope: 'everyone' });

    expect(result.items).toEqual([review('g1', 'x')]);
    expect(result.hasMore).toBe(true);
  });

  it('uses the global feed when the scope is everyone, even with follows', async () => {
    getFollowingIds.mockResolvedValue(['a']);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'everyone' });

    expect(result.personalized).toBe(false);
    expect(getReviewsByUserIds).not.toHaveBeenCalled();
  });

  it('filters reviews by blocked users out of both feeds', async () => {
    getBlockedIds.mockResolvedValue(['y']);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'auto' });

    expect(result.items).toEqual([review('g1', 'x')]);
  });

  it('filters blocked users out of the personalized feed too', async () => {
    getFollowingIds.mockResolvedValue(['a', 'y']);
    getBlockedIds.mockResolvedValue(['y']);
    getReviewsByUserIds.mockResolvedValue([review('f1', 'a'), review('f2', 'y')]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'auto' });

    expect(result).toEqual({ items: [review('f1', 'a')], personalized: true, hasMore: false });
  });

  it('falls back to the global feed when every followed review is blocked', async () => {
    getFollowingIds.mockResolvedValue(['y']);
    getBlockedIds.mockResolvedValue(['y']);
    getReviewsByUserIds.mockResolvedValue([review('f2', 'y')]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'auto' });

    expect(result).toEqual({ items: [review('g1', 'x')], personalized: false, hasMore: false });
  });
});
