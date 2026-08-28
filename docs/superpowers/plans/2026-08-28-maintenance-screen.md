# Maintenance-Screen für scent-boxd.com — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auf der Apex-Domain `scent-boxd.com` einen gestalteten "wird gerade gebaut"-Screen ausliefern, während die App auf allen `.vercel.app`-URLs und lokal unverändert läuft.

**Architecture:** Ein Laufzeit-Hostname-Gate (`isMaintenanceMode()`) entscheidet in `App.jsx` per Early Return zwischen `<MaintenancePage />` und dem bestehenden Router-Baum. Kein Build-Env-Schalter, weil alle vier Production-Aliase auf dasselbe Deployment zeigen und ein Build-Flag auch die Entwickler-URL sperren würde.

**Tech Stack:** React 19, React Router v7, Vite, Vitest + React Testing Library. Alle Kommandos aus `client/`.

**Spec:** `docs/superpowers/specs/2026-08-28-maintenance-screen-design.md`

---

## Spec-Korrekturen (beim Planen gefunden)

Zwei Angaben in Spec und `CLAUDE.md` stimmen nicht mit dem Code überein. Der Plan folgt dem Code:

1. **Die Motion-Utilities existieren nicht.** `CLAUDE.md` dokumentiert `.gradient-text`, `.float-deco`, `.tilt-3d` sowie die Keyframes `aurora` und `float-slow` in `src/index.css`. Ein `grep` über `src/` findet keine davon. Stattdessen gilt das tatsächliche Muster im Projekt: eine seitenspezifische CSS-Datei neben der Komponente, wie `src/pages/NotFoundPage.css`.
2. **Die Farbwerte in `DESIGN.md` sind veraltet.** `DESIGN.md` nennt `#0a0a0f` als Grundfläche, `src/index.css` definiert `--bg: #161826`. Der Plan verwendet ausschließlich CSS-Custom-Properties, nie Hex-Literale — damit ist die Frage gegenstandslos.

---

## File Structure

| Datei | Verantwortung |
|---|---|
| `client/src/config/maintenance.js` (neu) | Reine Entscheidung: gesperrter Host, ja oder nein. Kein React, keine Seiteneffekte. |
| `client/src/config/maintenance.test.js` (neu) | Hostname-Matrix. |
| `client/src/pages/MaintenancePage.jsx` (neu) | Der Screen. Keine Abhängigkeit zu Layout, Router, Auth oder Services. |
| `client/src/pages/MaintenancePage.css` (neu) | Nur diese Seite. |
| `client/src/pages/MaintenancePage.test.jsx` (neu) | Render, Waitlist-Link, noindex-Lebenszyklus. |
| `client/src/App.jsx` (ändern, Zeilen 22-50) | Split in `App` (nur Gate) und `AppRoutes` (bestehender Baum). |
| `client/src/App.test.jsx` (neu) | Gate schaltet tatsächlich zwischen Screen und App um. |

---

## Task 1: Das Hostname-Gate

**Files:**
- Create: `client/src/config/maintenance.js`
- Test: `client/src/config/maintenance.test.js`

- [ ] **Step 1: Write the failing test**

Schreibe `client/src/config/maintenance.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { isMaintenanceMode } from './maintenance';

// Ein Stand-in für window.location. Nur die zwei Felder, die die Funktion liest.
const at = (hostname, search = '') => ({ hostname, search });

describe('isMaintenanceMode', () => {
  it('locks the apex domain', () => {
    expect(isMaintenanceMode(at('scent-boxd.com'))).toBe(true);
  });

  it('locks the www subdomain', () => {
    expect(isMaintenanceMode(at('www.scent-boxd.com'))).toBe(true);
  });

  it('leaves the vercel.app developer alias open', () => {
    expect(isMaintenanceMode(at('scentboxd-webapp.vercel.app'))).toBe(false);
  });

  it('leaves preview deployments open', () => {
    const host = 'scentboxd-webapp-git-main-harunsefer-3348s-projects.vercel.app';
    expect(isMaintenanceMode(at(host))).toBe(false);
  });

  it('leaves localhost open', () => {
    expect(isMaintenanceMode(at('localhost'))).toBe(false);
  });

  it('leaves the waitlist subdomain open', () => {
    expect(isMaintenanceMode(at('waitlist.scent-boxd.com'))).toBe(false);
  });

  it('forces the screen on any host when ?maintenance is present', () => {
    expect(isMaintenanceMode(at('localhost', '?maintenance'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd client && npx vitest run src/config/maintenance.test.js
```

