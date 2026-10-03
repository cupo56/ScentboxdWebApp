# Redesign der Webapp nach iOS-App und Waitlist

**Datum:** 2026-10-02
**Status:** Design freigegeben

## Problem

Die Webapp sieht anders aus als die iOS-App und die Waitlist-Landingpage.
Sie nutzt ein kühles Blau-Violett (`#161826`, Akzent `#9184d9`), Inter als
einzige Schrift und ein dreispaltiges Feed-Layout mit eigener Begriffswelt
(Feed, Index, Houses, Shelf, Verdicts). App und Waitlist teilen dagegen eine
Marke: Magenta `#C20A66`, dunkle Pflaume- oder Schwarztöne, Serif-Headlines,
Glas-Panels und Magenta-Glows.

Ziel: Die Webapp bekommt dieselbe visuelle Sprache, und die drei wichtigsten
Seiten (Today, Catalog, Detail) werden nach dem Vorbild der iOS-Screens neu
aufgebaut. Alle übrigen Seiten behalten ihren Aufbau und bekommen nur die
neue Optik.

## Vorlagen

Beide Vorlagen wurden aus dem Code gelesen, nicht aus Screenshots.

| | iOS-App (`SCENTAPP/scentboxd/UI/Theme/DesignSystem.swift`) | Waitlist (`scentboxd-waitlist/style.css`) |
|---|---|---|
| Akzent | `#C20A66` | `#C20A66` |
| Hintergrund | `#221019` Pflaume | `#0D0B0F` fast Schwarz |
| Flächen | `#2E1A24` bei 60 % + `.ultraThinMaterial` | `#1C1A1E` bei 45 % + Blur 20px |
| Zweite Farbe | Champagner `#F7E7CE` (Sterne, Eyebrows) | Gold `#D4A017`, Pink `#E85D9F` im Gradient-Text |
| Überschriften | System-Serif (geplant: Playfair Display) | Fraunces 600 |
| Fließtext | System (geplant: Manrope) | System |
| Schatten | Magenta-Glow statt Schwarz | Magenta-Glow auf Buttons, schwarze Drop-Shadows auf Karten |
| Extras | Bild-Scrims, Shimmer-Skeletons, Rang-Badges Gold/Silber/Bronze | Aurora-Blobs, Partikel, Scroll-Reveal |

Beide sind dark-only.

## Entscheidungen

Getroffen im Brainstorming mit Mockups im Browser (`.superpowers/brainstorm/`).

1. **Richtung „Hybrid“.** Pflaume-Schwarz als Grund, Fraunces und dezente
   Aurora von der Waitlist, Champagner und Komponenten-Details aus der App.
   Eine Marke, keine Kopie von einer der beiden Vorlagen.
2. **Umfang.** Neue Optik überall, plus Today, Catalog und Detail neu gedacht.
3. **Navigation wie iOS.** Today, Catalog, Favorites, Collection, Community.
   Profil hinter dem Avatar.
4. **Today zweispaltig** mit Zahlenleiste oben.
5. **Catalog mit Filter-Spalte links**, App-Karten im Raster, Trending-Karussell
   über dem Raster.
6. **Detail als eine Spalte** mit großem Bild oben, wie in der App.
7. **Umsetzung schrittweise über Tokens**, ein PR pro Schritt, jeder hinter
   dem Maintenance-Gate live.

## Abschnitt 1: Grundlagen

### Farben

Alle in `client/src/index.css` unter `:root`. Die alten Variablennamen
(`--bg-primary`, `--bg-card`, `--accent-dim`, …) bleiben als Aliase, damit
Komponenten-CSS, das noch nicht angefasst wurde, weiter funktioniert.

