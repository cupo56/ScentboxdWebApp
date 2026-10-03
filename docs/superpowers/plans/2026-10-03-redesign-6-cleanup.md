# Redesign Schritt 6: Übrige Seiten und Aufräumen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die übrigen Seiten bekommen das neue Wording, die alten Token-Aliase verschwinden aus dem CSS, hartkodierte Altfarben werden ersetzt, die drei verbliebenen Lint-Fehler sind behoben, und Spec, DESIGN.md und CLAUDE.md spiegeln den Stand nach Schritt 1–5.

**Architecture:** Keine neuen Features. Reine Umbenennungen, Token-Ersetzungen per `sed`, kleine Komponenten-Refactorings für den Linter (abgeleiteter Ladezustand statt `setState` im Effekt) und Dokumentation. Spec: `docs/superpowers/specs/2026-10-02-webapp-redesign-design.md`, Abschnitt 4 und „Umsetzung“ Punkt 6.

**Tech Stack:** React 19, Vite, Vanilla CSS, Vitest + RTL, ESLint.

**Branch:** `redesign-6-cleanup` von `main`. Alle Befehle aus `client/` (außer Doku). Commit-Trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Dateien explizit stagen, nie `git add -A`.

**Stand (geprüft):**
- Alias-Verwendungen in `src/**/*.css|jsx`: `--accent-text` 22, `--text-primary` 6, `--text-secondary` 5, `--border` 5, je 1× `--bg-secondary`, `--bg-card`, `--bg-card-hover`, `--bg-elevated`, `--accent-bright`, `--shadow-elevated`; 0× `--bg-primary`, `--accent-hover`, `--accent-dim`, `--section`, `--border-hover`, `--shadow-card`. `--text-dim` wird 58× benutzt und ist inzwischen eine eigene Stufe, kein Alias mehr.
- Lint-Fehler (`npm run lint`): `Navbar.jsx:42` (Such-Effekt setzt `setSearchResults([])` synchron), `BrandPage.jsx:15` (`setLoading(true)` synchron), `CatalogPage.jsx:71` (`loadPerfumes` setzt `setLoading(true)` synchron im Effekt).
- Hartkodiert: `SettingsPage.css` `#5f6376` (Zeile 21 Textfarbe, Zeile 87 Hintergrund eines Toggles); `NotFoundPage.jsx` SVG-Gradient mit `#7c3aed` und `fontFamily="Inter, sans-serif"`.
- Brands-Übersicht: `getBrands()` zählt per `perfumes(count)` je Marke und braucht mehrere Sekunden. Follow-up (DB-View), nicht Teil dieses Schritts.

---

## Dateien

| Datei | Aktion |
|---|---|
| `src/pages/ProfilePage.jsx`, `AccountPage.jsx`, `SettingsPage.jsx`, `ListDetailPage.jsx`, `BrandsOverviewPage.jsx`, `src/components/review/ReviewForm.jsx` | Wording |
| `src/index.css`, `src/index.css.test.js`, alle `src/**/*.css` mit Alias-Verwendungen | Aliase ersetzen und entfernen |
| `src/pages/SettingsPage.css`, `src/pages/NotFoundPage.jsx` | Altfarben ersetzen |
| `src/components/layout/Navbar.jsx`, `src/pages/BrandPage.jsx`, `src/pages/CatalogPage.jsx` | Lint |
| `CLAUDE.md`, `DESIGN.md`, `docs/superpowers/specs/2026-10-02-webapp-redesign-design.md` | Doku |

---

### Task 1: Wording

**Files:** die sechs oben genannten JSX-Dateien.

- [ ] **Step 1: Ersetzungen** (jeweils die Datei lesen, dann gezielt ändern)

`src/pages/ProfilePage.jsx`:
- `TABS`: `label: 'Owned'` → `'Collection'`; `label: 'Want to try'` bleibt; `label: 'Favorites'` bleibt.
- Stats: `<label>Owned</label>` → `<label>Collection</label>`; `<label>Wishlist</label>` → `<label>Want to try</label>`.
- `No verdicts yet` → `No reviews yet`; `No liked verdicts yet` → `No liked reviews yet`; `Verdicts you like show up here.` → `Reviews you like show up here.`
- Alle sonstigen sichtbaren „verdict“-Texte in der Datei ebenso (`grep -n "erdict" src/pages/ProfilePage.jsx` muss danach leer sein).

