# Redesign Schritt 2: Navigation und Routen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Webapp bekommt die Navigation der iOS-App (Today, Catalog, Favorites, Collection, Community), neue Routen mit Weiterleitung von `/explore`, eine Shelf-Seite für Favorites und Collection, eine Community-Seite mit dem Aktivitäts-Feed, eine Glas-Navbar und eine neue mobile Tab-Leiste. Das Wording wechselt von Feed/Index/Houses/Shelf/Verdicts zu Today/Catalog/Brands/Collection/Reviews.

**Architecture:** Routen in `App.jsx`; `AppRoutes` wird testbar (ohne eigenen Router). Der Aktivitäts-Feed zieht aus `HomePage` in den Hook `useActivityFeed` (mit purer Funktion `loadActivity`) und die Komponente `ActivityRow`, beide von Today und Community geteilt. `RequireAuth` bekommt einen `prompt`-Modus, der statt Redirect eine Sign-in-Karte zeigt. Spec: `docs/superpowers/specs/2026-10-02-webapp-redesign-design.md`, Abschnitt 2.

**Tech Stack:** React 19, React Router v7, Zustand, Vite, Vanilla CSS, Vitest + React Testing Library, Phosphor Icons.

**Branch:** `redesign-2-navigation` (von `redesign` abgezweigt, bereits ausgecheckt). Alle Befehle aus `client/`. Commit-Trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## Dateien

| Datei | Aktion | Verantwortung |
|---|---|---|
| `src/hooks/useAuth.js` | ändern | `profilePath`, `collectionPath` statt `shelfPath` |
| `src/components/layout/ExploreRedirect.jsx` (+ Test) | neu | `/explore?…` → `/catalog?…` |
| `src/App.jsx` | ändern | neue Routen, `AppRoutes` exportiert |
| `src/pages/CatalogPage.jsx`, `.css` | umbenennen | ehemals `ExplorePage`, Titel „Catalog“ |
| `src/hooks/useActivityFeed.js` (+ Test) | neu | Feed-Logik: Following → global, Blockierte raus |
| `src/components/community/ActivityRow.jsx`, `.css` (+ Test) | neu | Eine Aktivitätszeile |
| `src/pages/HomePage.jsx`, `.css` | ändern | nutzt Hook und `ActivityRow`, neues Wording |
| `src/components/layout/RequireAuth.jsx` (+ Test) | ändern | `prompt`-Modus mit Sign-in-Karte |
| `src/components/layout/SignInPrompt.jsx`, `.css` | neu | Glas-Karte mit Sign-in-Button |
| `src/pages/ShelfPage.jsx`, `.css` (+ Test) | neu | Favorites / Collection |
| `src/pages/CommunityPage.jsx`, `.css` (+ Test) | neu | Feed in voller Länge, Following/Everyone |
| `src/components/layout/Navbar.jsx`, `.css` (+ Test) | ersetzen | Glas-Leiste, fünf Links, Avatar |
| `src/components/layout/TabBar.jsx`, `.css` (+ Test) | ersetzen | fünf Tabs |
| `src/components/layout/AccountMenu.jsx`, `.css` | ändern | neue Links und Wording |
| `src/components/layout/Footer.jsx` | ändern | Links auf Catalog, Brands, Community |
| `src/pages/AccountPage.jsx`, `NotFoundPage.jsx`, `PerfumeDetailPage.jsx` | ändern | Links und Wording |

---

### Task 1: Pfade, Redirect und Routen

**Files:**
- Modify: `src/hooks/useAuth.js`
- Create: `src/components/layout/ExploreRedirect.jsx`, `src/components/layout/ExploreRedirect.test.jsx`
- Rename: `src/pages/ExplorePage.jsx` → `src/pages/CatalogPage.jsx`, `src/pages/ExplorePage.css` → `src/pages/CatalogPage.css`
- Modify: `src/App.jsx`, `src/components/layout/Footer.jsx`, `src/pages/NotFoundPage.jsx`, `src/pages/PerfumeDetailPage.jsx`

- [ ] **Step 1: Test für den Redirect schreiben** (`ExploreRedirect.test.jsx`)

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ExploreRedirect from './ExploreRedirect';

function Probe() {
  const { pathname, search } = useLocation();
  return <p>{pathname + search}</p>;
}

const renderAt = (entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/explore" element={<ExploreRedirect />} />
        <Route path="/catalog" element={<Probe />} />
      </Routes>
    </MemoryRouter>
  );