| Token | Wert | Rolle |
|---|---|---|
| `--bg` | `#130A10` | Seitenhintergrund |
| `--surface` | `rgba(46, 26, 36, 0.5)` | Glas-Karten, Panels, Chips; immer mit `backdrop-filter: blur(20px)` |
| `--surface-solid` | `#2E1A24` | Dropdowns, Modals, Toasts, Tab-Leiste (kein Blur nötig) |
| `--accent` | `#C20A66` | Primär-Buttons, aktive Zustände, Marke auf Karten, Links |
| `--accent-soft` | `#E75A9C` | Akzent-Text auf dunklem Grund, wenn `#C20A66` zu dunkel ist |
| `--accent-tint` | `rgba(194, 10, 102, 0.15)` | Chip-Hintergrund, Konzentrations-Tag |
| `--accent-line` | `rgba(194, 10, 102, 0.3)` | Ränder auf Akzent-Elementen |
| `--champagne` | `#F7E7CE` | Sterne, Eyebrows, Bewertungs-Pille, Kicker |
| `--text` | `#F2EEF0` | Primärtext |
| `--text-body` | `#A9A2A6` | Fließtext, Sekundäres |
| `--text-muted` | `#94A3B8` | Meta, Notenlisten, Labels |
| `--hairline` | `rgba(255, 255, 255, 0.08)` | Ränder |
| `--hairline-strong` | `rgba(255, 255, 255, 0.14)` | Ränder im Hover, Input-Ränder |
| `--glow` | `0 6px 20px rgba(194, 10, 102, 0.4)` | Primär-Buttons, aktive Chips |
| `--glow-card` | `0 14px 36px rgba(194, 10, 102, 0.14)` | Hero-Karten |
| `--inset-highlight` | `inset 0 1px 0 rgba(255, 255, 255, 0.1)` | Oberkante von Glas-Panels |
| `--gold`, `--silver`, `--bronze` | `#FFD700`, `#C0C0C0`, `#CD7F32` | Rang-Badges 1–3 |
| `--success`, `--danger`, `--warning` | `#4ADE80`, `#FF6B6B`, `#F59E0B` | Status |
| `--gradient-text` | `linear-gradient(105deg, #E85D9F, #F7E7CE)` | Zahlen in der Statistik, Akzent in Headlines |

Scent-Family-Farben aus der App (`Floral #FFB6C1`, `Woody #8B7355`, …)
werden als `--family-*` übernommen, für Family-Chips und Filter.

### Schrift

- **Display:** Fraunces 600 mit optischer Größe, von Google Fonts. Für
  alle Überschriften, Parfum-Namen auf Karten und Detailseite, Zahlen in der
  Statistik und das Wortzeichen.
- **UI und Fließtext:** Manrope 400, 500, 600, 700, von Google Fonts.
  Das ist die Schrift, die in der App als Platzhalter geplant war.
- **Eyebrows und Kicker:** Manrope 700, 10–11px, Großbuchstaben,
  `letter-spacing: 0.16em`, in Champagner oder Magenta.
- **Wortzeichen:** `scent` in `--text`, `boxd` in `--accent`, Fraunces 600,
  klein geschrieben, wie auf der Waitlist. Das Rauten-SVG entfällt.

Inter wird entfernt.

### Basis-Komponenten in `index.css`

- `.btn-primary`: Magenta, weiß, Radius 10px, `--glow`; Hover hebt um 1px
  und verstärkt den Glow; Active skaliert auf 0.98.
- `.btn-secondary`: Glas mit `--hairline`, Text `--text`.
- `.btn-ghost`: nur Text in `--text-body`.
- `.chip`: `--accent-tint`, Text `--accent-soft`, Radius pill. Aktiv:
  Magenta-Füllung, weißer Text, `--glow`. Variante `.chip-glass` für
  neutrale Chips (Glas mit Hairline).
- `.card` und `.glass`: `--surface` mit Blur, `--hairline`,
  `--inset-highlight`, Radius 14px. `.card` hebt sich im Hover und bekommt
  `--glow-card`.