Erwartet: FAIL — `Failed to resolve import "./maintenance"`.

- [ ] **Step 3: Write minimal implementation**

Schreibe `client/src/config/maintenance.js`:

```js
// Hosts, auf denen statt der App der Maintenance-Screen ausgeliefert wird.
//
// Bewusst hostname-basiert statt über eine VITE_-Env-Var: alle vier Aliase des
// Production-Deployments (scent-boxd.com, scentboxd-webapp.vercel.app und die
// beiden längeren Team-URLs) zeigen auf dieselben Dateien. Ein Build-Flag würde
// deshalb auch die .vercel.app-URL sperren, die als Entwicklerzugang dient.
const LOCKED_HOSTS = ['scent-boxd.com', 'www.scent-boxd.com'];

export function isMaintenanceMode(location = window.location) {
  // Escape-Hatch, um den Screen lokal und auf Previews anzusehen.
  if (new URLSearchParams(location.search).has('maintenance')) return true;

  return LOCKED_HOSTS.includes(location.hostname);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd client && npx vitest run src/config/maintenance.test.js
```

Erwartet: PASS, 7 Tests.

- [ ] **Step 5: Commit**

```bash
cd client && git add src/config/maintenance.js src/config/maintenance.test.js
git commit -m "feat: add hostname gate for maintenance mode"
```

---

## Task 2: Die Maintenance-Seite

**Files:**
- Create: `client/src/pages/MaintenancePage.jsx`
- Create: `client/src/pages/MaintenancePage.css`
- Test: `client/src/pages/MaintenancePage.test.jsx`

- [ ] **Step 1: Write the failing test**

Schreibe `client/src/pages/MaintenancePage.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MaintenancePage from './MaintenancePage';

describe('MaintenancePage', () => {
  it('shows the headline', () => {
    render(<MaintenancePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Wir bauen gerade an scentboxd'
    );
  });

  it('links to the waitlist', () => {
    render(<MaintenancePage />);

    expect(screen.getByRole('link', { name: /warteliste/i })).toHaveAttribute(
      'href',
      'https://waitlist.scent-boxd.com'
    );
  });

  it('adds a noindex robots tag while mounted and removes it on unmount', () => {
    const { unmount } = render(<MaintenancePage />);

    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex'
    );

    unmount();

    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd client && npx vitest run src/pages/MaintenancePage.test.jsx
```

Erwartet: FAIL — `Failed to resolve import "./MaintenancePage"`.

- [ ] **Step 3: Write the component**

Schreibe `client/src/pages/MaintenancePage.jsx`:

```jsx
import { useEffect } from 'react';
import './MaintenancePage.css';

const WAITLIST_URL = 'https://waitlist.scent-boxd.com';

export default function MaintenancePage() {
  useEffect(() => {
    document.title = 'scentboxd — wird gerade gebaut';

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
      <div className="maintenance__glow" aria-hidden="true" />

      <div className="maintenance__content">
        <p className="maintenance__wordmark">scentboxd</p>

        <h1 className="maintenance__title">Wir bauen gerade an scentboxd</h1>

        <p className="maintenance__subtitle">
          Deine Duftsammlung, endlich an einem Ort. Wir feilen noch an den
          letzten Details — trag dich in die Warteliste ein und du bist beim
          Start dabei.
        </p>

        <a
          className="btn btn-primary btn-lg"
          href={WAITLIST_URL}
          id="maintenance-waitlist-btn"
        >
          Zur Warteliste
        </a>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Write the stylesheet**

Schreibe `client/src/pages/MaintenancePage.css`. Nur Custom-Properties aus `src/index.css`, keine Hex-Literale:

```css
/* ===== Maintenance — scent-boxd.com ===== */

.maintenance {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--space-14) var(--space-8);
  overflow: hidden;
  background: var(--bg);
}

/* Weicher Akzent-Schein hinter dem Text */
.maintenance__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(760px, 120vw);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--accent) 18%, transparent) 0%,
    transparent 68%
  );
  animation: maintenance-breathe 9s ease-in-out infinite;
}