describe('ExploreRedirect', () => {
  it('sends /explore to /catalog', () => {
    renderAt('/explore');
    expect(screen.getByText('/catalog')).toBeInTheDocument();
  });

  it('keeps the query string', () => {
    renderAt('/explore?q=oud&sort=name');
    expect(screen.getByText('/catalog?q=oud&sort=name')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test laufen lassen, muss fehlschlagen**

Run: `npx vitest run src/components/layout/ExploreRedirect.test.jsx 2>&1 | tail -5`
Expected: FAIL, `Failed to resolve import "./ExploreRedirect"`.

- [ ] **Step 3: Redirect-Komponente** (`ExploreRedirect.jsx`)

```jsx
import { Navigate, useLocation } from 'react-router-dom';

// Alte Catalog-URL. Query-String (Suche, Filter) bleibt erhalten.
export default function ExploreRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/catalog${search}`} replace />;
}
```

Run: `npx vitest run src/components/layout/ExploreRedirect.test.jsx 2>&1 | tail -5` → PASS (2).

- [ ] **Step 4: useAuth umstellen** — `src/hooks/useAuth.js` vollständig:

```js
import useAuthStore from '../store/authStore';

export function useAuth() {
  const { user, profile, session, loading, error, login, register, logout, clearError, setProfile } =
    useAuthStore();

  const isAuthenticated = !!session;
  // Eigene Profilseite (Listen, Reviews). Nicht eingeloggt → Login.
  const profilePath = isAuthenticated ? `/profile/${profile?.username || 'me'}` : '/login';
  const collectionPath = '/collection';
  const favoritesPath = '/favorites';

  return {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated,
    profilePath,
    collectionPath,
    favoritesPath,
    // Übergangsalias, bis Navbar, TabBar, AccountMenu und AccountPage in
    // Task 5 umgestellt sind. Danach entfernen.
    shelfPath: profilePath,
    login,
    register,
    logout,
    clearError,
    setProfile,
  };
}
```

- [ ] **Step 5: ExplorePage → CatalogPage umbenennen**

```bash
git mv src/pages/ExplorePage.jsx src/pages/CatalogPage.jsx
git mv src/pages/ExplorePage.css src/pages/CatalogPage.css
```

In `src/pages/CatalogPage.jsx`:
- `import './ExplorePage.css';` → `import './CatalogPage.css';`
- `export default function ExplorePage()` → `export default function CatalogPage()`
- `<h1 className="explore__title">Index</h1>` → `<h1 className="explore__title">Catalog</h1>`

Die CSS-Klassen (`explore__…`) und der localStorage-Key bleiben; die Seite wird in Schritt 4 neu gebaut.

- [ ] **Step 6: App.jsx** — vollständig ersetzen:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import Layout from './components/layout/Layout';
import RequireAuth from './components/layout/RequireAuth';
import ExploreRedirect from './components/layout/ExploreRedirect';
import ToastContainer from './components/layout/ToastContainer';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ShelfPage from './pages/ShelfPage';
import CommunityPage from './pages/CommunityPage';
import PerfumeDetailPage from './pages/PerfumeDetailPage';
import BrandsOverviewPage from './pages/BrandsOverviewPage';
import BrandPage from './pages/BrandPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import ListDetailPage from './pages/ListDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import MaintenanceGate from './components/layout/MaintenanceGate';
import { isMaintenanceMode } from './config/maintenance';

export default function App() {
  // Absichtlich vor jedem Hook: App selbst hält keinen State, deshalb kann
  // dieser Early Return die Rules of Hooks nicht verletzen.
  if (isMaintenanceMode()) {
    return (
      <MaintenanceGate>
        <AppRouter />
      </MaintenanceGate>
    );
  }

  return <AppRouter />;
}

function AppRouter() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <AppRoutes />
    </BrowserRouter>
  );
}

// Ohne eigenen Router, damit Tests einen MemoryRouter drumherum legen können.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/explore" element={<ExploreRedirect />} />
        <Route
          path="/favorites"
          element={
            <RequireAuth prompt={{ title: 'Your favorites', text: 'Sign in to see the fragrances you marked with a heart.' }}>
              <ShelfPage status="favorite" />
            </RequireAuth>
          }
        />
        <Route
          path="/collection"
          element={
            <RequireAuth prompt={{ title: 'Your collection', text: 'Sign in to keep track of the bottles you own.' }}>
              <ShelfPage status="owned" />
            </RequireAuth>
          }
        />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/perfume/:id" element={<PerfumeDetailPage />} />
        <Route path="/brands" element={<BrandsOverviewPage />} />
        <Route path="/brand/:id" element={<BrandPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/profile/:username" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="/list/:id" element={<ListDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
```

`ShelfPage` und `CommunityPage` entstehen in Task 3 und 4. Damit Build und Tests zwischendurch laufen, in diesem Task zwei Platzhalter anlegen, die in Task 3/4 ersetzt werden:

`src/pages/ShelfPage.jsx`:
```jsx
export default function ShelfPage() {
  return null;
}
```
`src/pages/CommunityPage.jsx`:
```jsx
export default function CommunityPage() {
  return null;
}
```

`RequireAuth` bekommt das `prompt`-Prop erst in Task 3; bis dahin ignoriert es das Prop, das ist in Ordnung.

- [ ] **Step 7: Alte Links umbiegen**

- `src/components/layout/Footer.jsx`: Block `footer__links` ersetzen durch

```jsx
        <div className="footer__links">
          <div className="footer__column">
            <h4>Discover</h4>
            <Link to="/catalog">Catalog</Link>
            <Link to="/brands">Brands</Link>
            <Link to="/community">Community</Link>
          </div>
          <div className="footer__column">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
          </div>
        </div>
```

- `src/pages/NotFoundPage.jsx`: `to="/explore"` → `to="/catalog"`; falls der Button-Text „Index“ oder „Explore“ enthält, auf „Browse the catalog“ ändern.
- `src/pages/PerfumeDetailPage.jsx`: `<Link to="/explore" className="btn btn-primary">Back to Index</Link>` → `<Link to="/catalog" className="btn btn-primary">Back to Catalog</Link>`.

- [ ] **Step 8: Prüfen**

Run: `grep -rn "shelfPath\|/explore" src --include='*.jsx' --include='*.js' | grep -v "ExploreRedirect\|\.test\."`
Expected: nur noch Treffer in `Navbar.jsx`, `TabBar.jsx`, `AccountMenu.jsx`, `AccountPage.jsx`, `HomePage.jsx` (werden in Task 2 und 5 bereinigt).

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npm run build 2>&1 | grep -E "built in|error"`
Expected: Tests grün, Build ok. Navbar, TabBar, AccountMenu und AccountPage laufen bis Task 5 über den Übergangsalias `shelfPath`.

- [ ] **Step 9: Commit**

```bash
git add -A src
git commit -m "feat(redesign): catalog route with explore redirect, new auth paths"
```

---

### Task 2: Aktivitäts-Feed als Hook und Komponente

**Files:**
- Create: `src/hooks/useActivityFeed.js`, `src/hooks/useActivityFeed.test.js`
- Create: `src/components/community/ActivityRow.jsx`, `ActivityRow.css`, `ActivityRow.test.jsx`
- Modify: `src/pages/HomePage.jsx`, `src/pages/HomePage.css`

- [ ] **Step 1: Test für `loadActivity`** (`useActivityFeed.test.js`)

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/reviewService', () => ({
  getLatestReviews: vi.fn(),
  getReviewsByUserIds: vi.fn(),
}));
vi.mock('../services/followService', () => ({ getFollowingIds: vi.fn() }));
vi.mock('../services/blockService', () => ({ getBlockedIds: vi.fn() }));

import { getLatestReviews, getReviewsByUserIds } from '../services/reviewService';
import { getFollowingIds } from '../services/followService';
import { getBlockedIds } from '../services/blockService';
import { loadActivity } from './useActivityFeed';

const review = (id, user_id) => ({ id, user_id });

beforeEach(() => {
  vi.clearAllMocks();
  getBlockedIds.mockResolvedValue([]);
  getFollowingIds.mockResolvedValue([]);
  getLatestReviews.mockResolvedValue([review('g1', 'x'), review('g2', 'y')]);
  getReviewsByUserIds.mockResolvedValue([]);
});

describe('loadActivity', () => {
  it('uses the global feed for visitors without touching follow or block data', async () => {
    const result = await loadActivity({ userId: null, limit: 4, scope: 'auto' });

    expect(result).toEqual({ items: [review('g1', 'x'), review('g2', 'y')], personalized: false });
    expect(getFollowingIds).not.toHaveBeenCalled();
    expect(getBlockedIds).not.toHaveBeenCalled();
    expect(getLatestReviews).toHaveBeenCalledWith(4);
  });

  it('prefers reviews from followed users', async () => {
    getFollowingIds.mockResolvedValue(['a', 'b']);
    getReviewsByUserIds.mockResolvedValue([review('f1', 'a')]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'auto' });

    expect(result).toEqual({ items: [review('f1', 'a')], personalized: true });
    expect(getReviewsByUserIds).toHaveBeenCalledWith(['a', 'b'], 4);
    expect(getLatestReviews).not.toHaveBeenCalled();
  });

  it('falls back to the global feed when followed users posted nothing', async () => {
    getFollowingIds.mockResolvedValue(['a']);
    getReviewsByUserIds.mockResolvedValue([]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'auto' });

    expect(result.personalized).toBe(false);
    expect(result.items).toHaveLength(2);
  });

  it('keeps the following scope even when it is empty', async () => {
    getFollowingIds.mockResolvedValue(['a']);
    getReviewsByUserIds.mockResolvedValue([]);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'following' });

    expect(result).toEqual({ items: [], personalized: true });
    expect(getLatestReviews).not.toHaveBeenCalled();
  });

  it('uses the global feed when the scope is everyone, even with follows', async () => {
    getFollowingIds.mockResolvedValue(['a']);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'everyone' });

    expect(result.personalized).toBe(false);
    expect(getReviewsByUserIds).not.toHaveBeenCalled();
  });

  it('filters reviews by blocked users out of both feeds', async () => {
    getBlockedIds.mockResolvedValue(['y']);

    const result = await loadActivity({ userId: 'me', limit: 4, scope: 'auto' });

    expect(result.items).toEqual([review('g1', 'x')]);
  });
});
```

- [ ] **Step 2: Test laufen lassen, muss fehlschlagen**

Run: `npx vitest run src/hooks/useActivityFeed.test.js 2>&1 | tail -5` → FAIL (Import nicht auflösbar).

- [ ] **Step 3: Hook und Funktion** (`src/hooks/useActivityFeed.js`)

```js
import { useEffect, useState } from 'react';
import { getLatestReviews, getReviewsByUserIds } from '../services/reviewService';
import { getFollowingIds } from '../services/followService';
import { getBlockedIds } from '../services/blockService';
import { useAuth } from './useAuth';

// Reine Lade-Logik, getrennt vom Hook, damit sie ohne React testbar ist.
//
// scope: 'auto'      → Leute, denen man folgt; wenn die nichts gepostet haben, global
//        'following' → nur Leute, denen man folgt (auch wenn leer)
//        'everyone'  → global
// Blockierte Nutzer fliegen immer raus. Ohne userId gibt es nur den globalen Feed.
export async function loadActivity({ userId, limit, scope }) {
  const [followingIds, blockedIds] = userId
    ? await Promise.all([getFollowingIds(userId).catch(() => []), getBlockedIds().catch(() => [])])
    : [[], []];
  const notBlocked = (r) => !blockedIds.includes(r.user_id);

  if (scope !== 'everyone' && followingIds.length > 0) {
    const followed = (await getReviewsByUserIds(followingIds, limit).catch(() => [])).filter(notBlocked);
    if (followed.length > 0 || scope === 'following') return { items: followed, personalized: true };
  }

  const latest = (await getLatestReviews(limit).catch(() => [])).filter(notBlocked);
  return { items: latest, personalized: false };
}

export function useActivityFeed({ limit = 4, scope = 'auto' } = {}) {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const userId = isAuthenticated && user ? user.id : null;

  useEffect(() => {
    let active = true;
    loadActivity({ userId, limit, scope })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setPersonalized(result.personalized);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, limit, scope]);

  return { items, personalized, loading };
}
```

Run: `npx vitest run src/hooks/useActivityFeed.test.js 2>&1 | tail -5` → PASS (6).

- [ ] **Step 4: Test für `ActivityRow`** (`src/components/community/ActivityRow.test.jsx`)

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActivityRow from './ActivityRow';

const review = {
  id: 'r1',
  rating: 4,
  created_at: '2026-09-30T10:00:00Z',
  profiles: { username: 'mara', avatar_url: null },
  perfumes: { id: 'p1', name: 'Layton', brands: { name: 'Parfums de Marly' } },
};

describe('ActivityRow', () => {
  it('links the user to their profile and the perfume to its page', () => {
    render(<MemoryRouter><ActivityRow review={review} /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'mara' })).toHaveAttribute('href', '/profile/mara');
    expect(screen.getByRole('link', { name: 'Layton' })).toHaveAttribute('href', '/perfume/p1');
    expect(screen.getByText('★ 4')).toBeInTheDocument();
  });

  it('falls back when the profile is missing', () => {
    render(<MemoryRouter><ActivityRow review={{ ...review, profiles: null }} /></MemoryRouter>);

    expect(screen.getByText('Someone')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/components/community/ActivityRow.test.jsx 2>&1 | tail -5` → FAIL (Import).

- [ ] **Step 5: Komponente** (`ActivityRow.jsx`)

```jsx
import { Link } from 'react-router-dom';
import './ActivityRow.css';

// Eine Zeile im Aktivitäts-Feed: wer hat was bewertet.
export default function ActivityRow({ review }) {
  const username = review.profiles?.username;
  const avatar = review.profiles?.avatar_url;
  const perfume = review.perfumes;

  return (
    <div className="activity-row">
      <span className="activity-row__avatar">
        {avatar ? <img src={avatar} alt="" /> : (username || 'S')[0].toUpperCase()}
      </span>
      <div className="activity-row__body">
        <div className="activity-row__text">
          {username ? <Link to={`/profile/${username}`}>{username}</Link> : <strong>Someone</strong>}
          {' rated '}
          {perfume ? <Link to={`/perfume/${perfume.id}`}>{perfume.name}</Link> : <strong>a fragrance</strong>}
          {review.rating != null && <span className="activity-row__rating">★ {review.rating}</span>}
        </div>
        <div className="activity-row__time">{new Date(review.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
}
```

`ActivityRow.css`:

```css
.activity-row {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--hairline);
}
.activity-row:first-child { border-top: none; }

.activity-row__avatar {
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 50%;
  background: var(--accent-tint);
  color: var(--accent-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font: 600 12px var(--font);
  overflow: hidden;
}
.activity-row__avatar img { width: 100%; height: 100%; object-fit: cover; }

.activity-row__text { font: 400 13px/1.5 var(--font); color: var(--text-body); }
.activity-row__text a, .activity-row__text strong { color: var(--text); font-weight: 600; }
.activity-row__text a:hover { color: var(--accent-soft); }

.activity-row__rating {
  margin-left: var(--space-3);
  color: var(--champagne);
  font-size: 12px;
}

.activity-row__time { font: 400 11.5px var(--font); color: var(--text-dim); margin-top: 2px; }
```

Run: `npx vitest run src/components/community/ActivityRow.test.jsx 2>&1 | tail -5` → PASS (2).

- [ ] **Step 6: HomePage auf Hook und Komponente umstellen**

In `src/pages/HomePage.jsx`:

a) Imports: `getReviewsByUserIds` aus dem `reviewService`-Import entfernen, die Imports von `getFollowingIds` und `getBlockedIds` komplett entfernen, hinzufügen:

```jsx
import { useActivityFeed } from '../hooks/useActivityFeed';
import ActivityRow from '../components/community/ActivityRow';
```

b) Die lokale Funktion `ActivityRow` (oben in der Datei) löschen.

c) Die States `activity` und `personalized` entfernen und stattdessen nach `const { isAuthenticated, user } = useAuth();` einfügen:

```jsx
  const { items: activity, personalized, loading: activityLoading } = useActivityFeed({ limit: 4 });
```

d) Den ersten `useEffect` (der `load` definiert) ersetzen durch:

```jsx
  useEffect(() => {
    const load = async () => {
      const blockedIds = isAuthenticated && user ? await getBlockedIds().catch(() => []) : [];
      const notBlocked = (r) => !blockedIds.includes(r.user_id);

      const [bottleResult, topResult] = await Promise.allSettled([
        getPerfumes({ sortBy: 'performance', pageSize: 1 }),
        getLatestReviews(4),
      ]);
      if (bottleResult.status === 'fulfilled') setBottleOfDay(bottleResult.value.perfumes?.[0] || null);
      if (topResult.status === 'fulfilled') {
        setVerdicts((blockedIds.length ? topResult.value.filter(notBlocked) : topResult.value).slice(0, 2));
      }
      setLoading(false);
    };
    load();
  }, [isAuthenticated, user]);
```

und `getBlockedIds` wieder importieren: `import { getBlockedIds } from '../services/blockService';`

e) Im JSX:
- `<span className="feed__label">Your shelf</span>` → `Your collection`
- `<div className="feed__stat-row"><span>Owned</span>` → `<span>In collection</span>`
- `<span>Verdicts written</span>` → `<span>Reviews written</span>`
- `Sign in to track your shelf` → `Sign in to track your collection`
- Aktivitäts-Block: `{activity.map((r) => <ActivityRow key={r.id} review={r} />)}` bleibt, aber `{!loading && activity.length === 0 && …}` → `{!activityLoading && activity.length === 0 && …}`
- `You added {nudgePerfume.name} to your shelf.` → `… to your collection.`; `Got a verdict for it yet?` → `Written a review yet?`
- `<h2>Verdicts worth reading</h2>` → `<h2>Reviews worth reading</h2>`
- `<Link to="/explore">All verdicts →</Link>` → `<Link to="/community">All reviews →</Link>`
- `No verdicts yet.` → `No reviews yet.`

f) In `src/pages/HomePage.css` die Regeln `.feed__activity-row`, `.feed__avatar`, `.feed__activity-text`, `.feed__activity-item`, `.feed__activity-time` löschen, **außer** `.feed__avatar` wird noch von den Verdict-Karten (`feed__verdict-head`) benutzt → `.feed__avatar` behalten.

- [ ] **Step 7: Prüfen**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/pages/HomePage.jsx src/hooks/useActivityFeed.js src/components/community ; npm run build 2>&1 | grep -E "built in|error"`
Expected: alle grün, keine Lint-Fehler, Build ok.

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "feat(redesign): shared activity feed hook and row"
```

---

### Task 3: RequireAuth mit Sign-in-Karte und ShelfPage

**Files:**
- Modify: `src/components/layout/RequireAuth.jsx`; Create: `RequireAuth.test.jsx`
- Create: `src/components/layout/SignInPrompt.jsx`, `SignInPrompt.css`
- Replace: `src/pages/ShelfPage.jsx`; Create: `ShelfPage.css`, `ShelfPage.test.jsx`

- [ ] **Step 1: Test für RequireAuth** (`RequireAuth.test.jsx`)

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }));
import { useAuth } from '../../hooks/useAuth';
import RequireAuth from './RequireAuth';

const renderGuard = (props) =>
  render(
    <MemoryRouter initialEntries={['/collection']}>
      <Routes>
        <Route path="/collection" element={<RequireAuth {...props}><p>Protected</p></RequireAuth>} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => vi.clearAllMocks());

describe('RequireAuth', () => {
  it('shows a spinner while auth is loading', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: true });
    const { container } = renderGuard();
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('redirects to /login by default', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    renderGuard();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows a sign-in prompt instead of redirecting when one is given', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    renderGuard({ prompt: { title: 'Your collection', text: 'Sign in to see it.' } });

    expect(screen.getByRole('heading', { name: 'Your collection' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to see it.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByText('Protected')).toBeNull();
  });

  it('renders children when signed in', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    renderGuard({ prompt: { title: 'x', text: 'y' } });
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/components/layout/RequireAuth.test.jsx 2>&1 | tail -8` → der dritte Test FAIL (Prompt wird noch nicht gerendert).

- [ ] **Step 2: SignInPrompt** (`SignInPrompt.jsx`)

```jsx
import { Link } from 'react-router-dom';
import './SignInPrompt.css';

// Glas-Karte für Seiten, die ohne Login keinen Inhalt haben (Favorites, Collection).
export default function SignInPrompt({ title, text }) {
  return (
    <div className="container page">
      <div className="signin-prompt glass">
        <h1 className="signin-prompt__title">{title}</h1>
        <p className="signin-prompt__text">{text}</p>
        <div className="signin-prompt__actions">
          <Link to="/login" className="btn btn-primary">Sign in</Link>
          <Link to="/register" className="btn btn-ghost">Create account</Link>
        </div>
      </div>
    </div>
  );
}
```

`SignInPrompt.css`:

```css
.signin-prompt {
  max-width: 460px;
  margin: var(--space-14) auto;
  padding: var(--space-10);
  text-align: center;
}
.signin-prompt__title { font-size: 28px; margin-bottom: var(--space-3); }
.signin-prompt__text { color: var(--text-body); margin-bottom: var(--space-8); }
.signin-prompt__actions { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
```

- [ ] **Step 3: RequireAuth** — vollständig:

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SignInPrompt from './SignInPrompt';

/**
 * Route guard. Ohne Login: Redirect nach /login, oder — wenn `prompt`
 * gesetzt ist — eine Sign-in-Karte an Ort und Stelle (für Tabs wie
 * Favorites und Collection, die auch ohne Login einen Sinn ergeben sollen).
 */
export default function RequireAuth({ children, prompt }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return prompt ? <SignInPrompt {...prompt} /> : <Navigate to="/login" replace />;
  }

  return children;
}
```

Run: `npx vitest run src/components/layout/RequireAuth.test.jsx 2>&1 | tail -5` → PASS (4).

- [ ] **Step 4: Test für ShelfPage** (`src/pages/ShelfPage.test.jsx`)

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../services/userPerfumeService', () => ({ getUserPerfumesByStatus: vi.fn() }));
vi.mock('../components/perfume/PerfumeCard', () => ({
  default: ({ perfume }) => <div data-testid="card">{perfume.name}</div>,
}));

import { useAuth } from '../hooks/useAuth';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import ShelfPage from './ShelfPage';

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { id: 'u1' } });
});

const renderPage = (status) => render(<MemoryRouter><ShelfPage status={status} /></MemoryRouter>);

describe('ShelfPage', () => {
  it('loads the collection and shows a card per perfume', async () => {
    getUserPerfumesByStatus.mockResolvedValue([
      { perfumes: { id: 'p1', name: 'Layton' } },
      { perfumes: { id: 'p2', name: 'Oud Wood' } },
      { perfumes: null },
    ]);

    renderPage('owned');

    expect(await screen.findAllByTestId('card')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Collection' })).toBeInTheDocument();
    expect(screen.getByText('2 fragrances')).toBeInTheDocument();
    expect(getUserPerfumesByStatus).toHaveBeenCalledWith('u1', 'is_owned');
  });

  it('loads favorites with the favorite flag', async () => {
    getUserPerfumesByStatus.mockResolvedValue([{ perfumes: { id: 'p1', name: 'Layton' } }]);

    renderPage('favorite');

    await screen.findByTestId('card');
    expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument();
    expect(screen.getByText('1 fragrance')).toBeInTheDocument();
    expect(getUserPerfumesByStatus).toHaveBeenCalledWith('u1', 'is_favorite');
  });

  it('shows an empty state with a link to the catalog', async () => {
    getUserPerfumesByStatus.mockResolvedValue([]);

    renderPage('favorite');

    expect(await screen.findByText(/No favorites yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /catalog/i })).toHaveAttribute('href', '/catalog');
  });
});
```

Run: `npx vitest run src/pages/ShelfPage.test.jsx 2>&1 | tail -8` → FAIL (Platzhalter rendert nichts).

- [ ] **Step 5: ShelfPage** (`src/pages/ShelfPage.jsx`, Platzhalter ersetzen)

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { toast } from '../store/toastStore';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import './ShelfPage.css';

const STATUSES = {
  favorite: {
    field: 'is_favorite',
    title: 'Favorites',
    empty: 'No favorites yet. Tap the heart on any fragrance to keep it here.',
  },
  owned: {
    field: 'is_owned',
    title: 'Collection',
    empty: 'Nothing in your collection yet. Add the bottle you wore today.',
  },
};

// Favorites und Collection des eingeloggten Users. Wird nur hinter
// RequireAuth gerendert, `user` ist also immer gesetzt.
export default function ShelfPage({ status }) {
  const { user } = useAuth();
  const { field, title, empty } = STATUSES[status];
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getUserPerfumesByStatus(user.id, field)
      .then((rows) => {
        if (active) setPerfumes(rows.map((r) => r.perfumes).filter(Boolean));
      })
      .catch((err) => toast.error(`Failed to load ${title.toLowerCase()}: ` + err.message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.id, field, title]);

  const count = perfumes.length;

  return (
    <div className="container page shelf-page">
      <header className="shelf-page__head">
        <h1 className="shelf-page__title">{title}</h1>
        {!loading && (
          <span className="shelf-page__count">
            {count} {count === 1 ? 'fragrance' : 'fragrances'}
          </span>
        )}
      </header>

      {!loading && count === 0 ? (
        <div className="shelf-page__empty glass">
          <p>{empty}</p>
          <Link to="/catalog" className="btn btn-primary">Browse the catalog</Link>
        </div>
      ) : (
        <PerfumeGrid perfumes={perfumes} loading={loading} />
      )}
    </div>
  );
}
```

`ShelfPage.css`:

```css
.shelf-page__head {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}
.shelf-page__title { font-size: 32px; }
.shelf-page__count { color: var(--text-muted); font-size: 13px; }

.shelf-page__empty {
  max-width: 460px;
  padding: var(--space-10);
  text-align: center;
  color: var(--text-body);
}
.shelf-page__empty p { margin-bottom: var(--space-6); }
```

Run: `npx vitest run src/pages/ShelfPage.test.jsx 2>&1 | tail -5` → PASS (3).

- [ ] **Step 6: Suite, Lint, Build**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/pages/ShelfPage.jsx src/components/layout/RequireAuth.jsx src/components/layout/SignInPrompt.jsx ; npm run build 2>&1 | grep -E "built in|error"`

- [ ] **Step 7: Commit**

```bash
git add -A src
git commit -m "feat(redesign): favorites and collection pages with sign-in prompt"
```

---

### Task 4: CommunityPage

**Files:**
- Replace: `src/pages/CommunityPage.jsx`; Create: `CommunityPage.css`, `CommunityPage.test.jsx`

- [ ] **Step 1: Test** (`CommunityPage.test.jsx`)

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useActivityFeed', () => ({ useActivityFeed: vi.fn() }));

import { useAuth } from '../hooks/useAuth';
import { useActivityFeed } from '../hooks/useActivityFeed';
import CommunityPage from './CommunityPage';

const review = (id) => ({
  id,
  rating: 5,
  created_at: '2026-09-30T10:00:00Z',
  profiles: { username: `user${id}` },
  perfumes: { id: `p${id}`, name: `Perfume ${id}` },
});

beforeEach(() => {
  vi.clearAllMocks();
  useActivityFeed.mockReturnValue({ items: [review(1), review(2)], personalized: false, loading: false });
});

const renderPage = () => render(<MemoryRouter><CommunityPage /></MemoryRouter>);

describe('CommunityPage', () => {
  it('lists the activity feed for visitors without a scope switch', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    renderPage();

    expect(screen.getByRole('heading', { name: 'Community' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Perfume 1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Following' })).toBeNull();
    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 20, scope: 'everyone' });
  });

  it('lets signed-in users switch between following and everyone', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    const user = userEvent.setup();
    renderPage();

    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 20, scope: 'following' });
    await user.click(screen.getByRole('button', { name: 'Everyone' }));
    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 20, scope: 'everyone' });
  });

  it('loads more by raising the limit', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    useActivityFeed.mockReturnValue({
      items: Array.from({ length: 20 }, (_, i) => review(i)),
      personalized: false,
      loading: false,
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(useActivityFeed).toHaveBeenLastCalledWith({ limit: 40, scope: 'everyone' });
  });

  it('shows an empty state', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    useActivityFeed.mockReturnValue({ items: [], personalized: true, loading: false });
    renderPage();

    expect(screen.getByText(/Nobody you follow has posted yet/)).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/pages/CommunityPage.test.jsx 2>&1 | tail -8` → FAIL.

- [ ] **Step 2: CommunityPage** (`src/pages/CommunityPage.jsx`, Platzhalter ersetzen)

```jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useActivityFeed } from '../hooks/useActivityFeed';
import ActivityRow from '../components/community/ActivityRow';
import './CommunityPage.css';

const PAGE = 20;

// Aktivitäts-Feed in voller Länge. Eingeloggte können zwischen den Leuten,
// denen sie folgen, und allen umschalten; Besucher sehen alle.
export default function CommunityPage() {
  const { isAuthenticated } = useAuth();
  const [scope, setScope] = useState('following');
  const [limit, setLimit] = useState(PAGE);
  const effectiveScope = isAuthenticated ? scope : 'everyone';
  const { items, loading } = useActivityFeed({ limit, scope: effectiveScope });

  const emptyText = effectiveScope === 'following'
    ? 'Nobody you follow has posted yet. Switch to Everyone to see what the community is rating.'
    : 'No reviews yet. Be the first to rate a fragrance.';

  return (
    <div className="container page community">
      <header className="community__head">
        <h1 className="community__title">Community</h1>
        {isAuthenticated && (
          <div className="community__scope" role="group" aria-label="Feed scope">
            <button type="button" className="chip" aria-pressed={scope === 'following'} onClick={() => setScope('following')}>
              Following
            </button>
            <button type="button" className="chip" aria-pressed={scope === 'everyone'} onClick={() => setScope('everyone')}>
              Everyone
            </button>
          </div>
        )}
      </header>

      <div className="community__feed glass">
        {items.map((r) => <ActivityRow key={r.id} review={r} />)}
        {loading && items.length === 0 && (
          <div className="spinner-container"><div className="spinner spinner-md" /></div>
        )}
        {!loading && items.length === 0 && <p className="community__empty">{emptyText}</p>}
      </div>

      {items.length >= limit && (
        <button type="button" className="btn btn-secondary community__more" onClick={() => setLimit((l) => l + PAGE)}>
          Load more
        </button>
      )}
    </div>
  );
}
```

`CommunityPage.css`:

```css
.community { max-width: 760px; }

.community__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  flex-wrap: wrap;
}
.community__title { font-size: 32px; }
.community__scope { display: flex; gap: var(--space-2); }

.community__feed { padding: var(--space-2) var(--space-6); }
.community__empty { padding: var(--space-8) 0; color: var(--text-body); text-align: center; }

.community__more { display: flex; margin: var(--space-8) auto 0; }
```

Run: `npx vitest run src/pages/CommunityPage.test.jsx 2>&1 | tail -5` → PASS (4).

- [ ] **Step 3: Suite, Lint, Build, Commit**

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/pages/CommunityPage.jsx ; npm run build 2>&1 | grep -E "built in|error"`

```bash
git add -A src
git commit -m "feat(redesign): community page with following/everyone feed"
```

---

### Task 5: Navbar, TabBar, AccountMenu, AccountPage

**Files:**
- Replace: `src/components/layout/Navbar.jsx`, `Navbar.css`; Create: `Navbar.test.jsx`
- Replace: `src/components/layout/TabBar.jsx`, `TabBar.css`; Create: `TabBar.test.jsx`
- Modify: `src/components/layout/AccountMenu.jsx`, `AccountMenu.css`
- Modify: `src/pages/AccountPage.jsx`

- [ ] **Step 1: Tests für Navbar und TabBar**

`Navbar.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../services/perfumeService', () => ({ getPerfumes: vi.fn(() => Promise.resolve({ perfumes: [] })) }));
vi.mock('./AccountMenu', () => ({ default: () => <div data-testid="account-menu" /> }));

import { useAuth } from '../../hooks/useAuth';
import Navbar from './Navbar';

const renderNav = () => render(<MemoryRouter><Navbar /></MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('Navbar', () => {
  it('links to the five sections', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    renderNav();

    const expected = [['Today', '/'], ['Catalog', '/catalog'], ['Favorites', '/favorites'], ['Collection', '/collection'], ['Community', '/community']];
    for (const [name, href] of expected) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('shows a sign-in button for visitors and the account menu when signed in', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    const { unmount } = renderNav();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByTestId('account-menu')).toBeNull();
    unmount();

    useAuth.mockReturnValue({ isAuthenticated: true });
    renderNav();
    expect(screen.getByTestId('account-menu')).toBeInTheDocument();
  });
});
```

`TabBar.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TabBar from './TabBar';

describe('TabBar', () => {
  it('has the five app tabs in order', () => {
    render(<MemoryRouter><TabBar /></MemoryRouter>);

    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Today', 'Catalog', 'Favorites', 'Collection', 'Community']);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/', '/catalog', '/favorites', '/collection', '/community']);
  });
});
```

Run: `npx vitest run src/components/layout/Navbar.test.jsx src/components/layout/TabBar.test.jsx 2>&1 | tail -8` → FAIL.

- [ ] **Step 2: Navbar.jsx** — vollständig ersetzen:

```jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import { getPerfumes } from '../../services/perfumeService';
import AccountMenu from './AccountMenu';
import Wordmark from './Wordmark';
import './Navbar.css';

const LINKS = [
  { to: '/', label: 'Today', end: true },
  { to: '/catalog', label: 'Catalog' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/collection', label: 'Collection' },
  { to: '/community', label: 'Community' },
];

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Leiste wird nach dem ersten Scrollen dunkler, wie auf der Waitlist.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    getPerfumes({ search: debouncedSearch, pageSize: 5 })
      .then((res) => setSearchResults(res.perfumes || []))
      .catch(() => {})
      .finally(() => setIsSearching(false));
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const tag = e.target.tagName;
        const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
        if (isEditable && e.target !== inputRef.current) return;
        e.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleSelectResult = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="Scentboxd home">
          <Wordmark className="navbar__logo-text" />
        </Link>

        <div className="navbar__links">
          {LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className="navbar__link">{label}</NavLink>
          ))}
        </div>

        <div className="navbar__right">
          <div className="navbar__search" ref={searchRef}>
            <button
              type="button"
              className="navbar__search-pill"
              onClick={() => { setSearchOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); }}
            >
              <MagnifyingGlass size={14} weight="regular" aria-hidden="true" />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>

            {searchOpen && (
              <div className="navbar__search-panel">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    className="input"
                    placeholder="Search fragrances…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                {searchQuery.trim() && (
                  <div className="navbar__search-results">
                    {isSearching ? (
                      <div className="navbar__search-item">Searching…</div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {searchResults.map((p) => (
                          <Link
                            key={p.id}
                            to={`/perfume/${p.id}`}
                            className="navbar__search-item"
                            onClick={handleSelectResult}
                          >
                            <span className="navbar__search-item-img">
                              {p.image_url ? <img src={p.image_url} alt="" /> : '◆'}
                            </span>
                            <span className="navbar__search-item-info">
                              <span className="navbar__search-item-name">{p.name}</span>
                              <span className="navbar__search-item-brand">{p.brands?.name}</span>
                            </span>
                          </Link>
                        ))}
                        <Link
                          to={`/catalog?q=${encodeURIComponent(searchQuery)}`}
                          className="navbar__search-item navbar__search-item--all"
                          onClick={handleSelectResult}
                        >
                          See all results
                        </Link>
                      </>
                    ) : (
                      <div className="navbar__search-item">No results found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <AccountMenu />
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">Sign in</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
```

Hinweis: Die Suche ist unverändert übernommen (inklusive des bekannten, alten Lint-Hinweises `react-hooks/set-state-in-effect` im Such-Effekt). Nicht anfassen.

- [ ] **Step 3: Navbar.css** — vollständig ersetzen:

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--nav-height);
  background: rgba(19, 10, 16, 0.55);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  backdrop-filter: blur(16px) saturate(140%);
  border-bottom: 1px solid transparent;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
.navbar--scrolled {
  background: rgba(19, 10, 16, 0.78);
  border-bottom-color: var(--hairline);
}

.navbar__inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-8);
  height: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.navbar__logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex: none;
}
.navbar__logo-text { font-size: 20px; }

.navbar__links { display: flex; gap: var(--space-1); }

.navbar__link {
  padding: 7px 12px;
  border-radius: var(--radius-pill);
  font: 500 13px var(--font);
  color: var(--text-body);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.navbar__link:hover { color: var(--text); background: rgba(255, 255, 255, 0.04); }
.navbar__link.active { color: var(--text); background: var(--accent-tint); font-weight: 600; }

.navbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.navbar__search { position: relative; }

.navbar__search-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding: 0 var(--space-4);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-pill);
  background: rgba(13, 11, 15, 0.4);
  color: var(--text-muted);
  font: 400 13px var(--font);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}
.navbar__search-pill:hover { border-color: var(--accent-line); color: var(--text); }
.navbar__search-pill kbd {
  font: 500 11px ui-monospace, Menlo, monospace;
  color: var(--text-dim);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-sm);
  padding: 2px 5px;
}

