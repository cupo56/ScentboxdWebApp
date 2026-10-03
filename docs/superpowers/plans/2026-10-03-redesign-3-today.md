# Redesign Schritt 3: Today — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Startseite wird zur „Today“-Seite nach Spec Abschnitt 3: zweispaltig, oben (eingeloggt) eine Zahlenleiste, links die Tagesempfehlung als Hero-Karte mit „Why“-Text und das Trending-Karussell, rechts Community-Aktivität und zwei lesenswerte Reviews.

**Architecture:** `HomePage` wird durch `TodayPage` ersetzt. Datenlogik, die ohne React testbar ist, liegt in `src/lib/today.js` (`pickOfTheDay`, `buildWhyText`). Ein neuer Service `getTrendingPerfumes` liest die View `trending_perfumes`. Die Seite besteht aus vier kleinen Komponenten unter `src/components/today/`. Spec: `docs/superpowers/specs/2026-10-02-webapp-redesign-design.md`, Abschnitt 3 „Today“.

**Tech Stack:** React 19, React Router v7, Supabase JS, Vite, Vanilla CSS, Vitest + RTL.

**Branch:** `redesign-3-today` von `main`. Alle Befehle aus `client/`. Commit-Trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

**Abweichungen von der Spec, bewusst:**
- „Reviews worth reading“ nutzt nicht `ReviewCard` (die lädt pro Karte Likes und Kommentare nach), sondern eine leichte `ReviewTeaser`-Komponente mit dem Markup der heutigen Karten.
- Der „Nudge“-Banner („You added X to your collection. Written a review yet?“) entfällt. Er steht nicht in der Spec.

---

## Dateien

| Datei | Aktion | Verantwortung |
|---|---|---|
| `src/services/perfumeService.js` (+ Test) | ändern | `getTrendingPerfumes()` |
| `src/lib/today.js`, `today.test.js` | neu | `pickOfTheDay`, `buildWhyText` |
| `src/components/today/StatsStrip.jsx`, `.css`, `.test.jsx` | neu | Zahlenleiste |
| `src/components/today/HeroPickCard.jsx`, `.css`, `.test.jsx` | neu | Tagesempfehlung |
| `src/components/today/TrendingCarousel.jsx`, `.css`, `.test.jsx` | neu | Trending-Kacheln mit Rang-Badges |
| `src/components/today/ReviewTeaser.jsx`, `.css` | neu | Kompakte Review-Karte |
| `src/pages/TodayPage.jsx`, `.css`, `.test.jsx` | neu | Seite, Datenladen, Layout |
| `src/pages/HomePage.jsx`, `.css` | löschen | ersetzt |
| `src/App.jsx` | ändern | `/` → `TodayPage` |

Daten, die es schon gibt: View `trending_perfumes` (Spalten `rank, id, name, brand_name, image_url, avg_rating, week_review_count, score`; sechs Zeilen; öffentlich lesbar), `getPerfumeById(id)` (liefert `brands(name)`, `perfume_notes(note_type, notes(id, name, family))`, `longevity`, `concentration`, `image_url`, `desc`), `getUserPerfumesByStatus(userId, field)` (Zeilen mit `perfumes(id, name, image_url, concentration, brands(name))`, neueste zuerst), `getReviewCountByUser`, `getLatestReviews(limit)`, `getBlockedIds`, Hook `useActivityFeed`, Hook `useNoteName` (übersetzt Notennamen ins Englische), Komponente `ActivityRow`.

---

### Task 1: `getTrendingPerfumes`

**Files:**
- Modify: `src/services/perfumeService.js`, `src/services/perfumeService.test.js`

- [ ] **Step 1: Test** — in `perfumeService.test.js` den Import um `getTrendingPerfumes` erweitern und am Ende anhängen:

```js
describe('getTrendingPerfumes', () => {
  it('reads the trending view ordered by rank', async () => {
    const rows = [{ rank: 1, id: 'a', name: 'Layton' }, { rank: 2, id: 'b', name: 'Oud Wood' }];
    const builder = mock.mockFrom('trending_perfumes', { data: rows, error: null });

    await expect(getTrendingPerfumes()).resolves.toEqual(rows);
    expect(supabase.from).toHaveBeenCalledWith('trending_perfumes');
    expect(builder.order).toHaveBeenCalledWith('rank', { ascending: true });
  });

  it('throws when the query errors', async () => {
    mock.mockFrom('trending_perfumes', { data: null, error: new Error('boom') });

    await expect(getTrendingPerfumes()).rejects.toThrow('boom');
  });
});
```

Run: `npx vitest run src/services/perfumeService.test.js 2>&1 | tail -6` → FAIL (`getTrendingPerfumes` ist kein Export).

