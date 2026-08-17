import { supabase } from '../lib/supabaseClient';

/**
 * Get user lists.
 */
export async function getUserLists(userId) {
  const { data, error } = await supabase
    .from('lists')
    .select(`
      *,
      list_items(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get a single list with its perfumes.
 */
export async function getListById(listId) {
  const { data, error } = await supabase
    .from('lists')
    .select(`
      *,
      list_items(
        id,
        added_at,
        perfumes(id, name, image_url, concentration, performance, brands(name))
      )
    `)
    .order('added_at', { foreignTable: 'list_items' })
    .eq('id', listId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new list.
 */
export async function createList({ name, description = '', is_public = false }) {
  const { data, error } = await supabase
    .from('lists')
    .insert({ name, description, is_public })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add a perfume to a list.
 */
export async function addToList(listId, perfumeId) {
  const { error } = await supabase
    .from('list_items')
    .insert({ list_id: listId, perfume_id: perfumeId });

  if (error) throw error;
}

/**
 * Remove a perfume from a list.
 */
export async function removeFromList(listId, perfumeId) {
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('perfume_id', perfumeId);

  if (error) throw error;
}

/**
 * Update list metadata.
 */
export async function updateList(listId, { name, description, is_public }) {
  const { data, error } = await supabase
    .from('lists')
    .update({ name, description, is_public })
    .eq('id', listId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a list.
 */
export async function deleteList(listId) {
  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId);

  if (error) throw error;
}
