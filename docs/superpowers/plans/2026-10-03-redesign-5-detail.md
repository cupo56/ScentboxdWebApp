# Redesign Schritt 5: Detailseite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Parfum-Detailseite wird nach der iOS-App neu aufgebaut: eine Spalte (max. 720px), großes Bild oben mit Verlauf in den Hintergrund, Champagner-Eyebrow, Serif-Name, Konzentrations- und Bewertungs-Pille, vier Glas-Aktionskacheln, Duftpyramide in Glas-Zeilen, Performance-Panel mit vier Magenta-Balken, Beschreibung, „More from Brand“, Reviews mit Champagner-Sternen.

**Architecture:** Die Seite wird neu geschrieben; die Datenlogik (Perfume, Reviews, Rating-Summary, Similar, Blocked) bleibt. Die Aktionskacheln bauen auf dem `userPerfumeStore` aus Schritt 4 auf (`usePerfumeStatus`), `UserPerfumeActions` und `PerformanceBar` entfallen. Das Trending-Karussell wird zu `PerfumeCarousel` in `components/perfume` verallgemeinert (optionaler Rang) und für „More from Brand“ wiederverwendet. Performance-Werte kommen aus Community-Durchschnitten, wenn es Reviews gibt, sonst aus `longevity_code`/`sillage_code` (Mapping in `src/lib/performance.js`). Spec: `docs/superpowers/specs/2026-10-02-webapp-redesign-design.md`, Abschnitt 3 „Detail“.

**Tech Stack:** React 19, React Router v7, Zustand, Supabase JS, Vite, Vanilla CSS, Vitest + RTL, Phosphor Icons.

**Branch:** `redesign-5-detail` von `main`. Alle Befehle aus `client/`. Commit-Trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

**Datenlage (geprüft):** `perfumes` hat `longevity_code` (`moderate|long|very_long`), `sillage_code` (`light|moderate|strong|enormous`), `avg_bottle_rating`, `avg_value_rating` (0–5), `desc`, `brand_id`, `brands(id, name, country)`. `getPerfumeRatingSummary` liefert `avg_rating`, `review_count`, `avg_longevity`, `avg_sillage` (Prozent). `getSimilarPerfumes` liefert `id, name, image_url, concentration, brands(name)`.

---

## Dateien

| Datei | Aktion | Verantwortung |
|---|---|---|
| `src/lib/performance.js` (+ Test) | neu | Code → Prozent und Label für Longevity/Sillage |
| `src/components/perfume/PerfumeCarousel.jsx`, `.css`, `.test.jsx` | umbenannt aus `components/today/TrendingCarousel.*` | Kacheln mit optionalem Rang |
| `src/pages/TodayPage.jsx`, `TodayPage.test.jsx`, `src/pages/CatalogPage.jsx`, `CatalogPage.test.jsx` | ändern | neuer Import-Pfad |
| `src/components/perfume/ActionTiles.jsx`, `.css`, `.test.jsx` | neu | Want to try · Collection · Favorite · Add to list |
| `src/components/perfume/AddToListButton.jsx`, `.css` | ändern | Kachel-Variante |
| `src/components/perfume/UserPerfumeActions.jsx`, `.css` | löschen | ersetzt durch ActionTiles |
| `src/components/perfume/FragrancePyramid.jsx`, `.css`, `.test.jsx` | ersetzen | Glas-Zeilen mit Icon |
| `src/components/perfume/PerformancePanel.jsx`, `.css`, `.test.jsx` | neu | 2×2 Balken |
| `src/components/perfume/PerformanceBar.jsx`, `.css` | löschen | ersetzt |
| `src/components/review/StarRating.css`, `ReviewCard.css`, `ReviewCard.jsx` | ändern | Champagner-Sterne, Glas, Magenta-Like, Wording |
| `src/pages/PerfumeDetailPage.jsx`, `.css`, `.test.jsx` | ersetzen | Seite |

---

### Task 1: Performance-Vokabular und Karussell verallgemeinern

**Files:**
- Create: `src/lib/performance.js`, `src/lib/performance.test.js`
- Rename: `src/components/today/TrendingCarousel.{jsx,css,test.jsx}` → `src/components/perfume/PerfumeCarousel.{jsx,css,test.jsx}`
- Modify: `src/pages/TodayPage.jsx`, `src/pages/TodayPage.test.jsx`, `src/pages/CatalogPage.jsx`, `src/pages/CatalogPage.test.jsx`

- [ ] **Step 1: Test** (`performance.test.js`)

```js
import { describe, it, expect } from 'vitest';
import { longevityFromCode, sillageFromCode, ratingToPercent } from './performance';

describe('performance vocabulary', () => {
  it('maps longevity codes to a percent and an English label', () => {
    expect(longevityFromCode('moderate')).toEqual({ percent: 50, label: 'Moderate' });
    expect(longevityFromCode('very_long')).toEqual({ percent: 90, label: 'Very long' });
    expect(longevityFromCode('nope')).toBeNull();
  });

  it('maps sillage codes', () => {
    expect(sillageFromCode('light')).toEqual({ percent: 30, label: 'Light' });
    expect(sillageFromCode('enormous')).toEqual({ percent: 95, label: 'Enormous' });
    expect(sillageFromCode(null)).toBeNull();
  });

  it('turns a 0–5 rating into a percent', () => {
    expect(ratingToPercent(4.5)).toBe(90);
    expect(ratingToPercent(null)).toBeNull();
    expect(ratingToPercent('3')).toBe(60);
  });
});
```

Run: `npx vitest run src/lib/performance.test.js 2>&1 | tail -5` → FAIL.

