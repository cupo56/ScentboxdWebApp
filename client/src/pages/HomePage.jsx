import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPerfumes } from '../services/perfumeService';
import { getLatestReviews, getReviewsByUserIds, getReviewCountByUser } from '../services/reviewService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getFollowingIds } from '../services/followService';
import { useAuth } from '../hooks/useAuth';
import './HomePage.css';

function ActivityRow({ review }) {
  const username = review.profiles?.username || 'Someone';
  return (
    <div className="feed__activity-row">
      <span className="feed__avatar">{username[0].toUpperCase()}</span>
      <div>
        <div className="feed__activity-text">
          <strong>{username}</strong> reviewed <strong className="feed__activity-item">{review.perfumes?.name}</strong>
        </div>
        <div className="feed__activity-time">{new Date(review.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [bottleOfDay, setBottleOfDay] = useState(null);
  const [activity, setActivity] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [verdicts, setVerdicts] = useState([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [wantCount, setWantCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [nudgePerfume, setNudgePerfume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const followingIds = isAuthenticated && user ? await getFollowingIds(user.id).catch(() => []) : [];

      const [bottleResult, topResult] = await Promise.allSettled([
        getPerfumes({ sortBy: 'performance', pageSize: 1 }),
        getLatestReviews(2),
      ]);
      if (bottleResult.status === 'fulfilled') setBottleOfDay(bottleResult.value.perfumes?.[0] || null);
      if (topResult.status === 'fulfilled') setVerdicts(topResult.value);

      // Prefer activity from people the user follows; fall back to the global
      // feed if they don't follow anyone yet, or nobody they follow has posted.
      let feedItems = followingIds.length > 0
        ? await getReviewsByUserIds(followingIds, 4).catch(() => [])
        : [];
      const usePersonalized = feedItems.length > 0;
      if (!usePersonalized) feedItems = await getLatestReviews(4).catch(() => []);

      setActivity(feedItems);
      setPersonalized(usePersonalized);
      setLoading(false);
    };
    load();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear shelf state on sign-out — otherwise stale values from the last
      // authenticated render (including the nudge banner) linger in this tab.
      setOwnedCount(0);
      setWantCount(0);
      setReviewCount(0);
      setNudgePerfume(null);
      return;
    }
    getUserPerfumesByStatus(user.id, 'is_owned')
      .then((rows) => {
        setOwnedCount(rows.length);
        if (rows.length > 0) {
          const nudgeCandidate = rows[Math.floor(Math.random() * rows.length)].perfumes;
          if (nudgeCandidate) setNudgePerfume(nudgeCandidate);
        }
      })
      .catch(() => {});
    getUserPerfumesByStatus(user.id, 'is_want_to_try').then((rows) => setWantCount(rows.length)).catch(() => {});
    getReviewCountByUser(user.id).then(setReviewCount).catch(() => {});
  }, [isAuthenticated, user]);

  return (
    <div className="feed">
      <div className="feed__columns">
        <div className="feed__col feed__col--shelf">
          <span className="feed__label">Your shelf</span>
          {isAuthenticated ? (
            <div className="feed__stats">
              <div className="feed__stat-row"><span>Owned</span><span>{ownedCount}</span></div>
              <div className="feed__hr" />
              <div className="feed__stat-row"><span>Want to try</span><span>{wantCount}</span></div>
              <div className="feed__hr" />
              <div className="feed__stat-row"><span>Verdicts written</span><span>{reviewCount}</span></div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-secondary">Sign in to track your shelf</Link>
          )}
        </div>

        <div className="feed__col feed__col--bottle">
          <span className="feed__label feed__label--accent">Bottle of the day</span>
          {loading || !bottleOfDay ? (
            <div className="feed__bottle-skeleton skeleton" />
          ) : (
            <div className="feed__bottle">
              <div className="bottle feed__bottle-img">
                {bottleOfDay.image_url ? <img src={bottleOfDay.image_url} alt="" /> : <span>◆</span>}
              </div>
              <div>
                <div className="feed__bottle-brand">{bottleOfDay.brands?.name}</div>
                <h2 className="feed__bottle-name">{bottleOfDay.name}</h2>
                {bottleOfDay.desc && <p className="feed__bottle-desc">{bottleOfDay.desc}</p>}
                <div className="feed__bottle-actions">
                  <Link to={`/perfume/${bottleOfDay.id}`} className="btn btn-primary">Full entry</Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="feed__col feed__col--activity">
          <span className="feed__label">{personalized ? 'From people you follow' : 'Right now'}</span>
          <div className="feed__activity">
            {activity.map((r) => <ActivityRow key={r.id} review={r} />)}
            {!loading && activity.length === 0 && <p className="feed__empty">No activity yet.</p>}
          </div>
        </div>
      </div>

      {nudgePerfume && (
        <div className="feed__section">
          <div>
            <div className="feed__section-title">You added {nudgePerfume.name} to your shelf.</div>
            <div className="feed__section-sub">Got a verdict for it yet?</div>
          </div>
          <Link to={`/perfume/${nudgePerfume.id}`} className="btn feed__section-btn">Write it</Link>
        </div>
      )}

      <div className="feed__verdicts">
        <div className="feed__verdicts-head">
          <h2>Verdicts worth reading</h2>
          <Link to="/explore">All verdicts →</Link>
        </div>
        <div className="feed__verdicts-grid">
          {verdicts.map((v) => (
            <div key={v.id} className="feed__verdict-card">
              <div className="feed__verdict-head">
                <span className="feed__avatar">{(v.profiles?.username || 'U')[0].toUpperCase()}</span>
                <div>
                  <div className="feed__verdict-user">{v.profiles?.username || 'Anonymous'}</div>
                  <div className="feed__verdict-on">on {v.perfumes?.name}</div>
                </div>
                <span className="feed__verdict-score">{v.rating?.toFixed?.(1) ?? v.rating}</span>
              </div>
              <p className="feed__verdict-text">{v.text}</p>
            </div>
          ))}
          {!loading && verdicts.length === 0 && <p className="feed__empty">No verdicts yet.</p>}
        </div>
      </div>
    </div>
  );
}