@keyframes maintenance-breathe {
  0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.12); }
}

.maintenance__content {
  position: relative;
  z-index: 1;
  max-width: 560px;
  text-align: center;
}

.maintenance__wordmark {
  margin-bottom: var(--space-10);
  color: var(--accent-text);
  font-size: 14px;
  font-weight: var(--weight-label);
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.maintenance__title {
  margin-bottom: var(--space-6);
  color: var(--text);
  font-size: clamp(28px, 6vw, 44px);
  font-weight: var(--weight-heading);
  line-height: 1.15;
  text-wrap: balance;
}

.maintenance__subtitle {
  margin-bottom: var(--space-10);
  color: var(--text-body);
  font-size: clamp(15px, 2.4vw, 17px);
  line-height: 1.6;
  text-wrap: pretty;
}

@media (prefers-reduced-motion: reduce) {
  .maintenance__glow {
    animation: none;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd client && npx vitest run src/pages/MaintenancePage.test.jsx
```

Erwartet: PASS, 3 Tests.

- [ ] **Step 6: Look at it**

```bash
cd client && npm run dev
```

Öffne `http://localhost:5173/?maintenance`. Erwartet: zentrierter Screen auf dunklem Grund, atmender violetter Schein, Button führt auf die Warteliste. Prüfe zusätzlich bei ~375px Breite, dass nichts überläuft.

- [ ] **Step 7: Commit**

```bash
cd client && git add src/pages/MaintenancePage.jsx src/pages/MaintenancePage.css src/pages/MaintenancePage.test.jsx
git commit -m "feat: add maintenance screen with waitlist CTA"
```

---

## Task 3: Gate in App.jsx verdrahten

**Files:**
- Modify: `client/src/App.jsx:22-50`
- Test: `client/src/App.test.jsx`

- [ ] **Step 1: Write the failing test**

Schreibe `client/src/App.test.jsx`. `supabaseClient` wird gemockt wie in `src/services/perfumeService.test.js`, weil `createClient` sonst ohne Env-Vars beim Import wirft:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('./config/maintenance', () => ({ isMaintenanceMode: () => true }));

import App from './App';

describe('App maintenance gate', () => {
  it('renders only the maintenance screen on a locked host', () => {
    const { container } = render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Wir bauen gerade an scentboxd'
    );
    // Kein Layout gemountet -> keine Navigation im Baum.
    expect(container.querySelector('nav')).toBeNull();
  });
});
```

**Warum hier kein Gegentest für den offenen Host steht.** Der naheliegende zweite
Test (`isMaintenanceMode` gibt `false` zurück, erwarte die volle App) lässt sich
nicht ohne weiteres schreiben: `AppRoutes` mountet `HomePage`, das über
`getPerfumes` auf `supabase.from(...)` zugreift. Das Stub-Objekt `{ supabase: {} }`
hat kein `from`, der Render wirft. Ein vollständiger Supabase-Mock (`createSupabaseMock`
aus `src/test/supabaseMock.js`) reicht auch nicht, weil die Services dann `null`-Daten
zurückgeben, über die die Seiten iterieren.

Der offene Pfad ist stattdessen dreifach abgedeckt: `maintenance.test.js` prüft die
Entscheidung für jeden relevanten Host, `AppRoutes` ist ein wortwörtlicher Umzug des
bestehenden Baums (jeder existierende Test muss weiter grün sein), und Task 4 Step 3
ruft den Production-Build ohne `?maintenance` im Browser auf. Bitte diesen Test
**nicht** nachträglich ergänzen — er wird flaky oder erzwingt Mocks für den halben
Seitenbaum.

- [ ] **Step 2: Run test to verify it fails**

```bash
cd client && npx vitest run src/App.test.jsx
```

Erwartet: FAIL — der erste Test findet die Überschrift nicht, weil `App` noch immer den Router rendert.

- [ ] **Step 3: Split App in Gate und Router-Baum**

In `client/src/App.jsx` zwei Importe oben ergänzen, direkt nach `import NotFoundPage from './pages/NotFoundPage';`:

```js
import MaintenancePage from './pages/MaintenancePage';
import { isMaintenanceMode } from './config/maintenance';
```

Dann `export default function App() { ... }` (aktuell Zeile 22-50) vollständig ersetzen durch:

```jsx
export default function App() {
  // Absichtlich vor jedem Hook: App selbst hält keinen State, deshalb kann
  // dieser Early Return die Rules of Hooks nicht verletzen.
  if (isMaintenanceMode()) return <MaintenancePage />;

  return <AppRoutes />;
}

function AppRoutes() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
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
    </BrowserRouter>
  );
}
```

Die Route-Liste ist unverändert aus dem bestehenden `App` übernommen — nur umgezogen.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd client && npx vitest run src/App.test.jsx
```

