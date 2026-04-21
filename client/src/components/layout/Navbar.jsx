import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <span className="navbar__logo-icon">◆</span>
          <span className="navbar__logo-text">Scentboxd</span>
        </Link>

        <button
          className={`navbar__burger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>

        <div className={`navbar__links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/explore" className="navbar__link" onClick={() => setMenuOpen(false)}>
            Explore
          </NavLink>
          <NavLink to="/brands" className="navbar__link" onClick={() => setMenuOpen(false)}>
            Brands
          </NavLink>

          {isAuthenticated ? (
            <div className="navbar__user">
              <NavLink
                to={`/profile/${profile?.username || 'me'}`}
                className="navbar__link navbar__profile-link"
                onClick={() => setMenuOpen(false)}
              >
                <span className="navbar__avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" />
                  ) : (
                    <span className="navbar__avatar-fallback">
                      {(profile?.username || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </span>
                <span>{profile?.username || 'Profile'}</span>
              </NavLink>
              <button className="navbar__logout btn btn-ghost btn-sm" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="navbar__link navbar__link--cta"
              onClick={() => setMenuOpen(false)}
            >
              Sign In
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
