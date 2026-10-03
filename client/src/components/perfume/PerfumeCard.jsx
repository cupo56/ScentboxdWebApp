import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from '@phosphor-icons/react';
import { useNoteName } from '../../hooks/useNoteName';
import { usePerfumeStatus } from '../../hooks/usePerfumeStatus';
import './PerfumeCard.css';

const TIER = { top: 0, mid: 1, base: 2 };

// Katalog-Karte nach der iOS-App: Bild mit Verlauf, Herz und Stern auf dem
// Bild (nur eingeloggt), Serif-Name, Marke in Magenta, Top-Noten, Konzentration.
// Die Buttons liegen neben dem Link, nicht darin (kein Button im Anker).
export default function PerfumeCard({ perfume }) {
  const brandName = perfume.brands?.name || 'Unknown';
  const noteName = useNoteName();
  const { isAuthenticated, status, toggle } = usePerfumeStatus(perfume.id);
  const [imgError, setImgError] = useState(false);

  const notes = [...(perfume.perfume_notes || [])]
    .filter((pn) => pn.notes?.name)
    .sort((a, b) => (TIER[a.note_type] ?? 3) - (TIER[b.note_type] ?? 3))
    .slice(0, 2)
    .map((pn) => noteName(pn.notes.name));

  return (
    <article className="pcard">
      <Link to={`/perfume/${perfume.id}`} className="pcard__link">
        <div className="pcard__image">
          {perfume.image_url && !imgError ? (
            <img src={perfume.image_url} alt="" loading="lazy" onError={() => setImgError(true)} />
          ) : (
            <span className="pcard__placeholder" aria-hidden="true">◆</span>
          )}
          <div className="pcard__scrim" aria-hidden="true" />
        </div>
        <div className="pcard__body">
          {perfume.performance != null && (
            <div className="pcard__rating">★ {Number(perfume.performance).toFixed(1)}</div>
          )}
          <h3 className="pcard__name">{perfume.name}</h3>
          <div className="pcard__brand">{brandName}</div>
          {notes.length > 0 && <div className="pcard__notes">{notes.join(' · ')}</div>}
          {perfume.concentration && <span className="pcard__tag">{perfume.concentration}</span>}
        </div>
      </Link>

      {isAuthenticated && (
        <div className="pcard__actions">
          <button
            type="button"
            className={`pcard__action ${status.is_owned ? 'pcard__action--on' : ''}`}
            aria-label={status.is_owned ? 'Remove from collection' : 'Add to collection'}
            aria-pressed={!!status.is_owned}
            onClick={() => toggle('is_owned')}
          >
            <Star size={18} weight={status.is_owned ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`pcard__action ${status.is_favorite ? 'pcard__action--on' : ''}`}
            aria-label={status.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={!!status.is_favorite}
            onClick={() => toggle('is_favorite')}
          >
            <Heart size={18} weight={status.is_favorite ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}
