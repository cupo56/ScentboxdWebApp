# Scentboxd — Projektplan & Codebase-Analyse

> **Stand:** 08.05.2026 | **Team:** 2 Entwickler | **Typ:** Parfüm-Enzyklopädie & Community-Plattform

---

## 0. Aktueller Status (Phase 1 abgeschlossen)
Alle Aufgaben der Phase 1 (Technical Debt, grundlegende Frontend UI-Erweiterungen und Backend CRUD-Funktionen) wurden erfolgreich im `main`-Branch zusammengeführt (Stand: 08.05.2026).
- **Abgeschlossen:** Globale Error-Handling (ErrorBoundary, Toasts), Protected Routes, vollständiges CRUD für Listen (Erstellen, Hinzufügen, Löschen), Suchleiste mit Autocomplete, Password Reset Funktionalität und Profil-Bearbeitungs-UI.
- **Nächster Fokus (Phase 2):** Community-Features (Kommentare, Follow-System), Avatar-Storage und Notification-System.

---

## 1. Ist-Zustand, Datenmodelle & Architektur

### 1.1 Verzeichnisstruktur

```
ScentboxdWebApp/
├── README.md
├── package.json                    # Root (leer – kein Monorepo-Setup)
└── client/                         # React-Frontend
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── postcss.config.js
    ├── .env                        # Supabase-Credentials
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── main.jsx                # React-Entry
        ├── App.jsx                 # Router + Auth-Init
        ├── index.css               # Globale Styles & Design-System
        ├── lib/
        │   └── supabaseClient.js   # Supabase-Instanz
        ├── store/
        │   └── authStore.js        # Zustand Auth-Store
        ├── hooks/
        │   └── useAuth.js          # Auth-Convenience-Hook
        ├── services/               # Supabase-Queries (Data Layer)
        │   ├── perfumeService.js
        │   ├── brandService.js
        │   ├── reviewService.js
        │   ├── listService.js
        │   ├── profileService.js
        │   └── userPerfumeService.js
        ├── components/
        │   ├── layout/   (Layout, Navbar, Footer)
        │   ├── perfume/  (PerfumeCard, PerfumeGrid, FragrancePyramid, PerformanceBar, UserPerfumeActions)
        │   └── review/   (ReviewCard, ReviewForm, StarRating)
        └── pages/
            ├── HomePage, ExplorePage, PerfumeDetailPage
            ├── BrandsOverviewPage, BrandPage
            ├── LoginPage, RegisterPage
            ├── ProfilePage, ListDetailPage
```

### 1.2 Tech-Stack

| Bereich | Technologie | Version |
|---|---|---|
| **Framework** | React | 19.2.4 |
| **Bundler** | Vite | 8.0.1 |
| **Routing** | react-router-dom | 7.13.1 |
| **State Management** | Zustand | 5.0.12 |
| **Backend / DB** | Supabase (PostgreSQL) | 2.49.8 |
| **Auth** | Supabase Auth | (integriert) |
| **Styling** | TailwindCSS v4 + Vanilla CSS | 4.2.2 |

### 1.3 Architektur-Übersicht

```
┌──────────────────────────────────────────────┐
│  Browser (React SPA)                         │
│  Pages → Components → Services (Data Layer)  │
│       ↕                       │              │
│  Zustand (Auth Store)         │              │
└───────────────────────────────┼──────────────┘
                                │ HTTPS
                      ┌─────────▼─────────┐
                      │    Supabase        │
                      │  PostgreSQL        │
                      │  Auth + Storage    │
                      └────────────────────┘
```

**Pattern:** Serverless — kein eigener Backend-Server. Alle Queries laufen direkt vom Client über den Supabase-JS-Client. Row-Level-Security (RLS) in Supabase regelt Zugriffsrechte.

### 1.4 Datenmodelle (aus Code erschlossen)

