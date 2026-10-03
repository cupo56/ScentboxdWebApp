# Redesign Schritt 1: Grundlagen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Webapp bekommt die neue visuelle Sprache (Pflaume-Schwarz, Magenta, Champagner, Fraunces + Manrope, Glas, Aurora) über die globalen Tokens und Basis-Komponenten, so dass alle Seiten sofort anders aussehen, ohne dass eine Seite umgebaut wird.

**Architecture:** Alles läuft über `client/src/index.css`. Die `:root`-Tokens werden ersetzt, die alten Variablennamen bleiben als Aliase, damit das Komponenten-CSS der übrigen Seiten weiter funktioniert. Ein neues `Aurora`-Element liegt fix hinter dem Layout. Das Wortzeichen wird eine kleine Komponente, die Navbar und Footer teilen. `DESIGN.md` wird neu geschrieben. Spec: `docs/superpowers/specs/2026-10-02-webapp-redesign-design.md`, Abschnitt 1.

**Tech Stack:** React 19, Vite, Vanilla CSS mit Custom Properties, Vitest + React Testing Library, Google Fonts (Fraunces, Manrope).

**Abweichung von der Spec:** `--surface` bleibt eine deckende Farbe, weil über 20 CSS-Dateien sie für Dropdowns, Panels und die Tab-Leiste benutzen. Das transparente Glas heißt `--glass` und wird nur über `.glass` und `.card` mit Blur angewendet. `--surface-solid` aus der Spec ist ein Alias auf `--surface-2`.

**Branch:** Alle Tasks auf dem bestehenden Branch `redesign` (enthält bereits die Spec). Alle Befehle aus `client/` ausführen.

---

## Dateien

| Datei | Aktion | Verantwortung |
|---|---|---|
| `client/index.html` | ändern | Fonts laden (Fraunces, Manrope), Theme-Color |
| `client/src/index.css` | ersetzen | Tokens, Globals, Basis-Komponenten, Aurora-CSS, Keyframes |
| `client/src/index.css.test.js` | neu | Token-Vertrag: Pflichttokens vorhanden, alte Werte weg |
| `client/src/components/layout/Aurora.jsx` | neu | Fixe Hintergrund-Ebene mit zwei Blobs |
| `client/src/components/layout/Aurora.test.jsx` | neu | Rendert dekorativ, zwei Blobs |
| `client/src/components/layout/Layout.jsx` | ändern | Aurora einhängen |
| `client/src/components/layout/Wordmark.jsx` | neu | `scent` + `boxd` in Magenta, Fraunces |
| `client/src/components/layout/Wordmark.css` | neu | Styling des Wortzeichens |
| `client/src/components/layout/Wordmark.test.jsx` | neu | Rendert beide Teile, Akzent-Klasse |
| `client/src/components/layout/Navbar.jsx` | ändern | SVG-Raute raus, Wordmark rein |
| `client/src/components/layout/Navbar.css` | ändern | Logo-Regel an Wordmark anpassen |
| `client/src/components/layout/Footer.jsx` | ändern | Wordmark statt „◆ Scentboxd“ |
| `client/src/components/layout/Footer.css` | ändern | Logo-Regel entfernen |
| `DESIGN.md` | ersetzen | Neue Designsprache dokumentieren |

---

### Task 1: Fonts laden

**Files:**
- Modify: `client/index.html`
- Modify: `client/src/index.css:1` (Inter-Import entfernen, erst in Task 2 komplett ersetzt)

- [ ] **Step 1: index.html um Font-Links und Theme-Color ergänzen**

Ersetze den `<head>` in `client/index.html` vollständig:

```html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#130A10" />
    <meta name="description" content="Scentboxd — The fragrance encyclopedia. Discover, rate, and collect perfumes from 500+ fragrances." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Manrope:wght@400;500;600;700&display=swap"
    />
    <title>Scentboxd — Fragrance Encyclopedia</title>
  </head>
```

- [ ] **Step 2: Build prüfen**

Run: `npm run build 2>&1 | tail -2`
Expected: `✓ built in …`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(redesign): load Fraunces and Manrope from Google Fonts"
```

---

### Task 2: Token-Vertrag als Test

Der Test liest `index.css` als Text und prüft, dass die neuen Tokens definiert sind und die alten Werte verschwunden sind. Er schützt die Umstellung vor Rückfällen und dokumentiert, welche Tokens Komponenten voraussetzen dürfen.

**Files:**
- Create: `client/src/index.css.test.js`

- [ ] **Step 1: Test schreiben**

```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');

