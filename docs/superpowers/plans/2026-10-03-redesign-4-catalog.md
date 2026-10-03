# Redesign Schritt 4: Catalog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Catalog bekommt die App-Karten (Bild mit Verlauf, Herz und Stern direkt auf dem Bild, Serif-Name, Magenta-Marke, Noten, Konzentrations-Tag), eine Suchzeile oben, die Filter-Spalte als Glas-Panel, das Trending-Karussell über dem Raster, aktive Filter als Chips und einen Longevity-Filter mit englischen Labels.

**Architecture:** Die Favoriten-/Collection-Zustände aller Karten kommen aus einem kleinen Zustand-Store (`userPerfumeStore`), der die Zeilen des Users einmal lädt; Karten lesen und toggeln darüber, statt je Karte eine Anfrage zu schicken. `PerfumeCard` wird ein `<article>` mit Link und zwei Buttons daneben (kein Button im Link). Longevity läuft über `longevity_code`; Labels und Mapping liegen in `src/lib/catalog.js`. Spec: `docs/superpowers/specs/2026-10-02-webapp-redesign-design.md`, Abschnitt 3 „Catalog“.

**Tech Stack:** React 19, React Router v7, Zustand, Supabase JS, Vite, Vanilla CSS, Vitest + RTL.

**Branch:** `redesign-4-catalog` von `main`. Alle Befehle aus `client/`. Commit-Trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

**Datenlage (geprüft):**
- `perfumes.longevity` ist deutscher Text („Moderat“, „Langhaltend“, „Lang“, „Sehr langhaltend“), `perfumes.longevity_code` ist `moderate | long | very_long`. 31 639 von 31 663 Zeilen sind `moderate`.
- Die RPC `get_perfumes_by_notes` (Pfad mit Notenfamilie) filtert `p.longevity ilike p_longevity`, also über den deutschen Text. Deshalb mappt der Client für diesen Pfad Code → deutsches Label. Die vier Zeilen mit „Lang“ fallen dabei bei `long` durch. Follow-up: RPC auf `longevity_code` umstellen (DB-Änderung, braucht Freigabe).
- `user_perfumes` hat `perfume_id, is_favorite, is_owned, is_want_to_try`; `togglePerfumeStatus(perfumeId, field)` existiert.
- Standardansicht wird das Raster (App-Vorbild); die Listenansicht bleibt als Alternative.

---

## Dateien

| Datei | Aktion | Verantwortung |
|---|---|---|
| `src/lib/catalog.js` (+ Test) | neu | Longevity-Codes, Labels, RPC-Mapping, Sortier-Optionen |
| `src/services/perfumeService.js` (+ Test) | ändern | Longevity über `longevity_code`, `getLongevityLevels` liefert Codes |
| `src/services/userPerfumeService.js` | ändern | `getUserPerfumeStatuses(userId)` |
| `src/store/userPerfumeStore.js` (+ Test) | neu | Status-Map des Users, optimistisches Toggle |
| `src/hooks/usePerfumeStatus.js` | neu | Store-Anbindung für eine Karte |
| `src/components/perfume/PerfumeCard.jsx`, `.css` (+ Test) | ersetzen | App-Karte mit Herz und Stern |
| `src/components/perfume/PerfumeGrid.jsx`, `.css` | ändern | Raster 180px, Skeleton ohne `.card` |
| `src/components/perfume/PerfumeRow.css` | ändern | Tokens, Serif-Name |
| `src/components/perfume/FilterPanel.jsx`, `.css` | ersetzen | Glas-Panel ohne Sortierung, Longevity-Labels |
| `src/components/perfume/FilterSheet.css` | ändern | Backdrop- und Flächenfarben |
| `src/pages/CatalogPage.jsx`, `.css` (+ Test) | ersetzen | Suche oben, Filter links, Trending, Chips, Sortier-Select, Brand-Link |
| `src/store/authStore.js` | ändern | Store beim Logout zurücksetzen |

---

### Task 1: Longevity-Vokabular und Service

**Files:**
- Create: `src/lib/catalog.js`, `src/lib/catalog.test.js`
- Modify: `src/services/perfumeService.js`, `src/services/perfumeService.test.js`
- Modify: `src/services/userPerfumeService.js`

- [ ] **Step 1: Test für `catalog.js`**

```js
import { describe, it, expect } from 'vitest';
import { LONGEVITY_OPTIONS, longevityLabel, longevityRpcLabel, SORT_OPTIONS, sortLabel } from './catalog';

describe('catalog vocabulary', () => {
  it('lists longevity codes in order with English labels', () => {
    expect(LONGEVITY_OPTIONS.map((o) => o.code)).toEqual(['moderate', 'long', 'very_long']);
    expect(longevityLabel('very_long')).toBe('Very long');
    expect(longevityLabel('unknown')).toBe('unknown');
  });

  it('maps codes to the German label the notes RPC still filters on', () => {
    expect(longevityRpcLabel('long')).toBe('Langhaltend');
    expect(longevityRpcLabel('')).toBeNull();
  });

  it('knows the sort options', () => {
    expect(SORT_OPTIONS.map((o) => o.value)).toEqual(['performance', 'newest', 'name', 'name_desc']);
    expect(sortLabel('performance')).toBe('Best rated');
    expect(sortLabel('nope')).toBe('nope');
  });
});
```

Run: `npx vitest run src/lib/catalog.test.js 2>&1 | tail -5` → FAIL (Import).

- [ ] **Step 2: `src/lib/catalog.js`**