- [ ] **Step 2: Service** — am Ende von `perfumeService.js`:

```js
/**
 * Trending perfumes of the week from the `trending_perfumes` materialized
 * view (rank, id, name, brand_name, image_url, avg_rating, week_review_count, score).
 */
export async function getTrendingPerfumes() {
  const { data, error } = await supabase
    .from('trending_perfumes')
    .select('*')
    .order('rank', { ascending: true });

  if (error) throw error;
  return data || [];
}
```

Run: der Test → PASS.

- [ ] **Step 3: Commit**

```bash
git add src/services/perfumeService.js src/services/perfumeService.test.js
git commit -m "feat(today): read trending perfumes from the view"
```

---

### Task 2: `pickOfTheDay` und `buildWhyText`

**Files:**
- Create: `src/lib/today.js`, `src/lib/today.test.js`

- [ ] **Step 1: Test** (`today.test.js`)

```js
import { describe, it, expect } from 'vitest';
import { pickOfTheDay, buildWhyText } from './today';

const trending = [{ id: 't1' }, { id: 't2' }];
const wantToTry = [{ id: 'w1' }, { id: 'w2' }, { id: 'w3' }];

describe('pickOfTheDay', () => {
  it('prefers the want-to-try list and is stable within a day', () => {
    const date = new Date('2026-10-03T08:00:00Z');
    const a = pickOfTheDay({ trending, wantToTry, date });
    const b = pickOfTheDay({ trending, wantToTry, date: new Date('2026-10-03T22:00:00Z') });

    expect(a).toEqual({ id: expect.stringMatching(/^w/), source: 'want_to_try' });
    expect(b).toEqual(a);
  });

  it('rotates through the want-to-try list from day to day', () => {
    const ids = [1, 2, 3].map((d) => pickOfTheDay({ trending, wantToTry, date: new Date(`2026-10-0${d}T12:00:00Z`) }).id);

    expect(new Set(ids).size).toBe(3);
  });

  it('falls back to the top trending perfume', () => {
    expect(pickOfTheDay({ trending, wantToTry: [] })).toEqual({ id: 't1', source: 'trending' });
  });

  it('returns null without any candidates', () => {
    expect(pickOfTheDay({ trending: [], wantToTry: [] })).toBeNull();
  });
});

describe('buildWhyText', () => {
  const perfume = {
    longevity: 'Long',
    perfume_notes: [
      { note_type: 'base', notes: { name: 'Moschus', family: 'Musky' } },
      { note_type: 'top', notes: { name: 'Mokka', family: 'Gourmand' } },
      { note_type: 'top', notes: { name: 'Sandelholz', family: 'Woody' } },
      { note_type: 'mid', notes: { name: 'Kaffee', family: 'Gourmand' } },
    ],
  };

  it('names the family, the first three notes in pyramid order and the longevity', () => {
    const translate = (n) => ({ Mokka: 'Mocha', Sandelholz: 'Sandalwood', Kaffee: 'Coffee' }[n] || n);

    expect(buildWhyText(perfume, translate)).toBe(
      'Gourmand with Mocha, Sandalwood and Coffee up top. Long-lasting, good for a full day.'
    );
  });

  it('handles a single note and moderate longevity', () => {
    const p = { longevity: 'Moderate', perfume_notes: [{ note_type: 'top', notes: { name: 'Iris', family: 'Floral' } }] };

    expect(buildWhyText(p)).toBe('Floral with Iris up top. Moderate longevity, easy to re-apply.');
  });

  it('falls back to a generic line without notes or longevity', () => {
    expect(buildWhyText({ perfume_notes: [] })).toBe('Rated highly by the community this week.');
  });
});
```

Run: `npx vitest run src/lib/today.test.js 2>&1 | tail -5` → FAIL (Import).

- [ ] **Step 2: Implementierung** (`today.js`)

