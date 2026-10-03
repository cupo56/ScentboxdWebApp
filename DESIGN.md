---
version: 2.0.0
theme:
  mode: "dark"
colors:
  background: "#130A10"
  surface: "#1C1017"
  surfaceElevated: "#2E1A24"
  glass: "rgba(46, 26, 36, 0.5)"
  text:
    primary: "#F2EEF0"
    body: "#A9A2A6"
    muted: "#94A3B8"
    dim: "rgba(242, 238, 240, 0.45)"
  accent:
    base: "#C20A66"
    soft: "#E75A9C"
    tint: "rgba(194, 10, 102, 0.15)"
    line: "rgba(194, 10, 102, 0.3)"
  champagne: "#F7E7CE"
  rank:
    gold: "#FFD700"
    silver: "#C0C0C0"
    bronze: "#CD7F32"
  status:
    success: "#4ADE80"
    danger: "#FF6B6B"
    warning: "#F59E0B"
  border:
    default: "rgba(255, 255, 255, 0.08)"
    strong: "rgba(255, 255, 255, 0.14)"
typography:
  display: "'Fraunces', Georgia, serif — weight 600–800, optical size axis"
  ui: "'Manrope', system-ui, sans-serif — weights 400–700"
  eyebrow: "700 11px, uppercase, letter-spacing 0.16em"
radii:
  sm: "4px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  pill: "999px"
shadows:
  glow: "0 6px 20px rgba(194, 10, 102, 0.4)"
  glowCard: "0 14px 36px rgba(194, 10, 102, 0.14)"
  insetHighlight: "inset 0 1px 0 rgba(255, 255, 255, 0.1)"
gradients:
  text: "linear-gradient(105deg, #E85D9F, #F7E7CE)"
motion:
  durations:
    fast: "0.15s"
    medium: "0.25s"
    rise: "0.6s"
    shimmer: "1.5s"
    aurora: "20s"
  reducedMotion: "honoured — aurora, shimmer and transitions stop; spinners keep running"
---

# Scentboxd Design System

Die Webapp teilt ihre visuelle Sprache mit der iOS-App und der
Waitlist-Landingpage. Quelle der Wahrheit für Werte ist `client/src/index.css`;
dieses Dokument erklärt, wie sie gemeint sind. Entscheidungen und Herleitung:
`docs/superpowers/specs/2026-10-02-webapp-redesign-design.md`.

## Identität

Scentboxd ist eine Community-Plattform für Parfum-Fans. Der Look ist dunkel,
warm und edel: ein fast schwarzes Pflaume als Grund, ein kräftiges Magenta
als einziger Akzent, Champagner für alles, was Wert oder Bewertung bedeutet.
Dark-only, wie App und Landingpage.

## Flächen und Tiefe

- `--bg` `#130A10` ist der Grund. Er liegt auf `html`, nicht auf `body`,
  damit die Aurora dahinter durchscheint.
- Dahinter liegt die **Aurora**: zwei weichgezeichnete Farbflecken (Magenta
  oben links, Gold unten rechts), die langsam driften. Sie gibt der Seite
  Bewegung, ohne Inhalt zu stören. Komponente: `Aurora.jsx` in `Layout`.
- **Glas** (`.glass`, `.card`, `.btn-secondary`) ist die Standardfläche für
  Karten und Panels: halbtransparentes Pflaume (`--glass`) mit
  `backdrop-filter: blur(20px)`, einer Hairline und einem hellen
  Innen-Highlight an der Oberkante.
- `--surface` und `--surface-2` sind deckende Flächen für Dropdowns, Modals,
  Toasts und die Tab-Leiste. Dort muss nichts durchscheinen.

## Farbe

- **Magenta** `#C20A66` ist der einzige Akzent: Primär-Buttons, aktive Chips
  und Tabs, Marke auf Karten, Links, Herz und Stern. Als kleiner Text auf
  dunklem Grund ist `--accent-soft` `#E75A9C` besser lesbar.
- **Champagner** `#F7E7CE` steht für Wert: Sterne, Bewertungen, Eyebrows über
  Überschriften, Kicker.
