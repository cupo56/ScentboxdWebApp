import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { List as ListIcon, MagnifyingGlass, SlidersHorizontal, SquaresFour } from '@phosphor-icons/react';
import { getPerfumes, getConcentrations, getNoteFamilies, getLongevityLevels, getTrendingPerfumes } from '../services/perfumeService';
import { longevityLabel, SORT_OPTIONS } from '../lib/catalog';
import { toast } from '../store/toastStore';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import PerfumeRow from '../components/perfume/PerfumeRow';
import FilterPanel from '../components/perfume/FilterPanel';
import FilterSheet from '../components/perfume/FilterSheet';
import PerfumeCarousel from '../components/perfume/PerfumeCarousel';
import SkeletonRow from '../components/layout/SkeletonRow';
import './CatalogPage.css';

const PAGE_SIZE = 24;
const VIEW_KEY = 'scentboxd:catalogView';
const TRENDING_KEY = 'scentboxd:catalogTrending';

const readStorage = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const writeStorage = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* privater Modus o. ä. */ }
};

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState({ key: undefined, perfumes: [], total: 0, page: 1 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [concentrations, setConcentrations] = useState([]);
  const [noteFamilies, setNoteFamilies] = useState([]);
  const [longevityLevels, setLongevityLevels] = useState([]);
  const [trending, setTrending] = useState([]);
  const [view, setView] = useState(() => readStorage(VIEW_KEY, 'grid'));
  const [trendingHidden, setTrendingHidden] = useState(() => readStorage(TRENDING_KEY, 'shown') === 'hidden');
  const [sheetOpen, setSheetOpen] = useState(false);
  const requestId = useRef(0);

  const search = searchParams.get('q') || '';
  const concentration = searchParams.get('concentration') || '';
  const noteFamily = searchParams.get('family') || '';
  const longevity = searchParams.get('longevity') || '';
  const sortBy = searchParams.get('sort') || 'performance';

  useEffect(() => {
    Promise.all([getConcentrations(), getNoteFamilies(), getLongevityLevels()])
      .then(([c, nf, ll]) => { setConcentrations(c); setNoteFamilies(nf); setLongevityLevels(ll); })
      .catch((err) => toast.error('Failed to load filters: ' + err.message));
    getTrendingPerfumes().then(setTrending).catch(() => {});
  }, []);

  const filterKey = [search, concentration, noteFamily, longevity, sortBy].join('|');
  const loading = result.key !== filterKey;
  const { perfumes, total } = result;

  useEffect(() => {
    let active = true;
    const id = ++requestId.current;
    getPerfumes({ search, concentration, noteFamily, longevity, sortBy, page: 1, pageSize: PAGE_SIZE })
      .then((r) => { if (active && id === requestId.current) setResult({ key: filterKey, perfumes: r.perfumes, total: r.total, page: 1 }); })
      .catch((err) => { if (active && id === requestId.current) { toast.error('Failed to load perfumes: ' + err.message); setResult({ key: filterKey, perfumes: [], total: 0, page: 1 }); } });
    return () => { active = false; };
  }, [filterKey, search, concentration, noteFamily, longevity, sortBy]);

  const loadMore = async () => {
    const id = ++requestId.current;
    setLoadingMore(true);
    try {
      const next = await getPerfumes({ search, concentration, noteFamily, longevity, sortBy, page: result.page + 1, pageSize: PAGE_SIZE });
      if (id !== requestId.current) return;
      setResult((r) => ({ ...r, perfumes: [...r.perfumes, ...next.perfumes], total: next.total, page: r.page + 1 }));
    } catch (err) {
      if (id === requestId.current) toast.error('Failed to load perfumes: ' + err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    setSearchParams(params, { replace: key === 'q' });
  };
  const resetAll = () => setSearchParams(new URLSearchParams());

  const changeView = (v) => { setView(v); writeStorage(VIEW_KEY, v); };
  const toggleTrending = () => {
    const next = !trendingHidden;
    setTrendingHidden(next);
    writeStorage(TRENDING_KEY, next ? 'hidden' : 'shown');
  };

  const activeTags = [
    concentration && { key: 'concentration', label: concentration },
    noteFamily && { key: 'family', label: noteFamily },
    longevity && { key: 'longevity', label: longevityLabel(longevity) },
  ].filter(Boolean);

  const filterProps = {
    concentrations, concentration, onConcentrationChange: (v) => updateFilter('concentration', v),
    noteFamilies, noteFamily, onNoteFamilyChange: (v) => updateFilter('family', v),
    longevityLevels, longevity, onLongevityChange: (v) => updateFilter('longevity', v),
    onReset: resetAll,
  };

  return (
    <div className="container page catalog">
      <header className="catalog__head">
        <h1 className="catalog__title">Catalog</h1>
        <label className="catalog__search">
          <MagnifyingGlass size={16} aria-hidden="true" />
          <input
            type="search"
            className="input"
            placeholder="Search perfumes or brands…"
            aria-label="Search the catalog"
            value={search}
            onChange={(e) => updateFilter('q', e.target.value)}
          />
        </label>
      </header>

      <div className="catalog__layout">
        <aside className="catalog__sidebar" aria-label="Filters">
          <FilterPanel {...filterProps} />
        </aside>

        <div className="catalog__main">
          {trending.length > 0 && (
            <section className="catalog__trending">
              <div className="catalog__trending-head">
                <span className="eyebrow eyebrow--accent">Trending this week</span>
                <button type="button" className="catalog__trending-toggle" onClick={toggleTrending} aria-expanded={!trendingHidden}>
                  {trendingHidden ? 'Show trending' : 'Hide trending'}
                </button>
              </div>
              {!trendingHidden && <PerfumeCarousel items={trending} />}
            </section>
          )}

          <div className="catalog__toolbar">
            <div className="catalog__tags">
              <span className="catalog__count">{loading ? '…' : `${total} ${total === 1 ? 'fragrance' : 'fragrances'}`}</span>
              {activeTags.map((tag) => (
                <button key={tag.key} type="button" className="chip chip--active" onClick={() => updateFilter(tag.key, '')}>
                  {tag.label} ✕
                </button>
              ))}
            </div>
            <div className="catalog__controls">
              <button type="button" className="chip chip--active catalog__filter-btn" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal size={14} aria-hidden="true" /> Filter{activeTags.length ? ` · ${activeTags.length}` : ''}
              </button>
              <label className="catalog__sort">
                <span className="eyebrow">Sort</span>
                <select className="input" aria-label="Sort" value={sortBy} onChange={(e) => updateFilter('sort', e.target.value)}>
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <div className="catalog__view" role="group" aria-label="View">
                <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => changeView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'}>
                  <SquaresFour size={16} aria-hidden="true" />
                </button>
                <button type="button" className={view === 'rows' ? 'active' : ''} onClick={() => changeView('rows')} aria-label="Row view" aria-pressed={view === 'rows'}>
                  <ListIcon size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {view === 'grid' ? (
            loading || perfumes.length > 0 ? (
              <PerfumeGrid perfumes={perfumes} loading={loading} />
            ) : (
              <EmptyState onReset={resetAll} />
            )
          ) : (
            <div className="catalog__rows">
              {loading ? <SkeletonRow count={8} /> : perfumes.length === 0 ? <EmptyState onReset={resetAll} /> : perfumes.map((p) => <PerfumeRow key={p.id} perfume={p} />)}
            </div>
          )}

          {!loading && perfumes.length < total && (
            <div className="catalog__more">
              <button type="button" className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Load ${PAGE_SIZE} more`}
              </button>
              <span>Showing {perfumes.length} of {total}</span>
            </div>
          )}

          <p className="catalog__brands">
            Looking for a house? <Link to="/brands">Browse by brand →</Link>
          </p>
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={total} {...filterProps} />
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="catalog__empty glass">
      <h2 className="catalog__empty-title">Nothing matches these filters.</h2>
      <p>Try dropping one of the active filters.</p>
      <button type="button" className="btn btn-primary" onClick={onReset}>Reset all</button>
    </div>
  );
}