```js
// Vokabular für Catalog-Filter. perfumes.longevity ist deutscher Text,
// perfumes.longevity_code das stabile Vokabular; die UI zeigt englische Labels.
export const LONGEVITY_OPTIONS = [
  { code: 'moderate', label: 'Moderate', rpcLabel: 'Moderat' },
  { code: 'long', label: 'Long', rpcLabel: 'Langhaltend' },
  { code: 'very_long', label: 'Very long', rpcLabel: 'Sehr langhaltend' },
];

export function longevityLabel(code) {
  return LONGEVITY_OPTIONS.find((o) => o.code === code)?.label ?? code;
}

// Die RPC get_perfumes_by_notes filtert noch über den deutschen Text
// (p.longevity ilike p_longevity). Bis sie auf longevity_code umgestellt ist,
// bekommt sie das Hauptlabel; die vier Zeilen mit "Lang" fallen bei long durch.
export function longevityRpcLabel(code) {
  return LONGEVITY_OPTIONS.find((o) => o.code === code)?.rpcLabel ?? null;
}

export const SORT_OPTIONS = [
  { value: 'performance', label: 'Best rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export function sortLabel(value) {
  return SORT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
```

Run: der Test → PASS (3).

- [ ] **Step 3: Service-Tests anpassen** (`perfumeService.test.js`)

Den Test `getLongevityLevels returns unique, sorted, non-null values` ersetzen durch:

```js
  it('getLongevityLevels returns the distinct codes in vocabulary order', async () => {
    mock.mockFrom('perfumes', {
      data: [{ longevity_code: 'long' }, { longevity_code: 'moderate' }, { longevity_code: 'long' }, { longevity_code: null }],
      error: null,
    });

    await expect(getLongevityLevels()).resolves.toEqual(['moderate', 'long']);
  });
```

Im `describe('getPerfumes')` ergänzen:

```js
  it('filters by longevity_code', async () => {
    const builder = mock.mockFrom('perfumes', { data: [], error: null, count: 0 });

    await getPerfumes({ longevity: 'long' });

    expect(builder.calls.eq).toEqual([['longevity_code', 'long']]);
  });

  it('passes the German label to the notes RPC when a family and longevity are set', async () => {
    mock.mockFrom('notes', { data: [{ name: 'Oud' }], error: null });
    mock.mockRpc('get_perfumes_by_notes', { data: [], error: null });

    await getPerfumes({ noteFamily: 'Woody', longevity: 'long' });

    expect(supabase.rpc).toHaveBeenCalledWith('get_perfumes_by_notes', expect.objectContaining({ p_longevity: 'Langhaltend' }));
  });
```

Run: `npx vitest run src/services/perfumeService.test.js 2>&1 | tail -8` → die drei Tests FAIL.

- [ ] **Step 4: Service umstellen** (`perfumeService.js`)

- Import oben: `import { longevityRpcLabel } from '../lib/catalog';`
- In `getPerfumesByNoteFamily`: `p_longevity: longevity || null,` → `p_longevity: longevityRpcLabel(longevity),`
- In `getPerfumes`: `query = query.eq('longevity', longevity);` → `query = query.eq('longevity_code', longevity);`
- `getLongevityLevels` ersetzen:

```js
/**
 * Distinct longevity codes present in the catalog, in vocabulary order
 * (see lib/catalog.js). The UI maps them to English labels.
 */
export async function getLongevityLevels() {
  const { data, error } = await supabase
    .from('perfumes')
    .select('longevity_code')
    .not('longevity_code', 'is', null);

  if (error) throw error;

  const present = new Set(data.map((d) => d.longevity_code).filter(Boolean));
  return LONGEVITY_OPTIONS.map((o) => o.code).filter((code) => present.has(code));
}
```
  und den Import erweitern: `import { LONGEVITY_OPTIONS, longevityRpcLabel } from '../lib/catalog';`

Run: Service-Tests → PASS.

- [ ] **Step 5: `getUserPerfumeStatuses`** — am Ende von `src/services/userPerfumeService.js`:

```js
/**
 * All status rows of a user, for the catalog cards (one query instead of
 * one per card). Returns [{ perfume_id, is_favorite, is_owned, is_want_to_try }].
 */
export async function getUserPerfumeStatuses(userId) {
  const { data, error } = await supabase
    .from('user_perfumes')
    .select('perfume_id, is_favorite, is_owned, is_want_to_try')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}
```

- [ ] **Step 6: Suite, Lint, Commit**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/lib/catalog.js src/services/perfumeService.js src/services/userPerfumeService.js ; npm run build 2>&1 | grep -E "built in|error"`

```bash
git add src/lib/catalog.js src/lib/catalog.test.js src/services
git commit -m "feat(catalog): longevity filter on longevity_code with English labels"
```

---

### Task 2: Status-Store und Hook

**Files:**
- Create: `src/store/userPerfumeStore.js`, `src/store/userPerfumeStore.test.js`
- Create: `src/hooks/usePerfumeStatus.js`
- Modify: `src/store/authStore.js` (Reset beim Logout)

- [ ] **Step 1: Test** (`userPerfumeStore.test.js`)

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/userPerfumeService', () => ({
  getUserPerfumeStatuses: vi.fn(),
  togglePerfumeStatus: vi.fn(),
}));
vi.mock('./toastStore', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { getUserPerfumeStatuses, togglePerfumeStatus } from '../services/userPerfumeService';
import { toast } from './toastStore';
import useUserPerfumeStore from './userPerfumeStore';

beforeEach(() => {
  vi.clearAllMocks();
  useUserPerfumeStore.getState().reset();
});

describe('userPerfumeStore', () => {
  it('loads the status map once per user', async () => {
    getUserPerfumeStatuses.mockResolvedValue([
      { perfume_id: 'p1', is_favorite: true, is_owned: false, is_want_to_try: false },
    ]);

    await useUserPerfumeStore.getState().load('u1');
    await useUserPerfumeStore.getState().load('u1');

    expect(getUserPerfumeStatuses).toHaveBeenCalledTimes(1);
    expect(useUserPerfumeStore.getState().statuses.p1.is_favorite).toBe(true);
    expect(useUserPerfumeStore.getState().loadedFor).toBe('u1');
  });

  it('reloads for a different user', async () => {
    getUserPerfumeStatuses.mockResolvedValue([]);

    await useUserPerfumeStore.getState().load('u1');
    await useUserPerfumeStore.getState().load('u2');

    expect(getUserPerfumeStatuses).toHaveBeenCalledTimes(2);
  });

  it('toggles optimistically and keeps the server result', async () => {
    togglePerfumeStatus.mockResolvedValue({ perfume_id: 'p1', is_favorite: true, is_owned: false, is_want_to_try: false });

    const pending = useUserPerfumeStore.getState().toggle('p1', 'is_favorite');
    expect(useUserPerfumeStore.getState().statuses.p1.is_favorite).toBe(true);
    await pending;

    expect(togglePerfumeStatus).toHaveBeenCalledWith('p1', 'is_favorite');
    expect(useUserPerfumeStore.getState().statuses.p1.is_favorite).toBe(true);
  });

  it('reverts and toasts when the toggle fails', async () => {
    togglePerfumeStatus.mockRejectedValue(new Error('boom'));

    await useUserPerfumeStore.getState().toggle('p1', 'is_owned');

    expect(useUserPerfumeStore.getState().statuses.p1?.is_owned ?? false).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Failed to update status: boom');
  });

  it('reset clears everything', async () => {
    getUserPerfumeStatuses.mockResolvedValue([{ perfume_id: 'p1', is_favorite: true }]);
    await useUserPerfumeStore.getState().load('u1');

    useUserPerfumeStore.getState().reset();

    expect(useUserPerfumeStore.getState()).toMatchObject({ statuses: {}, loadedFor: null });
  });
});
```

