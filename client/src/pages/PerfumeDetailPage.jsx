import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPerfumeById, getSimilarPerfumes } from '../services/perfumeService';
import { getReviewsByPerfume, toggleReviewLike, deleteReview } from '../services/reviewService';
import FragrancePyramid from '../components/perfume/FragrancePyramid';
import PerformanceBar from '../components/perfume/PerformanceBar';
import UserPerfumeActions from '../components/perfume/UserPerfumeActions';
import AddToListButton from '../components/perfume/AddToListButton';
import ReviewCard from '../components/review/ReviewCard';
import ReviewForm from '../components/review/ReviewForm';
import PerfumeCard from '../components/perfume/PerfumeCard';
import { useAuth } from '../hooks/useAuth';
import './PerfumeDetailPage.css';

const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect fill="#16161f" width="600" height="800"/>
    <text x="300" y="400" fill="#55556a" font-family="sans-serif" font-size="60" text-anchor="middle" dominant-baseline="middle">◆</text>
  </svg>
`);

export default function PerfumeDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [perfume, setPerfume] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getPerfumeById(id)
      .then((data) => {
        setPerfume(data);
        // Load reviews + similar
        getReviewsByPerfume(id).then(setReviews).catch(() => {});
        if (data.brand_id) {
          getSimilarPerfumes(data.brand_id, id).then(setSimilar).catch(() => {});
        }
      })
      .catch((err) => setError(err.message || 'Failed to load perfume'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert('Failed to delete review: ' + err.message);
    }
  };

  const handleUpdateReview = (updatedReview) => {
    setReviews((prev) => prev.map((r) => (r.id === updatedReview.id ? updatedReview : r)));
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="page container">
        <div className="empty-state">
          <div className="icon">😔</div>
          <h3>Fragrance not found</h3>
          <p>{error}</p>
          <Link to="/explore" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const imgSrc = perfume.image_url || PLACEHOLDER_IMG;
  const brandName = perfume.brands?.name || 'Unknown';

  // Calc average rating from reviews
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="detail page">
      <div className="container">
        <div className="detail__layout">
          {/* Left: Image */}
          <div className="detail__image-section">
            <div className="detail__image-wrap">
              <img
                src={imgSrc}
                alt={perfume.name}
                className="detail__image"
                onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
              />
            </div>
          </div>

          {/* Right: Info */}
          <div className="detail__info">
            <Link to={`/brand/${perfume.brands?.id}`} className="detail__brand-link">
              {brandName}
            </Link>
            <h1 className="detail__name">{perfume.name}</h1>

            <div className="detail__meta">
              {perfume.concentration && (
                <span className="badge badge-accent">{perfume.concentration}</span>
              )}
              {avgRating && (
                <span className="badge badge-gold">★ {avgRating}</span>
              )}
              {reviews.length > 0 && (
                <span className="detail__review-count">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {perfume.desc && (
              <p className="detail__description">{perfume.desc}</p>
            )}

            {/* User Actions */}
            <div className="detail__actions-row">
              <UserPerfumeActions perfumeId={perfume.id} />
              <AddToListButton perfumeId={perfume.id} />
            </div>

            {/* Performance */}
            <div className="detail__performance">
              <h3 className="detail__section-title">Performance</h3>
              {perfume.longevity && (
                <PerformanceBar label="Longevity" value={perfume.longevity} icon="⏱" maxValue={100} />
              )}
              {perfume.sillage && (
                <PerformanceBar label="Sillage" value={perfume.sillage} icon="💨" maxValue={100} />
              )}
              {perfume.performance && (
                <PerformanceBar label="Overall" value={perfume.performance} icon="⭐" maxValue={5} />
              )}
            </div>

            {/* Fragrance Pyramid */}
            <FragrancePyramid notes={perfume.perfume_notes} />

            {/* EAN */}
            {perfume.ean && (
              <p className="detail__ean">EAN: {perfume.ean}</p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <section className="detail__reviews" id="reviews-section">
          <h2 className="section-title">
            <span className="icon">💬</span>
            Reviews ({reviews.length})
          </h2>

          {isAuthenticated && (
            <ReviewForm
              perfumeId={perfume.id}
              onReviewAdded={(r) => setReviews((prev) => [r, ...prev])}
            />
          )}

          {!isAuthenticated && (
            <div className="detail__login-prompt">
              <Link to="/login" className="btn btn-secondary">Sign in to write a review</Link>
            </div>
          )}

          <div className="detail__reviews-list">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                currentUserId={user?.id}
                onDelete={handleDeleteReview}
                onUpdate={handleUpdateReview}
              />
            ))}
            {reviews.length === 0 && (
              <div className="empty-state">
                <div className="icon">✍️</div>
                <h3>No reviews yet</h3>
                <p>Be the first to review this fragrance</p>
              </div>
            )}
          </div>
        </section>

        {/* Similar Perfumes */}
        {similar.length > 0 && (
          <section className="detail__similar">
            <h2 className="section-title">
              <span className="icon">✨</span>
              More from {brandName}
            </h2>
            <div className="perfume-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {similar.map((p) => (
                <PerfumeCard key={p.id} perfume={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