```js
const DAY_MS = 86_400_000;
const ORDER = { top: 0, mid: 1, base: 2 };

/**
 * Tagesempfehlung. Eingeloggte mit Want-to-try-Liste bekommen einen Duft
 * daraus, deterministisch pro Kalendertag (gleicher Tag → gleicher Duft).
 * Sonst Platz 1 aus Trending. Ohne Kandidaten null.
 */
export function pickOfTheDay({ trending = [], wantToTry = [], date = new Date() }) {
  if (wantToTry.length > 0) {
    const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
    return { id: wantToTry[day % wantToTry.length].id, source: 'want_to_try' };
  }
  if (trending.length > 0) return { id: trending[0].id, source: 'trending' };
  return null;
}

/**
 * Ein ehrlicher Satz aus Daten statt Matching-Prozent: Familie der ersten
 * Note, die ersten drei Noten in Pyramiden-Reihenfolge, Longevity.
 * `translate` übersetzt Notennamen (siehe useNoteName).
 */
export function buildWhyText(perfume, translate = (name) => name) {
  const ordered = [...(perfume.perfume_notes || [])]
    .filter((pn) => pn.notes?.name)
    .sort((a, b) => (ORDER[a.note_type] ?? 3) - (ORDER[b.note_type] ?? 3));
  const names = ordered.slice(0, 3).map((pn) => translate(pn.notes.name));
  const family = ordered.find((pn) => pn.notes.family)?.notes.family;

  const parts = [];
  if (family && names.length) parts.push(`${family} with ${joinNames(names)} up top.`);
  else if (names.length) parts.push(`Opens with ${joinNames(names)}.`);
  else if (family) parts.push(`A ${family.toLowerCase()} fragrance.`);

  const longevity = (perfume.longevity || '').toLowerCase();
  if (longevity.includes('long') || longevity.includes('eternal')) parts.push('Long-lasting, good for a full day.');
  else if (longevity.includes('moderate')) parts.push('Moderate longevity, easy to re-apply.');
  else if (longevity) parts.push(`${perfume.longevity} longevity.`);

  return parts.length ? parts.join(' ') : 'Rated highly by the community this week.';
}

function joinNames(names) {
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
```

Run: der Test → PASS (7).

- [ ] **Step 3: Commit**

```bash
git add src/lib/today.js src/lib/today.test.js
git commit -m "feat(today): pick of the day and why text"
```

---

### Task 3: Komponenten `StatsStrip`, `HeroPickCard`, `TrendingCarousel`, `ReviewTeaser`

**Files:** alle unter `src/components/today/` (neu).

- [ ] **Step 1: Tests**

`StatsStrip.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatsStrip from './StatsStrip';

describe('StatsStrip', () => {
  it('shows the three counts with links', () => {
    render(<MemoryRouter><StatsStrip owned={12} wantToTry={5} reviews={8} profilePath="/profile/me" /></MemoryRouter>);

    expect(screen.getByRole('link', { name: /12\s*Collection/ })).toHaveAttribute('href', '/collection');
    expect(screen.getByRole('link', { name: /5\s*Want to try/ })).toHaveAttribute('href', '/profile/me?tab=want_to_try');
    expect(screen.getByRole('link', { name: /8\s*Reviews/ })).toHaveAttribute('href', '/profile/me?tab=reviews');
  });
});
```

`HeroPickCard.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeroPickCard from './HeroPickCard';

const perfume = { id: 'p1', name: 'Layton', image_url: 'https://x/l.png', concentration: 'EDP', brands: { name: 'Parfums de Marly' } };

describe('HeroPickCard', () => {
  it('renders the perfume with tag and why text and links to its page', () => {
    render(<MemoryRouter><HeroPickCard perfume={perfume} tag="Trending #1" why="Warm and sweet." /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Layton' })).toBeInTheDocument();
    expect(screen.getByText('Parfums de Marly · EDP')).toBeInTheDocument();
    expect(screen.getByText('Trending #1')).toBeInTheDocument();
    expect(screen.getByText('Warm and sweet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Layton/ })).toHaveAttribute('href', '/perfume/p1');
    expect(screen.getByRole('img', { name: 'Layton' })).toHaveAttribute('src', 'https://x/l.png');
  });

  it('renders a skeleton while there is no perfume', () => {
    const { container } = render(<MemoryRouter><HeroPickCard perfume={null} /></MemoryRouter>);

    expect(container.querySelector('.hero-pick--skeleton')).toBeInTheDocument();
  });
});
```

`TrendingCarousel.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrendingCarousel from './TrendingCarousel';

const items = [
  { rank: 1, id: 'a', name: 'Layton', brand_name: 'PdM', image_url: null },
  { rank: 2, id: 'b', name: 'Oud Wood', brand_name: 'Tom Ford', image_url: 'https://x/o.png' },
  { rank: 4, id: 'd', name: 'Sauvage', brand_name: 'Dior', image_url: null },
];

describe('TrendingCarousel', () => {
  it('renders a tile per perfume with rank badges', () => {
    render(<MemoryRouter><TrendingCarousel items={items} /></MemoryRouter>);

    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Layton/ })).toHaveAttribute('href', '/perfume/a');
    expect(screen.getByText('1')).toHaveClass('badge-rank-1');
    expect(screen.getByText('2')).toHaveClass('badge-rank-2');
    expect(screen.getByText('4')).toHaveClass('badge-rank');
    expect(screen.getByText('4')).not.toHaveClass('badge-rank-1');
  });

  it('renders nothing without items', () => {
    const { container } = render(<MemoryRouter><TrendingCarousel items={[]} /></MemoryRouter>);

    expect(container.firstChild).toBeNull();
  });
});
```

