import { Link } from 'react-router-dom';
import './StatsStrip.css';

// Zahlenleiste über der Today-Seite, nur eingeloggt.
export default function StatsStrip({ owned, wantToTry, reviews, profilePath }) {
  const stats = [
    { value: owned, label: 'Collection', to: '/collection' },
    { value: wantToTry, label: 'Want to try', to: `${profilePath}?tab=want_to_try` },
    { value: reviews, label: 'Reviews', to: `${profilePath}?tab=reviews` },
  ];

  return (
    <div className="stats-strip glass">
      {stats.map(({ value, label, to }) => (
        <Link key={label} to={to} className="stats-strip__item">
          <span className="stats-strip__value gradient-text">{value}</span>
          <span className="stats-strip__label">{label}</span>
        </Link>
      ))}
    </div>
  );
}
