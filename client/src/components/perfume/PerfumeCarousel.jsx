import { Link } from 'react-router-dom';
import './PerfumeCarousel.css';

const rankClass = (rank) => `badge badge-rank${rank <= 3 ? ` badge-rank-${rank}` : ''}`;

// Horizontale Reihe von Parfum-Kacheln. Mit `rank` (Trending-View) gibt es
// Rang-Badges; Zeilen aus getSimilarPerfumes haben keinen Rang und `brands.name`.
export default function PerfumeCarousel({ items }) {
  if (!items?.length) return null;

  return (
    <div className="trending">
      {items.map((p) => {
        const brand = p.brand_name ?? p.brands?.name;
        return (
          <Link key={p.id} to={`/perfume/${p.id}`} className="trending__tile">
            {p.rank != null && <span className={rankClass(p.rank)}>{p.rank}</span>}
            <div className="trending__image">
              {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">◆</span>}
            </div>
            <div className="trending__name">{p.name}</div>
            {brand && <div className="trending__brand">{brand}</div>}
          </Link>
        );
      })}
    </div>
  );
}
