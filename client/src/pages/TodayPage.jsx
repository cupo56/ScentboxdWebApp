import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { useNoteName } from '../hooks/useNoteName';
import { getTrendingPerfumes, getPerfumeById } from '../services/perfumeService';
import { getLatestReviews, getReviewCountByUser } from '../services/reviewService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getBlockedIds } from '../services/blockService';
import { pickOfTheDay, buildWhyText } from '../lib/today';
import StatsStrip from '../components/today/StatsStrip';
import HeroPickCard from '../components/today/HeroPickCard';
import PerfumeCarousel from '../components/perfume/PerfumeCarousel';
import ReviewTeaser from '../components/today/ReviewTeaser';
import ActivityRow from '../components/community/ActivityRow';
import './TodayPage.css';

const EMPTY_STATS = { owned: 0, wantToTry: 0, reviews: 0 };

// Lädt alles für Today in einem Rutsch. Fehler einzelner Quellen lassen den
// Rest stehen (allSettled); die Seite zeigt dann eben weniger.
async function loadToday(userId) {
  const [trendingR, wantR, ownedR, reviewCountR, latestR, blockedR] = await Promise.allSettled([
    getTrendingPerfumes(),
    userId ? getUserPerfumesByStatus(userId, 'is_want_to_try') : Promise.resolve([]),
    userId ? getUserPerfumesByStatus(userId, 'is_owned') : Promise.resolve([]),
    userId ? getReviewCountByUser(userId) : Promise.resolve(0),
    getLatestReviews(8),
    userId ? getBlockedIds() : Promise.resolve([]),
  ]);
  const value = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);

  const trending = value(trendingR, []);
  const wantToTry = value(wantR, []).map((row) => row.perfumes).filter(Boolean);
  const blocked = value(blockedR, []);
  const pick = pickOfTheDay({ trending, wantToTry });
  const pickDetail = pick ? await getPerfumeById(pick.id).catch(() => null) : null;

  let pickFallback = null;
  if (pick?.source === 'want_to_try') pickFallback = wantToTry.find((p) => p.id === pick.id) || null;
  else if (pick) {
    const row = trending.find((p) => p.id === pick.id);
    if (row) pickFallback = { id: row.id, name: row.name, image_url: row.image_url, brands: { name: row.brand_name } };
  }

  return {
    trending,
    pick,
    pickDetail,
    pickFallback,
    stats: {
      owned: value(ownedR, []).length,
      wantToTry: wantToTry.length,
      reviews: value(reviewCountR, 0) || 0,
    },
    reviews: value(latestR, [])
      .filter((r) => r.text?.trim() && !blocked.includes(r.user_id))
      .slice(0, 2),
  };
}

export default function TodayPage() {
  const { isAuthenticated, user, profilePath, loading: authLoading } = useAuth();
  const userId = isAuthenticated && user ? user.id : null;
  const noteName = useNoteName();
  const { items: activity, personalized, loading: activityLoading } = useActivityFeed({ limit: 4 });
  // key: userId der geladenen Daten. `undefined` = noch nichts geladen (userId
  // ist für Besucher null, deshalb nicht null als Startwert).
  const [data, setData] = useState({ key: undefined, trending: [], pick: null, pickDetail: null, pickFallback: null, stats: EMPTY_STATS, reviews: [] });

  useEffect(() => {
    if (authLoading) return undefined;
    let active = true;
    loadToday(userId)
      .then((next) => {
        if (active) setData({ key: userId, ...next });
      })
      .catch(() => {
        if (active) setData({ key: userId, trending: [], pick: null, pickDetail: null, pickFallback: null, stats: EMPTY_STATS, reviews: [] });
      });
    return () => {
      active = false;
    };
  }, [userId, authLoading]);

  const loading = authLoading || data.key !== userId;
  const heroPerfume = data.pickDetail ?? data.pickFallback;
  let tag = null;
  if (data.pick?.source === 'want_to_try') tag = 'From your list';
  else if (data.pick) tag = 'Trending #1';
  const why = data.pickDetail ? buildWhyText(data.pickDetail, noteName) : null;

  return (
    <div className="container page today" aria-busy={loading}>
      {isAuthenticated && (
        <StatsStrip owned={data.stats.owned} wantToTry={data.stats.wantToTry} reviews={data.stats.reviews} profilePath={profilePath} loading={loading} />
      )}

      <div className="today__grid">
        <div className="today__main">
          <section className="today__section">
            <span className="eyebrow">✦ Your pick today</span>
            <HeroPickCard perfume={loading ? null : heroPerfume} tag={tag} why={why} />
            {!loading && !heroPerfume && (
              <p className="today__empty">Nothing to recommend yet. <Link to="/catalog">Browse the catalog</Link>.</p>
            )}
          </section>

          {data.trending.length > 0 && (
            <section className="today__section">
              <span className="eyebrow eyebrow--accent">Trending this week</span>
              <PerfumeCarousel items={data.trending} />
            </section>
          )}
        </div>

        <aside className="today__side">
          <section className="today__section">
            <span className="eyebrow eyebrow--accent">{personalized ? 'From people you follow' : 'Community'}</span>
            <div className="today__feed glass">
              {activity.map((r) => <ActivityRow key={r.id} review={r} />)}
              {!activityLoading && activity.length === 0 && <p className="today__empty">No activity yet.</p>}
            </div>
            <Link to="/community" className="today__more">All activity →</Link>
          </section>

          <section className="today__section">
            <span className="eyebrow eyebrow--accent">Reviews worth reading</span>
            {data.reviews.map((r) => <ReviewTeaser key={r.id} review={r} />)}
            {!loading && data.reviews.length === 0 && <p className="today__empty">No written reviews yet.</p>}
            <Link to="/community" className="today__more">All reviews →</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
