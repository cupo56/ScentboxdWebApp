import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star } from '@phosphor-icons/react';
import { getPerfumeById, getSimilarPerfumes } from '../services/perfumeService';
import { getReviewsByPerfume, getPerfumeRatingSummary, deleteReview } from '../services/reviewService';
import { getBlockedIds } from '../services/blockService';
import { toast } from '../store/toastStore';
import { useAuth } from '../hooks/useAuth';
import ActionTiles from '../components/perfume/ActionTiles';
import FragrancePyramid from '../components/perfume/FragrancePyramid';
import PerformancePanel from '../components/perfume/PerformancePanel';
import PerfumeCarousel from '../components/perfume/PerfumeCarousel';
import ReviewCard from '../components/review/ReviewCard';
import ReviewForm from '../components/review/ReviewForm';
import './PerfumeDetailPage.css';

const REVIEWS_PAGE_SIZE = 10;

const withoutBlocked = (rows, blocked) =>
  blocked.length ? rows.filter((r) => !blocked.includes(r.user_id)) : rows;

const EMPTY = { key: undefined, perfume: null, reviews: [], reviewsTotal: 0, blockedIds: [], similar: [], error: '' };

// Lädt Parfum, erste Review-Seite und Blockliste zusammen; Similar läuft nach.
async function loadDetail(id, isAuthenticated) {
  const perfume = await getPerfumeById(id);
  const [firstPage, blocked] = await Promise.all([
    getReviewsByPerfume(id, { page: 1, pageSize: REVIEWS_PAGE_SIZE }).catch(() => ({ reviews: [], total: 0 })),
    isAuthenticated ? getBlockedIds().catch(() => []) : Promise.resolve([]),
  ]);
  return {
    perfume,
    reviews: withoutBlocked(firstPage.reviews, blocked),
    reviewsTotal: firstPage.total,
    blockedIds: blocked,
  };
}