Run: `npx vitest run src/components/today 2>&1 | tail -6` → FAIL (Imports).

- [ ] **Step 2: StatsStrip**

`StatsStrip.jsx`:
```jsx
import { Link } from 'react-router-dom';
import './StatsStrip.css';

// Zahlenleiste über der Today-Seite, nur eingeloggt.
export default function StatsStrip({ owned, wantToTry, reviews, profilePath }) {
  const stats = [
    { value: owned, label: 'Collection', to: '/collection' },
    { value: wantToTry, label: 'Want to try', to: `${profilePath}?tab=want_to_try` },
    { value: reviews, label: 'Reviews', to: `${profilePath}?tab=reviews` },
  ];

  return (
    <div className="stats-strip glass">
      {stats.map(({ value, label, to }) => (
        <Link key={label} to={to} className="stats-strip__item">
          <span className="stats-strip__value gradient-text">{value}</span>
          <span className="stats-strip__label">{label}</span>
        </Link>
      ))}
    </div>
  );
}
```

`StatsStrip.css`:
```css
.stats-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: var(--space-3);
  margin-bottom: var(--space-8);
}

.stats-strip__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color 0.2s ease;
}
.stats-strip__item:hover { background: rgba(255, 255, 255, 0.04); }
.stats-strip__item + .stats-strip__item { border-left: 1px solid var(--hairline); border-radius: 0; }

.stats-strip__value {
  font: 600 26px/1 var(--font-display);
  font-variant-numeric: tabular-nums;
}

.stats-strip__label {
  font: 700 10px var(--font);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
}
```

- [ ] **Step 3: HeroPickCard**

`HeroPickCard.jsx`:
```jsx
import { Link } from 'react-router-dom';
import './HeroPickCard.css';

// Tagesempfehlung: großes Bild mit Verlauf, Serif-Name, Marke, "Why"-Block.
export default function HeroPickCard({ perfume, tag, why }) {
  if (!perfume) {
    return (
      <div className="hero-pick hero-pick--skeleton">
        <div className="hero-pick__image skeleton" />
        <div className="hero-pick__why"><div className="skeleton" style={{ height: 14, width: '70%' }} /></div>
      </div>
    );
  }

  const brand = perfume.brands?.name;
  const meta = [brand, perfume.concentration].filter(Boolean).join(' · ');

  return (
    <Link to={`/perfume/${perfume.id}`} className="hero-pick">
      <div className="hero-pick__image">
        {perfume.image_url ? (
          <img src={perfume.image_url} alt={perfume.name} />
        ) : (
          <span className="hero-pick__placeholder" aria-hidden="true">◆</span>
        )}
        <div className="hero-pick__scrim" aria-hidden="true" />
        {tag && <span className="hero-pick__tag">{tag}</span>}
        <div className="hero-pick__caption">
          <h2 className="hero-pick__name">{perfume.name}</h2>
          {meta && <div className="hero-pick__meta">{meta}</div>}
        </div>
      </div>
      {why && (
        <div className="hero-pick__why">
          <span className="eyebrow">Why</span>
          <p>{why}</p>
        </div>
      )}
    </Link>
  );
}
```

`HeroPickCard.css`:
```css
.hero-pick {
  display: block;
  border-radius: 16px;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--accent-line);
  box-shadow: var(--glow-card);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
a.hero-pick:hover { transform: translateY(-2px); box-shadow: var(--glow-card), var(--glow); }

.hero-pick__image {
  position: relative;
  aspect-ratio: 4 / 5;
  max-height: 520px;
  background: radial-gradient(ellipse at 50% 40%, #3A1428, var(--surface) 70%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-pick__image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: var(--space-10);
  filter: drop-shadow(0 20px 40px rgba(194, 10, 102, 0.35));
}
.hero-pick__placeholder { font-size: 48px; color: var(--text-dim); }

.hero-pick__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(19, 10, 16, 0.95) 0%, rgba(19, 10, 16, 0.6) 25%, transparent 65%);
  pointer-events: none;
}

.hero-pick__tag {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: #fff;
  font: 700 11px var(--font);
  letter-spacing: 0.04em;
  box-shadow: var(--glow);
}

.hero-pick__caption {
  position: absolute;
  left: var(--space-6);
  right: var(--space-6);
  bottom: var(--space-6);
}
.hero-pick__name { font-size: clamp(24px, 3vw, 30px); color: var(--text); margin: 0 0 4px; }
.hero-pick__meta { font: 600 12px var(--font); letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent-soft); }

.hero-pick__why {
  padding: var(--space-4) var(--space-6) var(--space-6);
  border-top: 1px solid var(--hairline);
  background: var(--glass);
}
.hero-pick__why p { margin: var(--space-2) 0 0; font-size: 14px; line-height: 1.5; color: var(--text-body); }

.hero-pick--skeleton .hero-pick__image { aspect-ratio: 4 / 5; }
```

