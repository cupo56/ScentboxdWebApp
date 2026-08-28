import { supabase } from '../lib/supabaseClient';

/**
 * Fetch a page of reviews for a perfume, newest first.
 */
export async function getReviewsByPerfume(perfumeId, { page = 1, pageSize = 10 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('reviews')
    .select(`*, profiles(username, avatar_url)`, { count: 'exact' })
    .eq('perfume_id', perfumeId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { reviews: data, total: count };
}

/**
 * Aggregate rating stats (avg rating, review count, avg longevity/sillage) for a
 * perfume, computed server-side across all reviews — independent of any review
 * list pagination, so it stays correct as getReviewsByPerfume only loads a page.
 */
export async function getPerfumeRatingSummary(perfumeId) {
  const { data, error } = await supabase
    .rpc('get_perfume_rating', { p_perfume_id: perfumeId })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new review.
 */
export async function createReview({
  perfume_id,
  title,
  text,
  rating,
  longevity = null,
  sillage = null,
  occasions = [],
  bottle_rating = null,
  value_rating = null,
  seasons = [],
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      perfume_id,
      user_id: user.id,
      title,
      text,
      rating,
      longevity,
      sillage,
      occasions,
      bottle_rating,
      value_rating,
      seasons,
    })
    .select(`*, profiles(username, avatar_url)`)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a review (only own reviews).
 */
export async function deleteReview(reviewId) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
}

/**
 * Toggle like on a review.
 */
export async function toggleReviewLike(reviewId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  // Check if already liked
  const { data: existing } = await supabase
    .from('review_likes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('review_likes').delete().eq('id', existing.id);
    return false; // unliked
  } else {
    await supabase.from('review_likes').insert({
      review_id: reviewId,
      user_id: user.id,
    });
    return true; // liked
  }
}

/**
 * Get like count for a review.
 */
export async function getReviewLikeCount(reviewId) {
  const { count, error } = await supabase
    .from('review_likes')
    .select('*', { count: 'exact', head: true })
    .eq('review_id', reviewId);

  if (error) throw error;
  return count;
}

/**
 * Check if current user liked a review.
 */
export async function hasUserLikedReview(reviewId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return false;

  const { data } = await supabase
    .from('review_likes')
    .select('id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle();

  return !!data;
}

/**
 * Get all reviews written by a user, most recent first.
 */
export async function getReviewsByUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profiles(username, avatar_url), perfumes(id, name, image_url, brands(name))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get the reviews a user has liked, most recently liked first.
 */
export async function getLikedReviewsByUser(userId) {
  const { data, error } = await supabase
    .from('review_likes')
    .select(`created_at, reviews(*, profiles(username, avatar_url), perfumes(id, name, image_url, brands(name)))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((row) => row.reviews).filter(Boolean);
}

/**
 * Get total review count.
 */
export async function getReviewCount() {
  const { count, error } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count;
}

/**
 * Get review count for a specific user.
 */
export async function getReviewCountByUser(userId) {
  const { count, error } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count;
}

/**
 * Get latest reviews across all perfumes.
 */
export async function getLatestReviews(limit = 5) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles(username, avatar_url),
      perfumes(id, name, image_url, brands(name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get the latest reviews written by any of the given users (e.g. for a
 * "people you follow" feed).
 */
export async function getReviewsByUserIds(userIds, limit = 10) {
  if (!userIds.length) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles(username, avatar_url),
      perfumes(id, name, image_url, brands(name))
    `)
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Update an existing review.
 */
export async function updateReview(reviewId, updates) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .update({
      title: updates.title,
      text: updates.text,
      rating: updates.rating,
      longevity: updates.longevity,
      sillage: updates.sillage,
      occasions: updates.occasions,
      bottle_rating: updates.bottle_rating,
      value_rating: updates.value_rating,
      seasons: updates.seasons,
    })
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .select(`*, profiles(username, avatar_url)`)
    .single();

  if (error) throw error;
  return data;
}