`src/pages/AccountPage.jsx`: `<label>Wishlist</label>` → `<label>Want to try</label>`.

`src/pages/SettingsPage.jsx`:
- `'When someone likes one of your verdicts.'` → `'When someone likes one of your reviews.'`
- `'Replies to your verdicts'` → `'Replies to your reviews'`
- `label: 'Shelf & privacy'` → `'Collection & privacy'`
- Löschtext: `your shelf, your lists, and your verdicts` → `your collection, your lists, and your reviews`
- `aria-label="Public shelf"` → `aria-label="Public collection"`

`src/pages/ListDetailPage.jsx`: Breadcrumb „Shelf › Lists“ → der erste Teil heißt `Profile` und verlinkt auf `/profile/<owner username>`, falls der Besitzer bekannt ist (Datei lesen: der Listen-Datensatz enthält `profiles(username)` oder `user_id`; wenn kein Username verfügbar ist, nur `Lists` ohne Link zeigen).

`src/pages/BrandsOverviewPage.jsx`:
- `<h1 className="houses__title">Houses</h1>` → `Brands`
- `{brands.length} houses · … entries` → `{brands.length} brands · … fragrances`
- Placeholder `Search houses…` → `Search brands…`
- `{brand.perfume_count} entries` → `{brand.perfume_count} fragrances`
- `No houses found` → `No brands found`
- CSS-Klassen `houses__*` bleiben.

`src/components/review/ReviewForm.jsx`: `'Post verdict'` → `'Post review'`; falls der Titel der Composer-Box „verdict“ enthält (`composer__title`), ebenfalls auf „review“ ändern.

- [ ] **Step 2: Prüfen**

Run: `grep -rn "erdict\|Wishlist\|Houses\|houses found\|Shelf &\|Public shelf" src --include='*.jsx' | grep -v "verdict-row\|\.test\." ; echo "exit $?"` → keine Treffer, `exit 1`.
Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL"` → grün (falls ein Test alte Texte erwartet, den Test anpassen und nennen).

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProfilePage.jsx src/pages/AccountPage.jsx src/pages/SettingsPage.jsx src/pages/ListDetailPage.jsx src/pages/BrandsOverviewPage.jsx src/components/review/ReviewForm.jsx
git commit -m "chore(redesign): finish the wording sweep on profile, settings, lists and brands"
```

---

### Task 2: Token-Aliase ersetzen und entfernen

**Files:** `src/index.css`, `src/index.css.test.js`, betroffene CSS/JSX unter `src/`.

- [ ] **Step 1: Test zuerst anpassen** — in `src/index.css.test.js` den Test `keeps the legacy aliases that untouched component CSS relies on` ersetzen durch:

```js
  it('no longer defines the legacy aliases', () => {
    for (const alias of [
      '--bg-primary', '--bg-secondary', '--bg-card', '--bg-card-hover', '--bg-elevated',
      '--text-primary', '--text-secondary', '--accent-text', '--accent-bright',
      '--accent-hover', '--accent-dim', '--border', '--border-hover', '--section',
      '--shadow-card', '--shadow-elevated',
    ]) {
      expect(token(alias), alias).toBeUndefined();
    }
  });

  it('keeps --text-dim as a real token', () => {
    expect(token('--text-dim')).toBe('rgba(242, 238, 240, 0.45)');
  });