- [ ] **Step 4: TrendingCarousel**

`TrendingCarousel.jsx`:
```jsx
import { Link } from 'react-router-dom';
import './TrendingCarousel.css';

const rankClass = (rank) => `badge badge-rank${rank <= 3 ? ` badge-rank-${rank}` : ''}`;

// Horizontale Reihe der Trending-Düfte mit Rang-Badges (Gold, Silber, Bronze, dann Magenta).
export default function TrendingCarousel({ items }) {
  if (!items?.length) return null;

  return (
    <div className="trending">
      {items.map((p) => (
        <Link key={p.id} to={`/perfume/${p.id}`} className="trending__tile">
          <span className={rankClass(p.rank)}>{p.rank}</span>
          <div className="trending__image">
            {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">◆</span>}
          </div>
          <div className="trending__name">{p.name}</div>
          <div className="trending__brand">{p.brand_name}</div>
        </Link>
      ))}
    </div>
  );
}
```

`TrendingCarousel.css`:
```css
.trending {
  display: flex;
  gap: var(--space-4);
  overflow-x: auto;
  padding-bottom: var(--space-2);
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}

.trending__tile {
  position: relative;
  flex: 0 0 120px;
  scroll-snap-align: start;
  text-decoration: none;
  color: inherit;
}

.trending__tile .badge-rank {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
}

.trending__image {
  height: 170px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--text-dim);
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.trending__image img { width: 100%; height: 100%; object-fit: contain; padding: var(--space-3); }
.trending__tile:hover .trending__image { border-color: var(--accent-line); transform: translateY(-2px); }

.trending__name {
  margin-top: var(--space-2);
  font: 600 12.5px/1.25 var(--font-display);
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.trending__brand { font: 500 10.5px var(--font); color: var(--accent-soft); margin-top: 2px; }
```

- [ ] **Step 5: ReviewTeaser**

`ReviewTeaser.jsx`:
```jsx
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
```

