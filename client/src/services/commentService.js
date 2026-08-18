import { supabase } from '../lib/supabaseClient';

/**
 * Get all comments on a review, oldest first.
 */
export async function getCommentsByReview(reviewId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get the comment count for a review.
 */
export async function getCommentCount(reviewId) {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('review_id', reviewId);

  if (error) throw error;
  return count || 0;
}

export async function createComment(reviewId, text) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({ review_id: reviewId, user_id: user.id, text })
    .select('*, profiles(username, avatar_url)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
