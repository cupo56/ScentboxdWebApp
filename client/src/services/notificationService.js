import { supabase } from '../lib/supabaseClient';

const DEFAULTS = {
  new_reviews: true,
  review_likes: true,
  new_comments: true,
  new_followers: true,
  similar_added: false,
  community_updates: false,
};

/**
 * Get the current user's notification preferences.
 * Returns defaults if no row exists yet (table starts empty per-user).
 */
export async function getNotificationPreferences(userId) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? { ...DEFAULTS, ...data } : { ...DEFAULTS, user_id: userId };
}

/**
 * Upsert the current user's notification preferences.
 */
export async function updateNotificationPreferences(userId, updates) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}