`ReviewTeaser.css`:
```css
.review-teaser { padding: var(--space-6); }
.review-teaser + .review-teaser { margin-top: var(--space-4); }

.review-teaser__head { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }

.review-teaser__avatar {
  width: 28px; height: 28px; flex: none; border-radius: 50%;
  background: var(--accent-tint); color: var(--accent-soft);
  display: flex; align-items: center; justify-content: center;
  font: 600 12px var(--font); overflow: hidden;
}
.review-teaser__avatar img { width: 100%; height: 100%; object-fit: cover; }

.review-teaser__who { min-width: 0; }
.review-teaser__user { font: 600 13.5px var(--font); color: var(--text); }
.review-teaser__user a, .review-teaser__on a { color: inherit; }
.review-teaser__user a:hover, .review-teaser__on a:hover { color: var(--accent-soft); }
.review-teaser__on { font: 400 11.5px var(--font); color: var(--text-muted); }

.review-teaser__score { margin-left: auto; font: 600 13px var(--font); color: var(--champagne); font-variant-numeric: tabular-nums; }

.review-teaser__text {
  margin: 0;
  font: 400 14.5px/1.6 var(--font);
  color: var(--text-body);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- [ ] **Step 6: Tests, Lint, Commit**

Run: `npx vitest run src/components/today 2>&1 | tail -6` → PASS (5). `npx eslint src/components/today` → clean.

```bash
git add src/components/today
git commit -m "feat(today): stats strip, hero pick card, trending carousel, review teaser"
```

---

### Task 4: `TodayPage`

**Files:**
- Create: `src/pages/TodayPage.jsx`, `TodayPage.css`, `TodayPage.test.jsx`
- Delete: `src/pages/HomePage.jsx`, `src/pages/HomePage.css`
- Modify: `src/App.jsx`

- [ ] **Step 1: Test** (`TodayPage.test.jsx`)

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useActivityFeed', () => ({ useActivityFeed: vi.fn() }));
vi.mock('../hooks/useNoteName', () => ({ useNoteName: () => (n) => n }));
vi.mock('../services/perfumeService', () => ({ getTrendingPerfumes: vi.fn(), getPerfumeById: vi.fn() }));
vi.mock('../services/reviewService', () => ({ getLatestReviews: vi.fn(), getReviewCountByUser: vi.fn() }));
vi.mock('../services/userPerfumeService', () => ({ getUserPerfumesByStatus: vi.fn() }));
vi.mock('../services/blockService', () => ({ getBlockedIds: vi.fn() }));

import { useAuth } from '../hooks/useAuth';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { getTrendingPerfumes, getPerfumeById } from '../services/perfumeService';
import { getLatestReviews, getReviewCountByUser } from '../services/reviewService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getBlockedIds } from '../services/blockService';
import TodayPage from './TodayPage';

const trending = [
  { rank: 1, id: 't1', name: 'Layton', brand_name: 'PdM', image_url: null },
  { rank: 2, id: 't2', name: 'Oud Wood', brand_name: 'Tom Ford', image_url: null },
];
const detail = (id, name) => ({
  id, name, concentration: 'EDP', longevity: 'Long', brands: { name: 'Brand' },
  perfume_notes: [{ note_type: 'top', notes: { name: 'Mocha', family: 'Gourmand' } }],
});
const review = (id, text, user_id = 'u9') => ({
  id, text, rating: 5, user_id, created_at: '2026-09-30T10:00:00Z',
  profiles: { username: `user${id}` }, perfumes: { id: `p${id}`, name: `Perfume ${id}` },
});

beforeEach(() => {
  vi.clearAllMocks();
  useActivityFeed.mockReturnValue({ items: [review('a', 'x')], personalized: false, loading: false, hasMore: false });
  getTrendingPerfumes.mockResolvedValue(trending);
  getPerfumeById.mockImplementation((id) => Promise.resolve(detail(id, id === 't1' ? 'Layton' : 'Wanted')));
  getLatestReviews.mockResolvedValue([review('1', 'Great stuff'), review('2', ''), review('3', 'Lovely', 'blocked'), review('4', 'Fine')]);
  getBlockedIds.mockResolvedValue(['blocked']);
  getUserPerfumesByStatus.mockResolvedValue([]);
  getReviewCountByUser.mockResolvedValue(0);
});

const renderPage = () => render(<MemoryRouter><TodayPage /></MemoryRouter>);

describe('TodayPage', () => {
  it('shows the top trending perfume as the pick for visitors, without a stats strip', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, profilePath: '/login' });
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Layton' })).toBeInTheDocument();
    expect(screen.getByText('Trending #1')).toBeInTheDocument();
    expect(screen.getByText(/Gourmand with Mocha up top/)).toBeInTheDocument();
    expect(screen.queryByText('Collection')).toBeNull();
    expect(getUserPerfumesByStatus).not.toHaveBeenCalled();
  });

  it('shows reviews with text, skipping blocked users', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'me' }, profilePath: '/profile/me' });
    renderPage();

    expect(await screen.findByText('Great stuff')).toBeInTheDocument();
    expect(screen.getByText('Fine')).toBeInTheDocument();
    expect(screen.queryByText('Lovely')).toBeNull();
  });

  it('prefers a want-to-try perfume and shows the stats strip when signed in', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'me' }, profilePath: '/profile/me' });
    getUserPerfumesByStatus.mockImplementation((_, field) =>
      Promise.resolve(field === 'is_want_to_try' ? [{ perfumes: { id: 'w1', name: 'Wanted' } }] : [{ perfumes: { id: 'o1' } }, { perfumes: { id: 'o2' } }])
    );
    getReviewCountByUser.mockResolvedValue(3);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Wanted' })).toBeInTheDocument();
    expect(screen.getByText('From your list')).toBeInTheDocument();
    expect(getPerfumeById).toHaveBeenCalledWith('w1');
    expect(screen.getByRole('link', { name: /2\s*Collection/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1\s*Want to try/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /3\s*Reviews/ })).toBeInTheDocument();
  });

  it('renders the trending carousel and the community feed', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null, profilePath: '/login' });
    renderPage();

    expect(await screen.findByRole('link', { name: /Oud Wood/ })).toHaveAttribute('href', '/perfume/t2');
    expect(screen.getByRole('link', { name: 'usera' })).toHaveAttribute('href', '/profile/usera');
    expect(screen.getByRole('link', { name: 'All reviews →' })).toHaveAttribute('href', '/community');
  });
});
```

Run: `npx vitest run src/pages/TodayPage.test.jsx 2>&1 | tail -6` → FAIL (Import).

