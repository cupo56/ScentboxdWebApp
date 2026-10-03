import { Link, useLocation } from 'react-router-dom';
import './SignInPrompt.css';

// Glas-Karte für Seiten, die ohne Login keinen Inhalt haben (Favorites, Collection).
export default function SignInPrompt({ title, text }) {
  const { pathname } = useLocation();
  return (
    <div className="container page">
      <div className="signin-prompt glass">
        <h1 className="signin-prompt__title">{title}</h1>
        <p className="signin-prompt__text">{text}</p>
        <div className="signin-prompt__actions">
          <Link to="/login" state={{ from: pathname }} className="btn btn-primary">Sign in</Link>
          <Link to="/register" state={{ from: pathname }} className="btn btn-ghost">Create account</Link>
        </div>
      </div>
    </div>
  );
}
