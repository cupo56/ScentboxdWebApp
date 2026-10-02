import { supabase } from '../lib/supabaseClient';

// Fragt die RPC public.is_admin() ab. Die Tabelle public.admins selbst ist für
// Clients weder les- noch schreibbar; die Funktion beantwortet nur, ob der
// eingeloggte User darin steht.
export async function isCurrentUserAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}

// Login vom Maintenance-Screen aus. Nicht-Admins werden sofort wieder
// ausgeloggt, damit auf dem gesperrten Host keine normale Session hängen bleibt.
export async function signInAsAdmin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: 'E-Mail oder Passwort ist falsch.' };

  if (await isCurrentUserAdmin()) return { ok: true, error: null };

  await supabase.auth.signOut();
  return { ok: false, error: 'Dieser Account hat keinen Admin-Zugang.' };
}
