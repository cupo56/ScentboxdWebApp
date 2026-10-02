import { useEffect, useState } from 'react';
import './MaintenancePage.css';

const WAITLIST_URL = 'https://waitlist.scent-boxd.com';

export default function MaintenancePage({ onAdminLogin }) {
  useEffect(() => {
    document.title = 'Scentboxd — wird gerade gebaut';

    // Zur Laufzeit gesetzt, nicht in index.html: dort würde es die volle App
    // auf allen anderen Hosts mit deindexieren.
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);

    return () => {
      document.head.removeChild(robots);
    };
  }, []);

  return (
    <main className="maintenance" id="maintenance-page">
      <div className="maintenance__aurora" aria-hidden="true">
        <div className="maintenance__blob maintenance__blob--1" />
        <div className="maintenance__blob maintenance__blob--2" />
        <div className="maintenance__blob maintenance__blob--3" />
      </div>

      <div className="maintenance__content">
        <p className="maintenance__wordmark">
          Scent<span className="maintenance__wordmark-accent">boxd</span>
        </p>

        <h1 className="maintenance__title">Wir bauen gerade an Scentboxd</h1>

        <p className="maintenance__subtitle">
          Deine Duftsammlung, endlich an einem Ort. Wir feilen noch an den
          letzten Details. Trag dich in die Warteliste ein und du bist beim
          Start dabei.
        </p>

        <a
          className="maintenance__cta"
          href={WAITLIST_URL}
          id="maintenance-waitlist-btn"
        >
          Zur Warteliste
        </a>

        {onAdminLogin && <AdminLogin onSubmit={onAdminLogin} />}
      </div>
    </main>
  );
}

// Dezenter Zugang fürs Team: zugeklappt nur ein kleiner Textlink.
function AdminLogin({ onSubmit }) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        className="maintenance__admin-toggle"
        onClick={() => setExpanded(true)}
      >
        Admin
      </button>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const nextError = await onSubmit(email, password);
    // Bei Erfolg wird die Seite durch die App ersetzt, nur Fehler landen hier.
    if (nextError) {
      setError(nextError);
      setSubmitting(false);
    }
  };

  return (
    <form className="maintenance__admin" onSubmit={handleSubmit} aria-label="Admin-Login">
      <input
        className="maintenance__admin-input"
        type="email"
        placeholder="E-Mail"
        autoComplete="email"
        aria-label="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <input
        className="maintenance__admin-input"
        type="password"
        placeholder="Passwort"
        autoComplete="current-password"
        aria-label="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="maintenance__admin-submit" type="submit" disabled={submitting}>
        {submitting ? 'Prüfe…' : 'Einloggen'}
      </button>
      {error && (
        <p className="maintenance__admin-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
