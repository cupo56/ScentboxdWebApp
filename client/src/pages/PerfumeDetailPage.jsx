import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPerfumeById, getSimilarPerfumes } from '../services/perfumeService';
import { getReviewsByPerfume, deleteReview } from '../services/reviewService';
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
      .then(async (data) => {
        setPerfume(data);
        const [reviewData, blockedIds] = await Promise.all([
          getReviewsByPerfume(id).catch(() => []),
          isAuthenticated ? getBlockedIds().catch(() => []) : Promise.resolve([]),
        ]);
        setReviews(blockedIds.length ? reviewData.filter((r) => !blockedIds.includes(r.user_id)) : reviewData);
        if (data.brand_id) getSimilarPerfumes(data.brand_id, id).then(setSimilar).catch(() => {});
      })
      .catch((err) => setError(err.message || 'Failed to load perfume'))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert('Failed to delete review: ' + err.message);
    }
  };

  const handleUpdateReview = (updated) => {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
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
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const longevityValues = reviews.map((r) => r.longevity).filter((v) => v != null);
  const sillageValues = reviews.map((r) => r.sillage).filter((v) => v != null);
  const avgLongevity = longevityValues.length
    ? Math.round(longevityValues.reduce((a, b) => a + b, 0) / longevityValues.length)
    : null;
  const avgSillage = sillageValues.length
    ? Math.round(sillageValues.reduce((a, b) => a + b, 0) / sillageValues.length)
    : null;

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
            {avgRating && <span className="entry__score">{avgRating}</span>}
            <span>{reviews.length} verdict{reviews.length !== 1 ? 's' : ''}</span>
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
            <h2>{reviews.length} verdicts</h2>
          </div>

          {isAuthenticated ? (
            <ReviewForm perfumeId={perfume.id} onReviewAdded={(r) => setReviews((prev) => [r, ...prev])} />
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
