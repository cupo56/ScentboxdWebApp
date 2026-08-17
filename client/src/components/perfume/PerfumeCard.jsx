import { Link } from 'react-router-dom';
import './PerfumeCard.css';

export default function PerfumeCard({ perfume }) {
  const brandName = perfume.brands?.name || 'Unknown';
  const topNote = perfume.perfume_notes?.[0]?.notes?.name;

  return (
    <Link to={`/perfume/${perfume.id}`} className="perfume-card">
      <div className="bottle perfume-card__image">
        {perfume.image_url ? (
          <img src={perfume.image_url} alt={perfume.name} loading="lazy" />
        ) : (
          <span className="perfume-card__placeholder" aria-hidden="true">◆</span>
        )}
      </div>
      <div className="perfume-card__body">
        <div className="perfume-card__brand">{brandName}</div>
        <div className="perfume-card__name">{perfume.name}</div>
        <div className="perfume-card__foot">
          <span className="perfume-card__note">{topNote || perfume.concentration || '—'}</span>
          {perfume.performance != null && (
            <span className="perfume-card__score">{Number(perfume.performance).toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
