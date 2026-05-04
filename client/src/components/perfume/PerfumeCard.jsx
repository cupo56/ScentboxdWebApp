import { Link } from 'react-router-dom';
import StarRating from '../review/StarRating';
import './PerfumeCard.css';

const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <rect fill="#16161f" width="300" height="400"/>
    <text x="150" y="200" fill="#55556a" font-family="sans-serif" font-size="40" text-anchor="middle" dominant-baseline="middle">◆</text>
  </svg>
`);

export default function PerfumeCard({ perfume, avgRating, reviewCount }) {
  const brandName = perfume.brands?.name || 'Unknown';
  const imgSrc = perfume.image_url || PLACEHOLDER_IMG;

  // Use community avg rating if available, otherwise fall back to static performance
  const displayRating = avgRating != null ? avgRating : (perfume.performance > 0 ? perfume.performance : null);
  const displayCount = reviewCount != null ? reviewCount : null;

  return (
    <Link to={`/perfume/${perfume.id}`} className="perfume-card card" id={`perfume-card-${perfume.id}`}>
      <div className="perfume-card__image-wrap">
        <img
          src={imgSrc}
          alt={perfume.name}
          className="perfume-card__image"
          loading="lazy"
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
        {perfume.concentration && (
          <span className="perfume-card__badge badge badge-accent">
            {perfume.concentration}
          </span>
        )}
      </div>
      <div className="perfume-card__info">
        <p className="perfume-card__brand">{brandName}</p>
        <h3 className="perfume-card__name">{perfume.name}</h3>
        {displayRating != null && (
          <div className="perfume-card__rating">
            <StarRating rating={Math.round(displayRating)} size="sm" />
            <span className="perfume-card__rating-text">
              {Number(displayRating).toFixed(1)}
              {displayCount != null && (
                <span className="perfume-card__review-count"> ({displayCount})</span>
              )}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