Run: `npx vitest run src/store/userPerfumeStore.test.js 2>&1 | tail -5` → FAIL (Import).

- [ ] **Step 2: Store** (`userPerfumeStore.js`)

```js
import { create } from 'zustand';
import { getUserPerfumeStatuses, togglePerfumeStatus } from '../services/userPerfumeService';
import { toast } from './toastStore';

const EMPTY_STATUS = { is_favorite: false, is_owned: false, is_want_to_try: false };

// Favorit/Collection/Want-to-try aller Düfte des eingeloggten Users, einmal
// geladen und von allen Karten geteilt. Toggles sind optimistisch.
const useUserPerfumeStore = create((set, get) => ({
  statuses: {},
  loadedFor: null,
  _loading: null,

  load: (userId) => {
    const { loadedFor, _loading } = get();
    if (loadedFor === userId) return Promise.resolve();
    if (_loading?.userId === userId) return _loading.promise;

    const promise = getUserPerfumeStatuses(userId)
      .then((rows) => {
        const statuses = {};
        for (const row of rows) statuses[row.perfume_id] = { ...EMPTY_STATUS, ...row };
        set({ statuses, loadedFor: userId, _loading: null });
      })
      .catch(() => set({ _loading: null }));
    set({ _loading: { userId, promise } });
    return promise;
  },

  toggle: async (perfumeId, field) => {
    const before = get().statuses[perfumeId] || EMPTY_STATUS;
    set((s) => ({ statuses: { ...s.statuses, [perfumeId]: { ...before, [field]: !before[field] } } }));
    try {
      const row = await togglePerfumeStatus(perfumeId, field);
      set((s) => ({ statuses: { ...s.statuses, [perfumeId]: { ...EMPTY_STATUS, ...row } } }));
    } catch (err) {
      set((s) => ({ statuses: { ...s.statuses, [perfumeId]: before } }));
      toast.error('Failed to update status: ' + err.message);
    }
  },

  reset: () => set({ statuses: {}, loadedFor: null, _loading: null }),
}));

export default useUserPerfumeStore;
```

Run: der Test → PASS (5).

- [ ] **Step 3: Hook** (`src/hooks/usePerfumeStatus.js`)

```js
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import useUserPerfumeStore from '../store/userPerfumeStore';

const EMPTY = { is_favorite: false, is_owned: false, is_want_to_try: false };

// Status einer Karte plus Toggle. Lädt die Map des Users beim ersten Aufruf.
export function usePerfumeStatus(perfumeId) {
  const { isAuthenticated, user } = useAuth();
  const userId = isAuthenticated && user ? user.id : null;
  const status = useUserPerfumeStore((s) => s.statuses[perfumeId]) || EMPTY;
  const load = useUserPerfumeStore((s) => s.load);
  const toggle = useUserPerfumeStore((s) => s.toggle);

  useEffect(() => {
    if (userId) load(userId);
  }, [userId, load]);

  return { isAuthenticated: !!userId, status, toggle: (field) => toggle(perfumeId, field) };
}
```

- [ ] **Step 4: Reset beim Logout** — in `src/store/authStore.js` oben importieren: `import useUserPerfumeStore from './userPerfumeStore';` und in `logout` nach `await supabase.auth.signOut();` die Zeile `useUserPerfumeStore.getState().reset();` einfügen. Außerdem im `onAuthStateChange`-Callback im `else`-Zweig (kein User) ebenfalls `useUserPerfumeStore.getState().reset();`.

Prüfen, dass kein Import-Zyklus entsteht: `userPerfumeStore` importiert `toastStore` und den Service, nicht `authStore`. OK.

