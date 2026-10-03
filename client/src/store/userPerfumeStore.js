import { create } from 'zustand';
import { getUserPerfumeStatuses, togglePerfumeStatus } from '../services/userPerfumeService';
import { toast } from './toastStore';

const EMPTY_STATUS = { is_favorite: false, is_owned: false, is_want_to_try: false };

// Favorit/Collection/Want-to-try aller Düfte des eingeloggten Users, einmal
// geladen und von allen Karten geteilt. Toggles sind optimistisch.
const useUserPerfumeStore = create((set, get) => ({
  statuses: {},
  loadedFor: null,
  _loading: null,
  _pending: {},

  load: (userId) => {
    const { loadedFor, _loading } = get();
    if (loadedFor === userId) return Promise.resolve();
    if (_loading?.userId === userId) return _loading.promise;

    let promise;
    promise = getUserPerfumeStatuses(userId)
      .then((rows) => {
        if (get()._loading?.promise !== promise) return;
        const statuses = {};
        for (const row of rows) statuses[row.perfume_id] = { ...EMPTY_STATUS, ...row };
        set({ statuses, loadedFor: userId, _loading: null });
      })
      .catch(() => {
        if (get()._loading?.promise !== promise) return;
        set({ _loading: null });
      });
    set({ _loading: { userId, promise } });
    return promise;
  },

  toggle: async (perfumeId, field) => {
    if (get()._pending[perfumeId]) return;
    const owner = get().loadedFor;
    set((s) => ({ _pending: { ...s._pending, [perfumeId]: true } }));
    const before = get().statuses[perfumeId] || EMPTY_STATUS;
    set((s) => ({ statuses: { ...s.statuses, [perfumeId]: { ...before, [field]: !before[field] } } }));
    try {
      const row = await togglePerfumeStatus(perfumeId, field);
      if (get().loadedFor === owner) {
        set((s) => ({ statuses: { ...s.statuses, [perfumeId]: { ...EMPTY_STATUS, ...row } } }));
      }
    } catch (err) {
      if (get().loadedFor === owner) {
        set((s) => ({ statuses: { ...s.statuses, [perfumeId]: before } }));
      }
      toast.error('Failed to update status: ' + err.message);
    } finally {
      set((s) => {
        const next = { ...s._pending };
        delete next[perfumeId];
        return { _pending: next };
      });
    }
  },

  reset: () => set({ statuses: {}, loadedFor: null, _loading: null, _pending: {} }),
}));

export default useUserPerfumeStore;