- `.input`: `rgba(13, 11, 15, 0.5)`, `--hairline-strong`, Radius 10px,
  Fokus: 2px Magenta-Outline.
- `.badge-rank-1/2/3`: Gold, Silber, Bronze mit schwarzem Text bei 75 %;
  ab Rang 4 Magenta mit weißem Text.
- `.skeleton`: Shimmer, weißer Verlauf bei 30 %, 1.5s linear, wie in der App.
- `.eyebrow`: siehe Schrift.

### Hintergrund

Eine fixe Aurora-Ebene (`.aurora`) in `Layout.jsx`, hinter allem,
`pointer-events: none`. Zwei Blobs: Magenta oben links (`min(500px, 105vw)`,
Opacity 0.3), Gold unten rechts (`min(400px, 85vw)`, Opacity 0.22). Beide
`blur(clamp(48px, 14vw, 80px))`, Animation `aurora-float 20s` wie auf der
Waitlist. Unter `prefers-reduced-motion` ohne Animation. Keine Partikel.

### Entfällt

- Alte Blau-Violett-Tokens und die „Sillage“-Tokens.
- Inter.
- `DESIGN.md` wird komplett neu geschrieben und beschreibt die neue Sprache.

## Abschnitt 2: Navigation und Routen

### Desktop-Leiste (`Navbar.jsx`)

Links das Wortzeichen. Dann fünf Pill-Links: Today, Catalog, Favorites,
Collection, Community. Aktiv: `--accent-tint` mit Text `--text`. Rechts die
Suche (⌘K bleibt, Dropdown mit Treffern bleibt) und der Avatar mit dem
bestehenden `AccountMenu` (Profil, Settings, Logout). Nicht eingeloggt: statt
Avatar ein `.btn-primary btn-sm` „Sign in“.

Die Leiste ist Glas. Nach 8px Scroll wird sie `rgba(19, 10, 16, 0.7)` mit
Blur 16px und einer `--hairline` unten, Übergang 0.3s.

### Mobile Tab-Leiste (`TabBar.jsx`)

Fünf Tabs mit Phosphor-Icons: Today (`SunHorizon`), Catalog (`Book`),
Favorites (`Heart`), Collection (`Star`), Community (`Users`). Aktiv: Icon
und Label in Magenta, Icon mit Glow. Hintergrund `--surface-solid`,
Oberkante `--hairline`. Der Plus-Button entfällt. Der Avatar sitzt oben
rechts in der Navbar, auch mobil.

### Routen (`App.jsx`)

