import { useId } from 'react';
import { Link } from 'react-router-dom';
import './HeroPickCard.css';

// Tagesempfehlung: großes Bild mit Verlauf, Serif-Name, Marke, "Why"-Block.
export default function HeroPickCard({ perfume, tag, why }) {
  const nameId = useId();
  const whyId = useId();

  if (!perfume) {
    return (
      <div className="hero-pick hero-pick--skeleton">
        <div className="hero-pick__image"><div className="skeleton hero-pick__image-skeleton" /></div>
        <div className="hero-pick__why"><div className="skeleton" style={{ height: 14, width: '70%' }} /></div>
      </div>
    );
  }

  const brand = perfume.brands?.name;
  const meta = [brand, perfume.concentration].filter(Boolean).join(' · ');

  return (
    <Link
      to={`/perfume/${perfume.id}`}
      className="hero-pick"
      aria-labelledby={nameId}
      aria-describedby={why ? whyId : undefined}
    >
      <div className="hero-pick__image">
        {perfume.image_url ? (
          <img src={perfume.image_url} alt={perfume.name} />
        ) : (
          <span className="hero-pick__placeholder" aria-hidden="true">◆</span>
        )}
        <div className="hero-pick__scrim" aria-hidden="true" />
        {tag && <span className="hero-pick__tag">{tag}</span>}
        <div className="hero-pick__caption">
          <h2 id={nameId} className="hero-pick__name">{perfume.name}</h2>
          {meta && <div className="hero-pick__meta">{meta}</div>}
        </div>
      </div>
      {why && (
        <div className="hero-pick__why">
          <span className="eyebrow">Why</span>
          <p id={whyId}>{why}</p>
        </div>
      )}
    </Link>
  );
}