- [ ] **Step 5: Suite, Lint, Commit**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/store src/hooks/usePerfumeStatus.js ; npm run build 2>&1 | grep -E "built in|error"`

```bash
git add src/store src/hooks/usePerfumeStatus.js
git commit -m "feat(catalog): shared user perfume status store"
```

---

### Task 3: `PerfumeCard` nach der App, Raster und Zeile

**Files:**
- Replace: `src/components/perfume/PerfumeCard.jsx`, `PerfumeCard.css`; Create: `PerfumeCard.test.jsx`
- Modify: `src/components/perfume/PerfumeGrid.jsx`, `PerfumeGrid.css`, `PerfumeRow.css`

- [ ] **Step 1: Test** (`PerfumeCard.test.jsx`)

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useNoteName', () => ({ useNoteName: () => (n) => ({ Mokka: 'Mocha' }[n] || n) }));
vi.mock('../../hooks/usePerfumeStatus', () => ({ usePerfumeStatus: vi.fn() }));

import { usePerfumeStatus } from '../../hooks/usePerfumeStatus';
import PerfumeCard from './PerfumeCard';

const perfume = {
  id: 'p1', name: 'Layton', image_url: 'https://x/l.png', concentration: 'EDP', performance: 4.26,
  brands: { name: 'Parfums de Marly' },
  perfume_notes: [
    { note_type: 'base', notes: { name: 'Vanille' } },
    { note_type: 'top', notes: { name: 'Mokka' } },
    { note_type: 'top', notes: { name: 'Apfel' } },
  ],
};

const renderCard = (p = perfume) => render(<MemoryRouter><PerfumeCard perfume={p} /></MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('PerfumeCard', () => {
  it('shows rating, serif name, brand, translated top notes and concentration', () => {
    usePerfumeStatus.mockReturnValue({ isAuthenticated: false, status: {}, toggle: vi.fn() });
    renderCard();

    expect(screen.getByRole('link', { name: /Layton/ })).toHaveAttribute('href', '/perfume/p1');
    expect(screen.getByText('★ 4.3')).toBeInTheDocument();
    expect(screen.getByText('Parfums de Marly')).toBeInTheDocument();
    expect(screen.getByText('Mocha · Apfel')).toBeInTheDocument();
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows heart and star for signed-in users and toggles through the hook', async () => {
    const toggle = vi.fn();
    usePerfumeStatus.mockReturnValue({ isAuthenticated: true, status: { is_favorite: true, is_owned: false }, toggle });
    const user = userEvent.setup();
    renderCard();

    const heart = screen.getByRole('button', { name: 'Remove from favorites' });
    expect(heart).toHaveAttribute('aria-pressed', 'true');
    await user.click(heart);
    expect(toggle).toHaveBeenCalledWith('is_favorite');

    await user.click(screen.getByRole('button', { name: 'Add to collection' }));
    expect(toggle).toHaveBeenCalledWith('is_owned');
  });

  it('falls back when data is missing', () => {
    usePerfumeStatus.mockReturnValue({ isAuthenticated: false, status: {}, toggle: vi.fn() });
    renderCard({ id: 'p2', name: 'Mystery' });

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByText(/★/)).toBeNull();
  });
});
```

Run: `npx vitest run src/components/perfume/PerfumeCard.test.jsx 2>&1 | tail -8` → FAIL.

- [ ] **Step 2: `PerfumeCard.jsx`** — vollständig ersetzen:

```jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from '@phosphor-icons/react';
import { useNoteName } from '../../hooks/useNoteName';
import { usePerfumeStatus } from '../../hooks/usePerfumeStatus';
import './PerfumeCard.css';

const TIER = { top: 0, mid: 1, base: 2 };

// Katalog-Karte nach der iOS-App: Bild mit Verlauf, Herz und Stern auf dem
// Bild (nur eingeloggt), Serif-Name, Marke in Magenta, Top-Noten, Konzentration.
// Die Buttons liegen neben dem Link, nicht darin (kein Button im Anker).
export default function PerfumeCard({ perfume }) {
  const brandName = perfume.brands?.name || 'Unknown';
  const noteName = useNoteName();
  const { isAuthenticated, status, toggle } = usePerfumeStatus(perfume.id);
  const [imgError, setImgError] = useState(false);

  const notes = [...(perfume.perfume_notes || [])]
    .filter((pn) => pn.notes?.name)
    .sort((a, b) => (TIER[a.note_type] ?? 3) - (TIER[b.note_type] ?? 3))
    .slice(0, 2)
    .map((pn) => noteName(pn.notes.name));

  return (
    <article className="pcard">
      <Link to={`/perfume/${perfume.id}`} className="pcard__link">
        <div className="pcard__image">
          {perfume.image_url && !imgError ? (
            <img src={perfume.image_url} alt="" loading="lazy" onError={() => setImgError(true)} />
          ) : (
            <span className="pcard__placeholder" aria-hidden="true">◆</span>
          )}
          <div className="pcard__scrim" aria-hidden="true" />
        </div>
        <div className="pcard__body">
          {perfume.performance != null && (
            <div className="pcard__rating">★ {Number(perfume.performance).toFixed(1)}</div>
          )}
          <h3 className="pcard__name">{perfume.name}</h3>
          <div className="pcard__brand">{brandName}</div>
          {notes.length > 0 && <div className="pcard__notes">{notes.join(' · ')}</div>}
          {perfume.concentration && <span className="pcard__tag">{perfume.concentration}</span>}
        </div>
      </Link>

      {isAuthenticated && (
        <div className="pcard__actions">
          <button
            type="button"
            className={`pcard__action ${status.is_owned ? 'pcard__action--on' : ''}`}
            aria-label={status.is_owned ? 'Remove from collection' : 'Add to collection'}
            aria-pressed={!!status.is_owned}
            onClick={() => toggle('is_owned')}
          >
            <Star size={18} weight={status.is_owned ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`pcard__action ${status.is_favorite ? 'pcard__action--on' : ''}`}
            aria-label={status.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={!!status.is_favorite}
            onClick={() => toggle('is_favorite')}
          >
            <Heart size={18} weight={status.is_favorite ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 3: `PerfumeCard.css`** — vollständig ersetzen:

```css
.pcard {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: var(--glass);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgba(194, 10, 102, 0.1);
  box-shadow: var(--inset-highlight);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.pcard:hover, .pcard:focus-within {
  transform: translateY(-2px);
  border-color: var(--accent-line);
  box-shadow: var(--inset-highlight), var(--glow-card);
}

.pcard__link { display: flex; flex-direction: column; flex: 1; color: inherit; text-decoration: none; }

.pcard__image {
  position: relative;
  aspect-ratio: 3 / 4;
  background: radial-gradient(ellipse at 50% 40%, #2A1220, var(--surface) 72%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.pcard__image img { width: 100%; height: 100%; object-fit: contain; padding: var(--space-4); }
.pcard__placeholder { color: var(--text-dim); font-size: 28px; }
.pcard__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent 50%);
  pointer-events: none;
}

.pcard__body { padding: 10px; display: flex; flex-direction: column; gap: 2px; }
.pcard__rating { font: 500 11px var(--font); color: var(--accent-soft); }
.pcard__name {
  font: 600 15px/1.2 var(--font-display);
  color: var(--text);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pcard__brand { font: 500 11px var(--font); color: rgba(231, 90, 156, 0.9); }
.pcard__notes { font: 400 10px var(--font); color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pcard__tag {
  align-self: flex-start;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--accent-tint);
  color: var(--accent-soft);
  font: 600 10px var(--font);
}

/* Herz und Stern liegen auf der Bildfläche, unten links/rechts. */
.pcard__actions {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: var(--space-3);
  pointer-events: none;
}
.pcard__action {
  pointer-events: auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}
.pcard__action:hover { transform: scale(1.08); }
.pcard__action--on { color: var(--accent-soft); box-shadow: 0 0 10px rgba(194, 10, 102, 0.5); }
```

- [ ] **Step 4: Raster und Zeile**

`PerfumeGrid.jsx`: im Skeleton-Zweig `className="perfume-card-skeleton card"` → `className="perfume-card-skeleton"` und das Padding-`div` auf `padding: '10px'` setzen.

`PerfumeGrid.css` — vollständig:

```css
.perfume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-6);
}

