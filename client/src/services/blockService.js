import { supabase } from '../lib/supabaseClient';

/**
 * Get the ids of the users the current user has blocked.
 * blocked_users references auth.users, not profiles, so callers that need
 * display info (username/avatar) should follow up with a profiles lookup.
 */
export async function getBlockedIds() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', user.id);

  if (error) throw error;
  return data.map((row) => row.blocked_id);
}

/**
 * Get the profiles the current user has blocked, for a "Blocked users" list.
 */
export async function getBlockedUsers() {
  const ids = await getBlockedIds();
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids);

  if (error) throw error;
  return data;
}

export async function isBlocked(targetUserId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return false;

  const { data } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId)
    .maybeSingle();

  return !!data;
}

export async function blockUser(targetUserId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');
  if (user.id === targetUserId) throw new Error("You can't block yourself.");

  const { error } = await supabase
    .from('blocked_users')
    .insert({ blocker_id: user.id, blocked_id: targetUserId });

  if (error) throw error;
}

export async function unblockUser(targetUserId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId);

  if (error) throw error;
}