- [ ] **Step 2: `src/lib/performance.js`**

```js
// Vokabular für das Performance-Panel der Detailseite. Die Codes kommen aus
// perfumes.longevity_code / sillage_code; die Prozentwerte sind Balkenlängen.
const LONGEVITY = {
  very_weak: { percent: 10, label: 'Very weak' },
  weak: { percent: 25, label: 'Weak' },
  moderate: { percent: 50, label: 'Moderate' },
  long: { percent: 75, label: 'Long' },
  very_long: { percent: 90, label: 'Very long' },
};

const SILLAGE = {
  light: { percent: 30, label: 'Light' },
  moderate: { percent: 55, label: 'Moderate' },
  strong: { percent: 80, label: 'Strong' },
  enormous: { percent: 95, label: 'Enormous' },
};

export function longevityFromCode(code) {
  return LONGEVITY[code] ?? null;
}

export function sillageFromCode(code) {
  return SILLAGE[code] ?? null;
}

export function ratingToPercent(rating) {
  if (rating == null || rating === '') return null;
  const value = Number(rating);
  return Number.isFinite(value) ? Math.round((value / 5) * 100) : null;
}
```

Run: der Test → PASS (3).

- [ ] **Step 3: Karussell verschieben und verallgemeinern**

```bash
git mv src/components/today/TrendingCarousel.jsx src/components/perfume/PerfumeCarousel.jsx
git mv src/components/today/TrendingCarousel.css src/components/perfume/PerfumeCarousel.css
git mv src/components/today/TrendingCarousel.test.jsx src/components/perfume/PerfumeCarousel.test.jsx
```

`PerfumeCarousel.jsx` — vollständig:

```jsx
import { Link } from 'react-router-dom';
import './PerfumeCarousel.css';

const rankClass = (rank) => `badge badge-rank${rank <= 3 ? ` badge-rank-${rank}` : ''}`;

// Horizontale Reihe von Parfum-Kacheln. Mit `rank` (Trending-View) gibt es
// Rang-Badges; Zeilen aus getSimilarPerfumes haben keinen Rang und `brands.name`.
export default function PerfumeCarousel({ items }) {
  if (!items?.length) return null;

  return (
    <div className="trending">
      {items.map((p) => {
        const brand = p.brand_name ?? p.brands?.name;
        return (
          <Link key={p.id} to={`/perfume/${p.id}`} className="trending__tile">
            {p.rank != null && <span className={rankClass(p.rank)}>{p.rank}</span>}
            <div className="trending__image">
              {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">◆</span>}
            </div>
            <div className="trending__name">{p.name}</div>
            {brand && <div className="trending__brand">{brand}</div>}
          </Link>
        );
      })}
    </div>
  );
}
```

`PerfumeCarousel.test.jsx`: Import auf `./PerfumeCarousel` und `describe('PerfumeCarousel', …)` ändern; einen Test ergänzen:

```jsx
  it('renders similar perfumes without badges, using brands.name', () => {
    render(<MemoryRouter><PerfumeCarousel items={[{ id: 's1', name: 'Herod', brands: { name: 'PdM' }, image_url: null }]} /></MemoryRouter>);

    expect(screen.getByRole('link', { name: /Herod/ })).toHaveAttribute('href', '/perfume/s1');
    expect(screen.getByText('PdM')).toBeInTheDocument();
    expect(document.querySelector('.badge-rank')).toBeNull();
  });
```

Importe anpassen:
- `src/pages/TodayPage.jsx`: `import TrendingCarousel from '../components/today/TrendingCarousel';` → `import PerfumeCarousel from '../components/perfume/PerfumeCarousel';` und `<TrendingCarousel items={data.trending} />` → `<PerfumeCarousel items={data.trending} />`.
- `src/pages/CatalogPage.jsx`: analog (`<PerfumeCarousel items={trending} />`).
- `src/pages/TodayPage.test.jsx` und `src/pages/CatalogPage.test.jsx`: `vi.mock('../components/today/TrendingCarousel', …)` → `vi.mock('../components/perfume/PerfumeCarousel', …)`.

Run: `grep -rn "TrendingCarousel" src ; echo "exit $?"` → keine Treffer. `npm test 2>&1 | grep -E "Test Files|Tests |FAIL"` → grün.

- [ ] **Step 4: Commit**

```bash
git add -A src
git commit -m "feat(detail): performance vocabulary, generalised perfume carousel"
```

---

### Task 2: `ActionTiles`, `AddToListButton` als Kachel, `FragrancePyramid`, `PerformancePanel`

**Files:**
- Create: `src/components/perfume/ActionTiles.jsx`, `.css`, `.test.jsx`
- Modify: `src/components/perfume/AddToListButton.jsx`, `.css`
- Delete: `src/components/perfume/UserPerfumeActions.jsx`, `.css`, `src/components/perfume/PerformanceBar.jsx`, `.css`
- Replace: `src/components/perfume/FragrancePyramid.jsx`, `.css`; Create: `FragrancePyramid.test.jsx`
- Create: `src/components/perfume/PerformancePanel.jsx`, `.css`, `.test.jsx`

- [ ] **Step 1: Tests**

