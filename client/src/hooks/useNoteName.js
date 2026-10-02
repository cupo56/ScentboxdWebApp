import { useCallback, useEffect } from 'react';
import useNoteNamesStore from '../store/noteNamesStore';

// Liefert eine Funktion, die einen Notennamen aus der DB in den englischen
// Anzeigenamen übersetzt. Bis die Map geladen ist, kommt der Name unverändert zurück.
export function useNoteName() {
  const names = useNoteNamesStore((s) => s.names);
  const load = useNoteNamesStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return useCallback((name) => (name ? names[name] ?? name : name), [names]);
}
