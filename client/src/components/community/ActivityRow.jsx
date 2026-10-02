import { Link } from 'react-router-dom';
import './ActivityRow.css';

// Eine Zeile im Aktivitäts-Feed: wer hat was bewertet.
export default function ActivityRow({ review }) {
  const username = review.profiles?.username;
  const avatar = review.profiles?.avatar_url;
  const perfume = review.perfumes;

  return (
    <div className="activity-row">
      <span className="activity-row__avatar">
        {avatar ? <img src={avatar} alt="" /> : (username || 'S')[0].toUpperCase()}
      </span>
      <div className="activity-row__body">
        <div className="activity-row__text">
          {username ? <Link to={`/profile/${username}`}>{username}</Link> : <strong>Someone</strong>}
          {' rated '}
          {perfume ? <Link to={`/perfume/${perfume.id}`}>{perfume.name}</Link> : <strong>a fragrance</strong>}
          {review.rating != null && <span className="activity-row__rating">★ {review.rating}</span>}
        </div>
        <div className="activity-row__time">{new Date(review.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
}
