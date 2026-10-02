import { supabase } from '../lib/supabaseClient';

// Zuordnung deutscher Notenname (notes.name) -> Anzeigename in `locale`.
// Schlägt die RPC fehl, kommt eine leere Map zurück und die UI zeigt die
// deutschen Namen wie bisher.
export async function getNoteDisplayNames(locale = 'en') {
  const { data, error } = await supabase.rpc('get_note_names', { p_locale: locale });
  if (error) return {};

  const names = {};
  for (const row of data || []) {
    if (row.name && row.display_name) names[row.name] = row.display_name;
  }
  return names;
}
