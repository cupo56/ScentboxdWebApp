import { NavLink } from 'react-router-dom';
import { Compass, House, Plus, Rows, SquaresFour } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import './TabBar.css';

export default function TabBar() {
  const { isAuthenticated, profile } = useAuth();
  const shelfPath = isAuthenticated ? `/profile/${profile?.username || 'me'}` : '/login';

  return (
    <nav className="tabbar" aria-label="Main navigation">
      <NavLink to="/" end className="tabbar__item">
        <Rows size={18} />
        <span>Feed</span>
      </NavLink>
      <NavLink to="/explore" className="tabbar__item">
        <Compass size={18} />
        <span>Index</span>
      </NavLink>
      <NavLink to="/explore" className="tabbar__compose" aria-label="Write a verdict">
        <Plus size={20} weight="bold" />
      </NavLink>
      <NavLink to="/brands" className="tabbar__item">
        <House size={18} />
        <span>Houses</span>
      </NavLink>
      <NavLink to={shelfPath} className="tabbar__item">
        <SquaresFour size={18} />
        <span>Shelf</span>
      </NavLink>
    </nav>
  );
}
