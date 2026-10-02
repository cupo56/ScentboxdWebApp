import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import { getPerfumes } from '../../services/perfumeService';
import AccountMenu from './AccountMenu';
import Wordmark from './Wordmark';
import './Navbar.css';

const LINKS = [
  { to: '/', label: 'Today', end: true },
  { to: '/catalog', label: 'Catalog' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/collection', label: 'Collection' },
  { to: '/community', label: 'Community' },
];

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Leiste wird nach dem ersten Scrollen dunkler, wie auf der Waitlist.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleSelectResult = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="Scentboxd home">
          <Wordmark className="navbar__logo-text" />
        </Link>

        <div className="navbar__links">
          {LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className="navbar__link">{label}</NavLink>
          ))}
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
                          to={`/catalog?q=${encodeURIComponent(searchQuery)}`}
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
            <AccountMenu />
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">Sign in</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
