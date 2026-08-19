import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabaseClient', () => ({ supabase: {} }));

import { supabase } from '../lib/supabaseClient';
import { createSupabaseMock } from '../test/supabaseMock';
import {
  getReviewsByPerfume,
  getPerfumeRatingSummary,
  createReview,
  deleteReview,
  toggleReviewLike,
  getReviewLikeCount,
  hasUserLikedReview,
  getReviewCount,
  getReviewCountByUser,
  getLatestReviews,
  updateReview,
} from './reviewService';

let mock;

beforeEach(() => {
  mock = createSupabaseMock();
  Object.assign(supabase, mock.supabase);
});

function signInAs(userId) {
  supabase.auth.getSession = vi.fn(() =>
    Promise.resolve({ data: { session: { user: { id: userId } } } })
  );
}

describe('getReviewsByPerfume', () => {
  it('defaults to page 1 / pageSize 10 and returns { reviews, total }', async () => {
    const rows = [{ id: 'r1' }];
    const builder = mock.mockFrom('reviews', { data: rows, error: null, count: 1 });

    const result = await getReviewsByPerfume('perfume-1');

    expect(result).toEqual({ reviews: rows, total: 1 });
    expect(builder.calls.range).toEqual([[0, 9]]);
  });

  it('computes range from/to for later pages so aggregate totals stay independent of pagination', async () => {
    const builder = mock.mockFrom('reviews', { data: [], error: null, count: 25 });

    const result = await getReviewsByPerfume('perfume-1', { page: 3, pageSize: 10 });

    expect(builder.calls.range).toEqual([[20, 29]]);
    expect(result.total).toBe(25);
  });

  it('throws when the query errors', async () => {
    mock.mockFrom('reviews', { data: null, error: new Error('boom'), count: null });

    await expect(getReviewsByPerfume('perfume-1')).rejects.toThrow('boom');
  });
});

describe('getPerfumeRatingSummary', () => {
  it('calls the get_perfume_rating RPC and returns its aggregate row', async () => {
    const summary = { avg_rating: 4.3, review_count: 12, avg_longevity: 65, avg_sillage: 40 };
    mock.mockRpc('get_perfume_rating', { data: summary, error: null });

    await expect(getPerfumeRatingSummary('perfume-1')).resolves.toEqual(summary);
    expect(supabase.rpc).toHaveBeenCalledWith('get_perfume_rating', { p_perfume_id: 'perfume-1' });
  });
});

describe('createReview', () => {
  it('throws when there is no authenticated session', async () => {
    await expect(createReview({ perfume_id: 'p1', title: 't', text: 'x', rating: 5 }))
      .rejects.toThrow('Not authenticated');
  });

  it('inserts the review tagged with the current user id', async () => {
    signInAs('user-1');
    const created = { id: 'r1', user_id: 'user-1' };
    const builder = mock.mockFrom('reviews', { data: created, error: null });

    const result = await createReview({ perfume_id: 'p1', title: 't', text: 'nice scent', rating: 5 });

    expect(result).toEqual(created);
    expect(builder.calls.insert).toEqual([[expect.objectContaining({
      perfume_id: 'p1',
      user_id: 'user-1',
      rating: 5,
    })]]);
  });
});

describe('deleteReview', () => {
  it('deletes by id and throws on error', async () => {
    const builder = mock.mockFrom('reviews', { error: null });

    await deleteReview('r1');

    expect(builder.calls.eq).toEqual([['id', 'r1']]);
  });

  it('throws when the delete errors', async () => {
    mock.mockFrom('reviews', { error: new Error('nope') });

    await expect(deleteReview('r1')).rejects.toThrow('nope');
  });
});

describe('toggleReviewLike', () => {
  it('throws when there is no authenticated session', async () => {
    await expect(toggleReviewLike('r1')).rejects.toThrow('Not authenticated');
  });

  it('unlikes (deletes the like row) when already liked', async () => {
    signInAs('user-1');
    mock.mockFrom('review_likes', { data: { id: 'like-1' }, error: null }); // existing-like lookup
    const deleteBuilder = mock.mockFrom('review_likes', { error: null }); // delete call

    await expect(toggleReviewLike('r1')).resolves.toBe(false);
    expect(deleteBuilder.calls.eq).toEqual([['id', 'like-1']]);
  });

  it('likes (inserts a like row) when not already liked', async () => {
    signInAs('user-1');
    mock.mockFrom('review_likes', { data: null, error: null }); // existing-like lookup, none found
    const insertBuilder = mock.mockFrom('review_likes', { error: null }); // insert call

    await expect(toggleReviewLike('r1')).resolves.toBe(true);
    expect(insertBuilder.calls.insert).toEqual([[{ review_id: 'r1', user_id: 'user-1' }]]);
  });
});

describe('getReviewLikeCount', () => {
  it('returns the exact count', async () => {
    mock.mockFrom('review_likes', { count: 7, error: null });
    await expect(getReviewLikeCount('r1')).resolves.toBe(7);
  });
});

describe('hasUserLikedReview', () => {
  it('returns false without querying when unauthenticated', async () => {
    await expect(hasUserLikedReview('r1')).resolves.toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns true when a like row exists for the current user', async () => {
    signInAs('user-1');
    mock.mockFrom('review_likes', { data: { id: 'like-1' }, error: null });
    await expect(hasUserLikedReview('r1')).resolves.toBe(true);
  });

  it('returns false when no like row exists for the current user', async () => {
    signInAs('user-1');
    mock.mockFrom('review_likes', { data: null, error: null });
    await expect(hasUserLikedReview('r1')).resolves.toBe(false);
  });
});

describe('review counts', () => {
  it('getReviewCount returns the exact count across all reviews', async () => {
    mock.mockFrom('reviews', { count: 500, error: null });
    await expect(getReviewCount()).resolves.toBe(500);
  });

  it('getReviewCountByUser scopes the count to a user', async () => {
    const builder = mock.mockFrom('reviews', { count: 3, error: null });
    await expect(getReviewCountByUser('user-1')).resolves.toBe(3);
    expect(builder.calls.eq).toEqual([['user_id', 'user-1']]);
  });
});

describe('getLatestReviews', () => {
  it('limits to the requested count, newest first', async () => {
    const builder = mock.mockFrom('reviews', { data: [{ id: 'r1' }], error: null });
    await getLatestReviews(3);
    expect(builder.calls.limit).toEqual([[3]]);
  });
});

describe('updateReview', () => {
  it('throws when there is no authenticated session', async () => {
    await expect(updateReview('r1', { title: 't' })).rejects.toThrow('Not authenticated');
  });

  it('updates only the review owned by the current user', async () => {
    signInAs('user-1');
    const updated = { id: 'r1', title: 'new title' };
    const builder = mock.mockFrom('reviews', { data: updated, error: null });

    const result = await updateReview('r1', { title: 'new title', text: 'x', rating: 4 });

    expect(result).toEqual(updated);
    expect(builder.calls.eq).toEqual([['id', 'r1'], ['user_id', 'user-1']]);
  });
});
