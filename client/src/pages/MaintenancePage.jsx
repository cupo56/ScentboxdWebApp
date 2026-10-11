import { useEffect, useRef, useState } from 'react';
import { translations } from './maintenanceTranslations';
import './MaintenancePage.css';

const WAITLIST_URL = 'https://waitlist.scent-boxd.com';
const ASSETS = '/landing';
const LANGUAGE_KEY = 'scentboxd-language';
const LANGUAGES = ['de', 'en'];

// Gleiche Reihenfolge wie auf der Waitlist: ?lang=, gespeicherte Wahl, Browser.
// Den Storage-Key teilen sich beide Seiten.
function detectLanguage() {
  const normalize = (value) => {
    const v = typeof value === 'string' ? value.toLowerCase() : '';
    if (LANGUAGES.includes(v)) return v;
    return v.startsWith('de-') ? 'de' : null;
  };
  let stored = null;
  try {
    stored = localStorage.getItem(LANGUAGE_KEY);
  } catch {
    // ohne Storage bleibt es bei URL und Browser
  }
  return (
    normalize(new URLSearchParams(window.location.search).get('lang')) ||
    normalize(stored) ||
    normalize(navigator.language) ||
    'en'
  );
}

function matches(query) {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

// jsdom und manche Browser liefern bei play() kein Promise zurück.
function play(video) {
  try {
    const result = video.play();
    return result && typeof result.catch === 'function' ? result : Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

const FEATURES = [
  { key: 'collect', shot: 'list' },
  { key: 'rate', shot: 'performance' },
  { key: 'discover', shot: 'catalog' },
  { key: 'community', shot: 'community' },
  { key: 'profile', shot: 'fragrance-profile', alt: 'profile' },
];

const STACK = [
  { shot: 'user-collection', alt: 'userCollection' },
  { shot: 'detail', alt: 'detail' },
  { shot: 'catalog', alt: 'catalog' },
];

export default function MaintenancePage({ onAdminLogin }) {
  const [language, setLanguage] = useState(detectLanguage);
  const [revealReady] = useState(() => !matches('(prefers-reduced-motion: reduce)'));
  const [scrolled, setScrolled] = useState(false);
  const [heroMuted, setHeroMuted] = useState(true);
  const [storyMuted, setStoryMuted] = useState(true);
  const t = (key) => translations[language][key] ?? translations.de[key] ?? key;

  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const heroStageRef = useRef(null);
  const heroVideoRef = useRef(null);
  const heroSoundRef = useRef(null);
  const storyVideoRef = useRef(null);
  const phoneStackRef = useRef(null);

  const changeLanguage = (next) => {
    setLanguage(next);
    try {
      localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // Umschalten funktioniert trotzdem, nur ohne Erinnerung
    }
  };

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = language;
    document.title = translations[language].title;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language]);

  useEffect(() => {
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

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  // Abschnitte beim Hineinscrollen einblenden (reveal.js der Waitlist)
  useEffect(() => {
    if (!revealReady || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    rootRef.current
      .querySelectorAll('.reveal, .screenshots-3d')
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [revealReady]);

  // Aufsteigende Duftpartikel im Hintergrund (particles.js der Waitlist)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (matches('(prefers-reduced-motion: reduce)')) return undefined;
    let ctx = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return undefined;

    const HUES = [320, 45, 140, 200];
    let width;
    let height;
    let frame;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (particle = {}) => {
      particle.x = Math.random() * width;
      particle.y = height + 20;
      particle.size = Math.random() * 3 + 1;
      particle.speed = Math.random() * 0.4 + 0.1;
      particle.opacity = Math.random() * 0.4 + 0.1;
      particle.hue = HUES[Math.floor(Math.random() * HUES.length)];
      return particle;
    };

    window.addEventListener('resize', resize);
    resize();

    // Dichte an die Fläche koppeln: auf einem 402pt-Telefon sonst deutlich zu viel
    const count = Math.round(Math.min(50, Math.max(22, (width * height) / 26000)));
    const particles = Array.from({ length: count }, () => {
      const particle = spawn();
      particle.y = Math.random() * height;
      return particle;
    });

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(p.y * 0.01) * 0.3;
        p.opacity -= 0.0003;
        if (p.y < -20 || p.opacity <= 0) spawn(p);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity})`;
        ctx.fill();
      });
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // 3D-Neigung des Handy-Stapels mit der Maus (tilt.js der Waitlist)
  useEffect(() => {
    const stack = phoneStackRef.current;
    if (!matches('(hover: hover) and (pointer: fine)')) return undefined;
    const move = (event) => {
      const rect = stack.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stack.style.transform = `rotateY(${x * 15}deg) rotateX(${y * -15}deg)`;
    };
    const leave = () => {
      stack.style.transform = 'rotateY(0deg) rotateX(0deg)';
    };
    stack.addEventListener('mousemove', move);
    stack.addEventListener('mouseleave', leave);
    return () => {
      stack.removeEventListener('mousemove', move);
      stack.removeEventListener('mouseleave', leave);
    };
  }, []);

  // Hero-Video mit Ton (hero-video.js der Waitlist)
  useEffect(() => {
    const video = heroVideoRef.current;
    const story = storyVideoRef.current;
    const soundBtn = heroSoundRef.current;
    // Hat der Nutzer selbst stummgeschaltet, schalten wir nie automatisch wieder ein.
    let userMuted = false;
    let inView = true;
    const cleanups = [];

    const sync = () => setHeroMuted(video.muted);
    video.addEventListener('volumechange', sync);
    cleanups.push(() => video.removeEventListener('volumechange', sync));

    const setMuted = (muted) => {
      video.muted = muted;
      if (!muted && !story.muted) story.muted = true;
      if (video.paused) play(video).catch(() => {});
    };

    const onClick = () => {
      userMuted = !video.muted;
      setMuted(!video.muted);
    };
    soundBtn.addEventListener('click', onClick);
    cleanups.push(() => soundBtn.removeEventListener('click', onClick));

    // Story-Video mit Ton -> Hero-Video stumm, damit nie zwei Tonspuren laufen.
    const onStoryVolume = () => {
      if (!story.muted && !video.muted) {
        video.muted = true;
        userMuted = true;
      }
    };
    story.addEventListener('volumechange', onStoryVolume);
    cleanups.push(() => story.removeEventListener('volumechange', onStoryVolume));

    // Außerhalb des Sichtbereichs Ton aus, beim Zurückscrollen wieder an.
    if ('IntersectionObserver' in window) {
      let mutedByScroll = false;
      const observer = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (!inView && !video.muted) {
            mutedByScroll = true;
            video.muted = true;
          } else if (inView && mutedByScroll && !userMuted && story.muted) {
            mutedByScroll = false;
            video.muted = false;
          }
        },
        { threshold: 0.25 }
      );
      observer.observe(heroStageRef.current);
      cleanups.push(() => observer.disconnect());
    }

    if (matches('(prefers-reduced-motion: reduce)')) {
      video.removeAttribute('autoplay');
      video.pause?.();
    } else {
      // Browser blockieren Autoplay mit Ton. Ein laufendes stummes Video darf
      // ohne Interaktion nicht entstummt werden (Chrome/Safari pausieren es
      // sonst). Daher sofort stumm starten, Ton nur wenn der Browser es
      // erlaubt, sonst bei der ersten Interaktion mit der Seite einschalten.
      let soundAllowed = false;
      try {
        soundAllowed =
          typeof navigator.getAutoplayPolicy === 'function' &&
          navigator.getAutoplayPolicy(video) === 'allowed';
      } catch {
        soundAllowed = false;
      }
      video.muted = !soundAllowed;
      play(video)
        .catch(() => {
          video.muted = true;
          return play(video).catch(() => {});
        })
        .finally(sync);

      if (video.muted) {
        const events = ['pointerdown', 'keydown', 'touchstart', 'click'];
        const unlock = (event) => {
          events.forEach((name) => window.removeEventListener(name, unlock, true));
          if (soundBtn.contains(event.target) || userMuted || !inView || !video.muted) return;
          setMuted(false);
        };
        events.forEach((name) => window.addEventListener(name, unlock, true));
        cleanups.push(() =>
          events.forEach((name) => window.removeEventListener(name, unlock, true))
        );
      }
    }
    sync();

    return () => cleanups.forEach((fn) => fn());
  }, []);

  // Story-Video (video-showcase.js der Waitlist)
  useEffect(() => {
    const video = storyVideoRef.current;
    const sync = () => setStoryMuted(video.muted);
    video.addEventListener('volumechange', sync);
    sync();
    return () => video.removeEventListener('volumechange', sync);
  }, []);

  const toggleStorySound = () => {
    const video = storyVideoRef.current;
    video.muted = !video.muted;
    if (!video.muted && video.paused) play(video).catch(() => {});
  };

  const soundLabel = (muted) => (muted ? t('story.soundOn') : t('story.soundOff'));
  const soundAria = (muted) => (muted ? t('soundOnAria') : t('soundOffAria'));

  const rootClass = ['landing', revealReady && 'reveal-ready'].filter(Boolean).join(' ');

  return (
    <div className={rootClass} id="maintenance-page" ref={rootRef}>
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob blob-1" />
        <div className="aurora-blob blob-2" />
        <div className="aurora-blob blob-3" />
      </div>
      <canvas id="scentCanvas" ref={canvasRef} aria-hidden="true" />

      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <span className="wordmark">
          scent-<span className="wordmark-accent">boxd</span>
        </span>
        <div className="language-switcher" role="group" aria-label={t('languageLabel')}>
          <button
            type="button"
            aria-pressed={language === 'de'}
            aria-label="Deutsch"
            onClick={() => changeLanguage('de')}
          >
            DE
          </button>
          <button
            type="button"
            aria-pressed={language === 'en'}
            aria-label="English"
            onClick={() => changeLanguage('en')}
          >
            EN
          </button>
        </div>
      </header>

      <div className="hero-stage" ref={heroStageRef}>
        <div className="hero-video-bg" aria-hidden="true">
          <video
            ref={heroVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={`${ASSETS}/videos/hero-bg-poster.jpg`}
          >
            <source
              src={`${ASSETS}/videos/hero-bg-720.mp4`}
              type="video/mp4"
              media="(max-width: 767px)"
            />
            <source src={`${ASSETS}/videos/hero-bg.mp4`} type="video/mp4" />
          </video>
        </div>
        <button
          type="button"
          ref={heroSoundRef}
          className="story-sound-toggle hero-sound-toggle"
          aria-label={soundAria(heroMuted)}
        >
          <SoundIcon muted={heroMuted} />
          <span className="sound-label">{soundLabel(heroMuted)}</span>
        </button>

        <main className="hero">
          <div className="hero-copy">
            <p className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true" />
              {t('badge')}
            </p>
            <h1>
              {t('heading1')}
              <br className="desktop-br" /> {t('heading2')}
            </h1>
            <p className="subtitle">{t('subtitle')}</p>
          </div>

          <div className="hero-cta">
            <a className="cta-button" href={WAITLIST_URL}>
              {t('heroCta')}
            </a>
          </div>

          <ul className="feature-list">
            <li>{t('features.collect')}</li>
            <li>{t('features.rate')}</li>
            <li>{t('features.discover')}</li>
            <li>{t('features.community')}</li>
          </ul>
        </main>
      </div>

      <section className="app-showcase reveal" aria-label={t('previewLabel')}>
        <div className="showcase-copy">
          <p className="eyebrow">{t('showcase.eyebrow')}</p>
          <h2>{t('showcase.heading')}</h2>
          <p className="showcase-desc">{t('showcase.body')}</p>
        </div>
        <picture>
          <source media="(max-width: 767px)" srcSet={`${ASSETS}/promo/app-showcase-1920.webp`} />
          <img
            src={`${ASSETS}/promo/app-showcase-3840.webp`}
            width="3840"
            height="2160"
            alt={t('showcaseAlt')}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </section>

      <div className="showcase-copy phones-copy reveal">
        <p className="eyebrow">{t('phones.eyebrow')}</p>
        <h2>{t('phones.heading')}</h2>
        <p className="showcase-desc">{t('phones.body')}</p>
      </div>

      <section className="screenshots-3d" aria-label={t('previewLabel')}>
        <div className="phone-stack" ref={phoneStackRef}>
          {STACK.map(({ shot, alt }) => (
            <div className="phone-frame" key={shot}>
              <Screenshot shot={shot} alt={t(`screenshots.${alt}`)} />
            </div>
          ))}
        </div>
      </section>

      <section className="story-section reveal" aria-label={t('story.eyebrow')}>
        <div className="story-inner">
          <div className="story-copy">
            <p className="eyebrow">{t('story.eyebrow')}</p>
            <h2>{t('story.heading')}</h2>
            <p className="story-desc">{t('story.body')}</p>

            <div className="story-milestones" aria-hidden="true">
              <span className="story-badge">
                <span className="story-dot" />
                <span>{t('story.badge1')}</span>
              </span>
              <span className="story-arrow">→</span>
              <span className="story-badge">
                <span className="story-dot" />
                <span>{t('story.badge2')}</span>
              </span>
              <span className="story-arrow">→</span>
              <span className="story-badge story-badge--active">
                <span className="story-dot story-dot--active" />
                <span>{t('story.badge3')}</span>
              </span>
            </div>
          </div>

          <div className="story-device-wrap">
            <div className="story-device-glow" aria-hidden="true" />
            <div className="story-device-frame">
              <video
                ref={storyVideoRef}
                className="story-video-player"
                autoPlay
                loop
                muted
                playsInline
                poster={`${ASSETS}/videos/video-poster.jpg`}
                preload="metadata"
                aria-label={t('storyVideoLabel')}
              >
                <source src={`${ASSETS}/videos/scentboxd-preview.mp4`} type="video/mp4" />
              </video>
              <button
                type="button"
                className="story-sound-toggle"
                aria-label={soundAria(storyMuted)}
                onClick={toggleStorySound}
              >
                <SoundIcon muted={storyMuted} />
                <span className="sound-label">{soundLabel(storyMuted)}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        {FEATURES.map(({ key, shot, alt }) => (
          <div className="feature-block reveal" key={key}>
            <div className="feature-phone">
              <div className="phone-frame">
                <Screenshot shot={shot} alt={t(`screenshots.${alt ?? shot}`)} />
              </div>
            </div>
            <div className="feature-copy">
              <p className="eyebrow">{t(`${key}.eyebrow`)}</p>
              <h2>{t(`${key}.heading`)}</h2>
              <p>{t(`${key}.body`)}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="cta-final reveal">
        <h2>{t('final.heading')}</h2>
        <a className="cta-button" href={WAITLIST_URL}>
          {t('final.button')}
        </a>
      </section>

      <footer className="site-footer">
        <p>&copy; 2026 scent-boxd</p>
        <nav>
          <a href={`${WAITLIST_URL}/impressum`}>{t('imprint')}</a>
          <a href={`${WAITLIST_URL}/datenschutz`}>{t('privacy')}</a>
          <a href={`${WAITLIST_URL}/privacy`}>{t('appPrivacy')}</a>
          <a href={`${WAITLIST_URL}/terms`}>{t('terms')}</a>
        </nav>
        {onAdminLogin && <AdminLogin onSubmit={onAdminLogin} label={t('admin')} />}
      </footer>
    </div>
  );
}

function Screenshot({ shot, alt }) {
  return (
    <img
      src={`${ASSETS}/screenshots/${shot}.webp`}
      width="646"
      height="1307"
      alt={alt}
      loading="lazy"
    />
  );
}

function SoundIcon({ muted }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      {muted ? (
        <>
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  );
}

// Dezenter Zugang fürs Team: zugeklappt nur ein kleiner Textlink.
function AdminLogin({ onSubmit, label }) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!expanded) {
    return (
      <button type="button" className="admin-toggle" onClick={() => setExpanded(true)}>
        {label}
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
    <form className="admin-form" onSubmit={handleSubmit} aria-label="Admin-Login">
      <input
        className="admin-input"
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
        className="admin-input"
        type="password"
        placeholder="Passwort"
        autoComplete="current-password"
        aria-label="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="admin-submit" type="submit" disabled={submitting}>
        {submitting ? 'Prüfe…' : 'Einloggen'}
      </button>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