| Tabelle | Felder | Beziehungen |
|---|---|---|
| **profiles** | `id`, `username`, `bio`, `avatar_url`, `updated_at` | 1:1 → `auth.users` |
| **perfumes** | `id`, `name`, `image_url`, `concentration`, `desc`, `ean`, `longevity`, `sillage`, `performance`, `brand_id`, `created_at` | N:1 → `brands` |
| **brands** | `id`, `name`, `country` | 1:N → `perfumes` |
| **notes** | `id`, `name`, `family` | N:M → `perfumes` via `perfume_notes` |
| **perfume_notes** | `perfume_id`, `note_type` (top/mid/base) | Pivot: `perfumes` ↔ `notes` |
| **reviews** | `id`, `perfume_id`, `user_id`, `title`, `text`, `rating`, `longevity`, `sillage`, `occasions[]`, `created_at` | N:1 → `perfumes`, N:1 → `profiles` |
| **review_likes** | `id`, `review_id`, `user_id` | N:1 → `reviews`, N:1 → `profiles` |
| **user_perfumes** | `user_id`, `perfume_id`, `is_favorite`, `is_owned`, `is_want_to_try`, `created_at` | Pivot: `profiles` ↔ `perfumes` |
| **lists** | `id`, `user_id`, `name`, `description`, `is_public`, `created_at` | N:1 → `profiles` |
| **list_items** | `id`, `list_id`, `perfume_id`, `added_at` | Pivot: `lists` ↔ `perfumes` |

> **Bewertung:** Relational solide. Duftpyramide über `perfume_notes` korrekt modelliert. Es fehlen Tabellen für soziale Features (Follows, Kommentare).

### 1.5 Technical Debt & Schwachstellen

| # | Problem | Schwere | Beschreibung |
|---|---|---|---|
| 1 | **Keine Error-Boundaries** | 🟡 Mittel | JS-Fehler in einer Page legt die gesamte App lahm |
| 2 | **Kein globales Error-Handling** | 🟡 Mittel | Viele `.catch(console.error)` schlucken Fehler still |
| 3 | **Tailwind + Vanilla CSS Redundanz** | 🟠 Gering | Tailwind konfiguriert, aber CSS nutzt ausschließlich Vanilla CSS |
| 4 | **Keine Protected Routes** | 🔴 Hoch | Kein Route-Guard für authentifizierte Bereiche |
| 5 | **Client-seitige Filterung** | 🟡 Mittel | `noteFamily`-Filter client-seitig → Pagination inkorrekt |
| 6 | **Keine `.env.example`** | 🟠 Gering | Onboarding erschwert |
| 7 | **Falsches "Joined"-Datum** | 🟠 Gering | `ProfilePage.jsx:94` zeigt `updated_at` statt `created_at` |
| 8 | **Kein Auth-Listener Cleanup** | 🟡 Mittel | `onAuthStateChange` ohne Unsubscribe → Memory-Leak |
| 9 | **Root `package.json` leer** | 🟠 Gering | `npm run dev` im Root tut nichts |
| 10 | **Placeholder-Assets** | 🟠 Gering | `react.svg`, `vite.svg` in `assets/` — Template-Reste |

---

## 2. Arbeitsaufteilung (2-köpfiges Team)

### Entwickler A — Fokus: **Frontend, UX & Design**

| Bereich | Zuständigkeit |
|---|---|
| UI-Komponenten | Kommentar-System, Follow-Buttons, Profilbearbeitung, Notifications |
| Seiten & Layouts | Settings, Discover/Feed, 404, Duft-Vergleich |
| Responsive Design | Mobile-Optimierung aller Seiten |
| Micro-Animations | Hover-Effekte, Skeleton-Loading, Transitions |
| Accessibility | ARIA-Labels, Keyboard-Navigation |

**Erledigte To-Dos (Phase 1):**
1. [x] Protected-Route-Komponente (`<RequireAuth>`)
2. [x] Error-Boundary-Komponente
3. [x] 404-Seite
4. [x] Profil-Bearbeitungsseite (Avatar-Upload, Bio)
5. [x] Suchleiste mit Autocomplete/Debounce
6. [x] Review-Likes im UI verdrahten
7. [x] "Add to List"-Modal auf PerfumeDetailPage

**Nächste To-Dos (Phase 2):**
1. [ ] Kommentar-System UI (Review-Kommentare anzeigen und schreiben)
2. [ ] Follow-System UI (Follow-Button auf Profilen, Follower-Liste)
3. [ ] Community-Feed (Entdecken-Seite für Reviews von gefolgten Nutzern)
4. [ ] Notification-Dropdown in der Navbar
5. [ ] Avatar-Upload Logik anbinden (sobald Storage bereit ist)
6. [ ] Mobile-Optimierung der Detailseite verfeinern

---

### Entwickler B — Fokus: **Datenbank, Supabase & API**

| Bereich | Zuständigkeit |
|---|---|
| Supabase-Schema | Neue Tabellen (follows, comments), RLS-Policies |
| Services | Neue Service-Dateien, Query-Optimierung |
| Auth-Flow | Password-Reset, Email-Verifizierung, OAuth |
| Daten-Import | Parfüm-Datenbank befüllen/erweitern |
| Supabase Storage | Avatar-Upload, Parfüm-Bilder |

