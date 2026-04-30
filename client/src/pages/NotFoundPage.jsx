import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4,
    }))
  );

  useEffect(() => {
    document.title = 'Page Not Found — Scentboxd';
  }, []);

  return (
    <div className="not-found page" id="not-found-page">
      {/* Floating particles */}
      <div className="not-found__particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="not-found__particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="not-found__content">
        {/* Big 404 */}
        <div className="not-found__code">
          <span className="not-found__digit">4</span>
          <span className="not-found__digit not-found__digit--accent">
            <svg viewBox="0 0 120 120" width="120" height="120" className="not-found__bottle">
              <defs>
                <linearGradient id="bottle-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {/* Bottle cap */}
              <rect x="48" y="8" width="24" height="14" rx="4" fill="var(--text-muted)" />
              {/* Bottle neck */}
              <rect x="52" y="22" width="16" height="16" rx="2" fill="url(#bottle-grad)" opacity="0.7" />
              {/* Bottle body */}
              <rect x="32" y="38" width="56" height="70" rx="10" fill="url(#bottle-grad)" />
              {/* Label */}
              <rect x="42" y="58" width="36" height="30" rx="4" fill="rgba(255,255,255,0.1)" />
              {/* Question mark */}
              <text x="60" y="80" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text-primary)" fontFamily="Inter, sans-serif">?</text>
              {/* Shine */}
              <rect x="38" y="42" width="6" height="30" rx="3" fill="rgba(255,255,255,0.15)" />
            </svg>
          </span>
          <span className="not-found__digit">4</span>
        </div>

        <h1 className="not-found__title">Fragrance Not Found</h1>
        <p className="not-found__subtitle">
          This scent has evaporated into thin air. The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="not-found__actions">
          <Link to="/" className="btn btn-primary btn-lg" id="not-found-home-btn">
            Back to Home
          </Link>
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate(-1)}
            id="not-found-back-btn"
          >
            Go Back
          </button>
          <Link to="/explore" className="btn btn-ghost btn-lg" id="not-found-explore-btn">
            Explore Fragrances →
          </Link>
        </div>
      </div>
    </div>
  );
}