.perfume-card-skeleton {
  overflow: hidden;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface);
}

@media (max-width: 640px) {
  .perfume-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }
}
```

`PerfumeRow.css`: `.perfume-row__name { font: var(--weight-label) 16px var(--font); … }` → `font: 600 16px var(--font-display);`; `.perfume-row:hover .perfume-row__name { color: var(--accent-text); }` → `var(--accent-soft)`; `.perfume-row__score-value` Farbe → `var(--champagne)`.

- [ ] **Step 5: Tests, Lint, Commit**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/components/perfume ; npm run build 2>&1 | grep -E "built in|error"`

Hinweis: `ProfilePage` und `PerfumeDetailPage` nutzen `PerfumeCard` ebenfalls; sie bekommen die neue Karte automatisch.

```bash
git add src/components/perfume
git commit -m "feat(catalog): app-style perfume card with favorite and collection toggles"
```

---

### Task 4: `FilterPanel`, `FilterSheet`, `CatalogPage`

**Files:**
- Replace: `src/components/perfume/FilterPanel.jsx`, `FilterPanel.css`
- Modify: `src/components/perfume/FilterSheet.css`
- Replace: `src/pages/CatalogPage.jsx`, `CatalogPage.css`; Create: `src/pages/CatalogPage.test.jsx`

- [ ] **Step 1: Test** (`CatalogPage.test.jsx`)

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/perfumeService', () => ({
  getPerfumes: vi.fn(),
  getConcentrations: vi.fn(),
  getNoteFamilies: vi.fn(),
  getLongevityLevels: vi.fn(),
  getTrendingPerfumes: vi.fn(),
}));
vi.mock('../components/perfume/PerfumeCard', () => ({ default: ({ perfume }) => <div data-testid="card">{perfume.name}</div> }));
vi.mock('../components/perfume/PerfumeRow', () => ({ default: ({ perfume }) => <div data-testid="row">{perfume.name}</div> }));
vi.mock('../components/today/TrendingCarousel', () => ({ default: ({ items }) => <div data-testid="trending">{items.length}</div> }));

import { getPerfumes, getConcentrations, getNoteFamilies, getLongevityLevels, getTrendingPerfumes } from '../services/perfumeService';
import CatalogPage from './CatalogPage';

const perfumes = [{ id: 'a', name: 'Layton' }, { id: 'b', name: 'Oud Wood' }];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  getPerfumes.mockResolvedValue({ perfumes, total: 2 });
  getConcentrations.mockResolvedValue(['EDP', 'EDT']);
  getNoteFamilies.mockResolvedValue(['Woody']);
  getLongevityLevels.mockResolvedValue(['moderate', 'long']);
  getTrendingPerfumes.mockResolvedValue([{ id: 't1', rank: 1, name: 'T' }]);
});

const renderAt = (entry = '/catalog') => render(<MemoryRouter initialEntries={[entry]}><CatalogPage /></MemoryRouter>);

describe('CatalogPage', () => {
  it('renders the grid by default with the search box, trending and a brands link', async () => {
    renderAt();

    expect(await screen.findAllByTestId('card')).toHaveLength(2);
    expect(screen.getByRole('searchbox', { name: 'Search the catalog' })).toBeInTheDocument();
    expect(await screen.findByTestId('trending')).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: /Browse by brand/ })).toHaveAttribute('href', '/brands');
    expect(screen.getByText('2 fragrances')).toBeInTheDocument();
  });

  it('shows longevity options with English labels and sets the code in the URL', async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findAllByTestId('card');

    const panel = screen.getByRole('complementary', { name: 'Filters' });
    await user.click(within(panel).getByRole('button', { name: 'Long' }));

    expect(getPerfumes).toHaveBeenLastCalledWith(expect.objectContaining({ longevity: 'long' }));
    expect(screen.getByRole('button', { name: /Long ✕/ })).toBeInTheDocument();
  });

  it('reads filters from the URL and lets you clear a chip', async () => {
    const user = userEvent.setup();
    renderAt('/catalog?q=oud&concentration=EDP&longevity=very_long');
    await screen.findAllByTestId('card');

    expect(getPerfumes).toHaveBeenCalledWith(expect.objectContaining({ search: 'oud', concentration: 'EDP', longevity: 'very_long' }));
    expect(screen.getByRole('button', { name: /Very long ✕/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /EDP ✕/ }));
    expect(getPerfumes).toHaveBeenLastCalledWith(expect.objectContaining({ concentration: '' }));
  });

  it('switches sort from the toolbar select and view to rows', async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findAllByTestId('card');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), 'newest');
    expect(getPerfumes).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'newest' }));

    await user.click(screen.getByRole('button', { name: 'Row view' }));
    expect(await screen.findAllByTestId('row')).toHaveLength(2);
    expect(localStorage.getItem('scentboxd:catalogView')).toBe('rows');
  });

  it('collapses trending and remembers it', async () => {
    const user = userEvent.setup();
    renderAt();
    await screen.findByTestId('trending');

    await user.click(screen.getByRole('button', { name: 'Hide trending' }));
    expect(screen.queryByTestId('trending')).toBeNull();
    expect(localStorage.getItem('scentboxd:catalogTrending')).toBe('hidden');
  });
});
```

Run: `npx vitest run src/pages/CatalogPage.test.jsx 2>&1 | tail -8` → FAIL.

- [ ] **Step 2: `FilterPanel.jsx`** — vollständig ersetzen (ohne Sortierung; die wandert in die Toolbar):

```jsx
import { LONGEVITY_OPTIONS } from '../../lib/catalog';
import './FilterPanel.css';

