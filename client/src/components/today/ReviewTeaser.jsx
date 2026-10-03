import { Link } from 'react-router-dom';
import './ReviewTeaser.css';

// Kompakte Review-Karte für Today. Lädt nichts nach; dafür gibt es ReviewCard.
export default function ReviewTeaser({ review }) {
  const username = review.profiles?.username;
  const avatar = review.profiles?.avatar_url;
  const perfume = review.perfumes;

  return (
    <article className="review-teaser glass">
      <header className="review-teaser__head">
        <span className="review-teaser__avatar" aria-hidden="true">
          {avatar ? <img src={avatar} alt="" /> : (username || 'A')[0].toUpperCase()}
        </span>
        <div className="review-teaser__who">
          <div className="review-teaser__user">
            {username ? <Link to={`/profile/${username}`}>{username}</Link> : 'Anonymous'}
          </div>
          {perfume && (
            <div className="review-teaser__on">
              on <Link to={`/perfume/${perfume.id}`}>{perfume.name}</Link>
            </div>
          )}
        </div>
        {review.rating != null && (
          <span className="review-teaser__score">★ {Number(review.rating).toFixed(1)}</span>
        )}
      </header>
      {review.text && <p className="review-teaser__text">{review.text}</p>}
    </article>
  );
}
