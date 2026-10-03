import { Link } from 'react-router-dom';
import Wordmark from './Wordmark';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Wordmark className="footer__logo" />
          <p className="footer__tagline">Discover, rate, and collect fragrances.</p>
        </div>

        <div className="footer__links">
          <div className="footer__column">
            <h4>Discover</h4>
            <Link to="/catalog">Catalog</Link>
            <Link to="/brands">Brands</Link>
            <Link to="/community">Community</Link>
          </div>
          <div className="footer__column">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} Scentboxd. The fragrance encyclopedia.</p>
      </div>
    </footer>
  );
}