function Group({ label, children }) {
  return (
    <div className="filter-panel__group">
      <span className="eyebrow filter-panel__label">{label}</span>
      {children}
    </div>
  );
}

function CheckItem({ active, onClick, children }) {
  return (
    <button type="button" className={`filter-panel__check-item ${active ? 'active' : ''}`} onClick={onClick} aria-pressed={active}>
      <span className="filter-panel__check-box" aria-hidden="true" />
      {children}
    </button>
  );
}

export default function FilterPanel({
  concentrations, concentration, onConcentrationChange,
  noteFamilies, noteFamily, onNoteFamilyChange,
  longevityLevels, longevity, onLongevityChange,
  onReset,
}) {
  const longevityOptions = LONGEVITY_OPTIONS.filter((o) => longevityLevels.includes(o.code));

  return (
    <div className="filter-panel glass">
      <Group label="Note family">
        <div className="filter-panel__chips">
          {noteFamilies.map((nf) => (
            <button key={nf} type="button" className="chip" aria-pressed={noteFamily === nf} onClick={() => onNoteFamilyChange(noteFamily === nf ? '' : nf)}>
              {nf}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Concentration">
        <div className="filter-panel__check-list">
          {concentrations.map((c) => (
            <CheckItem key={c} active={concentration === c} onClick={() => onConcentrationChange(concentration === c ? '' : c)}>{c}</CheckItem>
          ))}
        </div>
      </Group>

      <Group label="Longevity">
        <div className="filter-panel__check-list">
          {longevityOptions.map((o) => (
            <CheckItem key={o.code} active={longevity === o.code} onClick={() => onLongevityChange(longevity === o.code ? '' : o.code)}>{o.label}</CheckItem>
          ))}
        </div>
      </Group>

      <button type="button" className="btn btn-ghost btn-sm filter-panel__reset" onClick={onReset}>Reset all filters</button>
    </div>
  );
}
```

`FilterPanel.css` — vollständig:

```css
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-6);
}

.filter-panel__group { display: flex; flex-direction: column; gap: var(--space-3); }
.filter-panel__label { color: var(--text-muted); }

.filter-panel__chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }

.filter-panel__check-list { display: flex; flex-direction: column; }
.filter-panel__check-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 36px;
  padding: 0 var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font: 400 13.5px var(--font);
  color: var(--text-body);
  cursor: pointer;
  text-align: left;
}
.filter-panel__check-item:hover { background: rgba(255, 255, 255, 0.04); color: var(--text); }
.filter-panel__check-item.active { color: var(--text); }
.filter-panel__check-box {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid var(--hairline-strong);
  flex: none;
}
.filter-panel__check-item.active .filter-panel__check-box { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 8px rgba(194, 10, 102, 0.5); }

.filter-panel__reset { align-self: flex-start; }
```

`FilterSheet.css`: `background: rgba(22, 24, 38, 0.72);` → `background: rgba(19, 10, 16, 0.72);`; im `.filter-sheet`: `background: var(--surface);` → `background: var(--surface-solid);`; `.filter-sheet__header { font: var(--weight-heading) 20px var(--font); }` → `font: 600 20px var(--font-display);`. Die `FilterSheet.jsx` bleibt (sie reicht `filterProps` durch; `FilterPanel` ignoriert die nicht mehr genutzten Sort-Props).

- [ ] **Step 3: `CatalogPage.jsx`** — vollständig ersetzen:

```jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { List as ListIcon, MagnifyingGlass, SlidersHorizontal, SquaresFour } from '@phosphor-icons/react';
import { getPerfumes, getConcentrations, getNoteFamilies, getLongevityLevels, getTrendingPerfumes } from '../services/perfumeService';
import { longevityLabel, SORT_OPTIONS } from '../lib/catalog';
import { toast } from '../store/toastStore';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import PerfumeRow from '../components/perfume/PerfumeRow';
import FilterPanel from '../components/perfume/FilterPanel';
import FilterSheet from '../components/perfume/FilterSheet';
import TrendingCarousel from '../components/today/TrendingCarousel';
import SkeletonRow from '../components/layout/SkeletonRow';
import './CatalogPage.css';

const PAGE_SIZE = 24;
const VIEW_KEY = 'scentboxd:catalogView';
const TRENDING_KEY = 'scentboxd:catalogTrending';

