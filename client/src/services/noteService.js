import { supabase } from '../lib/supabaseClient';

// Zuordnung deutscher Notenname (notes.name) -> Anzeigename in `locale`.
// Schlägt die RPC fehl, kommt eine leere Map zurück und die UI zeigt die
// deutschen Namen wie bisher. Die RPC liefert ein JSON-Objekt statt Zeilen,
// weil PostgREST Zeilen-Ergebnisse bei 1000 abschneidet.
export async function getNoteDisplayNames(locale = 'en') {
  const { data, error } = await supabase.rpc('get_note_names', { p_locale: locale });
  if (error) return {};
  return data || {};
}
