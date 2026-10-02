-- Anzeigenamen der Noten pro Sprache für die Webapp. Anders als
-- get_catalog_perfumes zählen hier auch maschinelle Übersetzungen, damit die
-- englische Seite keine deutschen Notennamen zeigt. Fallback ist notes.name.
--
-- Rückgabe als ein JSON-Objekt { notes.name: Anzeigename }, weil PostgREST
-- Tabellen-Ergebnisse bei 1000 Zeilen abschneidet und es mehr Noten gibt.
drop function if exists public.get_note_names(text);

create function public.get_note_names(p_locale text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    pg_catalog.jsonb_object_agg(
      note.name,
      coalesce(nullif(pg_catalog.btrim(localized.name), ''), note.name)
    ),
    '{}'::jsonb
  )
  from public.notes as note
  left join public.note_translations as localized
    on localized.note_id = note.id
   and localized.locale = p_locale
   and localized.status in ('reviewed', 'machine_translated');
$$;

revoke execute on function public.get_note_names(text) from public;
grant execute on function public.get_note_names(text) to anon, authenticated;