// Das `:root`-Block-Ende ist die erste schließende Klammer nach `:root {`.
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));

const token = (name) => {
  const match = root.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : undefined;
};

describe('design tokens', () => {
  it.each([
    ['--bg', '#130A10'],
    ['--accent', '#C20A66'],
    ['--accent-soft', '#E75A9C'],
    ['--champagne', '#F7E7CE'],
    ['--text', '#F2EEF0'],
    ['--text-body', '#A9A2A6'],
    ['--text-muted', '#94A3B8'],
    ['--gold', '#FFD700'],
    ['--silver', '#C0C0C0'],
    ['--bronze', '#CD7F32'],
    ['--success', '#4ADE80'],
    ['--danger', '#FF6B6B'],
    ['--warning', '#F59E0B'],
  ])('defines %s as %s', (name, value) => {
    expect(token(name)).toBe(value);
  });

  it.each([
    '--surface', '--surface-2', '--surface-solid', '--glass',
    '--accent-tint', '--accent-line', '--hairline', '--hairline-strong',
    '--glow', '--glow-card', '--inset-highlight', '--gradient-text',
    '--font', '--font-display',
  ])('defines %s', (name) => {
    expect(token(name)).toBeDefined();
  });

  it('keeps the legacy aliases that untouched component CSS relies on', () => {
    for (const alias of [
      '--bg-primary', '--bg-secondary', '--bg-card', '--bg-card-hover', '--bg-elevated',
      '--text-primary', '--text-secondary', '--text-dim', '--accent-text', '--accent-bright',
      '--accent-hover', '--accent-dim', '--border', '--border-hover', '--section',
      '--radius-xl', '--shadow-card', '--shadow-elevated',
    ]) {
      expect(token(alias), alias).toBeDefined();
    }
  });

  it('uses the display font for headings', () => {
    expect(token('--font-display')).toMatch(/Fraunces/);
    expect(token('--font')).toMatch(/Manrope/);
  });

  it('drops the old palette and Inter', () => {
    expect(css).not.toMatch(/Inter/);
    expect(css).not.toMatch(/#161826|#9184d9|#a78bfa|167, 139, 250/i);
  });
});
```

- [ ] **Step 2: Test laufen lassen, er muss fehlschlagen**

Run: `npx vitest run src/index.css.test.js 2>&1 | tail -15`
Expected: FAIL, u. a. `defines --bg as #130A10` (aktuell `#161826`) und `drops the old palette and Inter`.

---

### Task 3: index.css ersetzen

**Files:**
- Replace: `client/src/index.css`

- [ ] **Step 1: Gesamte Datei durch den neuen Inhalt ersetzen**

```css
/* ===== Scentboxd — global styles =====
   Designsprache: docs/superpowers/specs/2026-10-02-webapp-redesign-design.md
   Fonts werden in index.html geladen (Fraunces für Display, Manrope für UI). */

/* ===== Tokens ===== */
:root {
  /* Flächen */
  --bg: #130A10;
  --surface: #1C1017;
  --surface-2: #2E1A24;
  --surface-solid: var(--surface-2);
  --glass: rgba(46, 26, 36, 0.5);
  --glass-strong: rgba(46, 26, 36, 0.72);
  --hairline: rgba(255, 255, 255, 0.08);
  --hairline-strong: rgba(255, 255, 255, 0.14);

  /* Text */
  --text: #F2EEF0;
  --text-body: #A9A2A6;
  --text-muted: #94A3B8;

  /* Akzent */
  --accent: #C20A66;
  --accent-soft: #E75A9C;
  --accent-tint: rgba(194, 10, 102, 0.15);
  --accent-line: rgba(194, 10, 102, 0.3);
  --champagne: #F7E7CE;
  --gradient-text: linear-gradient(105deg, #E85D9F, #F7E7CE);

  /* Rang-Badges */
  --gold: #FFD700;
  --silver: #C0C0C0;
  --bronze: #CD7F32;

  /* Status */
  --success: #4ADE80;
  --danger: #FF6B6B;
  --warning: #F59E0B;

  /* Duftfamilien (aus der iOS-App) */
  --family-floral: #FFB6C1;
  --family-woody: #8B7355;
  --family-oriental: #DAA520;
  --family-fresh: #98FB98;
  --family-citrus: #FFD700;
  --family-gourmand: #D2691E;
  --family-aquatic: #87CEEB;
  --family-green: #3CB371;
  --family-spicy: #CD5C5C;
  --family-musky: #C0C0C0;

  /* Schrift */
  --font: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
  --weight-heading: 600;
  --weight-label: 600;
  --weight-body: 400;

  /* Abstände */
  --space-1: 2px;
  --space-2: 4px;
  --space-3: 8px;
  --space-4: 12px;
  --space-6: 16px;
  --space-8: 24px;
  --space-10: 32px;
  --space-14: 48px;

  /* Radien */
  --radius-sm: 4px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-pill: 999px;

  /* Schatten und Glows */
  --glow: 0 6px 20px rgba(194, 10, 102, 0.4);
  --glow-strong: 0 8px 28px rgba(194, 10, 102, 0.55);
  --glow-card: 0 14px 36px rgba(194, 10, 102, 0.14);
  --inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  --shadow-sm: 0 0 0 1px var(--hairline);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.55);

  /* Layout */
  --max-width: 1200px;
  --nav-height: 60px;
  --tabbar-height: 87px;

  /* Aliases — alte Variablennamen, damit noch nicht umgebautes Komponenten-CSS weiter funktioniert */
  --bg-primary: var(--bg);
  --bg-secondary: var(--surface);
  --bg-card: var(--surface);
  --bg-card-hover: var(--surface-2);
  --bg-elevated: var(--surface-2);
  --text-primary: var(--text);
  --text-secondary: var(--text-body);
  --text-dim: var(--text-muted);
  --accent-text: var(--accent-soft);
  --accent-bright: var(--accent-soft);
  --accent-hover: var(--accent-soft);
  --accent-dim: var(--accent-tint);
  --section: var(--surface-2);
  --border: var(--hairline);
  --border-hover: var(--hairline-strong);
  --shadow-card: var(--shadow-sm);
  --shadow-elevated: var(--shadow-md);
}

/* ===== Global ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html { background: var(--bg); }

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.55;
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: var(--weight-heading);
  line-height: 1.1;
  letter-spacing: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  height: auto;
}

button, input, select, textarea { font-family: inherit; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(194, 10, 102, 0.3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(194, 10, 102, 0.5); }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

::selection { background: rgba(194, 10, 102, 0.35); }

/* ===== Aurora (fixer Hintergrund, siehe Aurora.jsx) ===== */
.aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.aurora__blob {
  position: absolute;
  border-radius: 50%;
  aspect-ratio: 1;
  filter: blur(clamp(48px, 14vw, 80px));
  animation: aurora-float 20s ease-in-out infinite;
  will-change: transform;
}

.aurora__blob--magenta {
  width: min(500px, 105vw);
  top: -12%;
  left: -12%;
  opacity: 0.3;
  background: radial-gradient(circle, var(--accent), transparent 70%);
}

.aurora__blob--gold {
  width: min(400px, 85vw);
  bottom: 6%;
  right: -8%;
  opacity: 0.22;
  background: radial-gradient(circle, #D4A017, transparent 70%);
  animation-delay: -7s;
}

@keyframes aurora-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 30px) scale(0.9); }
}

/* ===== Layout-Utilities ===== */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-8);
}

.page {
  min-height: calc(100vh - var(--nav-height) - 200px);
  padding: var(--space-10) 0;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: var(--weight-heading);
  color: var(--text);
  margin-bottom: var(--space-8);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.section-title .icon { color: var(--accent); }

.eyebrow {
  display: block;
  font: 700 11px/1.3 var(--font);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--champagne);
}

.eyebrow--accent { color: var(--accent); }

.gradient-text {
  background: var(--gradient-text);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ===== Animationen ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes rise-in {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-fadeIn { animation: fadeIn 0.4s ease-out; }
.rise-in { animation: rise-in 0.6s ease both; }

/* ===== Skeleton ===== */
.skeleton {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}

/* ===== Glas und Karten ===== */
.glass,
.card {
  background: var(--glass);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--inset-highlight);
}

.card {
  overflow: hidden;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.card:hover {
  border-color: var(--accent-line);
  box-shadow: var(--inset-highlight), var(--glow-card);
  transform: translateY(-2px);
}

/* ===== Buttons ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 40px;
  padding: var(--space-3) var(--space-8);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: var(--weight-label) 14px var(--font);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease,
    transform 0.15s ease, box-shadow 0.2s ease;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: var(--glow);
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: var(--glow-strong); }
.btn-primary:active { transform: scale(0.98); }

.btn-secondary {
  background: var(--glass);
  border-color: var(--hairline);
  color: var(--text);
  box-shadow: var(--inset-highlight);
}
.btn-secondary:hover { border-color: var(--accent-line); }

.btn-ghost { color: var(--text-body); }
.btn-ghost:hover { color: var(--text); background: rgba(255, 255, 255, 0.04); }

.btn-sm { min-height: 32px; padding: var(--space-2) var(--space-6); font-size: 12.5px; }
.btn-lg { min-height: 48px; padding: var(--space-4) var(--space-10); font-size: 15px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

/* ===== Badges ===== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-accent { background: var(--accent-tint); color: var(--accent-soft); }
.badge-success { background: rgba(74, 222, 128, 0.15); color: var(--success); }

.badge-rank {
  min-width: 22px;
  height: 22px;
  justify-content: center;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
}
.badge-rank-1 { background: var(--gold); color: rgba(0, 0, 0, 0.75); }
.badge-rank-2 { background: var(--silver); color: rgba(0, 0, 0, 0.75); }
.badge-rank-3 { background: var(--bronze); color: rgba(0, 0, 0, 0.75); }

/* ===== Inputs ===== */
.input {
  width: 100%;
  min-height: 44px;
  padding: var(--space-3) var(--space-4);
  background: rgba(13, 11, 15, 0.5);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-md);
  color: var(--text);
  font: var(--weight-body) 15px var(--font);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-tint); }
.input::placeholder { color: var(--text-muted); }

textarea.input { min-height: 96px; resize: vertical; }

select.input {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394A3B8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 20px;
  padding-right: 40px;
}

/* ===== Chips ===== */
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;
  padding: 0 var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font: 500 12.5px var(--font);
  color: var(--accent-soft);
  background: var(--accent-tint);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.chip:hover { border-color: var(--accent-line); }
.chip[aria-pressed='true'],
.chip--active {
  background: var(--accent);
  color: #fff;
  box-shadow: var(--glow);
}

.chip--glass {
  background: var(--glass);
  border-color: var(--hairline);
  color: var(--text-body);
  box-shadow: var(--inset-highlight);
}
.chip--glass:hover { border-color: var(--accent-line); color: var(--text); }

/* ===== Flakon-Platzhalter ===== */
.bottle {
  aspect-ratio: 3 / 4;
  background: radial-gradient(ellipse at 50% 40%, #3A1428, var(--surface) 70%);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.bottle img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: var(--space-4);
  box-sizing: border-box;
}

/* ===== Spinner ===== */
.spinner {
  display: inline-block;
  border: 3px solid var(--hairline);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner-sm { width: 20px; height: 20px; }
.spinner-md { width: 32px; height: 32px; }
.spinner-lg { width: 48px; height: 48px; }

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 0;
}

/* ===== Empty State ===== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state .icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.2rem;
  color: var(--text-body);
  margin-bottom: 8px;
}

/* ===== Toast ===== */
.toast-container {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  background: var(--surface-solid);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  padding: 12px 20px;
  color: var(--text);
  font-size: 0.875rem;
  box-shadow: var(--inset-highlight), var(--shadow-md);
  animation: fadeIn 0.3s ease-out;
  max-width: 360px;
}

.toast-error { border-left: 3px solid var(--danger); }
.toast-success { border-left: 3px solid var(--success); }

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
  /* Spinner zeigen einen Ladezustand an, keine Dekoration — sie laufen weiter.
     Skeleton und Aurora stehen still, das ist gewollt. */
  .spinner { animation: spin 0.6s linear infinite !important; }
}
```

- [ ] **Step 2: Token-Test laufen lassen**

Run: `npx vitest run src/index.css.test.js 2>&1 | tail -6`
Expected: `Tests  … passed`, keine Fehler.

- [ ] **Step 3: Gesamte Suite und Build**

Run: `npm test 2>&1 | grep -E "Test Files|Tests " && npm run build 2>&1 | tail -1`
Expected: alle Tests grün (vorher 71, jetzt 71 + die neuen), `✓ built in …`.

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/index.css.test.js
git commit -m "feat(redesign): new design tokens, fonts and base components"
```

---

### Task 4: Aurora-Hintergrund

**Files:**
- Create: `client/src/components/layout/Aurora.jsx`
- Create: `client/src/components/layout/Aurora.test.jsx`
- Modify: `client/src/components/layout/Layout.jsx`

- [ ] **Step 1: Test schreiben**

```jsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Aurora from './Aurora';

describe('Aurora', () => {
  it('renders two decorative blobs that are hidden from assistive tech', () => {
    const { container } = render(<Aurora />);

    const layer = container.querySelector('.aurora');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer.querySelectorAll('.aurora__blob')).toHaveLength(2);
    expect(layer.querySelector('.aurora__blob--magenta')).toBeInTheDocument();
    expect(layer.querySelector('.aurora__blob--gold')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test laufen lassen, er muss fehlschlagen**

Run: `npx vitest run src/components/layout/Aurora.test.jsx 2>&1 | tail -5`
Expected: FAIL, `Failed to resolve import "./Aurora"`.

- [ ] **Step 3: Komponente schreiben**

```jsx
// Fixe, rein dekorative Hintergrund-Ebene. Das CSS steht in index.css
// (.aurora), damit es ohne Import auf allen Seiten gilt.
export default function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__blob aurora__blob--magenta" />
      <div className="aurora__blob aurora__blob--gold" />
    </div>
  );
}
```

- [ ] **Step 4: In Layout einhängen**

`client/src/components/layout/Layout.jsx` vollständig:

```jsx
import { Outlet } from 'react-router-dom';
import Aurora from './Aurora';
import Navbar from './Navbar';
import Footer from './Footer';
import TabBar from './TabBar';

export default function Layout() {
  return (
    <div className="layout">
      <Aurora />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 5: Tests laufen lassen**

Run: `npx vitest run src/components/layout 2>&1 | tail -6`
Expected: alle grün, inklusive `Aurora.test.jsx` und `MaintenanceGate.test.jsx`.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Aurora.jsx src/components/layout/Aurora.test.jsx src/components/layout/Layout.jsx
git commit -m "feat(redesign): fixed aurora background layer"
```

---

### Task 5: Wortzeichen

**Files:**
- Create: `client/src/components/layout/Wordmark.jsx`
- Create: `client/src/components/layout/Wordmark.test.jsx`
- Modify: `client/src/components/layout/Navbar.jsx:10-19`
- Modify: `client/src/components/layout/Navbar.css:19-28`
- Modify: `client/src/components/layout/Footer.jsx:9`
- Modify: `client/src/components/layout/Footer.css:21-26`

- [ ] **Step 1: Test schreiben**

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Wordmark from './Wordmark';

describe('Wordmark', () => {
  it('renders "scentboxd" with the accent on "boxd"', () => {
    render(<Wordmark />);

    const mark = screen.getByText((_, el) => el?.classList.contains('wordmark') && el.textContent === 'scentboxd');
    expect(mark).toBeInTheDocument();
    expect(mark.querySelector('.wordmark__accent')).toHaveTextContent('boxd');
  });

  it('accepts an extra class', () => {
    render(<Wordmark className="navbar__logo-text" />);

    expect(document.querySelector('.wordmark')).toHaveClass('navbar__logo-text');
  });
});
```

- [ ] **Step 2: Test laufen lassen, er muss fehlschlagen**

Run: `npx vitest run src/components/layout/Wordmark.test.jsx 2>&1 | tail -5`
Expected: FAIL, `Failed to resolve import "./Wordmark"`.

- [ ] **Step 3: Komponente schreiben**

```jsx
import './Wordmark.css';

// Wortzeichen wie auf der Waitlist: klein geschrieben, "boxd" in Magenta.
export default function Wordmark({ className = '' }) {
  return (
    <span className={`wordmark ${className}`.trim()}>
      scent<span className="wordmark__accent">boxd</span>
    </span>
  );
}
```

Neue Datei `client/src/components/layout/Wordmark.css`:

```css
.wordmark {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 22px;
  letter-spacing: 0;
  color: var(--text);
  white-space: nowrap;
}

.wordmark__accent { color: var(--accent); }
```

- [ ] **Step 4: Test laufen lassen**

Run: `npx vitest run src/components/layout/Wordmark.test.jsx 2>&1 | tail -5`
Expected: PASS (2 Tests).

- [ ] **Step 5: Navbar umstellen**

In `client/src/components/layout/Navbar.jsx` den Import ergänzen und die `Logo`-Funktion ersetzen:

```jsx
import Wordmark from './Wordmark';
```

```jsx
function Logo() {
  return (
    <Link to="/" className="navbar__logo">
      <Wordmark className="navbar__logo-text" />
    </Link>
  );
}
```

In `client/src/components/layout/Navbar.css` die Regel `.navbar__logo` ersetzen:

```css
.navbar__logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex: none;
}

.navbar__logo-text { font-size: 20px; }
```

- [ ] **Step 6: Footer umstellen**

In `client/src/components/layout/Footer.jsx` den Import ergänzen und die Logo-Zeile ersetzen:

```jsx
import Wordmark from './Wordmark';
```

```jsx
          <Wordmark className="footer__logo" />
```

In `client/src/components/layout/Footer.css` die Regel `.footer__logo` ersetzen:

```css
.footer__logo { display: inline-block; }
```

- [ ] **Step 7: Prüfen, dass das alte Logo weg ist**

Run: `grep -rn "9184d9\|◆ Scentboxd" src/ ; echo "exit $?"`
Expected: keine Treffer, `exit 1`.

- [ ] **Step 8: Suite, Lint auf geänderte Dateien, Build**

Run: `npm test 2>&1 | grep -E "Test Files|Tests " && npx eslint src/components/layout && npm run build 2>&1 | tail -1`
Expected: alle Tests grün, keine Lint-Fehler, `✓ built in …`.

- [ ] **Step 9: Commit**

```bash
git add src/components/layout/Wordmark.jsx src/components/layout/Wordmark.css src/components/layout/Wordmark.test.jsx src/components/layout/Navbar.jsx src/components/layout/Navbar.css src/components/layout/Footer.jsx src/components/layout/Footer.css
git commit -m "feat(redesign): shared wordmark in navbar and footer"
```

---

### Task 6: DESIGN.md neu schreiben

**Files:**
- Replace: `DESIGN.md` (Repo-Root)

- [ ] **Step 1: Datei vollständig ersetzen**

```markdown
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
  display: "'Fraunces', Georgia, serif — weight 600, optical size axis"
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

- `--bg` `#130A10` ist der Grund, immer sichtbar hinter allem.
- Dahinter liegt die **Aurora**: zwei weichgezeichnete Farbflecken (Magenta
  oben links, Gold unten rechts), die langsam driften. Sie gibt der Seite
  Bewegung, ohne Inhalt zu stören.
- **Glas** (`.glass`, `.card`) ist die Standardfläche für Karten und Panels:
  halbtransparentes Pflaume mit `backdrop-filter: blur(20px)`, einer
  Hairline und einem hellen Innen-Highlight an der Oberkante.
- `--surface` und `--surface-2` sind deckende Flächen für Dropdowns, Modals,
  Toasts und die Tab-Leiste. Dort muss nichts durchscheinen.

## Farbe

- **Magenta** `#C20A66` ist der einzige Akzent: Primär-Buttons, aktive Chips
  und Tabs, Marke auf Karten, Links, Herz und Stern. Auf dunklem Grund als
  Text ist `--accent-soft` `#E75A9C` besser lesbar.
- **Champagner** `#F7E7CE` steht für Wert: Sterne, Bewertungen, Eyebrows über
  Überschriften, Kicker.
- **Rang-Badges** in Gold, Silber, Bronze für die Plätze 1 bis 3, danach
  Magenta.
- Schatten sind **Glows in Magenta**, nicht schwarz. Primär-Buttons tragen
  immer einen Glow, Hero-Karten einen weichen, großen.
- Duftfamilien haben feste Farben (`--family-*`), übernommen aus der App.

## Typografie

- **Fraunces 600** für Überschriften, Parfum-Namen, große Zahlen und das
  Wortzeichen. `h1` bis `h3` sind global darauf gesetzt.
- **Manrope** für UI und Fließtext, 400 bis 700. Kleine, enge Texte wie in
  der App: Meta bei 11 bis 13px.
- **Eyebrows** (`.eyebrow`): 11px, Großbuchstaben, weiter Buchstabenabstand,
  Champagner oder Magenta. Sie stehen über Überschriften und Abschnitten.
- **Gradient-Text** (`.gradient-text`): Pink nach Champagner, für Zahlen in
  Statistiken und einzelne Wörter in Headlines.

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
- **Inputs:** dunkles Feld, Hairline, Magenta-Fokusring.
- **Karten:** `.card` ist Glas, hebt sich beim Hover und bekommt den
  Karten-Glow. Bilder tragen einen Verlauf von unten, damit Text darauf
  lesbar bleibt.
- **Skeleton:** Shimmer mit weißem Verlauf, 1.5s linear, wie in der App.

## Motion

Kurz und weich. Hover 0.15 bis 0.25s mit `ease`. Einblenden mit `rise-in`
(0.6s, 14px von unten). Aurora driftet in 20s. Unter
`prefers-reduced-motion` stehen Aurora, Shimmer und alle Übergänge still;
Spinner laufen weiter, weil sie einen Zustand anzeigen.
```

- [ ] **Step 2: Commit**

```bash
git add ../DESIGN.md
git commit -m "docs(redesign): rewrite DESIGN.md for the new visual language"
```

---

### Task 7: Sichtprüfung, Push und PR

**Files:** keine Änderung, außer Korrekturen aus der Sichtprüfung.

- [ ] **Step 1: Dev-Server starten und Seiten anschauen**

Run: `npm run dev -- --port 5199 --strictPort` (im Hintergrund), dann im Browser `http://localhost:5199/`, `/explore`, `/perfume/09625e97-33a7-46d0-8605-8a703b0ef762`, `/login`.

Prüfen:
- Hintergrund ist Pflaume-Schwarz, Aurora sichtbar, aber dezent.
- Überschriften in Fraunces, Fließtext in Manrope (Netzwerk-Tab: beide Fonts geladen).
- „Sign in“-Button ist Magenta mit Glow.
- Wortzeichen oben links und im Footer: `scentboxd`, `boxd` in Magenta.
- Keine Seite hat weiße oder blaue Reste (alte Hex-Werte in Komponenten-CSS).

Wenn an einer Stelle eine alte Farbe hart eingetragen ist, in der jeweiligen CSS-Datei durch das passende Token ersetzen und mit `fix(redesign): …` committen.

- [ ] **Step 2: Mockup-Vergleich**

Mockup „Richtung C“ unter `.superpowers/brainstorm/*/content/richtung.html` öffnen und Grundton, Akzent und Schrift mit der laufenden Seite vergleichen. Abweichungen notieren, aber nur Token-Werte korrigieren; Seitenaufbau ist Thema der nächsten Schritte.

- [ ] **Step 3: Suite, Lint auf geänderte Dateien, Build**

Run: `npm test 2>&1 | grep -E "Test Files|Tests " && npx eslint src/components/layout src/index.css.test.js && npm run build 2>&1 | tail -1`
Expected: alle grün, `✓ built in …`.

- [ ] **Step 4: Push und PR**

```bash
git push -u origin redesign
gh pr create --base main --head redesign --title "feat(redesign): foundations — tokens, fonts, aurora, wordmark" --body "$(cat <<'EOF'
## Summary
Step 1 of the redesign (spec: docs/superpowers/specs/2026-10-02-webapp-redesign-design.md).

- New design tokens in `index.css`: plum-black background, magenta accent, champagne, glass surfaces, magenta glows. Old variable names stay as aliases so untouched component CSS keeps working.
- Fraunces for headings and the wordmark, Manrope for UI text. Inter removed.
- Base components restyled: buttons, chips, cards/glass, inputs, badges (incl. rank badges), skeleton, toast.
- Fixed aurora background layer behind the whole app.
- Shared `Wordmark` component (`scentboxd`, `boxd` in magenta) in navbar and footer.
- `DESIGN.md` rewritten.

Page layouts are unchanged; Today, Catalog and Detail follow in later PRs.

## Test plan
- [x] `npm test` green, with new tests for the token contract, `Aurora` and `Wordmark`
- [x] `npm run build` succeeds
- [x] Checked `/`, `/explore`, a perfume detail page and `/login` in the browser
- [ ] After deploy: check behind the maintenance gate on scent-boxd.com

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR-URL wird ausgegeben. Der Merge bleibt beim Menschen.
