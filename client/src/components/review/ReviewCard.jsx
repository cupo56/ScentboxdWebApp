import { useState } from 'react';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import './ReviewCard.css';

export default function ReviewCard({ review, currentUserId, onLike, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  const username = review.profiles?.username || review.author_name || 'Anonymous';
  const avatar = review.profiles?.avatar_url;
  const date = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const isOwner = currentUserId && review.user_id === currentUserId;

  if (isEditing) {
    return (
      <div className="review-card" id={`review-${review.id}`}>
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
    <div className="review-card" id={`review-${review.id}`}>
      <div className="review-card__header">
        <div className="review-card__author">
          <div className="review-card__avatar">
            {avatar ? (
              <img src={avatar} alt={username} />
            ) : (
              <span>{username[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="review-card__username">{username}</p>
            <p className="review-card__date">{date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      <h4 className="review-card__title">{review.title}</h4>
      <p className="review-card__text">{review.text}</p>

      {(review.longevity || review.sillage) && (
        <div className="review-card__metrics">
          {review.longevity !== null && (
            <span className="review-card__metric">
              ⏱ Longevity: {review.longevity}%
            </span>
          )}
          {review.sillage !== null && (
            <span className="review-card__metric">
              💨 Sillage: {review.sillage}%
            </span>
          )}
        </div>
      )}

      {review.occasions?.length > 0 && (
        <div className="review-card__occasions">
          {review.occasions.map((occ, i) => (
            <span key={i} className="badge badge-accent">{occ}</span>
          ))}
        </div>
      )}

      <div className="review-card__footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <div>
          {onLike && (
            <button className="review-card__like btn btn-ghost btn-sm" onClick={() => onLike(review.id)}>
              ♡ Like
            </button>
          )}
        </div>
        
        {isOwner && (
          <div className="review-card__actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>Edit</button>
            <button className="btn btn-ghost btn-sm" style={{ color: '#ff4d4d' }} onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
