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

  load: (userId) => {
    const { loadedFor, _loading } = get();
    if (loadedFor === userId) return Promise.resolve();
    if (_loading?.userId === userId) return _loading.promise;

    const promise = getUserPerfumeStatuses(userId)
      .then((rows) => {
        const statuses = {};
        for (const row of rows) statuses[row.perfume_id] = { ...EMPTY_STATUS, ...row };
        set({ statuses, loadedFor: userId, _loading: null });
      })
      .catch(() => set({ _loading: null }));
    set({ _loading: { userId, promise } });
    return promise;
  },

  toggle: async (perfumeId, field) => {
    const before = get().statuses[perfumeId] || EMPTY_STATUS;
    set((s) => ({ statuses: { ...s.statuses, [perfumeId]: { ...before, [field]: !before[field] } } }));
    try {
      const row = await togglePerfumeStatus(perfumeId, field);
      set((s) => ({ statuses: { ...s.statuses, [perfumeId]: { ...EMPTY_STATUS, ...row } } }));
    } catch (err) {
      set((s) => ({ statuses: { ...s.statuses, [perfumeId]: before } }));
      toast.error('Failed to update status: ' + err.message);
    }
  },

  reset: () => set({ statuses: {}, loadedFor: null, _loading: null }),
}));

export default useUserPerfumeStore;
