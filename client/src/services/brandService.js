import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all brands with perfume count.
 */
export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*, perfumes(count)')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map((b) => ({ ...b, perfume_count: b.perfumes?.[0]?.count ?? 0 }));
}

/**
 * Fetch a single brand by ID.
 */
export async function getBrandById(id) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all perfumes for a given brand.
 */
export async function getPerfumesByBrand(brandId, { concentration = '' } = {}) {
  let query = supabase
    .from('perfumes')
    .select(`
      *,
      brands(name, country),
      perfume_notes(note_type, notes(name, family))
    `)
    .eq('brand_id', brandId)
    .order('name', { ascending: true });

  if (concentration) {
    query = query.eq('concentration', concentration);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get total brand count.
 */
export async function getBrandCount() {
  const { count, error } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count;
}
