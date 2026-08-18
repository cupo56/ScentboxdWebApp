import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChatCircle, Flag } from '@phosphor-icons/react';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import CommentSection from './CommentSection';
import ReportModal from '../report/ReportModal';
import { toggleReviewLike, getReviewLikeCount, hasUserLikedReview } from '../../services/reviewService';
import { getCommentCount } from '../../services/commentService';
import { useAuth } from '../../hooks/useAuth';
import './ReviewCard.css';

export default function ReviewCard({ review, currentUserId, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
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

    getCommentCount(review.id)
      .then(setCommentCount)
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

      {(review.bottle_rating > 0 || review.value_rating > 0) && (
        <div className="verdict-row__sub-ratings">
          {review.bottle_rating > 0 && (
            <span className="verdict-row__sub-rating">
              Bottle <StarRating rating={review.bottle_rating} size="sm" />
            </span>
          )}
          {review.value_rating > 0 && (
            <span className="verdict-row__sub-rating">
              Value <StarRating rating={review.value_rating} size="sm" />
            </span>
          )}
        </div>
      )}

      {(review.occasions?.length > 0 || review.seasons?.length > 0) && (
        <div className="verdict-row__occasions">
          {review.occasions?.map((occ, i) => (
            <span key={`occ-${i}`} className="badge badge-accent">{occ}</span>
          ))}
          {review.seasons?.map((season, i) => (
            <span key={`season-${i}`} className="badge">{season}</span>
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

        <button
          type="button"
          className={`verdict-row__comment-btn ${commentsOpen ? 'verdict-row__comment-btn--active' : ''}`}
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          aria-label={commentsOpen ? 'Hide comments' : 'Show comments'}
        >
          <ChatCircle size={18} weight={commentsOpen ? 'fill' : 'regular'} aria-hidden="true" />
          {commentCount > 0 && <span className="verdict-row__comment-count">{commentCount}</span>}
        </button>

        {isOwner ? (
          <div className="verdict-row__actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>Edit</button>
            <button className="btn btn-ghost btn-sm verdict-row__delete-btn" onClick={handleDelete}>Delete</button>
          </div>
        ) : (
          <button
            type="button"
            className="verdict-row__report-btn"
            onClick={() => (isAuthenticated ? setReporting(true) : navigate('/login'))}
            aria-label="Report this review"
          >
            <Flag size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {commentsOpen && (
        <CommentSection reviewId={review.id} currentUserId={currentUserId} onCountChange={setCommentCount} />
      )}

      {reporting && (
        <ReportModal
          contentType="review"
          contentId={review.id}
          reportedUserId={review.user_id}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
