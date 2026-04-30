# 🛠 Technical Debt — Fortschrittsliste

> **Branch:** `Stef` | **Stand:** 30.04.2026 | **Bearbeiter:** Stefan

---

## Übersicht

| # | Problem | Schwere | Status |
|---|---|---|---|
| 1 | Keine Error-Boundaries | 🟡 Mittel | ✅ Erledigt |
| 2 | Kein globales Error-Handling | 🟡 Mittel | ⬜ Offen |
| 3 | Tailwind + Vanilla CSS Redundanz | 🟠 Gering | ⬜ Offen |
| 4 | Keine Protected Routes | 🔴 Hoch | ✅ Erledigt |
| 5 | Client-seitige Filterung (Pagination) | 🟡 Mittel | ⬜ Offen (braucht Supabase DB-Funktion) |
| 6 | Keine `.env.example` | 🟠 Gering | ✅ Erledigt |
| 7 | Falsches "Joined"-Datum | 🟠 Gering | ✅ Erledigt |
| 8 | Kein Auth-Listener Cleanup | 🟡 Mittel | ✅ Erledigt |
| 9 | Root `package.json` leer | 🟠 Gering | ⬜ Offen |
| 10 | Placeholder-Assets | 🟠 Gering | ✅ Erledigt |

### Zusätzlich behoben:
| # | Problem | Status |
|---|---|---|
| B1 | 404-Seite fehlte komplett | ✅ Erledigt |
| B2 | Review-Likes im UI nicht verdrahtet | ✅ Erledigt |
| B3 | Doppelte Pagination-Logik in ExplorePage | ✅ Erledigt |

---

## Detaillog

### ✅ Fix 1: Auth-Listener Memory-Leak (`authStore.js`)
- **Problem:** `supabase.auth.onAuthStateChange()` wurde aufgerufen ohne die Subscription zu speichern → Memory-Leak bei Re-Renders
- **Lösung:** Subscription wird jetzt in `_authSubscription` gespeichert und bei erneutem `initialize()`-Aufruf vorher `unsubscribe()` aufgerufen
- **Dateien:** `src/store/authStore.js`

### ✅ Fix 2: Protected Routes (`RequireAuth.jsx`)
- **Problem:** Kein Route-Guard — unauthentifizierte User konnten auf `/profile/...` zugreifen
- **Lösung:** Neue `RequireAuth`-Komponente erstellt, die auf `/login` redirected. Zeigt Spinner während Auth-Loading.
- **Dateien:** `src/components/layout/RequireAuth.jsx`, `src/App.jsx`

### ✅ Fix 3: 404-Seite (`NotFoundPage.jsx`)
- **Problem:** Ungültige URLs zeigten eine leere Seite
- **Lösung:** `NotFoundPage` erstellt mit Navigations-Buttons. Catch-all `*` Route in App.jsx hinzugefügt.
- **Dateien:** `src/pages/NotFoundPage.jsx`, `src/App.jsx`

### ✅ Fix 4: Error Boundary (`ErrorBoundary.jsx`)
- **Problem:** Ein JS-Fehler in einer Komponente crashte die gesamte App (Whitescreen)
- **Lösung:** React Error Boundary als Class Component um `<App />` in `main.jsx` gewickelt. Zeigt Fallback-UI mit "Refresh" und "Back Home" Buttons.
- **Dateien:** `src/components/layout/ErrorBoundary.jsx`, `src/main.jsx`

### ✅ Fix 5: "Joined"-Datum (`ProfilePage.jsx`)
- **Problem:** Zeile 94 nutzte `profile.updated_at` statt `profile.created_at` als Join-Datum
- **Lösung:** Auf `created_at` geändert mit Fallback auf `updated_at`
- **Dateien:** `src/pages/ProfilePage.jsx`

### ✅ Fix 6: Review-Likes verdrahtet (`PerfumeDetailPage.jsx`)
- **Problem:** `ReviewCard` hatte einen `onLike` Prop, der nie übergeben wurde
- **Lösung:** `toggleReviewLike` importiert und als `onLike`-Handler an `ReviewCard` übergeben (nur für eingeloggte User)
- **Dateien:** `src/pages/PerfumeDetailPage.jsx`

### ✅ Fix 7: Doppelte Pagination (`ExplorePage.jsx`)
- **Problem:** "Previous"-Button rief sowohl `updateFilter()` als auch `setSearchParams()` auf → inkonsistentes Verhalten
- **Lösung:** Vereinheitlicht auf `setSearchParams()` (wie der "Next"-Button)
- **Dateien:** `src/pages/ExplorePage.jsx`

### ✅ Fix 8: `.env.example` erstellt
- **Datei:** `client/.env.example` mit Platzhaltern für Supabase-Credentials

### ✅ Fix 9: Placeholder-Assets entfernt
- `src/assets/react.svg` und `src/assets/vite.svg` gelöscht (Vite-Template-Reste)

---

## Noch offen

### ⬜ Globales Error-Handling
- Services sollten einen zentralen Error-Handler bekommen statt `console.error`
- Toast-Notification-System nutzen, das in `index.css` bereits vorbereitet ist

### ⬜ Tailwind aufräumen
- Entscheidung: Tailwind komplett entfernen oder aktiv nutzen?
- Aktuell: Nur `@import "tailwindcss"` in `index.css`, alle Styles sind Vanilla CSS

### ⬜ Client-seitige Filterung (noteFamily)
- Braucht Supabase DB-Funktion/View — **Aufgabe für Entwickler B (Backend)**
- `perfumeService.js:81-85` filtert client-seitig → Pagination-Count stimmt nicht

### ⬜ Root `package.json` Dev-Script
- Convenience-Script hinzufügen: `"dev": "cd client && npm run dev"`
