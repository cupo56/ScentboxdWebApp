# Maintenance-Screen für scent-boxd.com

**Datum:** 2026-08-28
**Status:** Design freigegeben

## Problem

Die Apex-Domain `scent-boxd.com` serviert aktuell die Scentboxd-App aus dem
Vercel-Projekt `scentboxd-webapp`. Die App ist noch in Entwicklung, die Domain
aber öffentlich erreichbar. Besucher landen also in einem unfertigen Produkt.

Die fertige Waitlist-Landingpage liegt bereits unter
`waitlist.scent-boxd.com` (eigenes Vercel-Projekt `scentboxd-waitlist`) und
bleibt dort unverändert. Sie ist nicht Teil dieser Arbeit.

Ziel: Auf `scent-boxd.com` einen gestalteten "wird gerade gebaut"-Screen
zeigen, statt der App. Die App muss für den Entwickler weiter erreichbar
bleiben.

## Der Alias-Fallstrick

Das Production-Deployment `dpl_EymHF96QKDGgDKoTzGh4SrsqQNdN` hat vier Aliase,
die alle auf dieselben Dateien zeigen:

- `scent-boxd.com`
- `scentboxd-webapp.vercel.app`
- `scentboxd-webapp-harunsefer-3348s-projects.vercel.app`
- `scentboxd-webapp-git-main-harunsefer-3348s-projects.vercel.app`

Ein Build-Time-Schalter (`VITE_MAINTENANCE` als Production-Env-Var) wirkt
deshalb auf **alle vier** Hosts gleichzeitig — auch auf die `.vercel.app`-URL,
die als Entwicklerzugang erhalten bleiben soll.

Daraus folgt die zentrale Designentscheidung: Der Schalter ist
**hostname-basiert zur Laufzeit**, nicht env-basiert zur Buildzeit.

## Architektur

Drei Einheiten, jede mit einer Aufgabe.

### 1. `src/config/maintenance.js`

Reine Entscheidungslogik, keine React-Abhängigkeit.

```js
const LOCKED_HOSTS = ['scent-boxd.com', 'www.scent-boxd.com'];

export function isMaintenanceMode(location = window.location) {
  if (new URLSearchParams(location.search).has('maintenance')) return true;
  return LOCKED_HOSTS.includes(location.hostname);
}
```

- `location` ist injizierbar → direkt testbar, ohne jsdom-Globals zu mutieren.
- Der `?maintenance`-Query-Parameter ist die Vorschau-Escape-Hatch, um die
  Seite lokal und auf Previews anzusehen.
- Abhängigkeiten: keine.

### 2. `src/pages/MaintenancePage.jsx`

Eigenständige Seite. Importiert **nicht** `Layout`, `Navbar`, `Footer`, den
Auth-Store oder irgendeinen Service — sie steht allein.

Hängt in einem `useEffect` beim Mounten ein
`<meta name="robots" content="noindex">` an `document.head` und entfernt es
beim Unmounten wieder. Bewusst zur Laufzeit und **nicht** statisch in
`index.html` — dort würde es auch die volle App auf allen anderen Hosts
deindexieren.

### 3. `src/App.jsx`

`App` wird in zwei Komponenten geteilt, damit der Gate keine Hooks
überspringt:

```js
export default function App() {
  if (isMaintenanceMode()) return <MaintenancePage />;
  return <AppRoutes />;
}

function AppRoutes() {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);
  return ( /* ToastContainer + BrowserRouter + Routes, unverändert */ );
}
```

`App` enthält danach **keine Hooks mehr** — der Early Return kann die Rules of
Hooks also gar nicht verletzen. Der gesamte bestehende Router-Baum wandert
unverändert nach `AppRoutes`.

Konsequenz auf der gesperrten Domain: kein Router, kein Auth-Init, kein
Supabase-Request, kein Toast-Container.

## Verhalten

| Host | Ergebnis |
|------|----------|
| `scent-boxd.com` | Maintenance-Screen |
| `www.scent-boxd.com` | Maintenance-Screen |
| `scentboxd-webapp.vercel.app` | volle App |
| Preview-Deployments (`*-git-*.vercel.app`) | volle App |
| `localhost:5173` | volle App |
| beliebiger Host mit `?maintenance` | Maintenance-Screen |

## Gestaltung

Nach `DESIGN.md`, Sprache Deutsch (passend zur Waitlist).

- Grundfläche `#0a0a0f`, Text `#f0f0f5` / `#8888a0`
- Wortmarke "scentboxd" in `.gradient-text`
- Die driftenden Aurora-Blobs (`.float-deco`, `float-slow`/`aurora`-Keyframes)
  aus `src/index.css` als Hintergrund
- Headline: "Wir bauen gerade an scentboxd"
- Eine Zeile Subline
- Button auf `https://waitlist.scent-boxd.com` — leitet geblockten Traffic in
  Waitlist-Anmeldungen statt ihn zu verlieren
- Sämtliche Bewegung hinter `prefers-reduced-motion: reduce` gated
- Responsiv, mobile-first

## Tests

Colocated, Vitest + React Testing Library, wie im Projekt üblich.

**`src/config/maintenance.test.js`** — Hostname-Matrix:
- `scent-boxd.com` → `true`
- `www.scent-boxd.com` → `true`
- `scentboxd-webapp.vercel.app` → `false`
- `localhost` → `false`
- beliebiger Host mit `?maintenance` → `true`

**`src/pages/MaintenancePage.test.jsx`** — Render-Smoke-Test: Headline
vorhanden, Waitlist-Link zeigt auf die korrekte URL.

## Bewusste Nicht-Ziele

- **Kein echter Zugriffsschutz.** Der App-Code bleibt im JS-Bundle, weil es
  eine statische SPA ist — das Bundle ist ohnehin öffentlich. Dies ist ein
  Schild an der Tür, kein Schloss. Für echtes Sperren wäre Vercel Deployment
  Protection nötig.
- **Kein Code-Splitting** des App-Bundles hinter den Gate. Ein zusätzlicher
  Ladezustand für eine temporäre Seite lohnt sich nicht.
- **Keine Änderung an `waitlist.scent-boxd.com`** oder am Waitlist-Projekt.
- **Keine Domain-Umhängung** in Vercel. `scent-boxd.com` bleibt auf
  `scentboxd-webapp`.

## Rückbau

Wenn die App live gehen soll: den Early Return aus `App.jsx` entfernen. Die
beiden neuen Dateien und ihre Tests können mitgelöscht werden. Ein einziger
Punkt, an dem rückgebaut wird.