- [ ] **Step 2: TodayPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { useNoteName } from '../hooks/useNoteName';
import { getTrendingPerfumes, getPerfumeById } from '../services/perfumeService';
import { getLatestReviews, getReviewCountByUser } from '../services/reviewService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getBlockedIds } from '../services/blockService';
import { pickOfTheDay, buildWhyText } from '../lib/today';
import StatsStrip from '../components/today/StatsStrip';
import HeroPickCard from '../components/today/HeroPickCard';
import TrendingCarousel from '../components/today/TrendingCarousel';
import ReviewTeaser from '../components/today/ReviewTeaser';
import ActivityRow from '../components/community/ActivityRow';
import './TodayPage.css';

const EMPTY_STATS = { owned: 0, wantToTry: 0, reviews: 0 };

// Lädt alles für Today in einem Rutsch. Fehler einzelner Quellen lassen den
// Rest stehen (allSettled); die Seite zeigt dann eben weniger.
async function loadToday(userId) {
  const [trendingR, wantR, ownedR, reviewCountR, latestR, blockedR] = await Promise.allSettled([
    getTrendingPerfumes(),
    userId ? getUserPerfumesByStatus(userId, 'is_want_to_try') : Promise.resolve([]),
    userId ? getUserPerfumesByStatus(userId, 'is_owned') : Promise.resolve([]),
    userId ? getReviewCountByUser(userId) : Promise.resolve(0),
    getLatestReviews(8),
    userId ? getBlockedIds() : Promise.resolve([]),
  ]);
  const value = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);

  const trending = value(trendingR, []);
  const wantToTry = value(wantR, []).map((row) => row.perfumes).filter(Boolean);
  const blocked = value(blockedR, []);
  const pick = pickOfTheDay({ trending, wantToTry });
  const pickDetail = pick ? await getPerfumeById(pick.id).catch(() => null) : null;

  return {
    trending,
    pick,
    pickDetail,
    stats: {
      owned: value(ownedR, []).length,
      wantToTry: wantToTry.length,
      reviews: value(reviewCountR, 0) || 0,
    },
    reviews: value(latestR, [])
      .filter((r) => r.text?.trim() && !blocked.includes(r.user_id))
      .slice(0, 2),
  };
}