`ActionTiles.test.jsx`:
```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/usePerfumeStatus', () => ({ usePerfumeStatus: vi.fn() }));
vi.mock('./AddToListButton', () => ({ default: () => <button type="button" className="action-tile">Add to list</button> }));

import { usePerfumeStatus } from '../../hooks/usePerfumeStatus';
import ActionTiles from './ActionTiles';

beforeEach(() => vi.clearAllMocks());

describe('ActionTiles', () => {
  it('shows a sign-in link for visitors', () => {
    usePerfumeStatus.mockReturnValue({ isAuthenticated: false, status: {}, toggle: vi.fn() });
    render(<MemoryRouter><ActionTiles perfumeId="p1" /></MemoryRouter>);

    expect(screen.getByRole('link', { name: /Sign in to track this fragrance/ })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders four tiles, marks active ones and toggles', async () => {
    const toggle = vi.fn();
    usePerfumeStatus.mockReturnValue({ isAuthenticated: true, status: { is_want_to_try: true, is_owned: false, is_favorite: false }, toggle });
    const user = userEvent.setup();
    render(<MemoryRouter><ActionTiles perfumeId="p1" /></MemoryRouter>);

    expect(screen.getByRole('button', { name: 'Want to try' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Collection' }));
    expect(toggle).toHaveBeenCalledWith('is_owned');
    await user.click(screen.getByRole('button', { name: 'Favorite' }));
    expect(toggle).toHaveBeenCalledWith('is_favorite');
    expect(screen.getByRole('button', { name: 'Add to list' })).toBeInTheDocument();
  });
});
```

`FragrancePyramid.test.jsx`:
```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../hooks/useNoteName', () => ({ useNoteName: () => (n) => ({ Mokka: 'Mocha' }[n] || n) }));

import FragrancePyramid from './FragrancePyramid';

describe('FragrancePyramid', () => {
  it('renders one glass row per tier with translated, comma-separated notes', () => {
    render(
      <FragrancePyramid notes={[
        { note_type: 'top', notes: { name: 'Mokka' } },
        { note_type: 'top', notes: { name: 'Bergamotte' } },
        { note_type: 'base', notes: { name: 'Moschus' } },
      ]} />
    );

    expect(screen.getByRole('heading', { name: 'Fragrance pyramid' })).toBeInTheDocument();
    expect(screen.getByText('Top')).toBeInTheDocument();
    expect(screen.getByText('Mocha, Bergamotte')).toBeInTheDocument();
    expect(screen.queryByText('Heart')).toBeNull();
    expect(screen.getByText('Moschus')).toBeInTheDocument();
  });

  it('renders nothing without notes', () => {
    const { container } = render(<FragrancePyramid notes={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

`PerformancePanel.test.jsx`:
```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PerformancePanel from './PerformancePanel';

