import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFollowers, getFollowing } from '../../services/followService';
import './FollowListModal.css';

export default function FollowListModal({ userId, initialTab = 'followers', onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetcher = tab === 'followers' ? getFollowers : getFollowing;
    fetcher(userId)
      .then(setProfiles)
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, [tab, userId]);

  return (
    <div className="follow-modal-overlay" onClick={onClose}>
      <div className="follow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="follow-modal__header">
          <div className="follow-modal__tabs">
            <button type="button" className={tab === 'followers' ? 'active' : ''} onClick={() => setTab('followers')}>Followers</button>
            <button type="button" className={tab === 'following' ? 'active' : ''} onClick={() => setTab('following')}>Following</button>
          </div>
          <button type="button" className="follow-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="follow-modal__body">
          {loading ? (
            <div className="follow-modal__loading">Loading…</div>
          ) : profiles.length > 0 ? (
            profiles.map((p) => (
              <Link key={p.id} to={`/profile/${p.username}`} className="follow-modal__row" onClick={onClose}>
                <span className="follow-modal__avatar">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" /> : (p.username || 'U')[0].toUpperCase()}
                </span>
                <span>{p.username}</span>
              </Link>
            ))
          ) : (
            <p className="follow-modal__empty">
              {tab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
