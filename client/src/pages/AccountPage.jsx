import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getUserLists } from '../services/listService';
import { getReviewCountByUser } from '../services/reviewService';
import { updateProfile } from '../services/profileService';
import { toast } from '../store/toastStore';
import './AccountPage.css';

export default function AccountPage() {
  const { user, profile, logout, shelfPath, setProfile } = useAuth();
  const [counts, setCounts] = useState({ owned: 0, want: 0, lists: 0, verdicts: 0 });
  const [togglingPublic, setTogglingPublic] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserPerfumesByStatus(user.id, 'is_owned'),
      getUserPerfumesByStatus(user.id, 'is_want_to_try'),
      getUserLists(user.id),
      getReviewCountByUser(user.id),
    ]).then(([owned, want, lists, verdicts]) => {
      setCounts({ owned: owned.length, want: want.length, lists: (lists || []).length, verdicts });
    }).catch(() => {});
  }, [user]);

  if (!profile) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;

  const handleTogglePublic = async () => {
    setTogglingPublic(true);
    try {
      const updated = await updateProfile({ is_public: !profile.is_public });
      setProfile(updated);
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setTogglingPublic(false);
    }
  };

  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="account-page">
      <div className="account-page__head">
        <span className="account-page__avatar">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile.username || 'U')[0].toUpperCase()}
        </span>
        <div className="account-page__head-info">
          <div className="account-page__handle">{profile.username}</div>
          {joined && <div className="account-page__joined">Joined {joined}</div>}
        </div>
        <Link to="/settings" className="btn btn-secondary btn-sm">Edit</Link>
      </div>

      <div className="account-page__stats">
        <div><span>{counts.owned}</span><label>Owned</label></div>
        <div><span>{counts.want}</span><label>Wishlist</label></div>
        <div><span>{counts.verdicts}</span><label>Verdicts</label></div>
      </div>

      <div className="account-page__list">
        <Link to={shelfPath} className="account-page__row">Your shelf <span>{counts.owned} ›</span></Link>
        <Link to={shelfPath} className="account-page__row">Your lists <span>{counts.lists} ›</span></Link>
        <Link to={shelfPath} className="account-page__row">Your verdicts <span>{counts.verdicts} ›</span></Link>
        <Link to={shelfPath} className="account-page__row">Want to try <span>{counts.want} ›</span></Link>
      </div>

      <div className="account-page__list">
        <div className="account-page__section-label">Account</div>
        <Link to="/settings" className="account-page__row">Settings <span>›</span></Link>
        <button type="button" className="account-page__row account-page__row--toggle" onClick={handleTogglePublic} disabled={togglingPublic}>
          Public shelf <span>{profile.is_public ? 'On' : 'Off'}</span>
        </button>
        <button type="button" className="account-page__row account-page__row--muted" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