describe('PerformancePanel', () => {
  it('prefers community averages and falls back to codes', () => {
    render(
      <PerformancePanel
        perfume={{ longevity_code: 'long', sillage_code: 'light', avg_bottle_rating: 4.5, avg_value_rating: null }}
        summary={{ avg_longevity: 72, avg_sillage: null }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Performance' })).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();          // community longevity
    expect(screen.getByText('Light')).toBeInTheDocument();        // sillage from code
    expect(screen.getByText('4.5')).toBeInTheDocument();          // bottle
    expect(screen.getByText('—')).toBeInTheDocument();            // value missing
    const bars = document.querySelectorAll('.perf__fill');
    expect(bars[0].style.width).toBe('72%');
    expect(bars[1].style.width).toBe('30%');
    expect(bars[2].style.width).toBe('90%');
    expect(bars[3].style.width).toBe('0%');
  });
});
```

Run: `npx vitest run src/components/perfume/ActionTiles.test.jsx src/components/perfume/FragrancePyramid.test.jsx src/components/perfume/PerformancePanel.test.jsx 2>&1 | tail -8` → FAIL.

- [ ] **Step 2: `ActionTiles.jsx`**

```jsx
import { Link } from 'react-router-dom';
import { Bookmark, Heart, Star } from '@phosphor-icons/react';
import { usePerfumeStatus } from '../../hooks/usePerfumeStatus';
import AddToListButton from './AddToListButton';
import './ActionTiles.css';

const TILES = [
  { field: 'is_want_to_try', label: 'Want to try', Icon: Bookmark },
  { field: 'is_owned', label: 'Collection', Icon: Star },
  { field: 'is_favorite', label: 'Favorite', Icon: Heart },
];

// Vier Glas-Kacheln wie in der App: drei Status-Toggles plus "Add to list".
export default function ActionTiles({ perfumeId }) {
  const { isAuthenticated, status, toggle } = usePerfumeStatus(perfumeId);

  if (!isAuthenticated) {
    return (
      <div className="action-tiles action-tiles--guest glass">
        <Link to="/login">Sign in to track this fragrance</Link>
      </div>
    );
  }

  return (
    <div className="action-tiles">
      {TILES.map(({ field, label, Icon }) => {
        const on = !!status[field];
        return (
          <button
            key={field}
            type="button"
            className={`action-tile ${on ? 'action-tile--on' : ''}`}
            aria-pressed={on}
            onClick={() => toggle(field)}
          >
            <Icon size={16} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
      <AddToListButton perfumeId={perfumeId} />
    </div>
  );
}
```

`ActionTiles.css`:

```css
.action-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}
.action-tiles--guest {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
  font: 500 13px var(--font);
}
.action-tiles--guest a { color: var(--accent-soft); }

.action-tile {
  position: relative;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--space-2);
  border-radius: 12px;
  border: 1px solid var(--hairline);
  background: var(--glass);
  box-shadow: var(--inset-highlight);
  color: var(--text-body);
  font: 700 10px var(--font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.action-tile:hover, .action-tile:focus-visible { border-color: var(--accent-line); color: var(--text); }
.action-tile--on {
  background: var(--accent);
  border-color: transparent;
  color: #fff;
  box-shadow: var(--glow);
}

@media (max-width: 480px) {
  .action-tiles { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] **Step 3: `AddToListButton` als Kachel**

In `AddToListButton.jsx`:
- Import ergänzen: `import { ListPlus } from '@phosphor-icons/react';`
- Den Trigger-Button ersetzen durch:
```jsx
      <button
        type="button"
        className={`action-tile ${open ? 'action-tile--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ListPlus size={16} aria-hidden="true" />
        <span>Add to list</span>
      </button>
```
- Das Dropdown bekommt `role="menu"`, die Einträge `role="menuitem"`.

In `AddToListButton.css`: `.add-to-list__dropdown` auf `background: var(--surface-solid); border: 1px solid var(--hairline-strong); box-shadow: var(--inset-highlight), var(--shadow-lg); right: 0; left: auto; min-width: 240px;` ändern; `.add-to-list__item` Farben: `color: var(--text)`, Hover `background: rgba(255, 255, 255, 0.04)`, Border `var(--hairline)`. Ergänzen: `.action-tile--open { border-color: var(--accent-line); color: var(--text); }`.

`src/components/perfume/UserPerfumeActions.jsx` und `.css` löschen (`git rm`). Prüfen: `grep -rn "UserPerfumeActions\|user-actions__" src` → nur noch in `PerfumeDetailPage.jsx` (wird in Task 3 ersetzt) — bis dahin die Seite kurz anpassen: Import und `<UserPerfumeActions …/>` dort durch `<ActionTiles perfumeId={perfume.id} />` ersetzen und `AddToListButton` aus der Seite entfernen (steckt jetzt in `ActionTiles`).

- [ ] **Step 4: `FragrancePyramid`** — vollständig:

```jsx
import { Drop, Leaf, Wind } from '@phosphor-icons/react';
import { useNoteName } from '../../hooks/useNoteName';
import './FragrancePyramid.css';

const TIERS = [
  { key: 'top', label: 'Top', Icon: Wind },
  { key: 'mid', label: 'Heart', Icon: Leaf },
  { key: 'base', label: 'Base', Icon: Drop },
];

// Duftpyramide wie in der App: drei Glas-Zeilen mit Icon-Kreis, Label und
// den Noten als Text (übersetzt über useNoteName).
export default function FragrancePyramid({ notes }) {
  const noteName = useNoteName();
  const rows = TIERS.map((tier) => ({
    ...tier,
    names: (notes || [])
      .filter((pn) => pn.note_type === tier.key && pn.notes?.name)
      .map((pn) => noteName(pn.notes.name)),
  })).filter((row) => row.names.length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="pyramid">
      <h2 className="pyramid__title">Fragrance pyramid</h2>
      <div className="pyramid__rows">
        {rows.map(({ key, label, Icon, names }) => (
          <div key={key} className="pyramid__row glass">
            <span className="pyramid__icon" aria-hidden="true"><Icon size={18} /></span>
            <span className="pyramid__label">{label}</span>
            <span className="pyramid__notes">{names.join(', ')}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

`FragrancePyramid.css` — vollständig:

```css
.pyramid { display: flex; flex-direction: column; gap: var(--space-4); }
.pyramid__title { font-size: 20px; }
.pyramid__rows { display: flex; flex-direction: column; gap: var(--space-3); }

.pyramid__row {
  display: grid;
  grid-template-columns: 40px 56px 1fr;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
}

.pyramid__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
}

.pyramid__label {
  font: 700 10px var(--font);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(231, 90, 156, 0.7);
}

.pyramid__notes { font: 500 13px/1.5 var(--font); color: var(--text); }

@media (max-width: 480px) {
  .pyramid__row { grid-template-columns: 36px 1fr; }
  .pyramid__label { grid-column: 2; }
  .pyramid__notes { grid-column: 2; }
}
```

- [ ] **Step 5: `PerformancePanel`**

```jsx
import { longevityFromCode, sillageFromCode, ratingToPercent } from '../../lib/performance';
import './PerformancePanel.css';

// 2×2 Glas-Panel wie in der App. Longevity und Sillage: Community-Durchschnitt
// (Prozent aus Reviews), sonst der Katalog-Code. Bottle und Value: 0–5-Schnitt.
export default function PerformancePanel({ perfume, summary }) {
  const longevity = pick(summary?.avg_longevity, longevityFromCode(perfume?.longevity_code));
  const sillage = pick(summary?.avg_sillage, sillageFromCode(perfume?.sillage_code));
  const bottle = stars(perfume?.avg_bottle_rating);
  const value = stars(perfume?.avg_value_rating);

  const rows = [
    { label: 'Longevity', ...longevity },
    { label: 'Sillage', ...sillage },
    { label: 'Bottle', ...bottle },
    { label: 'Value', ...value },
  ];

  return (
    <section className="perf glass">
      <h2 className="perf__title">Performance</h2>
      <div className="perf__grid">
        {rows.map(({ label, text, percent }) => (
          <div key={label} className="perf__item">
            <div className="perf__head">
              <span>{label}</span>
              <strong>{text}</strong>
            </div>
            <div className="perf__track"><div className="perf__fill" style={{ width: `${percent}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function pick(avgPercent, fromCode) {
  if (avgPercent != null && avgPercent !== '') {
    const percent = Math.round(Number(avgPercent));
    return { text: `${percent}%`, percent };
  }
  if (fromCode) return { text: fromCode.label, percent: fromCode.percent };
  return { text: '—', percent: 0 };
}

function stars(rating) {
  const percent = ratingToPercent(rating);
  return percent == null ? { text: '—', percent: 0 } : { text: Number(rating).toFixed(1), percent };
}
```

`PerformancePanel.css`:

```css
.perf { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.perf__title { font-size: 20px; }
.perf__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4) var(--space-8); }
.perf__head { display: flex; justify-content: space-between; font: 400 12.5px var(--font); color: rgba(242, 238, 240, 0.7); margin-bottom: 6px; }
.perf__head strong { color: var(--accent-soft); font-weight: 700; }
.perf__track { height: 6px; border-radius: 999px; background: rgba(255, 255, 255, 0.1); overflow: hidden; }
.perf__fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 0.4s ease; }

@media (max-width: 480px) { .perf__grid { grid-template-columns: 1fr; } }
```

`PerformanceBar.jsx`/`.css` löschen (`git rm`); `grep -rn "PerformanceBar" src` muss leer sein (der Import in `PerfumeDetailPage.jsx` wird dafür jetzt schon entfernt und der `entry__perf`-Block durch `<PerformancePanel perfume={perfume} summary={ratingSummary} />` ersetzt).

- [ ] **Step 6: Tests, Lint, Build, Commit**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/components/perfume src/pages/PerfumeDetailPage.jsx ; npm run build 2>&1 | grep -E "built in|error"`
(Der bekannte `set-state-in-effect`-Hinweis in `PerfumeDetailPage.jsx` darf bleiben; Task 3 schreibt die Seite neu.)

```bash
git add -A src
git commit -m "feat(detail): action tiles, glass pyramid, performance panel"
```

---

### Task 3: Reviews-Styling

**Files:**
- Modify: `src/components/review/StarRating.css`, `src/components/review/ReviewCard.css`, `src/components/review/ReviewCard.jsx`, `src/components/review/ReviewForm.css`

- [ ] **Step 1: StarRating** — in `StarRating.css`: `.star-rating__star { color: rgba(255, 255, 255, 0.2); }`, `.star-rating__star.filled { color: var(--champagne); }`, `.star-rating--interactive .star-rating__star:hover { color: var(--champagne); }`.

- [ ] **Step 2: ReviewCard.css** — Regeln anpassen:
- `.verdict-row { border-top: … }` → `.verdict-row { background: var(--glass); border: 1px solid var(--hairline); border-radius: 12px; box-shadow: var(--inset-highlight); padding: var(--space-6); }`
- `.verdict-row__avatar` Farbe `var(--accent-text)` → `var(--accent-soft)`.
- `.verdict-row__metrics`: in Pillen: `.verdict-row__metric { padding: 3px 8px; border-radius: 6px; background: rgba(255, 255, 255, 0.05); color: var(--text-body); }`.
- `.verdict-row__like-btn--liked { color: var(--accent-soft); }`; `.verdict-row__comment-btn--active, .verdict-row__comment-btn:hover { color: var(--accent-soft); }`.
- Neu: `.verdict-row__occasions .badge { font-size: 10px; font-weight: 600; border-radius: 4px; padding: 2px 6px; }`, `.verdict-row__occasions .badge-accent { background: var(--accent-tint); color: var(--accent-soft); border: 1px solid var(--accent-line); }`, `.verdict-row__occasions .badge-season { background: rgba(247, 231, 206, 0.1); color: var(--champagne); border: 1px solid rgba(247, 231, 206, 0.25); }`.

- [ ] **Step 3: ReviewCard.jsx** — Season-Badges: `className="badge"` → `className="badge badge-season"`. `window.confirm('Are you sure you want to delete this review?')` bleibt. Metriken: `⏱ Longevity: {review.longevity}%` → `Longevity {review.longevity}%`, `💨 Sillage: {review.sillage}%` → `Sillage {review.sillage}%` (keine Emojis).

- [ ] **Step 4: ReviewForm.css** — `.composer { … background: var(--surface); }` → `background: var(--glass); box-shadow: var(--inset-highlight);`; `.composer__error { color: var(--danger); }`; `.composer__occ-btn.active { background: var(--accent); border-color: transparent; color: #fff; box-shadow: var(--glow); }`.

- [ ] **Step 5: Tests, Commit**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/components/review`

```bash
git add src/components/review
git commit -m "style(detail): champagne stars, glass review cards and form"
```

---

### Task 4: `PerfumeDetailPage`

**Files:**
- Replace: `src/pages/PerfumeDetailPage.jsx`, `PerfumeDetailPage.css`; Create: `PerfumeDetailPage.test.jsx`

- [ ] **Step 1: Test** (`PerfumeDetailPage.test.jsx`)

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useNoteName', () => ({ useNoteName: () => (n) => n }));
vi.mock('../services/perfumeService', () => ({ getPerfumeById: vi.fn(), getSimilarPerfumes: vi.fn() }));
vi.mock('../services/reviewService', () => ({ getReviewsByPerfume: vi.fn(), getPerfumeRatingSummary: vi.fn(), deleteReview: vi.fn() }));
vi.mock('../services/blockService', () => ({ getBlockedIds: vi.fn() }));
vi.mock('../components/perfume/ActionTiles', () => ({ default: () => <div data-testid="tiles" /> }));
vi.mock('../components/review/ReviewCard', () => ({ default: ({ review }) => <div data-testid="review">{review.text}</div> }));
vi.mock('../components/review/ReviewForm', () => ({ default: () => <div data-testid="form" /> }));

import { useAuth } from '../hooks/useAuth';
import { getPerfumeById, getSimilarPerfumes } from '../services/perfumeService';
import { getReviewsByPerfume, getPerfumeRatingSummary } from '../services/reviewService';
import { getBlockedIds } from '../services/blockService';
import PerfumeDetailPage from './PerfumeDetailPage';

const perfume = {
  id: 'p1', name: 'Layton', concentration: 'EDP', desc: 'Sweet apple and vanilla.', brand_id: 'b1', image_url: 'https://x/l.png',
  longevity_code: 'long', sillage_code: 'moderate', avg_bottle_rating: 4.2, avg_value_rating: 3.8,
  brands: { id: 'b1', name: 'Parfums de Marly' },
  perfume_notes: [{ note_type: 'top', notes: { name: 'Apple' } }, { note_type: 'base', notes: { name: 'Vanilla' } }],
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ isAuthenticated: false, user: null });
  getPerfumeById.mockResolvedValue(perfume);
  getReviewsByPerfume.mockResolvedValue({ reviews: [{ id: 'r1', text: 'Lovely', user_id: 'u9' }, { id: 'r2', text: 'Hidden', user_id: 'blocked' }], total: 2 });
  getPerfumeRatingSummary.mockResolvedValue({ avg_rating: 4.3, review_count: 12, avg_longevity: 70, avg_sillage: null });
  getSimilarPerfumes.mockResolvedValue([{ id: 's1', name: 'Herod', brands: { name: 'Parfums de Marly' } }]);
  getBlockedIds.mockResolvedValue(['blocked']);
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/perfume/p1']}>
      <Routes><Route path="/perfume/:id" element={<PerfumeDetailPage />} /></Routes>
    </MemoryRouter>
  );

describe('PerfumeDetailPage', () => {
  it('renders header, pills, pyramid, performance, description and similar perfumes', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Layton' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Parfums de Marly' })).toHaveAttribute('href', '/brand/b1');
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(await screen.findByText('4.3')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
    expect(screen.getByTestId('tiles')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fragrance pyramid' })).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Performance' })).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('Sweet apple and vanilla.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'More from Parfums de Marly' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Herod/ })).toHaveAttribute('href', '/perfume/s1');
  });

  it('lists reviews without blocked users for signed-in users and shows the form', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 'me' } });
    renderPage();

    expect(await screen.findByText('Lovely')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).toBeNull();
    expect(screen.getByTestId('form')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /12 reviews/ })).toBeInTheDocument();
  });

  it('offers sign-in instead of the form to visitors', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'Sign in to write a review' })).toHaveAttribute('href', '/login');
    expect(screen.queryByTestId('form')).toBeNull();
  });

  it('shows an error state with a way back', async () => {
    getPerfumeById.mockRejectedValue(new Error('nope'));
    renderPage();

    expect(await screen.findByText('nope')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Catalog' })).toHaveAttribute('href', '/catalog');
  });
});
```

Run: `npx vitest run src/pages/PerfumeDetailPage.test.jsx 2>&1 | tail -8` → FAIL (einige Erwartungen gegen die alte Seite).

- [ ] **Step 2: `PerfumeDetailPage.jsx`** — vollständig ersetzen:

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star } from '@phosphor-icons/react';
import { getPerfumeById, getSimilarPerfumes } from '../services/perfumeService';
import { getReviewsByPerfume, getPerfumeRatingSummary, deleteReview } from '../services/reviewService';
import { getBlockedIds } from '../services/blockService';
import { toast } from '../store/toastStore';
import { useAuth } from '../hooks/useAuth';
import ActionTiles from '../components/perfume/ActionTiles';
import FragrancePyramid from '../components/perfume/FragrancePyramid';
import PerformancePanel from '../components/perfume/PerformancePanel';
import PerfumeCarousel from '../components/perfume/PerfumeCarousel';
import ReviewCard from '../components/review/ReviewCard';
import ReviewForm from '../components/review/ReviewForm';
import './PerfumeDetailPage.css';

const REVIEWS_PAGE_SIZE = 10;

const withoutBlocked = (rows, blocked) =>
  blocked.length ? rows.filter((r) => !blocked.includes(r.user_id)) : rows;

const EMPTY = { key: undefined, perfume: null, reviews: [], reviewsTotal: 0, blockedIds: [], similar: [], error: '' };

// Lädt Parfum, erste Review-Seite und Blockliste zusammen; Similar läuft nach.
async function loadDetail(id, isAuthenticated) {
  const perfume = await getPerfumeById(id);
  const [firstPage, blocked] = await Promise.all([
    getReviewsByPerfume(id, { page: 1, pageSize: REVIEWS_PAGE_SIZE }).catch(() => ({ reviews: [], total: 0 })),
    isAuthenticated ? getBlockedIds().catch(() => []) : Promise.resolve([]),
  ]);
  return {
    perfume,
    reviews: withoutBlocked(firstPage.reviews, blocked),
    reviewsTotal: firstPage.total,
    blockedIds: blocked,
  };
}

export default function PerfumeDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const key = `${id}|${isAuthenticated}`;
  const [data, setData] = useState(EMPTY);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  const refreshRatingSummary = (perfumeId) => {
    getPerfumeRatingSummary(perfumeId).then(setRatingSummary).catch(() => {});
  };

  useEffect(() => {
    let active = true;
    loadDetail(id, isAuthenticated)
      .then((next) => {
        if (!active) return;
        setData({ key, ...next, similar: [], error: '' });
        setReviewPage(1);
        refreshRatingSummary(id);
        if (next.perfume?.brand_id) {
          getSimilarPerfumes(next.perfume.brand_id, id)
            .then((similar) => { if (active) setData((d) => (d.key === key ? { ...d, similar } : d)); })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (active) setData({ ...EMPTY, key, error: err.message || 'Failed to load perfume' });
      });
    return () => { active = false; };
  }, [id, isAuthenticated, key]);

  const loading = data.key !== key;
  const { perfume, reviews, reviewsTotal, blockedIds, similar, error } = data;

  const patchReviews = (fn) => setData((d) => ({ ...d, ...fn(d) }));

  const loadMoreReviews = async () => {
    setLoadingMoreReviews(true);
    try {
      const nextPage = reviewPage + 1;
      const { reviews: nextReviews, total } = await getReviewsByPerfume(id, { page: nextPage, pageSize: REVIEWS_PAGE_SIZE });
      patchReviews((d) => ({ reviews: [...d.reviews, ...withoutBlocked(nextReviews, blockedIds)], reviewsTotal: total }));
      setReviewPage(nextPage);
    } catch (err) {
      toast.error('Failed to load more reviews: ' + err.message);
    }
    setLoadingMoreReviews(false);
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      patchReviews((d) => ({ reviews: d.reviews.filter((r) => r.id !== reviewId), reviewsTotal: Math.max(0, d.reviewsTotal - 1) }));
      refreshRatingSummary(id);
    } catch (err) {
      toast.error('Failed to delete review: ' + err.message);
    }
  };

  const handleReviewAdded = (review) => {
    patchReviews((d) => ({ reviews: [review, ...d.reviews], reviewsTotal: d.reviewsTotal + 1 }));
    refreshRatingSummary(id);
  };

  const handleUpdateReview = (updated) => {
    patchReviews((d) => ({ reviews: d.reviews.map((r) => (r.id === updated.id ? updated : r)) }));
    refreshRatingSummary(id);
  };

  if (loading) {
    return (
      <div className="detail detail--loading" aria-busy="true">
        <div className="detail__hero"><div className="skeleton detail__hero-skeleton" /></div>
        <div className="detail__body">
          <div className="skeleton" style={{ height: 11, width: '30%' }} />
          <div className="skeleton" style={{ height: 34, width: '70%', marginTop: 12 }} />
          <div className="skeleton" style={{ height: 56, marginTop: 24 }} />
        </div>
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="container page detail__error glass">
        <h1 className="detail__error-title">Couldn't load this fragrance</h1>
        <p>{error || 'Fragrance not found.'}</p>
        <Link to="/catalog" className="btn btn-primary">Back to Catalog</Link>
      </div>
    );
  }

  const brandName = perfume.brands?.name || 'Unknown';
  const brandId = perfume.brands?.id || perfume.brand_id;
  const reviewCount = ratingSummary?.review_count ?? reviewsTotal;
  const avgRating = ratingSummary?.avg_rating != null ? Number(ratingSummary.avg_rating) : null;

  return (
    <article className="detail">
      <div className="detail__hero">
        {perfume.image_url ? (
          <img src={perfume.image_url} alt={perfume.name} />
        ) : (
          <span className="detail__hero-placeholder" aria-hidden="true">◆</span>
        )}
        <div className="detail__hero-fade" aria-hidden="true" />
      </div>

      <div className="detail__body">
        <header className="detail__header">
          {brandId ? (
            <Link to={`/brand/${brandId}`} className="eyebrow detail__brand">{brandName}</Link>
          ) : (
            <span className="eyebrow detail__brand">{brandName}</span>
          )}
          <h1 className="detail__name">{perfume.name}</h1>
          <div className="detail__pills">
            {perfume.concentration && <span className="detail__pill detail__pill--accent">{perfume.concentration}</span>}
            {avgRating != null && (
              <span className="detail__pill detail__pill--rating">
                <Star size={13} weight="fill" aria-hidden="true" />
                <strong>{avgRating.toFixed(1)}</strong>
                <span>({reviewCount})</span>
              </span>
            )}
          </div>
        </header>

        <ActionTiles perfumeId={perfume.id} />

        <FragrancePyramid notes={perfume.perfume_notes} />

        <PerformancePanel perfume={perfume} summary={ratingSummary} />

        {perfume.desc && (
          <section className="detail__section">
            <h2>About</h2>
            <p className="detail__desc">{perfume.desc}</p>
          </section>
        )}

        {similar.length > 0 && (
          <section className="detail__section">
            <h2>More from {brandName}</h2>
            <PerfumeCarousel items={similar} />
          </section>
        )}

        <section className="detail__section detail__reviews">
          <h2>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</h2>

          {isAuthenticated ? (
            <ReviewForm perfumeId={perfume.id} onReviewAdded={handleReviewAdded} />
          ) : (
            <div className="detail__login glass">
              <Link to="/login" className="btn btn-primary">Sign in to write a review</Link>
            </div>
          )}

          <div className="detail__review-list">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} currentUserId={user?.id} onDelete={handleDeleteReview} onUpdate={handleUpdateReview} />
            ))}
            {reviews.length === 0 && (
              <p className="detail__empty">No reviews yet. Be the first to say something.</p>
            )}
          </div>

          {reviews.length < reviewsTotal && (
            <div className="detail__more">
              <button type="button" className="btn btn-secondary" onClick={loadMoreReviews} disabled={loadingMoreReviews}>
                {loadingMoreReviews ? 'Loading…' : 'Load more reviews'}
              </button>
              <span>Showing {reviews.length} of {reviewsTotal}</span>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: `PerfumeDetailPage.css`** — vollständig ersetzen:

```css
.detail { max-width: 720px; margin: 0 auto; padding-bottom: var(--space-14); }

.detail__hero {
  position: relative;
  height: min(60vh, 520px);
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 45%, #3A1428 0%, var(--bg) 72%);
}
.detail__hero img {
  max-height: 80%;
  max-width: 70%;
  object-fit: contain;
  filter: drop-shadow(0 24px 48px rgba(194, 10, 102, 0.35));
}
.detail__hero-placeholder { font-size: 64px; color: var(--text-dim); }
.detail__hero-fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 140px;
  background: linear-gradient(to bottom, transparent, var(--bg));
  pointer-events: none;
}
.detail__hero-skeleton { position: absolute; inset: 0; border-radius: 0; }

.detail__body {
  position: relative;
  margin-top: -40px;
  padding: 0 var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.detail__header { display: flex; flex-direction: column; gap: var(--space-3); }
.detail__brand { letter-spacing: 0.2em; text-decoration: none; }
a.detail__brand:hover { color: var(--accent-soft); }
.detail__name { font-size: clamp(30px, 5vw, 34px); }
.detail__pills { display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: center; }
.detail__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font: 500 12px var(--font);
}
.detail__pill--accent { background: var(--accent-tint); border: 1px solid var(--accent-line); color: var(--accent-soft); }
.detail__pill--rating { background: rgba(255, 255, 255, 0.08); border-radius: 8px; color: var(--text-body); }
.detail__pill--rating svg { color: var(--champagne); }
.detail__pill--rating strong { color: var(--text); font-weight: 700; }

.detail__section { display: flex; flex-direction: column; gap: var(--space-4); }
.detail__section h2 { font-size: 20px; }
.detail__desc { font: 400 15.5px/1.7 var(--font); color: var(--text-body); margin: 0; }

.detail__login { padding: var(--space-6); display: flex; justify-content: center; }
.detail__review-list { display: flex; flex-direction: column; gap: var(--space-4); }
.detail__empty { color: var(--text-muted); font-size: 13.5px; }
.detail__more { display: flex; align-items: center; gap: var(--space-6); padding-top: var(--space-6); border-top: 1px solid var(--hairline); }
.detail__more span { font: 400 12.5px var(--font); color: var(--text-dim); }

.detail__error { max-width: 480px; margin: var(--space-14) auto; padding: var(--space-10); text-align: center; }
.detail__error-title { font-size: 24px; margin-bottom: var(--space-3); }
.detail__error p { color: var(--text-body); margin-bottom: var(--space-6); }

@media (max-width: 600px) {
  .detail__hero { height: 56vh; }
  .detail__body { padding: 0 var(--space-6); gap: var(--space-8); }
}
```

- [ ] **Step 4: Prüfen**

Run: `grep -rn "verdict" src/pages/PerfumeDetailPage.jsx ; echo "exit $?"` → keine Treffer. `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/pages/PerfumeDetailPage.jsx src/pages/PerfumeDetailPage.test.jsx ; npm run build 2>&1 | grep -E "built in|error"` → grün, Lint sauber (die neue Fassung setzt State nur in Promise-Callbacks), Build ok.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "feat(detail): single-column detail page with hero image and app sections"
```

---

### Task 5: Sichtprüfung, Push, PR

- [ ] **Step 1: Browser**

`npm run dev -- --port 5199 --strictPort`, dann `http://localhost:5199/perfume/09625e97-33a7-46d0-8605-8a703b0ef762` (Firenze Per Due) und eines mit Reviews, z. B. `/perfume/004d2544-2560-4628-b442-b42ecc20f5f1`:
- Großes Bild oben mit Verlauf, Inhalt schiebt sich darüber; Champagner-Eyebrow verlinkt zur Marke; Serif-Name; EDP-Pille und Bewertungs-Pille.
- Ausgeloggt: Glas-Hinweis „Sign in to track this fragrance“ statt Kacheln; „Sign in to write a review“.
- Pyramide: Glas-Zeilen mit Icon, Label, Noten auf Englisch.
- Performance: vier Balken, Werte aus Community oder Code („Moderate“), Bottle/Value als 0–5.
- „More from …“ als Karussell ohne Badges. Reviews als Glas-Karten mit Champagner-Sternen.
- 390px: alles einspaltig, Kacheln 2×2.

- [ ] **Step 2: Suite, Build, Push, PR**

```bash
npm test 2>&1 | grep -E "Test Files|Tests "
npm run build 2>&1 | grep -E "built in|error"
git push -u origin redesign-5-detail
gh pr create --base main --head redesign-5-detail --title "feat(redesign): Detail page — hero image, action tiles, glass pyramid, performance panel" --body "$(cat <<'EOF'
## Summary
Step 5 of the redesign (spec Abschnitt 3 „Detail“, plan `docs/superpowers/plans/2026-10-03-redesign-5-detail.md`).

- `/perfume/:id` is one column (max 720px): full-width hero image fading into the background, champagne brand eyebrow (links to the brand), serif name, concentration and rating pills.
- Four glass action tiles — Want to try · Collection · Favorite · Add to list — on the shared `userPerfumeStore`; visitors get a sign-in hint. `UserPerfumeActions` removed.
- Fragrance pyramid as three glass rows with icons and English notes; a 2×2 performance panel (community averages when reviews exist, otherwise `longevity_code`/`sillage_code`; bottle and value from the 0–5 averages). `PerformanceBar` removed.
- "More from Brand" uses the carousel from Today/Catalog, now `PerfumeCarousel` in `components/perfume` with an optional rank badge.
- Reviews: glass cards, champagne stars, magenta like, occasion/season tags; "verdict" wording gone; `alert()`s replaced by toasts.

## Test plan
- [x] `npm test`; new tests for `lib/performance`, `PerfumeCarousel`, `ActionTiles`, `FragrancePyramid`, `PerformancePanel`, `PerfumeDetailPage`
- [x] `npm run build`
- [x] Browser check desktop and 390px, signed out
- [ ] Signed in: action tiles toggle, review form — behind the gate after deploy

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
