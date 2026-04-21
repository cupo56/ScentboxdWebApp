import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPerfumes, getConcentrations, getNoteFamilies } from '../services/perfumeService';
import { getBrands } from '../services/brandService';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import './ExplorePage.css';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [perfumes, setPerfumes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [concentrations, setConcentrations] = useState([]);
  const [noteFamilies, setNoteFamilies] = useState([]);

  // Read filters from URL
  const search = searchParams.get('q') || '';
  const brand = searchParams.get('brand') || '';
  const concentration = searchParams.get('concentration') || '';
  const noteFamily = searchParams.get('family') || '';
  const sortBy = searchParams.get('sort') || 'name';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 24;

  // Load filter options on mount
  useEffect(() => {
    Promise.all([getBrands(), getConcentrations(), getNoteFamilies()])
      .then(([b, c, nf]) => {
        setBrands(b);
        setConcentrations(c);
        setNoteFamilies(nf);
      })
      .catch(console.error);
  }, []);

  // Load perfumes when filters change
  const loadPerfumes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPerfumes({
        search, brand, concentration, noteFamily, sortBy, page, pageSize,
      });
      setPerfumes(result.perfumes);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to load perfumes:', err);
    }
    setLoading(false);
  }, [search, brand, concentration, noteFamily, sortBy, page]);

  useEffect(() => {
    loadPerfumes();
  }, [loadPerfumes]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // reset to page 1
    setSearchParams(params);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="explore page">
      <div className="container">
        <header className="explore__header">
          <h1 className="explore__title">Explore Fragrances</h1>
          <p className="explore__subtitle">{total} fragrances to discover</p>
        </header>

        {/* Search + Filters */}
        <div className="explore__controls">
          <div className="explore__search">
            <span className="explore__search-icon">🔍</span>
            <input
              className="input"
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => updateFilter('q', e.target.value)}
              id="perfume-search"
            />
          </div>

          <div className="explore__filters">
            <select
              className="input"
              value={brand}
              onChange={(e) => updateFilter('brand', e.target.value)}
              id="filter-brand"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              className="input"
              value={concentration}
              onChange={(e) => updateFilter('concentration', e.target.value)}
              id="filter-concentration"
            >
              <option value="">All Concentrations</option>
              {concentrations.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="input"
              value={noteFamily}
              onChange={(e) => updateFilter('family', e.target.value)}
              id="filter-family"
            >
              <option value="">All Note Families</option>
              {noteFamilies.map((nf) => (
                <option key={nf} value={nf}>{nf}</option>
              ))}
            </select>

            <select
              className="input"
              value={sortBy}
              onChange={(e) => updateFilter('sort', e.target.value)}
              id="filter-sort"
            >
              <option value="name">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="performance">Best Performance</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <PerfumeGrid perfumes={perfumes} loading={loading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="explore__pagination">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => updateFilter('page', String(page - 1)) || setSearchParams((p) => { p.set('page', String(page - 1)); return p; })}
            >
              ← Previous
            </button>
            <span className="explore__page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setSearchParams((p) => { p.set('page', String(page + 1)); return p; })}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
