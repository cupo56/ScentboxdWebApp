import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { toggleReviewLike, getReviewLikeCount, hasUserLikedReview } from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';
import './ReviewCard.css';

export default function ReviewCard({ review, currentUserId, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const username = review.profiles?.username || review.author_name || 'Anonymous';
  const avatar = review.profiles?.avatar_url;
  const date = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const isOwner = currentUserId && review.user_id === currentUserId;

  // Fetch like state on mount
  useEffect(() => {
    getReviewLikeCount(review.id)
      .then(setLikeCount)
      .catch(() => {});

    if (isAuthenticated) {
      hasUserLikedReview(review.id)
        .then(setLiked)
        .catch(() => {});
    }
  }, [review.id, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (likeLoading) return;

    setLikeLoading(true);
    // Optimistic update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => prev + (wasLiked ? -1 : 1));
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);

    try {
      await toggleReviewLike(review.id);
    } catch {
      // Revert on error
      setLiked(wasLiked);
      setLikeCount((prev) => prev + (wasLiked ? 1 : -1));
    } finally {
      setLikeLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="verdict-row" id={`review-${review.id}`}>
        <ReviewForm
          perfumeId={review.perfume_id}
          initialData={review}
          onCancel={() => setIsEditing(false)}
          onReviewAdded={(updatedReview) => {
            setIsEditing(false);
            onUpdate?.(updatedReview);
          }}
        />
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      onDelete?.(review.id);
    }
  };

  return (
    <div className="verdict-row" id={`review-${review.id}`}>
      <div className="verdict-row__header">
        <div className="verdict-row__author">
          <div className="verdict-row__avatar">
            {avatar ? (
              <img src={avatar} alt={username} />
            ) : (
              <span>{username[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="verdict-row__username">{username}</p>
            <p className="verdict-row__date">{date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {review.perfumes && (
        <Link to={`/perfume/${review.perfumes.id}`} className="verdict-row__perfume">
          <span className="verdict-row__perfume-thumb">
            {review.perfumes.image_url ? <img src={review.perfumes.image_url} alt="" /> : '◆'}
          </span>
          <span>
            <span className="verdict-row__perfume-brand">{review.perfumes.brands?.name}</span>
            <span className="verdict-row__perfume-name">{review.perfumes.name}</span>
          </span>
        </Link>
      )}

      <h4 className="verdict-row__title">{review.title}</h4>
      <p className="verdict-row__text">{review.text}</p>

      {(review.longevity || review.sillage) && (
        <div className="verdict-row__metrics">
          {review.longevity !== null && (
            <span className="verdict-row__metric">
              ⏱ Longevity: {review.longevity}%
            </span>
          )}
          {review.sillage !== null && (
            <span className="verdict-row__metric">
              💨 Sillage: {review.sillage}%
            </span>
          )}
        </div>
      )}

      {review.occasions?.length > 0 && (
        <div className="verdict-row__occasions">
          {review.occasions.map((occ, i) => (
            <span key={i} className="badge badge-accent">{occ}</span>
          ))}
        </div>
      )}

      <div className="verdict-row__footer">
        <button
          className={`verdict-row__like-btn ${liked ? 'verdict-row__like-btn--liked' : ''} ${likeAnimating ? 'verdict-row__like-btn--pop' : ''}`}
          onClick={handleLike}
          disabled={likeLoading}
          aria-label={liked ? 'Unlike this review' : 'Like this review'}
          id={`like-btn-${review.id}`}
        >
          <svg
            className="verdict-row__like-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likeCount > 0 && (
            <span className="verdict-row__like-count">{likeCount}</span>
          )}
        </button>

        {isOwner && (
          <div className="verdict-row__actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>Edit</button>
            <button className="btn btn-ghost btn-sm verdict-row__delete-btn" onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
