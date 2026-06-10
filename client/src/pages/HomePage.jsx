import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPerfumes, getPerfumeCount } from '../services/perfumeService';
import { getBrands, getBrandCount } from '../services/brandService';
import { getReviewCount, getLatestReviews } from '../services/reviewService';
import { toast } from '../store/toastStore';
import PerfumeCard from '../components/perfume/PerfumeCard';
import ReviewCard from '../components/review/ReviewCard';
import useTilt from '../hooks/useTilt';
import useCountUp from '../hooks/useCountUp';
import './HomePage.css';

/** Decorative animated SVG scattered across the hero. */
function HeroDecor() {
  return (
    <div className="home__hero-decor" aria-hidden="true">
      {/* aurora blobs */}
      <span className="home__aurora home__aurora--1" />
      <span className="home__aurora home__aurora--2" />
      <span className="home__aurora home__aurora--3" />

      {/* floating molecule rings */}
      <svg className="float-deco home__deco home__deco--1" width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="46" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="6 8" />
        <circle cx="60" cy="14" r="6" fill="#a78bfa" />
        <circle cx="106" cy="60" r="4" fill="#f5c842" />
        <circle cx="60" cy="60" r="10" stroke="#c4b5fd" strokeWidth="1.5" />
      </svg>
      <svg className="float-deco home__deco home__deco--2" width="90" height="90" viewBox="0 0 90 90" fill="none">
        <polygon points="45,6 84,67 6,67" stroke="#f5c842" strokeWidth="1.5" fill="none" />
        <circle cx="45" cy="45" r="5" fill="#f5c842" />
      </svg>
      <svg className="float-deco home__deco home__deco--3" width="70" height="70" viewBox="0 0 70 70" fill="none">
        <path d="M35 4 L66 35 L35 66 L4 35 Z" stroke="#a78bfa" strokeWidth="1.5" fill="none" />
      </svg>
      <svg className="float-deco home__deco home__deco--4" width="140" height="140" viewBox="0 0 140 140" fill="none">
        <circle cx="70" cy="70" r="60" stroke="#7c5cff" strokeWidth="1" strokeDasharray="2 10" />
      </svg>
    </div>
  );
}

/** A single animated stat with count-up. */
function Stat({ value, label }) {
  const n = useCountUp(value);
  return (
    <div className="home__stat">
      <span className="home__stat-number">{n.toLocaleString()}</span>
      <span className="home__stat-label">{label}</span>
    </div>
  );
}

/** Brand card with interactive 3D tilt. */
function BrandCard({ brand }) {
  const tiltRef = useTilt(10);
  return (
    <Link
      to={`/brand/${brand.id}`}
      className="home__brand-card card tilt-3d"
      ref={tiltRef}
    >
      <span className="home__brand-initial tilt-layer">{brand.name[0]}</span>
      <span className="home__brand-name">{brand.name}</span>
      {brand.country && <span className="home__brand-country">{brand.country}</span>}
    </Link>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [brands, setBrands] = useState([]);
  const [latestReviews, setLatestReviews] = useState([]);
  const [stats, setStats] = useState({ perfumes: 0, brands: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getPerfumes({ sortBy: 'newest', pageSize: 8 }),
      getBrands(),
      getLatestReviews(3),
      getPerfumeCount(),
      getBrandCount(),
      getReviewCount(),
    ])
      .then(([perfumeResult, brandList, reviews, pCount, bCount, rCount]) => {
        if (perfumeResult.status === 'fulfilled') setFeatured(perfumeResult.value.perfumes);
        if (brandList.status === 'fulfilled') setBrands(brandList.value.slice(0, 12));
        if (reviews.status === 'fulfilled') setLatestReviews(reviews.value);
        
        setStats({
          perfumes: pCount.status === 'fulfilled' ? pCount.value : 0,
          brands: bCount.status === 'fulfilled' ? bCount.value : 0,
          reviews: rCount.status === 'fulfilled' ? rCount.value : 0,
        });
      })
      .catch((err) => toast.error('Failed to load homepage data: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/explore?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="home__hero">
        <div className="home__hero-bg" />
        <HeroDecor />
        <div className="container home__hero-content reveal">
          <h1 className="home__hero-title">
            Discover the world
            <br />
            of <span className="home__hero-accent gradient-text">fragrances</span>
          </h1>
          <p className="home__hero-subtitle">
            Explore {stats.perfumes}+ perfumes, read reviews, and build your collection.
          </p>
          <form className="home__hero-search glass" onSubmit={handleSearch}>
            <input
              className="input"
              placeholder="Search for a fragrance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="hero-search"
            />
            <button className="btn btn-primary" type="submit">Search</button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section className="home__stats">
        <div className="container">
          <div className="home__stats-grid">
            <Stat value={stats.perfumes} label="Fragrances" />
            <Stat value={stats.brands} label="Brands" />
            <Stat value={stats.reviews} label="Reviews" />
          </div>
        </div>
      </section>

      {/* Recently Added */}
      <section className="home__section">
        <div className="container">
          <div className="home__section-header">
            <h2 className="section-title">
              <span className="icon">✨</span>
              Recently Added
            </h2>
            <Link to="/explore?sort=newest" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {loading ? (
            <div className="spinner-container"><div className="spinner spinner-md" /></div>
          ) : (
            <div className="perfume-grid">
              {featured.map((p) => (
                <PerfumeCard key={p.id} perfume={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brands */}
      <section className="home__section">
        <div className="container">
          <div className="home__section-header">
            <h2 className="section-title">
              <span className="icon">🏛️</span>
              Popular Brands
            </h2>
            <Link to="/brands" className="btn btn-ghost btn-sm">All Brands →</Link>
          </div>
          <div className="home__brands-grid">
            {brands.map((b) => (
              <BrandCard key={b.id} brand={b} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reviews */}
      {latestReviews.length > 0 && (
        <section className="home__section">
          <div className="container">
            <h2 className="section-title">
              <span className="icon">💬</span>
              Latest Reviews
            </h2>
            <div className="home__reviews-list">
              {latestReviews.map((r) => (
                <div key={r.id} className="home__review-wrap">
                  {r.perfumes && (
                    <Link to={`/perfume/${r.perfumes.id}`} className="home__review-perfume">
                      on <strong>{r.perfumes.name}</strong> by {r.perfumes.brands?.name}
                    </Link>
                  )}
                  <ReviewCard review={r} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="home__cta">
        <div className="container">
          <div className="home__cta-card glass">
            <svg className="float-deco home__cta-deco" width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
              <circle cx="80" cy="80" r="70" stroke="#a78bfa" strokeWidth="1" strokeDasharray="4 10" />
              <circle cx="80" cy="80" r="48" stroke="#f5c842" strokeWidth="1" strokeDasharray="2 12" />
            </svg>
            <h2>Start your fragrance journey</h2>
            <p>Create an account to rate, review, and build your personal collection.</p>
            <div className="home__cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">Create Account</Link>
              <Link to="/explore" className="btn btn-secondary btn-lg">Browse Fragrances</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