```

Run: `npx vitest run src/index.css.test.js 2>&1 | tail -6` → die zwei Tests FAIL (Aliase noch definiert). Der Test `custom properties used by component CSS are all defined` schützt die Ersetzung in Step 2.

- [ ] **Step 2: Verwendungen ersetzen** (BSD-`sed` auf macOS: `-i ''`)

```bash
cd src
FILES=$(grep -rlE "var\(--(accent-text|accent-bright|accent-hover|text-primary|text-secondary|bg-primary|bg-secondary|bg-card-hover|bg-card|bg-elevated|border-hover|border|shadow-elevated|shadow-card|accent-dim|section)\)" . --include='*.css' --include='*.jsx')
for f in $FILES; do
  sed -i '' \
    -e 's/var(--accent-text)/var(--accent-soft)/g' \
    -e 's/var(--accent-bright)/var(--accent-soft)/g' \
    -e 's/var(--accent-hover)/var(--accent-soft)/g' \
    -e 's/var(--accent-dim)/var(--accent-tint)/g' \
    -e 's/var(--text-primary)/var(--text)/g' \
    -e 's/var(--text-secondary)/var(--text-body)/g' \
    -e 's/var(--bg-primary)/var(--bg)/g' \
    -e 's/var(--bg-secondary)/var(--surface)/g' \
    -e 's/var(--bg-card-hover)/var(--surface-2)/g' \
    -e 's/var(--bg-card)/var(--surface)/g' \
    -e 's/var(--bg-elevated)/var(--surface-2)/g' \
    -e 's/var(--border-hover)/var(--hairline-strong)/g' \
    -e 's/var(--border)/var(--hairline)/g' \
    -e 's/var(--shadow-elevated)/var(--shadow-md)/g' \
    -e 's/var(--shadow-card)/var(--shadow-sm)/g' \
    -e 's/var(--section)/var(--surface-2)/g' \
    "$f"
done
cd ..
```

Achtung Reihenfolge: `--bg-card-hover` vor `--bg-card`, `--border-hover` vor `--border` (so steht es oben). Danach: `grep -rnE "var\(--(accent-text|accent-bright|accent-hover|text-primary|text-secondary|bg-primary|bg-secondary|bg-card|bg-elevated|border|shadow-elevated|shadow-card|accent-dim|section)\)" src ; echo "exit $?"` → keine Treffer.

- [ ] **Step 3: Alias-Block entfernen, `--text-dim` echt machen**

In `src/index.css`:
- Im Block `/* Text */` nach `--text-muted: #94A3B8;` die Zeile `--text-dim: rgba(242, 238, 240, 0.45); /* leiseste Stufe, für Meta und Zeitstempel */` einfügen.
- Den gesamten Block ab dem Kommentar `/* Aliases — alte Variablennamen … */` bis zur letzten Alias-Zeile (`--shadow-elevated: var(--shadow-md);`) löschen. `--surface-solid` bleibt (steht im Flächen-Block), `--radius-xl` bleibt (echtes Token).

Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL"` → grün, insbesondere `custom properties used by component CSS are all defined`.
Run: `npm run build 2>&1 | grep -E "built in|error"` → ok.

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/index.css.test.js $(git diff --name-only -- src)
git commit -m "refactor(redesign): replace legacy token aliases with the real tokens"
```

---

### Task 3: Altfarben

**Files:** `src/pages/SettingsPage.css`, `src/pages/NotFoundPage.jsx`

- [ ] **Step 1: SettingsPage.css** — Datei lesen. Zeile mit `color: #5f6376;` → `color: var(--text-dim);`. Zeile mit `background: #5f6376;` (Toggle-Track im Aus-Zustand) → `background: var(--hairline-strong);`. Prüfen, ob der An-Zustand des Toggles `var(--accent)` nutzt; falls er eine andere alte Farbe hat, ebenfalls auf `var(--accent)` setzen.

- [ ] **Step 2: NotFoundPage.jsx** — im SVG-Gradient `bottle-grad` die Stops auf die neue Palette setzen: erster Stop `stopColor="#E85D9F"`, letzter `stopColor="#C20A66" stopOpacity="0.8"` (weitere Stops entsprechend zwischen den beiden). `fontFamily="Inter, sans-serif"` → `fontFamily="var(--font-display)"`. `fill="var(--text-primary)"` wurde in Task 2 bereits zu `var(--text)`.

- [ ] **Step 3: Prüfen und Commit**

Run: `grep -rnE "#[0-9a-fA-F]{6}" src/pages src/components --include='*.css' --include='*.jsx' | grep -v "Maintenance\|#3A1428\|#2A1220\|#E85D9F\|#C20A66\|#D4A017"` → keine Treffer (die genannten Hex-Werte sind bewusste Verlaufsfarben).

```bash
git add src/pages/SettingsPage.css src/pages/NotFoundPage.jsx
git commit -m "style(redesign): retire the last old palette values in settings and 404"
```

---

### Task 4: Lint sauber

**Files:** `src/components/layout/Navbar.jsx`, `src/pages/BrandPage.jsx`, `src/pages/CatalogPage.jsx` (+ bestehende Tests)

