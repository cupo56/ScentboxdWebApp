import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import { getPerfumes } from '../../services/perfumeService';
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

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    getPerfumes({ search: debouncedSearch, limit: 5 })
      .then((res) => {
        setSearchResults(res.perfumes || []);
      })
      .catch(() => {})
      .finally(() => setIsSearching(false));
  }, [debouncedSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
      setMenuOpen(false);
    }
  };

  const handleSelectResult = () => {
    setSearchQuery('');
    setShowResults(false);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" onClick={() => setMenuOpen(false)}>
          <span className="navbar__logo-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#c4b5fd" />
                  <stop offset="0.5" stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#f5c842" />
                </linearGradient>
              </defs>
              <path
                className="navbar__logo-gem"
                d="M13 1.5 L24.5 13 L13 24.5 L1.5 13 Z"
                stroke="url(#logoGrad)"
                strokeWidth="1.6"
                fill="rgba(167,139,250,0.12)"
              />
              <path d="M13 1.5 L13 24.5 M1.5 13 L24.5 13" stroke="url(#logoGrad)" strokeWidth="0.8" opacity="0.5" />
            </svg>
          </span>
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
          <div className="navbar__search-container" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="navbar__search-form">
              <input
                type="text"
                placeholder="Search fragrances..."
                className="input navbar__search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
            </form>
            {showResults && searchQuery.trim() && (
              <div className="navbar__search-dropdown">
                {isSearching ? (
                  <div className="navbar__search-item">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((p) => (
                      <Link
                        key={p.id}
                        to={`/perfume/${p.id}`}
                        className="navbar__search-item"
                        onClick={handleSelectResult}
                      >
                        <div className="navbar__search-item-img">
                          {p.image_url ? <img src={p.image_url} alt="" /> : '◆'}
                        </div>
                        <div className="navbar__search-item-info">
                          <span className="navbar__search-item-name">{p.name}</span>
                          <span className="navbar__search-item-brand">{p.brands?.name}</span>
                        </div>
                      </Link>
                    ))}
                    <Link
                      to={`/explore?search=${encodeURIComponent(searchQuery)}`}
                      className="navbar__search-item navbar__search-item--all"
                      onClick={handleSelectResult}
                    >
                      See all results
                    </Link>
                  </>
                ) : (
                  <div className="navbar__search-item">No results found</div>
                )}
              </div>
            )}
          </div>

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