Erwartet: PASS, 1 Test.

- [ ] **Step 5: Commit**

```bash
cd client && git add src/App.jsx src/App.test.jsx
git commit -m "feat: gate the app behind the maintenance screen on locked hosts"
```

---

## Task 4: Gesamtprüfung und Deploy

**Files:** keine Änderungen, außer die Korrektur in Step 4.

- [ ] **Step 1: Volle Test-Suite**

```bash
cd client && npm test
```

Erwartet: alle Dateien PASS — die vier bestehenden Test-Dateien plus die drei neuen. Keine bestehende Datei darf brechen; wenn doch, ist der Split in Task 3 schuld und muss korrigiert werden, nicht der alte Test.

- [ ] **Step 2: Lint**

```bash
cd client && npm run lint
```

Erwartet: keine Fehler. `AppRoutes` wird in derselben Datei verwendet, `react-refresh/only-export-components` sollte nicht anschlagen, weil nur `App` als Default exportiert wird.

- [ ] **Step 3: Production-Build**

```bash
cd client && npm run build && npm run preview
```

Öffne die Preview-URL mit `?maintenance` und einmal ohne. Erwartet: mit → Maintenance-Screen; ohne → normale App.

- [ ] **Step 4: `CLAUDE.md` korrigieren**

Der Abschnitt "Motion layer (`src/index.css`)" in `CLAUDE.md` beschreibt Utilities,
die es nicht gibt (siehe Spec-Korrekturen oben). Bestätige das zuerst:

```bash
cd /Users/cupo/Documents/Github/scentboxd-webapp
grep -rn "gradient-text\|float-deco\|tilt-3d\|float-slow" client/src/ | wc -l
```

Erwartet: `0`. Lösche dann in `CLAUDE.md` den kompletten Block, der mit
`**Motion layer (\`src/index.css\`):**` beginnt und mit der Zeile über
`**UI hooks (\`src/hooks/\`):**` endet. Prüfe im selben Zug, ob `useTilt` und
`useCountUp` in `client/src/hooks/` wirklich existieren; falls nicht, entferne
auch den `UI hooks`-Absatz.

```bash
cd /Users/cupo/Documents/Github/scentboxd-webapp
git add CLAUDE.md && git commit -m "docs: drop motion-layer utilities that do not exist in index.css"
```

- [ ] **Step 5: Nach main mergen**

Der Branch `tech-debt/sce-5-8-preview` liegt bereits einen Commit vor `main`. Dieser Commit geht mit live.

```bash
cd /Users/cupo/Documents/Github/scentboxd-webapp
git checkout main && git merge tech-debt/sce-5-8-preview
```

- [ ] **Step 6: Production-Deploy**

```bash
cd client && npx vercel --prod
```

- [ ] **Step 7: Live verifizieren**

```bash
curl -s https://scent-boxd.com | grep -c "id=\"root\""
curl -sI https://scentboxd-webapp.vercel.app | head -1
```

Öffne dann beide URLs im Browser. Erwartet: `scent-boxd.com` zeigt den Maintenance-Screen, `scentboxd-webapp.vercel.app` die volle App. Weil beide dasselbe Bundle laden, ist der Browser-Check hier der eigentliche Test — `curl` allein kann die Hostname-Weiche nicht sehen, da sie im JavaScript zur Laufzeit fällt.

---

## Rückbau

Wenn die App öffentlich gehen soll: in `client/src/App.jsx` die Zeile `if (isMaintenanceMode()) return <MaintenancePage />;` löschen. Ein einziger Punkt. `MaintenancePage`, `maintenance.js` und die zugehörigen Tests können danach mit entfernt werden.