export default function TodayPage() {
  const { isAuthenticated, user, profilePath } = useAuth();
  const userId = isAuthenticated && user ? user.id : null;
  const noteName = useNoteName();
  const { items: activity, personalized, loading: activityLoading } = useActivityFeed({ limit: 4 });
  // key: userId der geladenen Daten. `undefined` = noch nichts geladen (userId
  // ist für Besucher null, deshalb nicht null als Startwert).
  const [data, setData] = useState({ key: undefined, trending: [], pick: null, pickDetail: null, stats: EMPTY_STATS, reviews: [] });

  useEffect(() => {
    let active = true;
    loadToday(userId)
      .then((next) => {
        if (active) setData({ key: userId, ...next });
      })
      .catch(() => {
        if (active) setData({ key: userId, trending: [], pick: null, pickDetail: null, stats: EMPTY_STATS, reviews: [] });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const loading = data.key !== userId;
  const trendingRank = data.pick ? data.trending.findIndex((p) => p.id === data.pick.id) + 1 : 0;
  let tag = null;
  if (data.pick?.source === 'want_to_try') tag = 'From your list';
  else if (data.pick) tag = `Trending #${trendingRank || 1}`;
  const why = data.pickDetail ? buildWhyText(data.pickDetail, noteName) : null;

  return (
    <div className="container page today" aria-busy={loading}>
      {isAuthenticated && (
        <StatsStrip owned={data.stats.owned} wantToTry={data.stats.wantToTry} reviews={data.stats.reviews} profilePath={profilePath} />
      )}

      <div className="today__grid">
        <div className="today__main">
          <section className="today__section">
            <span className="eyebrow">✦ Your pick today</span>
            <HeroPickCard perfume={loading ? null : data.pickDetail} tag={tag} why={why} />
            {!loading && !data.pickDetail && (
              <p className="today__empty">Nothing to recommend yet. <Link to="/catalog">Browse the catalog</Link>.</p>
            )}
          </section>

          {data.trending.length > 0 && (
            <section className="today__section">
              <span className="eyebrow eyebrow--accent">Trending this week</span>
              <TrendingCarousel items={data.trending} />
            </section>
          )}
        </div>

        <aside className="today__side">
          <section className="today__section">
            <span className="eyebrow eyebrow--accent">{personalized ? 'From people you follow' : 'Community'}</span>
            <div className="today__feed glass">
              {activity.map((r) => <ActivityRow key={r.id} review={r} />)}
              {!activityLoading && activity.length === 0 && <p className="today__empty">No activity yet.</p>}
            </div>
            <Link to="/community" className="today__more">All activity →</Link>
          </section>

          <section className="today__section">
            <span className="eyebrow eyebrow--accent">Reviews worth reading</span>
            {data.reviews.map((r) => <ReviewTeaser key={r.id} review={r} />)}
            {!loading && data.reviews.length === 0 && <p className="today__empty">No written reviews yet.</p>}
            <Link to="/community" className="today__more">All reviews →</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TodayPage.css**

```css
.today__grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--space-10);
  align-items: start;
}

.today__main, .today__side { display: flex; flex-direction: column; gap: var(--space-10); min-width: 0; }

.today__section { display: flex; flex-direction: column; gap: var(--space-4); }

.today__feed { padding: var(--space-2) var(--space-6); }

.today__empty { color: var(--text-muted); font-size: 13px; padding: var(--space-4) 0; }
.today__empty a { color: var(--accent-soft); }

.today__more {
  align-self: flex-end;
  font: 500 13px var(--font);
  color: var(--text-muted);
}
.today__more:hover { color: var(--accent-soft); }

@media (max-width: 960px) {
  .today__grid { grid-template-columns: 1fr; gap: var(--space-8); }
}
```

- [ ] **Step 4: App.jsx umstellen und HomePage löschen**

In `src/App.jsx`: `import HomePage from './pages/HomePage';` → `import TodayPage from './pages/TodayPage';` und `<Route path="/" element={<HomePage />} />` → `<Route path="/" element={<TodayPage />} />`.

```bash
git rm -q src/pages/HomePage.jsx src/pages/HomePage.css
grep -rn "HomePage" src ; echo "exit $?"   # erwartet: keine Treffer, exit 1
```

- [ ] **Step 5: Tests, Lint, Build**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/pages/TodayPage.jsx src/pages/TodayPage.test.jsx src/App.jsx ; npm run build 2>&1 | grep -E "built in|error"`
Expected: alle grün, Lint sauber, Build ok. Falls `react-hooks/set-state-in-effect` anschlägt: Es darf kein synchrones `setState` im Effekt-Body stehen; die obige Fassung setzt State nur in `.then/.catch`.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "feat(today): two-column Today page replaces the home feed"
```

---

### Task 5: Sichtprüfung, Push, PR

- [ ] **Step 1: Dev-Server und Seite anschauen**

`npm run dev -- --port 5199 --strictPort` (Hintergrund), dann `http://localhost:5199/`:
- Ausgeloggt: keine Zahlenleiste; links Hero-Karte mit „Trending #1“, Serif-Name, Marke, „Why“-Block; darunter Trending-Kacheln mit Gold/Silber/Bronze-Badges; rechts Community-Feed (4 Zeilen) und zwei Review-Teaser mit Champagner-Sternwert.
- Mobil (390px): eine Spalte in der Reihenfolge Hero, Trending, Community, Reviews. Trending scrollt horizontal.
- Mit Login (Admin-Account): Zahlenleiste mit Gradient-Zahlen über dem Grid; Hero-Tag „From your list“, wenn Want-to-try nicht leer ist.
- Vergleich mit dem Mockup „Today B“ in `.superpowers/brainstorm/*/content/today-layout.html`.

- [ ] **Step 2: Suite, Build, Push, PR**

```bash
npm test 2>&1 | grep -E "Test Files|Tests "
npm run build 2>&1 | grep -E "built in|error"
git push -u origin redesign-3-today
gh pr create --base main --head redesign-3-today --title "feat(redesign): Today page — pick of the day, trending, community" --body "$(cat <<'EOF'
## Summary
Step 3 of the redesign (spec Abschnitt 3 „Today“, plan `docs/superpowers/plans/2026-10-03-redesign-3-today.md`).

- `/` is now `TodayPage`, two columns on desktop (1.4fr / 1fr), one column on mobile. `HomePage` removed.
- Signed in: a glass stats strip (Collection · Want to try · Reviews) with gradient numbers.
- Left: "Your pick today" hero card. Signed-in users with a want-to-try list get one of those (stable per day), everyone else gets trending #1. The "Why" line is built from data (family, first three notes in English, longevity) — no fake match score. Below it the "Trending this week" carousel from the `trending_perfumes` view with gold/silver/bronze rank badges.
- Right: community activity (shared `useActivityFeed`) and two "Reviews worth reading" teasers (reviews with text, blocked users filtered).
- Not carried over on purpose: the "You added X — written a review yet?" nudge banner (not in the spec).

## Test plan
- [x] `npm test` green; new tests for `getTrendingPerfumes`, `pickOfTheDay`/`buildWhyText`, `StatsStrip`, `HeroPickCard`, `TrendingCarousel`, `TodayPage`
- [x] `npm run build`
- [x] Browser check desktop + 390px, signed out and signed in
- [ ] After deploy: check behind the gate on scent-boxd.com

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
