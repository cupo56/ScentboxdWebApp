import { supabase } from '../lib/supabaseClient';

function sortToRpcParams(sortBy) {
  switch (sortBy) {
    case 'name_desc':
      return { column: 'name', ascending: false };
    case 'performance':
      return { column: 'performance', ascending: false };
    case 'newest':
      return { column: 'created_at', ascending: false };
    case 'name':
    default:
      return { column: 'name', ascending: true };
  }
}

// noteFamily can't be filtered server-side via a plain column (it lives on the
// related notes table), so it's routed through the get_perfumes_by_notes RPC,
// which expects individual note names rather than a family.
async function getPerfumesByNoteFamily({ search, brand, concentration, noteFamily, longevity, sortBy, from, pageSize }) {
  const { data: familyNotes, error: notesError } = await supabase
    .from('notes')
    .select('name')
    .eq('family', noteFamily);

  if (notesError) throw notesError;

  const noteNames = familyNotes.map((n) => n.name);
  if (noteNames.length === 0) {
    return { perfumes: [], total: 0 };
  }

  const { column, ascending } = sortToRpcParams(sortBy);

  const { data, error } = await supabase.rpc('get_perfumes_by_notes', {
    p_notes: noteNames,
    p_brand_id: brand || null,
    p_concentration: concentration || null,
    p_longevity: longevity || null,
    p_search_query: search || null,
    p_sort_column: column,
    p_sort_ascending: ascending,
    p_limit: pageSize,
    p_offset: from,
    p_count_only: false,
  });

  if (error) throw error;

  const total = data?.[0]?.total_count ?? 0;
  const perfumes = (data || []).map((row) => {
    const perfume = { ...row };
    delete perfume.total_count;
    return perfume;
  });

  return { perfumes, total };
}

/**
 * Fetch perfumes with brand + notes, supporting search, filters, and pagination.
 */
export async function getPerfumes({
  search = '',
  brand = '',
  concentration = '',
  noteFamily = '',
  longevity = '',
  sortBy = 'name',
  page = 1,
  pageSize = 24,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (noteFamily) {
    return getPerfumesByNoteFamily({ search, brand, concentration, noteFamily, longevity, sortBy, from, pageSize });
  }

  let query = supabase
    .from('perfumes')
    .select(`
      *,
      brands(name, country),
      perfume_notes(
        note_type,
        notes(name, family)
      )
    `, { count: 'exact' });

  if (search) {
    // 1. Zuerst schauen wir, ob Marken zu diesem Suchbegriff passen
    const { data: matchedBrands } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', `%${search}%`);

    const brandIds = matchedBrands?.map(b => b.id) || [];

    // 2. Dann filtern wir Parfums: Entweder passt der Parfüm-Name ODER die Marke
    if (brandIds.length > 0) {
      const idList = brandIds.map(id => `"${id}"`).join(',');
      query = query.or(`name.ilike.%${search}%,brand_id.in.(${idList})`);
    } else {
      query = query.ilike('name', `%${search}%`);
    }
  }

  if (brand) {
    query = query.eq('brand_id', brand);
  }

  if (concentration) {
    query = query.eq('concentration', concentration);
  }

  if (longevity) {
    query = query.eq('longevity', longevity);
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
 * Get all unique longevity levels for filter dropdown.
 */
export async function getLongevityLevels() {
  const { data, error } = await supabase
    .from('perfumes')
    .select('longevity')
    .not('longevity', 'is', null);

  if (error) throw error;

  const unique = [...new Set(data.map((d) => d.longevity).filter(Boolean))];
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
 * Get total perfume count.
 */
export async function getPerfumeCount() {
  const { count, error } = await supabase
    .from('perfumes')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count;
}
