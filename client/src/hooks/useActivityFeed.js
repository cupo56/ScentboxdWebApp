import { useEffect, useState } from 'react';
import { getLatestReviews, getReviewsByUserIds } from '../services/reviewService';
import { getFollowingIds } from '../services/followService';
import { getBlockedIds } from '../services/blockService';
import { useAuth } from './useAuth';

// Reine Lade-Logik, getrennt vom Hook, damit sie ohne React testbar ist.
//
// scope: 'auto'      → Leute, denen man folgt; wenn die nichts gepostet haben, global
//        'following' → nur Leute, denen man folgt (auch wenn leer)
//        'everyone'  → global
// Blockierte Nutzer fliegen immer raus. Ohne userId gibt es nur den globalen Feed.
export async function loadActivity({ userId, limit, scope }) {
  const [followingIds, blockedIds] = userId
    ? await Promise.all([getFollowingIds(userId).catch(() => []), getBlockedIds().catch(() => [])])
    : [[], []];
  const notBlocked = (r) => !blockedIds.includes(r.user_id);

  if (scope !== 'everyone' && followingIds.length > 0) {
    const followed = (await getReviewsByUserIds(followingIds, limit).catch(() => [])).filter(notBlocked);
    if (followed.length > 0 || scope === 'following') return { items: followed, personalized: true };
  }

  const latest = (await getLatestReviews(limit).catch(() => [])).filter(notBlocked);
  return { items: latest, personalized: false };
}

export function useActivityFeed({ limit = 4, scope = 'auto' } = {}) {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const userId = isAuthenticated && user ? user.id : null;

  useEffect(() => {
    let active = true;
    loadActivity({ userId, limit, scope })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setPersonalized(result.personalized);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, limit, scope]);

  return { items, personalized, loading };
}
