import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__logo">✦ PARFUM</span>
          <p className="footer__tagline">Exklusive Düfte für jeden Anlass</p>
        </div>

        <div className="footer__links">
          <div className="footer__column">
            <h4>Shop</h4>
            <Link to="/shop">Alle Düfte</Link>
            <Link to="/shop?category=Herren">Herren</Link>
            <Link to="/shop?category=Damen">Damen</Link>
            <Link to="/shop?category=Unisex">Unisex</Link>
          </div>
          <div className="footer__column">
            <h4>Service</h4>
            <a href="#">Versand</a>
            <a href="#">Retouren</a>
            <a href="#">Kontakt</a>
          </div>
          <div className="footer__column">
            <h4>Rechtliches</h4>
            <a href="#">Impressum</a>
            <a href="#">Datenschutz</a>
            <a href="#">AGB</a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} PARFUM. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  );
}