- [ ] **Step 1: Navbar** — den Such-Effekt so umbauen, dass im Effekt-Body kein `setState` steht:

```jsx
  useEffect(() => {
    const term = debouncedSearch.trim();
    if (!term) return undefined;
    let active = true;
    getPerfumes({ search: term, pageSize: 5 })
      .then((res) => { if (active) setSearchResults({ term, items: res.perfumes || [] }); })
      .catch(() => { if (active) setSearchResults({ term, items: [] }); });
    return () => { active = false; };
  }, [debouncedSearch]);
```

State wird zu `const [searchResults, setSearchResults] = useState({ term: '', items: [] });`. Abgeleitet: `const term = debouncedSearch.trim(); const isSearching = !!term && searchResults.term !== term; const results = searchResults.term === term ? searchResults.items : [];`. `isSearching`-State und sein Setter entfallen. Im JSX `searchResults.length`/`searchResults.map` → `results.length`/`results.map`. Verhalten bleibt: leeres Feld → keine Ergebnisse, Tippen → „Searching…“ bis die Antwort für genau diesen Begriff da ist.

- [ ] **Step 2: BrandPage** — Ladezustand ableiten:

```jsx
  const [data, setData] = useState({ key: undefined, brand: null, perfumes: [] });

  useEffect(() => {
    let active = true;
    Promise.all([getBrandById(id), getPerfumesByBrand(id)])
      .then(([brand, perfumes]) => { if (active) setData({ key: id, brand, perfumes }); })
      .catch((err) => {
        toast.error('Failed to load brand data: ' + err.message);
        if (active) setData({ key: id, brand: null, perfumes: [] });
      });
    return () => { active = false; };
  }, [id]);

  const loading = data.key !== id;
  const { brand, perfumes } = data;
```

Die bisherigen `brand`/`perfumes`/`loading`-States entfallen; der Rest der Komponente bleibt.

- [ ] **Step 3: CatalogPage** — den Erstlade-Pfad vom „Load more“-Pfad trennen, damit der Effekt kein `setLoading(true)` mehr aufruft:

- Neuer abgeleiteter Schlüssel: `const filterKey = [search, concentration, noteFamily, longevity, sortBy].join('|');`
- State: `const [result, setResult] = useState({ key: undefined, perfumes: [], total: 0, page: 1 });` ersetzt `perfumes`, `total`, `page` und `loading`. `loading = result.key !== filterKey`. `loadingMore` bleibt State.
- Effekt:
```jsx
  useEffect(() => {
    let active = true;
    const id = ++requestId.current;
    getPerfumes({ search, concentration, noteFamily, longevity, sortBy, page: 1, pageSize: PAGE_SIZE })
      .then((r) => { if (active && id === requestId.current) setResult({ key: filterKey, perfumes: r.perfumes, total: r.total, page: 1 }); })
      .catch((err) => { if (active && id === requestId.current) { toast.error('Failed to load perfumes: ' + err.message); setResult({ key: filterKey, perfumes: [], total: 0, page: 1 }); } });
    return () => { active = false; };
  }, [filterKey, search, concentration, noteFamily, longevity, sortBy]);
```
- `loadMore` (Event-Handler) darf `setLoadingMore(true)` setzen, lädt `page: result.page + 1`, prüft `id === requestId.current` und hängt an: `setResult((r) => ({ ...r, perfumes: [...r.perfumes, ...next.perfumes], total: next.total, page: r.page + 1 }))`.
- `useCallback`/`loadPerfumes` entfallen. JSX: `perfumes` → `result.perfumes`, `total` → `result.total`, `page` → `result.page`.

Bestehende `CatalogPage.test.jsx`-Tests müssen unverändert bestehen (sie prüfen Verhalten, nicht Implementierung). Der Test „ignores a slower, older response“ gilt weiterhin über `requestId`.

- [ ] **Step 4: Prüfen**

