import { create } from 'zustand';
import { getNoteDisplayNames } from '../services/noteService';

// Die Seite ist englisch, die Noten liegen in notes.name auf Deutsch. Die Map
// wird beim ersten Bedarf einmal geladen und dann für alle Komponenten geteilt.
const useNoteNamesStore = create((set, get) => ({
  names: {},
  _loading: null,

  load: () => {
    if (get()._loading) return get()._loading;
    const loading = getNoteDisplayNames('en').then((names) => set({ names }));
    set({ _loading: loading });
    return loading;
  },
}));

export default useNoteNamesStore;
