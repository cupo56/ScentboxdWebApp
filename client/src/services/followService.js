import { supabase } from '../lib/supabaseClient';

/**
 * Get follower/following counts for a profile.
 */
export async function getFollowCounts(userId) {
  const [{ count: followers, error: followersError }, { count: following, error: followingError }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  if (followersError) throw followersError;
  if (followingError) throw followingError;
  return { followers: followers || 0, following: following || 0 };
}

/**
 * Get the profiles that follow this user.
 */
export async function getFollowers(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(id, username, avatar_url)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((row) => row.profiles).filter(Boolean);
}

/**
 * Get the profiles this user follows.
 */
export async function getFollowing(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_following_id_fkey(id, username, avatar_url)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((row) => row.profiles).filter(Boolean);
}

/**
 * Whether the current user follows the given profile.
 */
export async function isFollowing(targetUserId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return false;

  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  return !!data;
}

export async function followUser(targetUserId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');
  if (user.id === targetUserId) throw new Error("You can't follow yourself.");

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: targetUserId });

  if (error) throw error;
}

export async function unfollowUser(targetUserId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId);

  if (error) throw error;
}
