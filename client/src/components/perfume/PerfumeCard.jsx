import { Link } from 'react-router-dom';
import StarRating from '../review/StarRating';
import useTilt from '../../hooks/useTilt';
import './PerfumeCard.css';

const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1c1c28"/>
        <stop offset="1" stop-color="#12121a"/>
      </linearGradient>
    </defs>
    <rect fill="url(#g)" width="300" height="400"/>
    <text x="150" y="200" fill="#55556a" font-family="sans-serif" font-size="40" text-anchor="middle" dominant-baseline="middle">◆</text>
  </svg>
`);

export default function PerfumeCard({ perfume }) {
  const brandName = perfume.brands?.name || 'Unknown';
  const imgSrc = perfume.image_url || PLACEHOLDER_IMG;
  const tiltRef = useTilt(7);

  return (
    <Link
      to={`/perfume/${perfume.id}`}
      className="perfume-card card tilt-3d"
      id={`perfume-card-${perfume.id}`}
      ref={tiltRef}
    >
      <div className="perfume-card__image-wrap">
        <img
          src={imgSrc}
          alt={perfume.name}
          className="perfume-card__image"
          loading="lazy"
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
        <span className="perfume-card__sheen" aria-hidden="true" />
        {perfume.concentration && (
          <span className="perfume-card__badge badge badge-accent">
            {perfume.concentration}
          </span>
        )}
      </div>
      <div className="perfume-card__info tilt-layer">
        <p className="perfume-card__brand">{brandName}</p>
        <h3 className="perfume-card__name">{perfume.name}</h3>
        {perfume.performance > 0 && (
          <div className="perfume-card__rating">
            <StarRating rating={Math.round(perfume.performance)} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
}