Run: `npm run lint ; echo "exit $?"` → `exit 0`, keine Fehler.
Run: `npm test 2>&1 | grep -E "Test Files|Tests |FAIL"` → grün. `npm run build` ok.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Navbar.jsx src/pages/BrandPage.jsx src/pages/CatalogPage.jsx
git commit -m "refactor: derive loading state instead of setting it in effects; lint is clean"
```

---

### Task 5: Dokumentation

**Files:** `CLAUDE.md`, `DESIGN.md`, `docs/superpowers/specs/2026-10-02-webapp-redesign-design.md` (Repo-Root; Befehle aus dem Repo-Root)

- [ ] **Step 1: CLAUDE.md** — Routentabelle ersetzen:

```markdown
| Path | Page |
|------|------|
| `/` | TodayPage |
| `/catalog` | CatalogPage (`/explore` redirects here) |
| `/perfume/:id` | PerfumeDetailPage |
| `/brands` | BrandsOverviewPage |
| `/brand/:id` | BrandPage |
| `/favorites`, `/collection` | ShelfPage (sign-in card when logged out) |
| `/community` | CommunityPage |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth pages |
| `/profile/:username` | ProfilePage |
| `/settings`, `/account` | SettingsPage, AccountPage |
| `/list/:id` | ListDetailPage |
```

Im Abschnitt „Styling“ den Satz zu TailwindCSS durch „Vanilla CSS with design tokens in `client/src/index.css`; the visual language is documented in `DESIGN.md`“ ersetzen (Tailwind ist seit `1779f6d` entfernt). Unter „Commands“ ergänzen: `npm run lint` muss sauber sein. Unter Architektur: `src/store/userPerfumeStore.js` (Favoriten/Collection-Status aller Karten) und `src/lib/` (reine Funktionen: `today.js`, `catalog.js`, `performance.js`) kurz nennen.

- [ ] **Step 2: DESIGN.md** — unter „Komponenten“ ergänzen: Aktionskacheln (`.action-tile`), Glas-Pyramide, Performance-Panel, Karten (`.pcard`), `PerfumeCarousel`, `.sr-only`. Unter „Typografie“ den Hinweis, dass `--text-dim` die vierte Textstufe ist. Den Satz zu Aliasen (falls vorhanden) entfernen.

- [ ] **Step 3: Spec** — am Ende einen Abschnitt „Erkenntnisse aus der Umsetzung“ anfügen:

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md DESIGN.md docs/superpowers/specs/2026-10-02-webapp-redesign-design.md
git commit -m "docs: routes, tokens and implementation findings after the redesign"
```

---

### Task 6: Sichtprüfung, Push, PR

- [ ] **Step 1: Browser** — `npm run dev -- --port 5199 --strictPort`: `/brands` (Titel „Brands“, Zähler „fragrances“), `/brand/<id>`, `/list/<id>` (Breadcrumb), `/register`, `/does-not-exist` (404-Fläschchen in Magenta), `/settings` nur mit Login. Stichprobe, dass keine Seite nach der Alias-Entfernung farblose Stellen hat: `/`, `/catalog`, `/perfume/<id>`, `/community`.

- [ ] **Step 2: Suite, Lint, Build, Push, PR**

```bash
npm test 2>&1 | grep -E "Test Files|Tests "
npm run lint && echo LINT_OK
npm run build 2>&1 | grep -E "built in|error"
git push -u origin redesign-6-cleanup
gh pr create --base main --head redesign-6-cleanup --title "chore(redesign): wording sweep, token aliases removed, lint clean, docs" --body "$(cat <<'EOF'
## Summary
Step 6 of the redesign (spec Abschnitt 4 and „Umsetzung“ 6, plan `docs/superpowers/plans/2026-10-03-redesign-6-cleanup.md`).

- Wording finished on profile, account, settings, list detail, brands overview and the review form (Collection / Want to try / reviews / Brands).
- The legacy token aliases (`--accent-text`, `--text-primary`, `--border`, …) are replaced by the real tokens everywhere and removed from `index.css`; `--text-dim` is a real fourth text tier. The token test now asserts the aliases are gone.
- Last old palette values retired (settings toggle, 404 bottle).
- `npm run lint` is clean: Navbar search, BrandPage and CatalogPage derive their loading state instead of setting it inside effects.
- CLAUDE.md routes/styling updated, DESIGN.md component inventory extended, spec gets an „Erkenntnisse aus der Umsetzung“ section (German text columns, 0–100 ratings, performance follow-ups).

## Test plan
- [x] `npm test` green, `npm run lint` clean, `npm run build` ok
- [x] Browser spot checks: brands, brand, list, register, 404, plus Today/Catalog/Detail/Community after the alias removal
- [ ] Signed in: settings page toggle colours — behind the gate after deploy

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
