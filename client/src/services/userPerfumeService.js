import { supabase } from '../lib/supabaseClient';

/**
 * Get user's perfume statuses (favorites, owned, want to try).
 */
export async function getUserPerfumeStatus(perfumeId) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_perfumes')
    .select('*')
    .eq('user_id', user.id)
    .eq('perfume_id', perfumeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Toggle a perfume status (favorite, owned, want_to_try).
 */
export async function togglePerfumeStatus(perfumeId, field) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  // Get current status
  const { data: existing } = await supabase
    .from('user_perfumes')
    .select('*')
    .eq('user_id', user.id)
    .eq('perfume_id', perfumeId)
    .maybeSingle();

  if (existing) {
    const newValue = !existing[field];
    const { error } = await supabase
      .from('user_perfumes')
      .update({ [field]: newValue })
      .eq('user_id', user.id)
      .eq('perfume_id', perfumeId);

    if (error) throw error;
    return { ...existing, [field]: newValue };
  } else {
    const newRow = {
      user_id: user.id,
      perfume_id: perfumeId,
      is_favorite: false,
      is_owned: false,
      is_want_to_try: false,
      [field]: true,
    };
    const { data, error } = await supabase
      .from('user_perfumes')
      .insert(newRow)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Get all user perfumes with a specific status.
 */
export async function getUserPerfumesByStatus(userId, field) {
  const { data, error } = await supabase
    .from('user_perfumes')
    .select(`
      *,
      perfumes(id, name, image_url, concentration, brands(name))
    `)
    .eq('user_id', userId)
    .eq(field, true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
