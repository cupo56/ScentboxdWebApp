import './StarRating.css';

export default function StarRating({ rating, size = 'md', interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`star-rating star-rating--${size} ${interactive ? 'star-rating--interactive' : ''}`}>
      {stars.map((star) => (
        <span
          key={star}
          className={`star-rating__star ${star <= rating ? 'filled' : ''}`}
          onClick={interactive ? () => onChange?.(star) : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
}
