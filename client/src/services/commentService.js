import { supabase } from '../lib/supabaseClient';

/**
 * Get all comments for a specific review.
 */
export async function getCommentsForReview(reviewId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles(username, avatar_url)
    `)
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Add a comment to a review.
 */
export async function addComment(reviewId, text) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert([{
      review_id: reviewId,
      user_id: session.user.id,
      text: text
    }])
    .select(`
      *,
      profiles(username, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a comment.
 */
export async function deleteComment(commentId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', session.user.id);

  if (error) throw error;
  return true;
}

/**
 * Update an existing comment.
 */
export async function updateComment(commentId, text) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .update({ text: text, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('user_id', session.user.id)
    .select(`
      *,
      profiles(username, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}