**Erledigte To-Dos (Phase 1):**
1. [x] RLS-Policies prüfen und absichern (Grundgerüst)
2. [x] Password-Reset & Email-Flow eingerichtet
3. [x] CRUD-Funktionen für Custom Lists (Listen erstellen, hinzufügen, löschen)
4. [x] Profile & User relation in Supabase

**Nächste To-Dos (Phase 2):**
1. [ ] Supabase Storage Bucket für Avatare anlegen & Policies konfigurieren
2. [ ] `follows`-Tabelle erstellen inkl. API/Services
3. [ ] `comments`-Tabelle für Review-Kommentare erstellen inkl. API/Services
4. [ ] Server-seitiger `noteFamily`-Filter (DB-Funktion für Pagination)
5. [ ] Notification-System (Realtime Subscriptions) konzipieren
6. [ ] RLS-Policies für alle neuen Tabellen absichern
---

### Schnittstellen (enge Zusammenarbeit nötig)

| Bereich | Warum? |
|---|---|
| **Such-API** | A baut Autocomplete-UI, B definiert Supabase Full-Text-Search |
| **Follow-System** | B erstellt Tabelle + Service, A baut Follow-Button & Liste |
| **Avatar-Upload** | B konfiguriert Storage, A baut Upload-Widget |
| **Notification-System** | B erstellt Realtime-Subscription, A baut Dropdown |
| **Bewertungs-Aggregation** | B erstellt DB-View, A zeigt Durchschnitte auf Cards |

---

## 3. Feature-Analyse & Enzyklopädie-Erweiterungen

### 3.1 Bereits implementierte Features

| Feature | Status | Anmerkungen |
|---|---|---|
| Parfüm-Suche & Filter | ✅ Fertig | Suche, Brand, Konzentration, Duftfamilie, Sortierung |
| Parfüm-Detailseite | ✅ Fertig | Bild, Performance-Bars, Duftpyramide, Reviews |
| Duftpyramide (Kopf/Herz/Basis) | ✅ Fertig | Top/Mid/Base mit Emojis |
| Marken-Übersicht (A-Z) | ✅ Fertig | Alphabetisch gruppiert mit Suchfilter |
| Marken-Detailseite | ✅ Fertig | Alle Parfüms einer Marke |
| Registrierung & Login | ✅ Fertig | Email + Passwort via Supabase Auth |
| Review-System | ✅ Fertig | Rating, Longevity, Sillage, Occasions |
| Review-Likes | ⚠️ Backend only | Service existiert, UI nicht verdrahtet |
| User-Profil (Tabs) | ✅ Fertig | Favorites, Collection, WantToTry, Lists |
| Parfüm-Aktionen | ✅ Fertig | Favorit, Owned, Want to Try |
| Custom-Listen | ⚠️ Teilweise | Anzeigen ja, Hinzufügen-UI fehlt |
| Pagination | ✅ Fertig | Prev/Next mit URL-Params |

### 3.2 Fehlende Features

#### 🟢 Quick Wins (1-3 Tage)

| # | Feature | Priorität |
|---|---|---|
| Q1 | **Review-Likes verdrahten** — `onLike` Prop in PerfumeDetailPage übergeben | 🔴 Hoch |
| Q2 | **"Add to List"-Button** auf PerfumeDetailPage | 🔴 Hoch |
| Q3 | **404-Seite** erstellen | 🔴 Hoch |
| Q4 | **Eigene Reviews löschen** — Button im UI | 🟡 Mittel |
| Q5 | **"Joined"-Datum korrigieren** — `updated_at` → `created_at` | 🟢 Trivial |
| Q6 | **Durchschnittsbewertung auf PerfumeCard** | 🟡 Mittel |
| Q7 | **Listen erstellen** — Button auf ProfilePage | 🟡 Mittel |
| Q8 | **`.env.example` + Root Dev-Script** | 🟢 Trivial |

#### 🔵 Mittlere Features (3-7 Tage)

| # | Feature | Beschreibung |
|---|---|---|
| M1 | **Profil bearbeiten** | Username, Bio, Avatar-Upload |
| M2 | **Erweiterte Bewertungskriterien** | Flakon-Design, Preis-Leistung als Slider |
| M3 | **Passwort-Reset** | "Forgot Password"-Flow |
| M4 | **Duftfamilien-Seite** | Übersicht aller Familien (Floral, Oriental, etc.) |
| M5 | **Volltext-Suche** | Supabase Full-Text-Search statt `ilike` |
| M6 | **User-Statistiken im Profil** | Review-Count, Collection-Badges |
| M7 | **Saisonale Empfehlungen** | "Best for Summer/Winter" aus Occasions-Daten |

