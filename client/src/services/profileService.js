import { supabase } from '../lib/supabaseClient';

/**
 * Get profile by user ID.
 */
export async function getProfileById(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get profile by username.
 */
export async function getProfileByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile({ username, bio, avatar_url, is_public }) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const updates = {};
  if (username !== undefined) updates.username = username;
  if (bio !== undefined) updates.bio = bio;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (is_public !== undefined) updates.is_public = is_public;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upload a new avatar image and update the profile's avatar_url.
 * Path matches what the delete-account Edge Function expects to clean up:
 * `{userId (lowercase)}.jpg`.
 */
export async function uploadAvatar(file) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const path = `${user.id.toLowerCase()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so the new image actually shows (same path is reused every upload).
  const bustedUrl = `${publicUrl}?t=${Date.now()}`;

  return updateProfile({ avatar_url: bustedUrl });
}
