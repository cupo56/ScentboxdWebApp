import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBrands } from '../services/brandService';
import './BrandsOverviewPage.css';

export default function BrandsOverviewPage() {
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBrands()
      .then(setBrands)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by first letter
  const grouped = filtered.reduce((acc, brand) => {
    const letter = brand.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(brand);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="brands-page page">
      <div className="container">
        <header className="brands-page__header">
          <h1 className="brands-page__title">Brands</h1>
          <p className="brands-page__subtitle">{brands.length} fragrance houses</p>
        </header>

        <div className="brands-page__search">
          <input
            className="input"
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="brand-search"
          />
        </div>

        {/* Letter navigation */}
        <div className="brands-page__letters">
          {letters.map((letter) => (
            <a key={letter} href={`#letter-${letter}`} className="brands-page__letter">
              {letter}
            </a>
          ))}
        </div>

        {/* Brand list */}
        <div className="brands-page__list">
          {letters.map((letter) => (
            <div key={letter} className="brands-page__group" id={`letter-${letter}`}>
              <h2 className="brands-page__group-letter">{letter}</h2>
              <div className="brands-page__group-items">
                {grouped[letter].map((brand) => (
                  <Link
                    key={brand.id}
                    to={`/brand/${brand.id}`}
                    className="brands-page__item card"
                  >
                    <span className="brands-page__item-name">{brand.name}</span>
                    {brand.country && (
                      <span className="brands-page__item-country">{brand.country}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No brands found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
