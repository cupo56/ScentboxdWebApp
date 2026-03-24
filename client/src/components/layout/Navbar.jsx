import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import useCartStore from '../../store/cartStore';
import Badge from '../ui/Badge';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">✦</span>
          PARFUM
        </Link>

        <button
          className={`navbar__burger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menü"
        >
          <span /><span /><span />
        </button>

        <div className={`navbar__links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" className="navbar__link" onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/shop" className="navbar__link" onClick={() => setMenuOpen(false)}>
            Shop
          </NavLink>
          <NavLink to="/cart" className="navbar__link navbar__cart-link" onClick={() => setMenuOpen(false)}>
            🛒
            {getTotalItems() > 0 && (
              <Badge variant="cart">{getTotalItems()}</Badge>
            )}
          </NavLink>

          {isAuthenticated ? (
            <div className="navbar__user">
              {user?.role === 'admin' && (
                <NavLink to="/admin" className="navbar__link" onClick={() => setMenuOpen(false)}>
                  Admin
                </NavLink>
              )}
              <span className="navbar__user-name">{user?.name}</span>
              <button className="navbar__logout" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="navbar__link navbar__link--cta" onClick={() => setMenuOpen(false)}>
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