- **Text** in vier Stufen: `--text` für Inhalt, `--text-body` für Fließtext,
  `--text-muted` für Meta und Labels, `--text-dim` für die leiseste Stufe.
- **Rang-Badges** in Gold, Silber, Bronze für die Plätze 1 bis 3, danach
  Magenta.
- Schatten sind **Glows in Magenta**, nicht schwarz. Primär-Buttons tragen
  immer einen Glow, Hero-Karten einen weichen, großen.
- Duftfamilien haben feste Farben (`--family-*`), übernommen aus der App.

## Typografie

- **Fraunces** (`--font-display`, 600 bis 800) für Überschriften,
  Parfum-Namen, große Zahlen und das Wortzeichen. `h1` bis `h3` sind global
  darauf gesetzt; Klassen, die `font:` als Kurzform nutzen, müssen
  `var(--font-display)` selbst angeben.
- **Manrope** (`--font`) für UI und Fließtext, 400 bis 700. Kleine, enge
  Texte wie in der App: Meta bei 11 bis 13px.
- **Eyebrows** (`.eyebrow`): 11px, Großbuchstaben, weiter Buchstabenabstand,
  Champagner oder Magenta (`.eyebrow--accent`). Sie stehen über
  Überschriften und Abschnitten.
- **Gradient-Text** (`.gradient-text`): Pink nach Champagner, für Zahlen in
  Statistiken und einzelne Wörter in Headlines.
- `--text-dim` ist die vierte Textstufe, die leiseste (nach `--text`,
  `--text-body`, `--text-muted`).

## Wortzeichen

`scentboxd`, klein geschrieben, in Fraunces 600. `scent` in `--text`, `boxd`
in Magenta. Komponente: `client/src/components/layout/Wordmark.jsx`. Es gibt
kein Logo-Symbol.

## Komponenten

- **Buttons:** `.btn-primary` Magenta mit Glow, hebt sich beim Hover um 1px
  und drückt sich beim Klick auf 0.98. `.btn-secondary` Glas mit Hairline.
  `.btn-ghost` nur Text.
- **Chips:** `.chip` Magenta-Tint mit Magenta-Text. Aktiv (`aria-pressed` oder
  `.chip--active`) Magenta-Füllung mit Glow. `.chip--glass` für neutrale Chips.
- **Inputs:** dunkles Feld, Hairline, im Fokus Magenta-Rand mit zartem Ring.
- **Karten:** `.card` ist Glas, hebt sich beim Hover und bekommt den
  Karten-Glow. Bilder tragen einen Verlauf von unten, damit Text darauf
  lesbar bleibt.
- **Badges:** `.badge-rank` mit `.badge-rank-1/2/3` für Gold, Silber, Bronze.
- **Aktionskacheln:** `.action-tile`, Glaskachel mit Icon und Titel für
  Einstiege wie auf der Today-Seite.
- **Glas-Pyramide:** Duftpyramide aus Glasflächen (Kopf, Herz, Basis).
- **Performance-Panel:** Glas-Panel mit Longevity, Sillage und Bewertungen
  (Flaschen- und Preis-Leistungs-Rating).
- **Parfum-Karten:** `.pcard`, die Karte für Parfums in Grids und Karussells.
- **`PerfumeCarousel`:** horizontal scrollende Reihe aus `.pcard`.
- **`.sr-only`:** nur für Screenreader sichtbar, für Labels ohne sichtbaren Text.
- **Skeleton:** Shimmer mit weißem Verlauf, 1.5s linear, wie in der App.

## Motion

Kurz und weich. Hover 0.15 bis 0.25s mit `ease`. Einblenden mit `.rise-in`
(0.6s, 14px von unten). Aurora driftet in 20s. Unter
`prefers-reduced-motion` stehen Aurora, Shimmer und alle Übergänge still;
Spinner laufen weiter, weil sie einen Zustand anzeigen.

## Tests

`client/src/index.css.test.js` prüft den Token-Vertrag: Pflichttokens sind
definiert, alte Palette und Inter sind weg, und jede
`var(--x)`, die irgendwo in `src` benutzt wird, ist auch definiert.