.navbar__search-panel {
  position: absolute;
  top: calc(100% + var(--space-3));
  right: 0;
  width: 340px;
  background: var(--surface-solid);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--inset-highlight), var(--shadow-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 200;
}

.navbar__search-results {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
}

.navbar__search-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-2);
  text-decoration: none;
  color: var(--text);
  border-top: 1px solid var(--hairline);
}
.navbar__search-item:first-child { border-top: none; }
.navbar__search-item:hover { color: var(--accent-soft); }

.navbar__search-item-img {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.navbar__search-item-img img { width: 100%; height: 100%; object-fit: contain; }

.navbar__search-item-info { display: flex; flex-direction: column; overflow: hidden; }
.navbar__search-item-name { font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.navbar__search-item-brand { font-size: 11.5px; color: var(--text-muted); }
.navbar__search-item--all { justify-content: center; color: var(--accent-soft); font-weight: 500; }

@media (max-width: 900px) {
  .navbar__links { display: none; }
  .navbar__inner { padding: 0 var(--space-6); gap: var(--space-4); }
  .navbar__search-pill span, .navbar__search-pill kbd { display: none; }
  .navbar__search-pill { padding: 0 10px; }
  .navbar__search-panel { position: fixed; top: var(--nav-height); left: 0; right: 0; width: auto; border-radius: 0; }
}
```

- [ ] **Step 4: TabBar.jsx** — vollständig ersetzen:

```jsx
import { NavLink } from 'react-router-dom';
import { Book, Heart, Star, SunHorizon, Users } from '@phosphor-icons/react';
import './TabBar.css';

// Mobile Tab-Leiste mit denselben fünf Tabs wie die iOS-App.
const TABS = [
  { to: '/', label: 'Today', Icon: SunHorizon, end: true },
  { to: '/catalog', label: 'Catalog', Icon: Book },
  { to: '/favorites', label: 'Favorites', Icon: Heart },
  { to: '/collection', label: 'Collection', Icon: Star },
  { to: '/community', label: 'Community', Icon: Users },
];

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main navigation">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="tabbar__item">
          {({ isActive }) => (
            <>
              <Icon size={20} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

`TabBar.css` — vollständig ersetzen:

```css
.tabbar { display: none; }

@media (max-width: 900px) {
  .tabbar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    position: sticky;
    bottom: 0;
    z-index: 100;
    background: var(--surface-solid);
    border-top: 1px solid var(--hairline);
    padding: var(--space-2) var(--space-2) calc(var(--space-2) + env(safe-area-inset-bottom, 0px));
    box-sizing: border-box;
  }

  .tabbar__item {
    min-height: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font: 500 10px var(--font);
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .tabbar__item svg { transition: filter 0.2s ease; }
  .tabbar__item.active { color: var(--accent-soft); font-weight: 600; }
  .tabbar__item.active svg { filter: drop-shadow(0 0 6px rgba(194, 10, 102, 0.6)); }
}
```

Run: `npx vitest run src/components/layout 2>&1 | tail -6` → alle grün.

- [ ] **Step 5: AccountMenu anpassen**

In `src/components/layout/AccountMenu.jsx`:
- `const { profile, user, logout, shelfPath } = useAuth();` → `const { profile, user, logout, profilePath } = useAuth();`
- State-Key `verdicts` → `reviews` (in `useState`, im `setCounts` und in den beiden Verwendungen).
- `{counts.owned} owned · {counts.verdicts} verdicts` → `{counts.owned} in collection · {counts.reviews} reviews`
- Die erste `account-menu__group` ersetzen durch:

```jsx
          <div className="account-menu__group">
            <NavLink to={profilePath} className="account-menu__item" onClick={() => setOpen(false)}>
              Profile
            </NavLink>
            <NavLink to="/collection" className="account-menu__item" onClick={() => setOpen(false)}>
              Collection <span>{counts.owned}</span>
            </NavLink>
            <NavLink to="/favorites" className="account-menu__item" onClick={() => setOpen(false)}>
              Favorites
            </NavLink>
            <NavLink to={`${profilePath}?tab=want_to_try`} className="account-menu__item" onClick={() => setOpen(false)}>
              Want to try <span>{counts.want}</span>
            </NavLink>
            <NavLink to={profilePath} className="account-menu__item" onClick={() => setOpen(false)}>
              Your lists <span>{counts.lists}</span>
            </NavLink>
            <NavLink to={`${profilePath}?tab=reviews`} className="account-menu__item" onClick={() => setOpen(false)}>
              Your reviews <span>{counts.reviews}</span>
            </NavLink>
          </div>
```

- Die statische Zeile `Appearance <span>Dark</span>` samt `<span className="account-menu__item account-menu__item--static">…</span>` entfernen (die App ist dark-only).

In `src/components/layout/AccountMenu.css`:
- `.account-menu__panel`: `background: var(--surface);` → `background: var(--surface-solid);`, `box-shadow: var(--shadow-lg);` → `box-shadow: var(--inset-highlight), var(--shadow-lg);`
- `.account-menu__trigger` und `.account-menu__head-avatar`: `color: var(--accent-text);` → `color: var(--accent-soft);`

- [ ] **Step 6: AccountPage anpassen**

In `src/pages/AccountPage.jsx`:
- `const { user, profile, logout, shelfPath, setProfile } = useAuth();` → `const { user, profile, logout, profilePath, setProfile } = useAuth();`
- Stats-Labels: `Owned` → `Collection`, `Verdicts` → `Reviews` (Key `counts.verdicts` darf bleiben).
- Die vier `account-page__row`-Links ersetzen:

```jsx
        <Link to="/collection" className="account-page__row">Collection <span>{counts.owned} ›</span></Link>
        <Link to="/favorites" className="account-page__row">Favorites <span>›</span></Link>
        <Link to={profilePath} className="account-page__row">Your lists <span>{counts.lists} ›</span></Link>
        <Link to={`${profilePath}?tab=reviews`} className="account-page__row">Your reviews <span>{counts.verdicts} ›</span></Link>
        <Link to={`${profilePath}?tab=want_to_try`} className="account-page__row">Want to try <span>{counts.want} ›</span></Link>
```

- [ ] **Step 7: Übergangsalias entfernen und prüfen**

In `src/hooks/useAuth.js` die Zeile `shelfPath: profilePath,` samt ihrem zweizeiligen Kommentar entfernen.

Run: `grep -rn "shelfPath" src ; echo "exit $?"` → keine Treffer, `exit 1`.
Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL" ; npx eslint src/components/layout/TabBar.jsx src/components/layout/AccountMenu.jsx src/pages/AccountPage.jsx ; npm run build 2>&1 | grep -E "built in|error"`
Expected: alle grün, Build ok. (Lint auf `Navbar.jsx` zeigt weiterhin nur den bekannten alten Fehler im Such-Effekt.)

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "feat(redesign): glass navbar, five-tab navigation, account menu wording"
```

---

### Task 6: Sichtprüfung, Push und PR

- [ ] **Step 1: Dev-Server und Seiten anschauen**

Run: `npm run dev -- --port 5199 --strictPort` (Hintergrund). Prüfen in `http://localhost:5199`:
- `/`: Glas-Navbar mit fünf Pill-Links, „Today“ aktiv; nach Scrollen wird die Leiste dunkler und bekommt eine Hairline. Aurora scheint durch die Leiste.
- `/explore?q=oud` landet auf `/catalog?q=oud`, Titel „Catalog“.
- `/favorites` und `/collection` ohne Login: Sign-in-Karte mit Titel, Text, zwei Buttons.
- `/community`: Feed mit Zeilen, Links auf Profil und Parfum; ohne Login kein Following/Everyone-Umschalter.
- Fenster auf 390px: Tab-Leiste mit fünf Tabs, aktiver Tab Magenta mit Glow; Navbar zeigt nur Wortzeichen, Such-Icon und Sign-in.
- Footer-Links: Catalog, Brands, Community.

- [ ] **Step 2: Suite, Build, Push, PR**

```bash
npm test 2>&1 | grep -E "Test Files|Tests "
npm run build 2>&1 | grep -E "built in|error"
git push -u origin redesign-2-navigation
gh pr create --base redesign --head redesign-2-navigation --title "feat(redesign): navigation — five tabs, catalog route, favorites, collection, community" --body "$(cat <<'EOF'
## Summary
Step 2 of the redesign (spec Abschnitt 2, plan `docs/superpowers/plans/2026-10-02-redesign-2-navigation.md`). Stacked on `redesign` (PR #4); retarget to `main` once #4 is merged.

- Navigation like the iOS app: Today · Catalog · Favorites · Collection · Community. Glass navbar that darkens on scroll; mobile tab bar with the same five tabs (compose button removed, avatar lives in the navbar).
- Routes: `/catalog` (ExplorePage renamed to CatalogPage), `/explore` redirects and keeps the query string, `/favorites` and `/collection` (new `ShelfPage`, sign-in card instead of redirect when logged out), `/community` (new page).
- Activity feed logic moved out of `HomePage` into `useActivityFeed` / `loadActivity` and the `ActivityRow` component, shared by Today and Community. Community has a Following / Everyone switch and "Load more".
- `useAuth`: `shelfPath` replaced by `profilePath`, `collectionPath`, `favoritesPath`.
- Wording: Verdicts → Reviews, Shelf → Collection, Index → Catalog, Houses → Brands in navbar, footer, account menu, account page and the home page.

## Test plan
- [x] `npm test` green, new tests: `ExploreRedirect`, `loadActivity`, `ActivityRow`, `RequireAuth`, `ShelfPage`, `CommunityPage`, `Navbar`, `TabBar`
- [x] `npm run build`
- [x] Browser check of `/`, `/explore?q=…` redirect, `/favorites`, `/collection`, `/community`, mobile tab bar
- [ ] After deploy: check behind the gate on scent-boxd.com

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