#### 🟣 Epics (1-3 Wochen)

| # | Feature | Beschreibung |
|---|---|---|
| E1 | **Follow-System** | Usern folgen, Follower-Zähler, Activity-Feed |
| E2 | **Review-Kommentare** | Kommentare unter Reviews |
| E3 | **Duftvergleich** | 2-3 Parfüms nebeneinander vergleichen |
| E4 | **Discovery-Feed** | Personalisiert: "Basierend auf deinen Favoriten" |
| E5 | **Admin-Dashboard** | Parfüms/Brands hinzufügen, Moderation |
| E6 | **Notification-System** | Likes, Follows, Kommentare (Supabase Realtime) |
| E7 | **OAuth Login** | Google/GitHub/Apple |
| E8 | **"Signature Scent"** | Ein Parfüm als Signaturduft auf dem Profil |
| E9 | **Duft-Empfehlungen** | "Wenn du X magst, probiere Y" |

---

## 4. Roadmap & Nächste Schritte

### 4-Wochen-Plan zum MVP

#### Woche 1 — Stabilisierung & Quick Wins

| Entwickler A (Frontend) | Entwickler B (Backend) |
|---|---|
| Protected Routes + Error Boundaries | RLS-Policies Audit |
| 404-Seite erstellen | Auth-Listener-Cleanup fixen |
| Review-Likes im UI verdrahten | `created_at` für Profile sicherstellen |
| Review-Löschen-Button | Durchschnittsbewertung als DB-View |
| "Joined"-Datum fixen | `.env.example`, Root Dev-Script |

#### Woche 2 — Kern-Community-Features

| Entwickler A (Frontend) | Entwickler B (Backend) |
|---|---|
| Profil-Bearbeitungsseite (Form + UI) | Supabase Storage Bucket + Avatar-Service |
| "Add to List"-Modal | Volltext-Suche als Supabase-Funktion |
| Listen erstellen im Profil | Server-seitiger noteFamily-Filter |

#### Woche 3 — Soziale Features

| Entwickler A (Frontend) | Entwickler B (Backend) |
|---|---|
| Follow-Button + Follower-Liste | `follows`-Tabelle + RLS + Service |
| User-Statistiken auf Profil | `comments`-Tabelle + Service |

#### Woche 4 — Polish & Launch

| Entwickler A (Frontend) | Entwickler B (Backend) |
|---|---|
| Responsive Audit aller Seiten | Performance: Indizes, Query-Optimierung |
| Micro-Animations, SEO Meta-Tags | Passwort-Reset, Email-Verifizierung |
| **Gemeinsam:** End-to-End-Test, Bug-Fixing, Deployment |

### Kritischer Pfad

```
Auth-Fix → Protected Routes → Profil-Bearbeitung → Follow-System → Polish
    ↓
Review-Likes UI → Add-to-List → Kommentare (optional für MVP)
```

> **MVP-Definition:** User kann sich registrieren, Parfüms durchsuchen, Reviews schreiben (mit Likes), Profil bearbeiten, Listen erstellen, und anderen Usern folgen.

### Offene Bugs & Platzhalter

| # | Typ | Datei | Beschreibung |
|---|---|---|---|
| 1 | 🐛 Bug | `ProfilePage.jsx:94` | `updated_at` statt `created_at` für "Joined" |
| 2 | 🐛 Bug | `authStore.js:28` | `onAuthStateChange` ohne Cleanup → Memory-Leak |
| 3 | 🐛 Bug | `perfumeService.js:81` | Client-seitige Filterung verfälscht Pagination |
| 4 | 🐛 Bug | `ExplorePage.jsx:151` | Doppelte Pagination-Logik |
| 5 | ⚠️ Platzhalter | `assets/` | `react.svg`, `vite.svg` — ungenutzte Template-Dateien |
| 6 | ⚠️ Lücke | `ReviewCard.jsx` | `onLike` Prop wird nie übergeben |
| 7 | ⚠️ Lücke | `listService.js:45` | `createList` setzt keine `user_id` explizit |
| 8 | ⚠️ Config | `tailwind.config.js` | Konfiguriert aber ungenutzt → aufräumen |

---

*Erstellt am 30.04.2026 — Scentboxd Codebase v1.0 Analyse*
