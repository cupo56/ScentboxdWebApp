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
// hasMore: die DB hat so viele Zeilen geliefert wie angefragt (vor dem Blockfilter); es gibt also wahrscheinlich mehr.
export async function loadActivity({ userId, limit, scope }) {
  const [followingIds, blockedIds] = userId
    ? await Promise.all([getFollowingIds(userId).catch(() => []), getBlockedIds().catch(() => [])])
    : [[], []];
  const notBlocked = (r) => !blockedIds.includes(r.user_id);

  if (scope === 'following' && followingIds.length === 0) {
    return { items: [], personalized: true, hasMore: false };
  }

  if (scope !== 'everyone' && followingIds.length > 0) {
    const rows = await getReviewsByUserIds(followingIds, limit).catch(() => []);
    const followed = rows.filter(notBlocked);
    if (followed.length > 0 || scope === 'following') {
      return { items: followed, personalized: true, hasMore: rows.length >= limit };
    }
  }

  const rows = await getLatestReviews(limit).catch(() => []);
  return { items: rows.filter(notBlocked), personalized: false, hasMore: rows.length >= limit };
}

export function useActivityFeed({ limit = 4, scope = 'auto' } = {}) {
  const { isAuthenticated, user } = useAuth();
  const userId = isAuthenticated && user ? user.id : null;
  // Schlüssel der aktuellen Anfrage. Solange das Ergebnis einen anderen Schlüssel
  // trägt, läuft noch ein Request (oder es gab noch keinen).
  const key = `${userId}|${limit}|${scope}`;
  const [result, setResult] = useState({ key: null, items: [], personalized: false, hasMore: false });

  useEffect(() => {
    let active = true;
    loadActivity({ userId, limit, scope })
      .then((r) => {
        if (active) setResult({ key, ...r });
      })
      .catch(() => {
        if (active) setResult({ key, items: [], personalized: false, hasMore: false });
      });
    return () => {
      active = false;
    };
  }, [userId, limit, scope, key]);

  return {
    items: result.items,
    personalized: result.personalized,
    hasMore: result.hasMore,
    loading: result.key !== key,
  };
}
