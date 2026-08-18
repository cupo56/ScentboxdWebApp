import { supabase } from '../lib/supabaseClient';

/**
 * Fetch reviews for a perfume.
 */
export async function getReviewsByPerfume(perfumeId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profiles(username, avatar_url)`)
    .eq('perfume_id', perfumeId)
    .order('created_at', { ascending: false });

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
    })
    .eq('id', reviewId)
    .eq('user_id', user.id)
    .select(`*, profiles(username, avatar_url)`)
    .single();

  if (error) throw error;
  return data;
}
