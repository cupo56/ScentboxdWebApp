import { Link } from 'react-router-dom';
import './PerfumeRow.css';

export default function PerfumeRow({ perfume }) {
  const brandName = perfume.brands?.name || 'Unknown';
  const notes = (perfume.perfume_notes || []).slice(0, 2).map((pn) => pn.notes?.name).filter(Boolean);

  return (
    <Link to={`/perfume/${perfume.id}`} className="perfume-row">
      <div className="bottle perfume-row__image">
        {perfume.image_url ? <img src={perfume.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">◆</span>}
      </div>
      <div className="perfume-row__main">
        <div className="perfume-row__name">{perfume.name}</div>
        <div className="perfume-row__sub">{brandName}{notes[0] ? ` · ${notes[0]}` : ''}</div>
      </div>
      <div className="perfume-row__house">{brandName}</div>
      <div className="perfume-row__notes">
        {notes.map((n) => <span key={n} className="chip">{n}</span>)}
      </div>
      <div className="perfume-row__score">
        <div className="perfume-row__score-value">
          {perfume.performance != null ? Number(perfume.performance).toFixed(1) : '—'}
        </div>
        {perfume.review_count != null && (
          <div className="perfume-row__score-count">{perfume.review_count}</div>
        )}
      </div>
    </Link>
  );
}
