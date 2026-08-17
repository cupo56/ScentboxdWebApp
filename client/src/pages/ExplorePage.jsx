import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List as ListIcon, SquaresFour } from '@phosphor-icons/react';
import { getPerfumes, getConcentrations, getNoteFamilies } from '../services/perfumeService';
import { toast } from '../store/toastStore';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import PerfumeRow from '../components/perfume/PerfumeRow';
import FilterPanel from '../components/perfume/FilterPanel';
import FilterSheet from '../components/perfume/FilterSheet';
import './ExplorePage.css';

const PAGE_SIZE = 24;

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [perfumes, setPerfumes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [concentrations, setConcentrations] = useState([]);
  const [noteFamilies, setNoteFamilies] = useState([]);
  const [view, setView] = useState(() => localStorage.getItem('scentboxd:exploreView') || 'rows');
  const [sheetOpen, setSheetOpen] = useState(false);

  const search = searchParams.get('q') || '';
  const concentration = searchParams.get('concentration') || '';
  const noteFamily = searchParams.get('family') || '';
  const minLongevity = Number(searchParams.get('longevity') || 0);
  const sortBy = searchParams.get('sort') || 'performance';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    Promise.all([getConcentrations(), getNoteFamilies()])
      .then(([c, nf]) => { setConcentrations(c); setNoteFamilies(nf); })
      .catch((err) => toast.error('Failed to load filters: ' + err.message));
  }, []);

  const loadPerfumes = useCallback(async (targetPage, append) => {
    (append ? setLoadingMore : setLoading)(true);
    try {
      const result = await getPerfumes({
        search, concentration, noteFamily, minLongevity, sortBy, page: targetPage, pageSize: PAGE_SIZE,
      });
      setPerfumes((prev) => (append ? [...prev, ...result.perfumes] : result.perfumes));
      setTotal(result.total);
    } catch (err) {
      toast.error('Failed to load perfumes: ' + err.message);
    }
    (append ? setLoadingMore : setLoading)(false);
  }, [search, concentration, noteFamily, minLongevity, sortBy]);

  useEffect(() => { loadPerfumes(1, false); }, [loadPerfumes]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    setSearchParams(params);
  };

  const resetAll = () => setSearchParams(new URLSearchParams());

  const loadMore = () => {
    const next = page + 1;
    setSearchParams((p) => { p.set('page', String(next)); return p; }, { replace: true });
    loadPerfumes(next, true);
  };

  const setView_ = (v) => {
    setView(v);
    localStorage.setItem('scentboxd:exploreView', v);
  };

  const activeFilterTags = [];
  if (concentration) activeFilterTags.push({ key: 'concentration', label: concentration });
  if (noteFamily) activeFilterTags.push({ key: 'family', label: noteFamily });
  if (minLongevity > 0) activeFilterTags.push({ key: 'longevity', label: `Longevity ${minLongevity}h+` });

  const filterProps = {
    sortBy, onSortChange: (v) => updateFilter('sort', v),
    concentrations, concentration, onConcentrationChange: (v) => updateFilter('concentration', v),
    noteFamilies, noteFamily, onNoteFamilyChange: (v) => updateFilter('family', v),
    minLongevity, onMinLongevityChange: (v) => updateFilter('longevity', v ? String(v) : ''),
    onReset: resetAll,
  };

  return (
    <div className="explore">
      <div className="explore__layout">
        <aside className="explore__sidebar">
          <FilterPanel {...filterProps} />
        </aside>

        <div className="explore__main">
          <div className="explore__toolbar">
            <div>
              <h1 className="explore__title">Index</h1>
              <div className="explore__meta">{total} entries{concentration ? ` · ${concentration}` : ''} · sorted by {sortBy}</div>
            </div>
            <div className="explore__right">
              <input
                className="input explore__search-input"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => updateFilter('q', e.target.value)}
              />
              <button type="button" className="explore__filter-btn" onClick={() => setSheetOpen(true)}>
                Filters {activeFilterTags.length}
              </button>
              <div className="explore__view-toggle">
                <button
                  type="button"
                  className={view === 'rows' ? 'active' : ''}
                  onClick={() => setView_('rows')}
                  aria-label="Row view"
                ><ListIcon size={14} /></button>
                <button
                  type="button"
                  className={view === 'grid' ? 'active' : ''}
                  onClick={() => setView_('grid')}
                  aria-label="Grid view"
                ><SquaresFour size={14} /></button>
              </div>
            </div>
          </div>

          {activeFilterTags.length > 0 && (
            <div className="explore__active-tags">
              {activeFilterTags.map((tag) => (
                <button key={tag.key} className="chip" aria-pressed="true" onClick={() => updateFilter(tag.key, '')}>
                  {tag.label} ✕
                </button>
              ))}
            </div>
          )}

          {view === 'grid' ? (
            <PerfumeGrid perfumes={perfumes} loading={loading} />
          ) : (
            <div className="explore__rows">
              <div className="explore__rows-head">
                <span></span><span>Fragrance</span><span>House</span><span>Accords</span><span>Rating</span>
              </div>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <div key={i} className="explore__row-skeleton skeleton" />)
              ) : perfumes.length === 0 ? (
                <div className="explore__empty">
                  <div className="explore__empty-title">Nothing matches these filters.</div>
                  <p>Try dropping one of the active filters.</p>
                  <button className="btn btn-primary" onClick={resetAll}>Reset all</button>
                </div>
              ) : (
                perfumes.map((p) => <PerfumeRow key={p.id} perfume={p} />)
              )}
            </div>
          )}

          {!loading && perfumes.length < total && (
            <div className="explore__load-more">
              <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load 24 more'}
              </button>
              <span>Showing {perfumes.length} of {total}</span>
            </div>
          )}
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={total} {...filterProps} />
    </div>
  );
}
