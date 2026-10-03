import { Link } from 'react-router-dom';
import './TrendingCarousel.css';

const rankClass = (rank) => `badge badge-rank${rank <= 3 ? ` badge-rank-${rank}` : ''}`;

// Horizontale Reihe der Trending-Düfte mit Rang-Badges (Gold, Silber, Bronze, dann Magenta).
export default function TrendingCarousel({ items }) {
  if (!items?.length) return null;

  return (
    <div className="trending">
      {items.map((p) => (
        <Link key={p.id} to={`/perfume/${p.id}`} className="trending__tile">
          <span className={rankClass(p.rank)}>{p.rank}</span>
          <div className="trending__image">
            {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">◆</span>}
          </div>
          <div className="trending__name">{p.name}</div>
          <div className="trending__brand">{p.brand_name}</div>
        </Link>
      ))}
    </div>
  );
}
