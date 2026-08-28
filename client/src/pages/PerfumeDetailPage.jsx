import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPerfumeById, getSimilarPerfumes } from '../services/perfumeService';
import { getReviewsByPerfume, getPerfumeRatingSummary, deleteReview } from '../services/reviewService';
import { getBlockedIds } from '../services/blockService';
import FragrancePyramid from '../components/perfume/FragrancePyramid';
import PerformanceBar from '../components/perfume/PerformanceBar';
import UserPerfumeActions from '../components/perfume/UserPerfumeActions';
import AddToListButton from '../components/perfume/AddToListButton';
import ReviewCard from '../components/review/ReviewCard';
import ReviewForm from '../components/review/ReviewForm';
import PerfumeCard from '../components/perfume/PerfumeCard';
import { useAuth } from '../hooks/useAuth';
import './PerfumeDetailPage.css';

const REVIEWS_PAGE_SIZE = 10;

const withoutBlocked = (rows, blocked) =>
  blocked.length ? rows.filter((r) => !blocked.includes(r.user_id)) : rows;

export default function PerfumeDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [perfume, setPerfume] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [blockedIds, setBlockedIds] = useState([]);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshRatingSummary = (perfumeId) => {
    getPerfumeRatingSummary(perfumeId).then(setRatingSummary).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    getPerfumeById(id)
      .then(async (data) => {
        setPerfume(data);
        const [firstPage, blocked] = await Promise.all([
          getReviewsByPerfume(id, { page: 1, pageSize: REVIEWS_PAGE_SIZE })
            .catch(() => ({ reviews: [], total: 0 })),
          isAuthenticated ? getBlockedIds().catch(() => []) : Promise.resolve([]),
        ]);
        setBlockedIds(blocked);
        setReviews(withoutBlocked(firstPage.reviews, blocked));
        setReviewsTotal(firstPage.total);
        setReviewPage(1);
        refreshRatingSummary(id);
        if (data.brand_id) getSimilarPerfumes(data.brand_id, id).then(setSimilar).catch(() => {});
      })
      .catch((err) => setError(err.message || 'Failed to load perfume'))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  const loadMoreReviews = async () => {
    setLoadingMoreReviews(true);
    try {
      const nextPage = reviewPage + 1;
      const { reviews: nextReviews, total } = await getReviewsByPerfume(id, { page: nextPage, pageSize: REVIEWS_PAGE_SIZE });
      setReviews((prev) => [...prev, ...withoutBlocked(nextReviews, blockedIds)]);
      setReviewsTotal(total);
      setReviewPage(nextPage);
    } catch (err) {
      alert('Failed to load more verdicts: ' + err.message);
    }
    setLoadingMoreReviews(false);
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewsTotal((prev) => Math.max(0, prev - 1));
      refreshRatingSummary(id);
    } catch (err) {
      alert('Failed to delete review: ' + err.message);
    }
  };

  const handleReviewAdded = (review) => {
    setReviews((prev) => [review, ...prev]);
    setReviewsTotal((prev) => prev + 1);
    refreshRatingSummary(id);
  };

  const handleUpdateReview = (updated) => {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    refreshRatingSummary(id);
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="skeleton detail-loading__image" />
        <div className="detail-loading__lines">
          <div className="skeleton" style={{ height: 11, width: '30%' }} />
          <div className="skeleton" style={{ height: 28, width: '70%', marginTop: 11 }} />
          <div className="skeleton" style={{ height: 12, width: '100%', marginTop: 17 }} />
        </div>
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="entry__error">
        <div className="entry__error-title">Couldn't reach the database</div>
        <p>{error || 'Fragrance not found.'}</p>
        <Link to="/explore" className="btn btn-primary">Back to Index</Link>
      </div>
    );
  }

  const brandName = perfume.brands?.name || 'Unknown';
  const reviewCount = ratingSummary?.review_count ?? reviewsTotal;
  const avgRating = ratingSummary?.avg_rating != null ? Number(ratingSummary.avg_rating) : null;
  const avgLongevity = ratingSummary?.avg_longevity != null ? Number(ratingSummary.avg_longevity) : null;
  const avgSillage = ratingSummary?.avg_sillage != null ? Number(ratingSummary.avg_sillage) : null;

  return (
    <div className="entry">
      <div className="entry__layout">
        <aside className="entry__side">
          <div className="bottle entry__image">
            {perfume.image_url ? <img src={perfume.image_url} alt={perfume.name} /> : <span>◆</span>}
          </div>
          <UserPerfumeActions perfumeId={perfume.id} />
          <AddToListButton perfumeId={perfume.id} />
          <div className="entry__fade" />
          <div className="entry__facts">
            {perfume.release_year && <div><span>Released</span><span>{perfume.release_year}</span></div>}
            {perfume.concentration && <div><span>Concentration</span><span>{perfume.concentration}</span></div>}
            {perfume.ean && <div><span>EAN</span><span className="entry__facts-mono">{perfume.ean}</span></div>}
          </div>
        </aside>

        <div className="entry__main">
          <div className="entry__house">{brandName}</div>
          <h1 className="entry__name">{perfume.name}</h1>
          <div className="entry__meta">
            {avgRating != null && <span className="entry__score">{avgRating.toFixed(1)}</span>}
            <span>{reviewCount} verdict{reviewCount !== 1 ? 's' : ''}</span>
          </div>
          {perfume.desc && <p className="entry__desc">{perfume.desc}</p>}

          <div className="entry__perf">
            <div className="pyramid__label-row">Performance · community average</div>
            {avgLongevity != null && <PerformanceBar label="Longevity" value={avgLongevity} maxValue={100} suffix="%" />}
            {avgSillage != null && <PerformanceBar label="Sillage" value={avgSillage} maxValue={100} suffix="%" />}
            {avgLongevity == null && avgSillage == null && (
              <p className="entry__no-performance">No verdicts yet — performance data appears once someone rates this one.</p>
            )}
          </div>

          <FragrancePyramid notes={perfume.perfume_notes} />

          <div className="entry__verdicts-head">
            <h2>{reviewCount} verdicts</h2>
          </div>

          {isAuthenticated ? (
            <ReviewForm perfumeId={perfume.id} onReviewAdded={handleReviewAdded} />
          ) : (
            <div className="entry__login-prompt">
              <Link to="/login" className="btn btn-secondary">Sign in to write a verdict</Link>
            </div>
          )}

          <div className="entry__verdicts-list">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} currentUserId={user?.id} onDelete={handleDeleteReview} onUpdate={handleUpdateReview} />
            ))}
            {reviews.length === 0 && (
              <div className="entry__empty-verdicts">
                <div>No verdicts on this one yet</div>
                <p>Be the first to say something.</p>
              </div>
            )}
          </div>

          {reviews.length < reviewsTotal && (
            <div className="entry__load-more-reviews">
              <button className="btn btn-secondary" onClick={loadMoreReviews} disabled={loadingMoreReviews}>
                {loadingMoreReviews ? 'Loading…' : 'Load more verdicts'}
              </button>
              <span>Showing {reviews.length} of {reviewsTotal}</span>
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="entry__similar">
          <h2>More from {brandName}</h2>
          <div className="perfume-grid">
            {similar.map((p) => <PerfumeCard key={p.id} perfume={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
