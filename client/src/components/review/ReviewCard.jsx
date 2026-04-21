import StarRating from './StarRating';
import './ReviewCard.css';

export default function ReviewCard({ review, onLike }) {
  const username = review.profiles?.username || review.author_name || 'Anonymous';
  const avatar = review.profiles?.avatar_url;
  const date = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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

      {onLike && (
        <button className="review-card__like btn btn-ghost btn-sm" onClick={() => onLike(review.id)}>
          ♡ Like
        </button>
      )}
    </div>
  );
}
