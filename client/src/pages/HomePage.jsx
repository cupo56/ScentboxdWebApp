import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/product/ProductGrid';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import './HomePage.css';

export default function HomePage() {
  const { products, loading } = useProducts({ limit: 4 });

  return (
    <div className="home">
      {/* Hero */}
      <section className="home__hero">
        <div className="home__hero-bg" />
        <div className="home__hero-content">
          <span className="home__hero-label">Neue Kollektion 2026</span>
          <h1 className="home__hero-title">
            Entdecke deinen <span className="home__hero-accent">Signature-Duft</span>
          </h1>
          <p className="home__hero-subtitle">
            Premium Parfums der besten Marken — kuratiert für deinen individuellen Stil.
          </p>
          <div className="home__hero-actions">
            <Link to="/shop">
              <Button size="lg">Jetzt entdecken</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home__features">
        <div className="home__feature">
          <span className="home__feature-icon">🚚</span>
          <h3>Kostenloser Versand</h3>
          <p>Ab 50 € Bestellwert</p>
        </div>
        <div className="home__feature">
          <span className="home__feature-icon">✨</span>
          <h3>100% Original</h3>
          <p>Nur authentische Produkte</p>
        </div>
        <div className="home__feature">
          <span className="home__feature-icon">↩️</span>
          <h3>30 Tage Rückgabe</h3>
          <p>Kostenlose Retouren</p>
        </div>
      </section>

      {/* Featured Products */}
      <section className="home__section">
        <div className="home__section-header">
          <h2>Beliebte Düfte</h2>
          <Link to="/shop" className="home__section-link">
            Alle ansehen →
          </Link>
        </div>
        {loading ? <Spinner /> : <ProductGrid products={products} />}
      </section>
    </div>
  );
}