| Route | Seite | Anmerkung |
|---|---|---|
| `/` | `TodayPage` | neu, ersetzt `HomePage` |
| `/catalog` | `CatalogPage` | heutige `ExplorePage`, umbenannt |
| `/explore` | Redirect auf `/catalog` | Query-String bleibt erhalten |
| `/favorites` | `ShelfPage` mit `status="favorite"` | `RequireAuth` |
| `/collection` | `ShelfPage` mit `status="owned"` | `RequireAuth` |
| `/community` | `CommunityPage` | öffentlich |
| `/brands`, `/brand/:id` | bleiben | aus dem Catalog verlinkt („Browse by brand“) |
| `/perfume/:id` | `PerfumeDetailPage` | neu aufgebaut |
| `/profile/:username`, `/list/:id`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/settings`, `/account`, `*` | bleiben | nur neue Optik |

`RequireAuth` zeigt für Favorites und Collection statt einer Weiterleitung
eine Glas-Karte mit Erklärung und Sign-in-Button, damit die Tabs auch ohne
Login einen Sinn ergeben.

### Wording

Die Seite bleibt englisch. „Verdicts“ wird zu „Reviews“, „Shelf“ zu
„Collection“, „Index“ zu „Catalog“, „Houses“ zu „Brands“. `shelfPath` in
`useAuth` wird zu `collectionPath` und zeigt auf `/collection`.

## Abschnitt 3: Die drei neu gebauten Seiten

### Today (`/`)

Zwei Spalten auf Desktop (`1.4fr 1fr`, ab 960px), eine Spalte mobil mit der
Reihenfolge Zahlenleiste, Pick, Trending, Community, Reviews.

- **Zahlenleiste**, nur eingeloggt: Glas-Streifen mit drei Werten
  (Collection, Want to try, Reviews). Zahlen in Fraunces 600 mit
  `--gradient-text`, Labels als Eyebrow. Daten wie heute aus
  `getUserPerfumesByStatus` und `getReviewCountByUser`.
- **Your pick today** (linke Spalte): Hero-Karte, Radius 16px,
  `--accent-line`, `--glow-card`. Bild 4:5 mit Verlauf von unten
  (`rgba(19,10,16,0.95)` bis transparent bei 65 %), darauf Serif-Name 26px
  und Marke in `--accent-soft`. Oben rechts ein Magenta-Tag („Trending #1“
  oder „From your list“). Darunter ein „Why“-Block in Glas mit
  Champagner-Eyebrow. Der Pick kommt aus `pickOfTheDay(trending, wantToTry)`:
  eingeloggt mit nicht-leerer Want-to-try-Liste → ein Duft daraus,
  deterministisch nach Tagesdatum; sonst Platz 1 aus `trending_perfumes`.
  Der Why-Text wird aus Daten gebaut: Duftfamilie der Top-Note,
  erste drei Noten, Longevity. Beispiel: „Woody with Mocha, Sandalwood and
  Coffee up top. Long-lasting, good for cooler evenings.“ Kein Matching,
  kein Prozentwert.
- **Trending this week** (linke Spalte): horizontales Karussell mit sechs
  Kacheln 120×170px, Radius 10px, Rang-Badge oben links, Name und Marke
  unten. Daten aus `getTrendingPerfumes()` (neu in `perfumeService`, liest
  die View `trending_perfumes`).
- **Community** (rechte Spalte): Glas-Karte mit den letzten vier
  Aktivitäten. Bevorzugt Reviews von Leuten, denen man folgt, sonst global;
  Blockierte gefiltert. Logik aus der heutigen `HomePage` wird nach
  `useActivityFeed` ausgelagert und von Today und Community geteilt.
- **Reviews worth reading** (rechte Spalte): zwei `ReviewCard`s im
  kompakten Modus, Link „All reviews“ nach `/community`.

### Catalog (`/catalog`)

- Suchfeld oben in voller Breite, `.input` mit Lupe.
- Darunter Grid `220px 1fr` ab 900px. Links die Filter-Spalte: das
  bestehende `FilterPanel` als Glas-Panel mit Eyebrow-Überschriften und
  Optionen als Liste; aktive Option mit Magenta-Quadrat. Mobil bleibt das
  `FilterSheet`, der Filter-Button ist ein Magenta-Chip.
- Rechts über dem Raster: Trending-Karussell wie auf Today, zusammenklappbar
  (Zustand in `localStorage`). Darunter aktive Filter als Chips mit ×, rechts
  daneben Sortierung und der Umschalter Raster/Liste.
- Raster `repeat(auto-fill, minmax(180px, 1fr))`, Gap 16px.
- **PerfumeCard** neu nach der App: Bild 3:4 mit Verlauf von unten
  (schwarz 50 %), Favorit-Herz unten rechts und Collection-Stern unten links
  direkt auf dem Bild (22px, Magenta wenn aktiv, sonst Weiß 80 % auf dunklem
  Kreis; nur eingeloggt sichtbar, Toggle über `userPerfumeService`). Info
  mit Padding 10px: Sternwert in Magenta 11px, Serif-Name 15px, Marke in
  `--accent-soft` 11px, Top-Noten in `--text-muted` 10px, Konzentration als
  Tag mit `--accent-tint`, Radius 4px. Container Glas, Radius 12px,
  `--accent-line` bei 10 %.
- `PerfumeRow` bleibt als Listenansicht und wird nur neu gestylt.
- Unter dem Raster ein Link „Browse by brand“ nach `/brands`.

### Detail (`/perfume/:id`)

Eine Spalte, `max-width: 720px`, zentriert.

- **Hero-Bild:** volle Breite der Spalte, Höhe `min(60vh, 520px)`,
  Hintergrund radialer Pflaume-Verlauf, Flakon `object-fit: contain` mit
  Magenta-Glow-Schatten. Unten ein 140px-Verlauf in `--bg`. Der Inhalt
  beginnt mit `margin-top: -40px` darüber.
- **Header:** Marke als Champagner-Eyebrow (Link zur Brand-Seite),
  Serif-Name 34px, Konzentrations-Pille (`--accent-tint`, `--accent-line`),
  Bewertungs-Pille (Champagner-Stern, Durchschnitt fett, Anzahl in Klammern,
  Weiß 8 %).
- **Aktionen:** vier Glas-Kacheln 56px hoch in einer Reihe: Want to try,
  Collection, Favorite, Add to list. Icon 14px plus Label 10px Großbuchstaben.
  Aktiv: Magenta-Füllung mit Glow. `UserPerfumeActions` und
  `AddToListButton` werden darauf umgebaut.
- **Fragrance pyramid:** Serif-Titel 20px, drei Glas-Zeilen Top, Heart,
  Base mit Icon-Kreis (Weiß 8 %), Label 10px Großbuchstaben in Magenta bei
  60 %, Noten als Text 13px durch Kommas getrennt. Noten kommen weiterhin
  übersetzt über `useNoteName`.
- **Performance:** Glas-Panel, Padding 20px, Grid 2×2: Longevity, Sillage,
  Bottle, Value. Label bei 70 %, Wert in Magenta fett, Balken 6px mit
  Magenta-Füllung auf Weiß 10 %. Longevity und Sillage werden über
  `longevity_code` und `sillage_code` auf 0–100 abgebildet, Bottle und Value
  aus `avg_bottle_rating` und `avg_value_rating` (0–5 → 0–100).
- **Description:** `desc` als Fließtext in `--text-body`.
- **More from Brand:** horizontale Reihe mit `getSimilarPerfumes`, Kacheln
  wie Trending ohne Badge.
- **Reviews:** Serif-Titel, `ReviewForm` in Glas, darunter `ReviewCard`s
  mit Champagner-Sternen, Like in Magenta, Kommentare wie bisher.

## Abschnitt 4: Übrige Seiten und Komponenten

Nur neue Optik, Aufbau bleibt: `BrandsOverviewPage`, `BrandPage`,
`ProfilePage`, `ListDetailPage`, `AuthPage` (Login, Register),
`ForgotPasswordPage`, `ResetPasswordPage`, `SettingsPage`, `AccountPage`,
`NotFoundPage`, `Footer`. Direkt eingetragene Farbwerte in ihren CSS-Dateien
werden durch Tokens ersetzt. `MaintenancePage` bleibt unverändert, sie hat
ihr eigenes, gescoptes Styling.

Komponenten: `ReviewCard` (Champagner-Sterne, Glas, Magenta-Like,
Occasion-Tags Magenta und Season-Tags Champagner wie in der App),
`StarRating` (Champagner gefüllt, Weiß 20 % leer), `CommentSection`,
`ListFormModal`, `AddToListModal`, `CreateListModal`, `FollowListModal`,
`ReportModal`, `ToastContainer`, `SkeletonRow`, `ErrorBoundary`. Modals
nutzen `--surface-solid` mit Blur-Overlay.

`ShelfPage` (neu) zeigt die neue `PerfumeCard` im Raster, Titel „Favorites“
oder „Collection“, Zähler, leerer Zustand mit Link in den Catalog.

`CommunityPage` (neu) zeigt den Aktivitäts-Feed in voller Länge
(`useActivityFeed` mit Pagination über `getLatestReviews`) und oben einen
Umschalter „Following / Everyone“ für Eingeloggte.

## Umsetzung

Ein PR pro Schritt, jeder geht hinter dem Maintenance-Gate live und wird
im Browser mit den Mockups verglichen.

1. **Grundlagen:** `index.css` (Tokens, Schriften, Basis-Komponenten,
   Aurora), `Layout.jsx` (Aurora-Ebene), `index.html` (Fonts), `DESIGN.md`
   neu. Alle Seiten sehen danach schon anders aus.
2. **Navigation:** `Navbar`, `TabBar`, `AccountMenu`, Routen, `ShelfPage`,
   `CommunityPage`, `useActivityFeed`, Wording.
3. **Today:** `TodayPage`, `getTrendingPerfumes`, `pickOfTheDay`,
   `TrendingCarousel`, `HeroPickCard`, `StatsStrip`.
4. **Catalog:** `CatalogPage`, `PerfumeCard` neu, `FilterPanel` und
   `FilterSheet` neu gestylt, Trending-Einbindung.
5. **Detail:** `PerfumeDetailPage` neu, `UserPerfumeActions`,
   `FragrancePyramid`, `PerformanceBar`, `ReviewCard`, `StarRating`.
6. **Rest:** übrige Seiten und Komponenten durchgehen, alte Aliase und
   tote CSS-Regeln entfernen.

## Tests

- Bestehende Tests bleiben grün; Texte wie „Verdicts“ werden in den Tests
  mit angepasst.
- Neu: `/explore` leitet nach `/catalog` weiter; `ShelfPage` ohne Login zeigt
  die Sign-in-Karte; `getTrendingPerfumes` liest die View;
  `pickOfTheDay` bevorzugt Want-to-try und ist pro Tag stabil;
  `buildWhyText` erzeugt den Satz aus Familie, Noten und Longevity;
  `PerfumeCard` zeigt Herz und Stern nur eingeloggt.
- Optik: pro Schritt Screenshots vom Preview-Deploy, Vergleich mit den
  Mockups in `.superpowers/brainstorm/`.

## Nicht enthalten

- Light Mode (App und Waitlist sind dark-only).
- Anlass-Chips und echtes Matching mit Prozentwert.
- Geteiltes Token-Paket mit Waitlist und App.
- Partikel-Canvas und Scroll-Reveal der Waitlist.

## Erkenntnisse aus der Umsetzung

- `perfumes.longevity` und `perfumes.sillage` sind deutscher Text; die Codes
  (`longevity_code`, `sillage_code`) sind das stabile Vokabular. Web filtert und
  beschriftet über die Codes. Die RPC `get_perfumes_by_notes` filtert noch über
  den Text; der Client mappt dafür Code → Label (Follow-up: RPC umstellen).
- `reviews.bottle_rating`/`value_rating` und `perfumes.avg_bottle_rating`/
  `avg_value_rating` sind 0–100 (iOS schreibt Prozent). Web liest ≤ 5 als Sterne
  (Altbestand), zeigt 0–5 an und schreibt Prozent.
- Review-Anlässe (`occasions`) liegen gemischt deutsch/englisch vor; Anzeige
  unverändert.
- `--surface` blieb deckend (Dropdowns, Tab-Leiste); Glas ist `--glass` +
  `.glass`/`.card`. Die Aliase der alten Tokens wurden in Schritt 6 entfernt.
- Der Catalog-Erstaufruf dauert durch `count: 'exact'` über 31k Zeilen mehrere
  Sekunden; die Brands-Übersicht zählt je Marke. Beides Follow-ups (DB-View /
  geschätzter Count).
- Node 26 bringt ein unvollständiges `localStorage` mit; die Tests laufen mit
  `--no-experimental-webstorage`.
