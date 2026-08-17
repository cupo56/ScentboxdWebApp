import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBrands } from '../services/brandService';
import { toast } from '../store/toastStore';
import './BrandsOverviewPage.css';

export default function BrandsOverviewPage() {
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBrands()
      .then(setBrands)
      .catch((err) => toast.error('Failed to load brands: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  const letters = [...new Set(filtered.map((b) => b.name[0].toUpperCase()))].sort();

  if (loading) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;

  return (
    <div className="houses">
      <h1 className="houses__title">Houses</h1>
      <div className="houses__meta">{brands.length} houses · {brands.reduce((s, b) => s + b.perfume_count, 0)} entries</div>

      <input className="input houses__search" placeholder="Search houses…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="houses__letters">
        {letters.map((l) => <a key={l} href={`#letter-${l}`}>{l}</a>)}
      </div>

      {letters.map((letter) => (
        <div key={letter} id={`letter-${letter}`}>
          {filtered.filter((b) => b.name[0].toUpperCase() === letter).map((brand) => (
            <Link key={brand.id} to={`/brand/${brand.id}`} className="houses__row">
              <span className="houses__row-name">{brand.name}</span>
              <span className="houses__row-country">{brand.country}</span>
              <span className="houses__row-count">{brand.perfume_count} entries</span>
            </Link>
          ))}
        </div>
      ))}

      {filtered.length === 0 && <div className="empty-state"><h3>No houses found</h3></div>}
    </div>
  );
}
