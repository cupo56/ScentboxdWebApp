-- Anzeigenamen der Noten pro Sprache für die Webapp. Anders als
-- get_catalog_perfumes zählen hier auch maschinelle Übersetzungen, damit die
-- englische Seite keine deutschen Notennamen zeigt. Fallback ist notes.name.
create or replace function public.get_note_names(p_locale text)
returns table (name text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    note.name,
    coalesce(nullif(pg_catalog.btrim(localized.name), ''), note.name) as display_name
  from public.notes as note
  left join public.note_translations as localized
    on localized.note_id = note.id
   and localized.locale = p_locale
   and localized.status in ('reviewed', 'machine_translated');
$$;

revoke execute on function public.get_note_names(text) from public;
grant execute on function public.get_note_names(text) to anon, authenticated;