export default function PerfumeDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const key = `${id}|${isAuthenticated}`;
  const [data, setData] = useState(EMPTY);
  const [summary, setSummary] = useState({ key: undefined, value: null });
  const ratingSummary = summary.key === key ? summary.value : null;
  const keyRef = useRef(key);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  const refreshRatingSummary = (perfumeId, forKey) => {
    getPerfumeRatingSummary(perfumeId)
      .then((value) => setSummary((s) => (keyRef.current === forKey ? { key: forKey, value } : s)))
      .catch(() => {});
  };

  useEffect(() => { keyRef.current = key; }, [key]);

  useEffect(() => {
    let active = true;
    loadDetail(id, isAuthenticated)
      .then((next) => {
        if (!active) return;
        setData({ key, ...next, similar: [], error: '' });
        setReviewPage(1);
        refreshRatingSummary(id, key);
        if (next.perfume?.brand_id) {
          getSimilarPerfumes(next.perfume.brand_id, id)
            .then((similar) => { if (active) setData((d) => (d.key === key ? { ...d, similar } : d)); })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (active) setData({ ...EMPTY, key, error: err.message || 'Failed to load perfume' });
      });
    return () => { active = false; };
  }, [id, isAuthenticated, key]);

  const loading = data.key !== key;
  const { perfume, reviews, reviewsTotal, blockedIds, similar, error } = data;

  const patchReviews = (fn) => setData((d) => (d.key === key ? { ...d, ...fn(d) } : d));

  const loadMoreReviews = async () => {
    setLoadingMoreReviews(true);
    try {
      const nextPage = reviewPage + 1;
      const { reviews: nextReviews, total } = await getReviewsByPerfume(id, { page: nextPage, pageSize: REVIEWS_PAGE_SIZE });
      patchReviews((d) => ({ reviews: [...d.reviews, ...withoutBlocked(nextReviews, blockedIds)], reviewsTotal: total }));
      setReviewPage(nextPage);
    } catch (err) {
      toast.error('Failed to load more reviews: ' + err.message);
    }
    setLoadingMoreReviews(false);
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      patchReviews((d) => ({ reviews: d.reviews.filter((r) => r.id !== reviewId), reviewsTotal: Math.max(0, d.reviewsTotal - 1) }));
      refreshRatingSummary(id, key);
    } catch (err) {
      toast.error('Failed to delete review: ' + err.message);
    }
  };

  const handleReviewAdded = (review) => {
    patchReviews((d) => ({ reviews: [review, ...d.reviews], reviewsTotal: d.reviewsTotal + 1 }));
    refreshRatingSummary(id, key);
  };

  const handleUpdateReview = (updated) => {
    patchReviews((d) => ({ reviews: d.reviews.map((r) => (r.id === updated.id ? updated : r)) }));
    refreshRatingSummary(id, key);
  };

  if (loading) {
    return (
      <div className="detail detail--loading" aria-busy="true">
        <span className="sr-only">Loading…</span>
        <div className="detail__hero"><div className="skeleton detail__hero-skeleton" /></div>
        <div className="detail__body">
          <div className="skeleton" style={{ height: 11, width: '30%' }} />
          <div className="skeleton" style={{ height: 34, width: '70%', marginTop: 12 }} />
          <div className="skeleton" style={{ height: 56, marginTop: 24 }} />
        </div>
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="container page detail__error glass" role="alert">
        <h1 className="detail__error-title">Couldn't load this fragrance</h1>
        <p>{error || 'Fragrance not found.'}</p>
        <Link to="/catalog" className="btn btn-primary">Back to Catalog</Link>
      </div>
    );
  }

  const brandName = perfume.brands?.name || 'Unknown';
  const brandId = perfume.brands?.id || perfume.brand_id;
  const reviewCount = ratingSummary?.review_count ?? reviewsTotal;
  const avgRating = ratingSummary?.avg_rating != null ? Number(ratingSummary.avg_rating) : null;

  return (
    <article className="detail">
      <div className="detail__hero">
        {perfume.image_url ? (
          <img src={perfume.image_url} alt={perfume.name} />
        ) : (
          <span className="detail__hero-placeholder" aria-hidden="true">◆</span>
        )}
        <div className="detail__hero-fade" aria-hidden="true" />
      </div>

      <div className="detail__body">
        <header className="detail__header">
          {brandId ? (
            <Link to={`/brand/${brandId}`} className="eyebrow detail__brand">{brandName}</Link>
          ) : (
            <span className="eyebrow detail__brand">{brandName}</span>
          )}
          <h1 className="detail__name">{perfume.name}</h1>
          <div className="detail__pills">
            {perfume.concentration && <span className="detail__pill detail__pill--accent">{perfume.concentration}</span>}
            {avgRating != null && (
              <span className="detail__pill detail__pill--rating">
                <Star size={13} weight="fill" aria-hidden="true" />
                <strong>{avgRating.toFixed(1)}</strong>
                <span>({reviewCount})</span>
              </span>
            )}
          </div>
        </header>

        <ActionTiles perfumeId={perfume.id} />

        <FragrancePyramid notes={perfume.perfume_notes} />

        <PerformancePanel perfume={perfume} summary={ratingSummary} />

        {perfume.desc && (
          <section className="detail__section">
            <h2>About</h2>
            <p className="detail__desc">{perfume.desc}</p>
          </section>
        )}

        {similar.length > 0 && (
          <section className="detail__section">
            <h2>More from {brandName}</h2>
            <PerfumeCarousel items={similar} />
          </section>
        )}

        <section className="detail__section detail__reviews">
          <h2>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</h2>

          {isAuthenticated ? (
            <ReviewForm perfumeId={perfume.id} onReviewAdded={handleReviewAdded} />
          ) : (
            <div className="detail__login glass">
              <Link to="/login" className="btn btn-primary">Sign in to write a review</Link>
            </div>
          )}

          <div className="detail__review-list">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} currentUserId={user?.id} onDelete={handleDeleteReview} onUpdate={handleUpdateReview} />
            ))}
            {reviews.length === 0 && (
              <p className="detail__empty">No reviews yet. Be the first to say something.</p>
            )}
          </div>

          {reviewPage * REVIEWS_PAGE_SIZE < reviewsTotal && (
            <div className="detail__more">
              <button type="button" className="btn btn-secondary" onClick={loadMoreReviews} disabled={loadingMoreReviews}>
                {loadingMoreReviews ? 'Loading…' : 'Load more reviews'}
              </button>
              <span>Showing {reviews.length} of {reviewsTotal}</span>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
