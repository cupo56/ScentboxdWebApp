import { supabase } from '../lib/supabaseClient';

/**
 * Follow a user.
 */
export async function followUser(followingId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('follows')
    .insert([{ follower_id: session.user.id, following_id: followingId }]);

  if (error) throw error;
  return data;
}

/**
 * Unfollow a user.
 */
export async function unfollowUser(followingId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', session.user.id)
    .eq('following_id', followingId);

  if (error) throw error;
  return true;
}

/**
 * Check if the current user is following a specific user.
 */
export async function isFollowing(followingId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { data, error } = await supabase
    .from('follows')
    .select('created_at')
    .eq('follower_id', session.user.id)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/**
 * Get all users the specified user is following.
 */
export async function getFollowing(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following_id,
      profiles!follows_following_id_fkey(username, avatar_url, bio)
    `)
    .eq('follower_id', userId);

  if (error) throw error;
  return data?.map(d => ({
    id: d.following_id,
    ...d.profiles
  })) || [];
}

/**
 * Get all followers for a specified user.
 */
export async function getFollowers(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower_id,
      profiles!follows_follower_id_fkey(username, avatar_url, bio)
    `)
    .eq('following_id', userId);

  if (error) throw error;
  return data?.map(d => ({
    id: d.follower_id,
    ...d.profiles
  })) || [];
}
