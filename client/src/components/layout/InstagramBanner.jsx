import { useState } from 'react';
import { INSTAGRAM_URL } from '../../config/social';
import './InstagramBanner.css';

export const DISMISS_KEY = 'scentboxd-instagram-banner-dismissed';

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

// Hinweis oben auf der Seite, dass wir jetzt auf Instagram sind.
// Einmal weggeklickt bleibt er in diesem Browser weg.
export default function InstagramBanner({
  label = 'New:',
  message = "We're on Instagram now!",
  cta = 'Follow @scentboxd',
  closeLabel = 'Dismiss',
}) {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ohne Storage nur für diesen Besuch ausgeblendet
    }
  };

  return (
    <aside className="ig-banner" aria-label="Instagram">
      <a className="ig-banner__link" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
        <InstagramIcon />
        <span className="ig-banner__text">
          <strong>{label}</strong> {message}{' '}
          <span className="ig-banner__cta">
            {cta} <span aria-hidden="true">→</span>
          </span>
        </span>
      </a>
      <button type="button" className="ig-banner__close" aria-label={closeLabel} onClick={dismiss}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </aside>
  );
}

function InstagramIcon() {
  return (
    <svg className="ig-banner__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
