import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import { getPerfumes } from '../../services/perfumeService';
import './Navbar.css';

function Logo() {
  return (
    <Link to="/" className="navbar__logo">
      <svg width="20" height="20" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <path d="M13 1.5 L24.5 13 L13 24.5 L1.5 13 Z" stroke="#9184d9" strokeWidth="1.6" />
      </svg>
      <span className="navbar__logo-text">Scentboxd</span>
    </Link>
  );
}

export default function Navbar() {
  const { isAuthenticated, profile, logout, shelfPath } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    getPerfumes({ search: debouncedSearch, pageSize: 5 })
      .then((res) => setSearchResults(res.perfumes || []))
      .catch(() => {})
      .finally(() => setIsSearching(false));
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const tag = e.target.tagName;
        const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
        if (isEditable && e.target !== inputRef.current) return;
        e.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleSelectResult = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Logo />

        <div className="navbar__segment">
          <NavLink to="/" end className="navbar__segment-item">Feed</NavLink>
          <NavLink to="/explore" className="navbar__segment-item">Index</NavLink>
          <NavLink to="/brands" className="navbar__segment-item">Houses</NavLink>
          <NavLink to={shelfPath} className="navbar__segment-item">Shelf</NavLink>
        </div>

        <div className="navbar__right">
          <div className="navbar__search" ref={searchRef}>
            <button
              type="button"
              className="navbar__search-pill"
              onClick={() => { setSearchOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); }}
            >
              <MagnifyingGlass size={14} weight="regular" aria-hidden="true" />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>

            {searchOpen && (
              <div className="navbar__search-panel">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    className="input"
                    placeholder="Search fragrances…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                {searchQuery.trim() && (
                  <div className="navbar__search-results">
                    {isSearching ? (
                      <div className="navbar__search-item">Searching…</div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {searchResults.map((p) => (
                          <Link
                            key={p.id}
                            to={`/perfume/${p.id}`}
                            className="navbar__search-item"
                            onClick={handleSelectResult}
                          >
                            <span className="navbar__search-item-img">
                              {p.image_url ? <img src={p.image_url} alt="" /> : '◆'}
                            </span>
                            <span className="navbar__search-item-info">
                              <span className="navbar__search-item-name">{p.name}</span>
                              <span className="navbar__search-item-brand">{p.brands?.name}</span>
                            </span>
                          </Link>
                        ))}
                        <Link
                          to={`/explore?q=${encodeURIComponent(searchQuery)}`}
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
            )}
          </div>

          {isAuthenticated ? (
            <div className="navbar__user">
              <Link
                to={shelfPath}
                className="navbar__avatar"
                title={profile?.username || 'Profile'}
                aria-label={profile?.username || 'Profile'}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" />
                ) : (
                  (profile?.username || 'U')[0].toUpperCase()
                )}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">Sign in</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
