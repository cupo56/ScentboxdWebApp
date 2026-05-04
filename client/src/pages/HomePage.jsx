import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPerfumes, getPerfumeCount, getPerfumeRatings } from '../services/perfumeService';
import { getBrands, getBrandCount } from '../services/brandService';
import { getReviewCount, getLatestReviews } from '../services/reviewService';
import PerfumeCard from '../components/perfume/PerfumeCard';
import ReviewCard from '../components/review/ReviewCard';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [brands, setBrands] = useState([]);
  const [latestReviews, setLatestReviews] = useState([]);
  const [stats, setStats] = useState({ perfumes: 0, brands: 0, reviews: 0 });
  const [ratingsMap, setRatingsMap] = useState(new Map());
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
        if (perfumeResult.status === 'fulfilled') {
          const perfumes = perfumeResult.value.perfumes;
          setFeatured(perfumes);
          // Batch-fetch ratings for featured perfumes
          const ids = perfumes.map((p) => p.id);
          getPerfumeRatings(ids)
            .then(setRatingsMap)
            .catch(console.error);
        }
        if (brandList.status === 'fulfilled') setBrands(brandList.value.slice(0, 12));
        if (reviews.status === 'fulfilled') setLatestReviews(reviews.value);
        
        setStats({
          perfumes: pCount.status === 'fulfilled' ? pCount.value : 0,
          brands: bCount.status === 'fulfilled' ? bCount.value : 0,
          reviews: rCount.status === 'fulfilled' ? rCount.value : 0,
        });
      })
      .catch(console.error)
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
        <div className="container home__hero-content">
          <h1 className="home__hero-title">
            Discover the world
            <br />
            of <span className="home__hero-accent">fragrances</span>
          </h1>
          <p className="home__hero-subtitle">
            Explore {stats.perfumes}+ perfumes, read reviews, and build your collection.
          </p>
          <form className="home__hero-search" onSubmit={handleSearch}>
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
            <div className="home__stat">
              <span className="home__stat-number">{stats.perfumes}</span>
              <span className="home__stat-label">Fragrances</span>
            </div>
            <div className="home__stat">
              <span className="home__stat-number">{stats.brands}</span>
              <span className="home__stat-label">Brands</span>
            </div>
            <div className="home__stat">
              <span className="home__stat-number">{stats.reviews}</span>
              <span className="home__stat-label">Reviews</span>
            </div>
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
              {featured.map((p) => {
                const rating = ratingsMap.get(p.id);
                return (
                  <PerfumeCard
                    key={p.id}
                    perfume={p}
                    avgRating={rating?.avg_rating}
                    reviewCount={rating?.review_count}
                  />
                );
              })}
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
              <Link key={b.id} to={`/brand/${b.id}`} className="home__brand-card card">
                <span className="home__brand-initial">{b.name[0]}</span>
                <span className="home__brand-name">{b.name}</span>
                {b.country && <span className="home__brand-country">{b.country}</span>}
              </Link>
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
          <div className="home__cta-card">
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
