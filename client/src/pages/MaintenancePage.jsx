import { useEffect } from 'react';
import './MaintenancePage.css';

const WAITLIST_URL = 'https://waitlist.scent-boxd.com';

export default function MaintenancePage() {
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
      </div>
    </main>
  );
}
