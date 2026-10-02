import { NavLink } from 'react-router-dom';
import { Book, Heart, Star, SunHorizon, Users } from '@phosphor-icons/react';
import './TabBar.css';

// Mobile Tab-Leiste mit denselben fünf Tabs wie die iOS-App.
const TABS = [
  { to: '/', label: 'Today', Icon: SunHorizon, end: true },
  { to: '/catalog', label: 'Catalog', Icon: Book },
  { to: '/favorites', label: 'Favorites', Icon: Heart },
  { to: '/collection', label: 'Collection', Icon: Star },
  { to: '/community', label: 'Community', Icon: Users },
];

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main navigation">
      {TABS.map((tab) => {
        const { to, label, Icon, end } = tab;
        return (
          <NavLink key={to} to={to} end={end} className="tabbar__item">
            {({ isActive }) => (
              <>
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
