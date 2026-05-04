import { supabase } from '../lib/supabaseClient';

/**
 * Fetch perfumes with brand + notes, supporting search, filters, and pagination.
 */
export async function getPerfumes({
  search = '',
  brand = '',
  concentration = '',
  noteFamily = '',
  sortBy = 'name',
  page = 1,
  pageSize = 24,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Use !inner join ONLY if filtering by noteFamily, to avoid excluding perfumes without notes
  const notesSelect = noteFamily 
    ? 'perfume_notes!inner(note_type, notes!inner(name, family))'
    : 'perfume_notes(note_type, notes(name, family))';

  const selectString = `
    *,
    brands(name, country),
    ${notesSelect}
  `;

  let query;
  if (search) {
    // RPC returns SETOF perfumes, allowing us to chain .select() and relations just like a table
    query = supabase
      .rpc('search_perfumes_table', { search_term: search })
      .select(selectString, { count: 'exact' });
  } else {
    query = supabase
      .from('perfumes')
      .select(selectString, { count: 'exact' });
  }

  if (brand) {
    query = query.eq('brand_id', brand);
  }

  if (concentration) {
    query = query.eq('concentration', concentration);
  }

  if (noteFamily) {
    query = query.eq('perfume_notes.notes.family', noteFamily);
  }

  // Sort
  switch (sortBy) {
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'name_desc':
      query = query.order('name', { ascending: false });
      break;
    case 'performance':
      query = query.order('performance', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('name', { ascending: true });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return { perfumes: data, total: count };
}

/**
 * Fetch a single perfume by ID with full details.
 */
export async function getPerfumeById(id) {
  const { data, error } = await supabase
    .from('perfumes')
    .select(`
      *,
      brands(id, name, country),
      perfume_notes(
        note_type,
        notes(id, name, family)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all unique concentrations for filter dropdown.
 */
export async function getConcentrations() {
  const { data, error } = await supabase
    .from('perfumes')
    .select('concentration')
    .not('concentration', 'is', null);

  if (error) throw error;

  const unique = [...new Set(data.map((d) => d.concentration).filter(Boolean))];
  return unique.sort();
}

/**
 * Get all unique note families for filter dropdown.
 */
export async function getNoteFamilies() {
  const { data, error } = await supabase
    .from('notes')
    .select('family')
    .not('family', 'is', null);

  if (error) throw error;

  const unique = [...new Set(data.map((d) => d.family).filter(Boolean))];
  return unique.sort();
}

/**
 * Get similar perfumes (same brand, excluding current).
 */
export async function getSimilarPerfumes(brandId, currentPerfumeId, limit = 6) {
  const { data, error } = await supabase
    .from('perfumes')
    .select('id, name, image_url, concentration, brands(name)')
    .eq('brand_id', brandId)
    .neq('id', currentPerfumeId)
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Fetch average ratings for multiple perfumes (batch).
 * Returns a Map: perfumeId → { avg_rating, review_count, avg_longevity, avg_sillage }
 */
export async function getPerfumeRatings(perfumeIds) {
  if (!perfumeIds || perfumeIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('perfume_avg_ratings')
    .select('*')
    .in('perfume_id', perfumeIds);

  if (error) throw error;

  const map = new Map();
  (data || []).forEach((row) => {
    map.set(row.perfume_id, {
      avg_rating: parseFloat(row.avg_rating),
      review_count: row.review_count,
      avg_longevity: row.avg_longevity ? parseFloat(row.avg_longevity) : null,
      avg_sillage: row.avg_sillage ? parseFloat(row.avg_sillage) : null,
    });
  });
  return map;
}

/**
 * Fetch average rating for a single perfume via RPC.
 */
export async function getPerfumeRating(perfumeId) {
  const { data, error } = await supabase
    .rpc('get_perfume_rating', { p_perfume_id: perfumeId });

  if (error) throw error;

  const row = data?.[0];
  if (!row || row.review_count === 0) return null;

  return {
    avg_rating: parseFloat(row.avg_rating),
    review_count: row.review_count,
    avg_longevity: row.avg_longevity ? parseFloat(row.avg_longevity) : null,
    avg_sillage: row.avg_sillage ? parseFloat(row.avg_sillage) : null,
  };
}

/**
 * Get total perfume count.
 */
export async function getPerfumeCount() {
  const { count, error } = await supabase
    .from('perfumes')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count;
}
