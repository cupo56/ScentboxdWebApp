import { useEffect } from 'react';
import { useAuth } from './useAuth';
import useUserPerfumeStore from '../store/userPerfumeStore';

const EMPTY = { is_favorite: false, is_owned: false, is_want_to_try: false };

// Status einer Karte plus Toggle. Lädt die Map des Users beim ersten Aufruf.
export function usePerfumeStatus(perfumeId) {
  const { isAuthenticated, user } = useAuth();
  const userId = isAuthenticated && user ? user.id : null;
  const status = useUserPerfumeStore((s) => s.statuses[perfumeId]) || EMPTY;
  const load = useUserPerfumeStore((s) => s.load);
  const toggle = useUserPerfumeStore((s) => s.toggle);

  useEffect(() => {
    if (userId) load(userId);
  }, [userId, load]);

  return { isAuthenticated: !!userId, status, toggle: (field) => toggle(perfumeId, field) };
}
