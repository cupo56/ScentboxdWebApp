import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserPerfumesByStatus } from '../../services/userPerfumeService';
import { getUserLists } from '../../services/listService';
import { getReviewCountByUser } from '../../services/reviewService';
import { getFollowCounts } from '../../services/followService';
import './AccountMenu.css';

export default function AccountMenu() {
  const { profile, user, logout, shelfPath } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ owned: 0, lists: 0, verdicts: 0, want: 0, followers: 0, following: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open || !user) return;
    Promise.all([
      getUserPerfumesByStatus(user.id, 'is_owned'),
      getUserPerfumesByStatus(user.id, 'is_want_to_try'),
      getUserLists(user.id),
      getReviewCountByUser(user.id),
      getFollowCounts(user.id),
    ]).then(([owned, want, lists, verdicts, follows]) => {
      setCounts({ owned: owned.length, want: want.length, lists: (lists || []).length, verdicts, followers: follows.followers, following: follows.following });
    }).catch(() => {});
  }, [open, user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className={`account-menu__trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" />
        ) : (
          (profile?.username || 'U')[0].toUpperCase()
        )}
      </button>

      {open && (
        <div className="account-menu__panel">
          <div className="account-menu__head">
            <span className="account-menu__head-avatar">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile?.username || 'U')[0].toUpperCase()}
            </span>
            <div>
              <div className="account-menu__handle">{profile?.username}</div>
              <div className="account-menu__meta">{counts.owned} owned · {counts.verdicts} verdicts</div>
              <div className="account-menu__meta">{counts.followers} followers · {counts.following} following</div>
            </div>
          </div>

          <div className="account-menu__group">
            <NavLink to={shelfPath} className="account-menu__item" onClick={() => setOpen(false)}>
              Your shelf
            </NavLink>
            <NavLink to={shelfPath} className="account-menu__item" onClick={() => setOpen(false)}>
              Your lists <span>{counts.lists}</span>
            </NavLink>
            <NavLink to={shelfPath} className="account-menu__item" onClick={() => setOpen(false)}>
              Your verdicts <span>{counts.verdicts}</span>
            </NavLink>
            <NavLink to={`${shelfPath}?tab=want_to_try`} className="account-menu__item" onClick={() => setOpen(false)}>
              Want to try <span>{counts.want}</span>
            </NavLink>
          </div>

          <div className="account-menu__group">
            <NavLink to="/settings" className="account-menu__item" onClick={() => setOpen(false)}>
              Settings
            </NavLink>
            <span className="account-menu__item account-menu__item--static">
              Appearance <span>Dark</span>
            </span>
          </div>

          <div className="account-menu__group">
            <button type="button" className="account-menu__item account-menu__item--danger" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
