import { NavLink } from 'react-router-dom';
import { Compass, Plus, Rows, SquaresFour } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import './TabBar.css';

export default function TabBar() {
  const { shelfPath, profile } = useAuth();

  return (
    <nav className="tabbar" aria-label="Main navigation">
      <NavLink to="/" end className="tabbar__item">
        <Rows size={18} aria-hidden="true" />
        <span>Feed</span>
      </NavLink>
      <NavLink to="/explore" className="tabbar__item">
        <Compass size={18} aria-hidden="true" />
        <span>Index</span>
      </NavLink>
      <NavLink to="/explore" className="tabbar__compose" aria-label="Write a verdict">
        <Plus size={20} weight="bold" aria-hidden="true" />
      </NavLink>
      <NavLink to={shelfPath} className="tabbar__item">
        <SquaresFour size={18} aria-hidden="true" />
        <span>Shelf</span>
      </NavLink>
      <NavLink to="/account" className="tabbar__item tabbar__item--you">
        <span className="tabbar__you-avatar">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile?.username || 'U')[0].toUpperCase()}
        </span>
        <span>You</span>
      </NavLink>
    </nav>
  );
}