const readStorage = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const writeStorage = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* privater Modus o. ä. */ }
};

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [perfumes, setPerfumes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [concentrations, setConcentrations] = useState([]);
  const [noteFamilies, setNoteFamilies] = useState([]);
  const [longevityLevels, setLongevityLevels] = useState([]);
  const [trending, setTrending] = useState([]);
  const [view, setView] = useState(() => readStorage(VIEW_KEY, 'grid'));
  const [trendingHidden, setTrendingHidden] = useState(() => readStorage(TRENDING_KEY, 'shown') === 'hidden');
  const [sheetOpen, setSheetOpen] = useState(false);

  const search = searchParams.get('q') || '';
  const concentration = searchParams.get('concentration') || '';
  const noteFamily = searchParams.get('family') || '';
  const longevity = searchParams.get('longevity') || '';
  const sortBy = searchParams.get('sort') || 'performance';

  useEffect(() => {
    Promise.all([getConcentrations(), getNoteFamilies(), getLongevityLevels()])
      .then(([c, nf, ll]) => { setConcentrations(c); setNoteFamilies(nf); setLongevityLevels(ll); })
      .catch((err) => toast.error('Failed to load filters: ' + err.message));
    getTrendingPerfumes().then(setTrending).catch(() => {});
  }, []);

  const loadPerfumes = useCallback(async (targetPage, append) => {
    (append ? setLoadingMore : setLoading)(true);
    try {
      const result = await getPerfumes({ search, concentration, noteFamily, longevity, sortBy, page: targetPage, pageSize: PAGE_SIZE });
      setPerfumes((prev) => (append ? [...prev, ...result.perfumes] : result.perfumes));
      setTotal(result.total);
      setPage(targetPage);
    } catch (err) {
      toast.error('Failed to load perfumes: ' + err.message);
    }
    (append ? setLoadingMore : setLoading)(false);
  }, [search, concentration, noteFamily, longevity, sortBy]);

  useEffect(() => { loadPerfumes(1, false); }, [loadPerfumes]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    setSearchParams(params);
  };
  const resetAll = () => setSearchParams(new URLSearchParams());

  const changeView = (v) => { setView(v); writeStorage(VIEW_KEY, v); };
  const toggleTrending = () => {
    const next = !trendingHidden;
    setTrendingHidden(next);
    writeStorage(TRENDING_KEY, next ? 'hidden' : 'shown');
  };

  const activeTags = [
    concentration && { key: 'concentration', label: concentration },
    noteFamily && { key: 'family', label: noteFamily },
    longevity && { key: 'longevity', label: longevityLabel(longevity) },
  ].filter(Boolean);

  const filterProps = {
    concentrations, concentration, onConcentrationChange: (v) => updateFilter('concentration', v),
    noteFamilies, noteFamily, onNoteFamilyChange: (v) => updateFilter('family', v),
    longevityLevels, longevity, onLongevityChange: (v) => updateFilter('longevity', v),
    onReset: resetAll,
  };

  return (
    <div className="container page catalog">
      <header className="catalog__head">
        <h1 className="catalog__title">Catalog</h1>
        <label className="catalog__search">
          <MagnifyingGlass size={16} aria-hidden="true" />
          <input
            type="search"
            className="input"
            placeholder="Search perfumes or brands…"
            aria-label="Search the catalog"
            value={search}
            onChange={(e) => updateFilter('q', e.target.value)}
          />
        </label>
      </header>

      <div className="catalog__layout">
        <aside className="catalog__sidebar" aria-label="Filters">
          <FilterPanel {...filterProps} />
        </aside>

        <div className="catalog__main">
          {trending.length > 0 && (
            <section className="catalog__trending">
              <div className="catalog__trending-head">
                <span className="eyebrow eyebrow--accent">Trending this week</span>
                <button type="button" className="catalog__trending-toggle" onClick={toggleTrending}>
                  {trendingHidden ? 'Show trending' : 'Hide trending'}
                </button>
              </div>
              {!trendingHidden && <TrendingCarousel items={trending} />}
            </section>
          )}

          <div className="catalog__toolbar">
            <div className="catalog__tags">
              <span className="catalog__count">{loading ? '…' : `${total} ${total === 1 ? 'fragrance' : 'fragrances'}`}</span>
              {activeTags.map((tag) => (
                <button key={tag.key} type="button" className="chip chip--active" onClick={() => updateFilter(tag.key, '')}>
                  {tag.label} ✕
                </button>
              ))}
            </div>
            <div className="catalog__controls">
              <button type="button" className="chip chip--active catalog__filter-btn" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal size={14} aria-hidden="true" /> Filter{activeTags.length ? ` · ${activeTags.length}` : ''}
              </button>
              <label className="catalog__sort">
                <span className="eyebrow">Sort</span>
                <select className="input" aria-label="Sort" value={sortBy} onChange={(e) => updateFilter('sort', e.target.value)}>
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <div className="catalog__view" role="group" aria-label="View">
                <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => changeView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'}>
                  <SquaresFour size={16} aria-hidden="true" />
                </button>
                <button type="button" className={view === 'rows' ? 'active' : ''} onClick={() => changeView('rows')} aria-label="Row view" aria-pressed={view === 'rows'}>
                  <ListIcon size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {view === 'grid' ? (
            loading || perfumes.length > 0 ? (
              <PerfumeGrid perfumes={perfumes} loading={loading} />
            ) : (
              <EmptyState onReset={resetAll} />
            )
          ) : (
            <div className="catalog__rows">
              {loading ? <SkeletonRow count={8} /> : perfumes.length === 0 ? <EmptyState onReset={resetAll} /> : perfumes.map((p) => <PerfumeRow key={p.id} perfume={p} />)}
            </div>
          )}

          {!loading && perfumes.length < total && (
            <div className="catalog__more">
              <button type="button" className="btn btn-secondary" onClick={() => loadPerfumes(page + 1, true)} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Load ${PAGE_SIZE} more`}
              </button>
              <span>Showing {perfumes.length} of {total}</span>
            </div>
          )}

          <p className="catalog__brands">
            Looking for a house? <Link to="/brands">Browse by brand →</Link>
          </p>
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={total} {...filterProps} />
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="catalog__empty glass">
      <h2 className="catalog__empty-title">Nothing matches these filters.</h2>
      <p>Try dropping one of the active filters.</p>
      <button type="button" className="btn btn-primary" onClick={onReset}>Reset all</button>
    </div>
  );
}
```

- [ ] **Step 4: `CatalogPage.css`** — vollständig ersetzen:

```css
.catalog__head {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
  flex-wrap: wrap;
}
.catalog__title { font-size: 32px; }

.catalog__search {
  position: relative;
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
}
.catalog__search svg { position: absolute; left: 14px; color: var(--text-muted); pointer-events: none; }
.catalog__search .input { padding-left: 40px; min-height: 48px; }

.catalog__layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--space-8);
  align-items: start;
}
.catalog__sidebar { position: sticky; top: calc(var(--nav-height) + var(--space-6)); }
.catalog__main { min-width: 0; display: flex; flex-direction: column; gap: var(--space-6); }

.catalog__trending { display: flex; flex-direction: column; gap: var(--space-3); }
.catalog__trending-head { display: flex; align-items: center; justify-content: space-between; }
.catalog__trending-toggle {
  border: none;
  background: none;
  color: var(--text-muted);
  font: 500 12px var(--font);
  cursor: pointer;
}
.catalog__trending-toggle:hover { color: var(--accent-soft); }

.catalog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.catalog__tags { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.catalog__count { font: 500 13px var(--font); color: var(--text-muted); margin-right: var(--space-2); }
.catalog__controls { display: flex; align-items: center; gap: var(--space-3); }
.catalog__filter-btn { display: none; gap: var(--space-2); }

.catalog__sort { display: flex; align-items: center; gap: var(--space-2); }
.catalog__sort .input { width: auto; min-height: 36px; padding-right: 36px; font-size: 13px; }

.catalog__view { display: flex; gap: 2px; padding: 2px; border: 1px solid var(--hairline); border-radius: var(--radius-md); }
.catalog__view button {
  min-height: 32px;
  width: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.catalog__view button.active { background: var(--accent-tint); color: var(--accent-soft); }

.catalog__rows { display: flex; flex-direction: column; }

.catalog__empty { padding: var(--space-10); }
.catalog__empty-title { font-size: 20px; margin-bottom: var(--space-2); }
.catalog__empty p { color: var(--text-muted); margin-bottom: var(--space-6); }

.catalog__more { display: flex; align-items: center; gap: var(--space-6); padding-top: var(--space-6); border-top: 1px solid var(--hairline); }
.catalog__more span { font: 400 12.5px var(--font); color: var(--text-dim); }

.catalog__brands { font: 400 13.5px var(--font); color: var(--text-muted); }
.catalog__brands a { color: var(--accent-soft); }

@media (max-width: 899px) {
  .catalog__layout { grid-template-columns: 1fr; }
  .catalog__sidebar { display: none; }
  .catalog__filter-btn { display: inline-flex; }
}
```

- [ ] **Step 5: Tests, Lint, Build**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/pages/CatalogPage.jsx src/pages/CatalogPage.test.jsx src/components/perfume/FilterPanel.jsx ; npm run build 2>&1 | grep -E "built in|error"`

Bekannt: `CatalogPage.jsx` hatte einen alten `react-hooks/set-state-in-effect`-Fehler in `loadPerfumes` (`setLoading(true)` synchron im Effekt über `loadPerfumes`). Die neue Fassung ruft `loadPerfumes` aus dem Effekt auf; falls der Linter weiter meckert, den Aufruf in eine Mikro-Task verlegen: `useEffect(() => { const id = setTimeout(() => loadPerfumes(1, false), 0); return () => clearTimeout(id); }, [loadPerfumes]);` ist **nicht** gewünscht (Flackern). Stattdessen akzeptieren wir den bestehenden Lint-Hinweis an dieser Stelle und notieren ihn im PR, wie bei Navbar.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "feat(catalog): search bar, glass filters, trending, chips and sort toolbar"
```

---

### Task 5: Sichtprüfung, Push, PR

- [ ] **Step 1: Browser**

`npm run dev -- --port 5199 --strictPort`, dann `http://localhost:5199/catalog`:
- Suchzeile oben in voller Breite, links Glas-Filterpanel (Note family als Chips, Concentration, Longevity mit „Moderate/Long/Very long“), rechts Trending-Karussell (klappbar), Toolbar mit Zähler, Chips, Sortier-Select, Raster/Liste.
- Karten: Bild mit Verlauf, Serif-Name, Magenta-Marke, Noten auf Englisch, EDP-Tag. Ausgeloggt keine Herz/Stern-Buttons.
- `?longevity=long` zeigt Chip „Long ✕“; `?family=Woody&longevity=long` liefert Ergebnisse (RPC-Pfad).
- 390px: Filter-Button als Magenta-Chip öffnet das Sheet; Raster zweispaltig.
- Vergleich mit dem Mockup „Catalog B“ in `.superpowers/brainstorm/*/content/catalog-layout.html`.

- [ ] **Step 2: Suite, Build, Push, PR**

```bash
npm test 2>&1 | grep -E "Test Files|Tests "
npm run build 2>&1 | grep -E "built in|error"
git push -u origin redesign-4-catalog
gh pr create --base main --head redesign-4-catalog --title "feat(redesign): Catalog — app-style cards, glass filters, trending, English longevity" --body "$(cat <<'EOF'
## Summary
Step 4 of the redesign (spec Abschnitt 3 „Catalog“, plan `docs/superpowers/plans/2026-10-03-redesign-4-catalog.md`).

- `PerfumeCard` rebuilt after the iOS card: 3:4 image with scrim, heart (favorite) and star (collection) on the image for signed-in users, serif name, magenta brand, English top notes, concentration tag. Statuses come from a shared `userPerfumeStore` (one query per user, optimistic toggles) instead of one request per card. Profile and detail pages get the new card too.
- Catalog page: full-width search, glass filter panel on the left (note family chips, concentration, longevity), trending carousel above the grid (collapsible, remembered), active filters as chips with ✕, sort as a select in the toolbar, grid as default view with rows as an alternative, "Browse by brand" link.
- Longevity filter now uses `longevity_code` with English labels (Moderate / Long / Very long). `perfumes.longevity` is German text. For the note-family path the client maps the code to the German label because `get_perfumes_by_notes` still filters on the text column.

## Follow-ups
- Switch `get_perfumes_by_notes` to filter on `longevity_code` (DB change) and drop the label mapping.
- `CatalogPage` keeps the pre-existing `react-hooks/set-state-in-effect` lint hint in its load effect, same as Navbar.

## Test plan
- [x] `npm test`; new tests for `lib/catalog`, longevity service paths, `userPerfumeStore`, `PerfumeCard`, `CatalogPage`
- [x] `npm run build`
- [x] Browser check desktop and 390px, signed out
- [ ] Signed in: heart/star toggles on cards, behind the gate after deploy

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
