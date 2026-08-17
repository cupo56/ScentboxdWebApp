# Scentboxd "Sillage" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Scentboxd's UI on the new "Sillage" design system (dark, single-accent, community-first feed) delivered in `/Users/cupo/Downloads/design_handoff_scentboxd_redesign/` — replacing gradients/tilt/glass/aurora motion with calm hairline-and-accent styling, restructuring navigation into a segment nav + mobile tab bar, and rebuilding Home/Explore/Perfume Detail/Profile+Lists ("Shelf")/Auth around the new layouts.

**Architecture:** Pure frontend redesign of the existing React 19 + Vite + Supabase app in `client/`. No new stores, no backend/schema changes except two narrow, additive `perfumeService`/`brandService` query tweaks (relational count, longevity filter) needed to back filters the new design actually shows. Data flow (`Pages → Services → supabaseClient → Supabase`) is unchanged.

**Tech Stack:** React 19, React Router v7, Zustand, TailwindCSS v4 (unused utility classes aside — the app is hand-rolled CSS per component, Tailwind is not the primary styling mechanism here), plain CSS files per component, `@phosphor-icons/react` (new dependency, replaces emoji icons).

**No test suite exists in this repo** (confirmed in `CLAUDE.md`). Every task's "verify" step is therefore `npm run lint` + `npm run build` (catches syntax/import errors) plus a manual visual check with the dev server (`npm run dev`) against the corresponding screen in `Scentboxd Redesign.dc.html`, instead of a unit test. This replaces the TDD red/green steps from the standard plan template.

**Known pre-existing `npm run lint` baseline (verified before any redesign work started):** 6 errors, all from the `react-hooks/set-state-in-effect` / `immutability` rules (a strict `eslint-plugin-react-hooks` v7 rule flagging the common "set loading → fetch → set data" pattern used throughout this codebase) plus one unrelated unused-import and one variable-hoisting issue:
- `src/components/layout/Navbar.jsx:29` — setState-in-effect
- `src/pages/BrandPage.jsx:15` — setState-in-effect (not touched by this plan — pre-existing, out of scope)
- `src/pages/ExplorePage.jsx:54` — setState-in-effect
- `src/pages/PerfumeDetailPage.jsx:4` — unused `toggleReviewLike` import
- `src/pages/PerfumeDetailPage.jsx:32` — setState-in-effect
- `src/pages/ProfilePage.jsx:33` — `loadTab` accessed before declared (+ 1 related exhaustive-deps warning)

None of these are introduced by this plan, and fixing the `set-state-in-effect` pattern repo-wide is a separate refactor, not part of the Sillage redesign — every data-fetching effect in this codebase uses it. **When a task's "lint" verify step runs, compare against this baseline**: passing means "no *new* errors beyond this list," not zero errors. Two exceptions where a task's own rewrite naturally clears an entry: Task 7's `ProfilePage.jsx` rewrite doesn't call `loadTab` from inside the effect, so that error and its warning disappear as a side effect — don't treat their disappearance as a regression to investigate. `PerfumeDetailPage.jsx:4`'s unused `toggleReviewLike` import also disappears once Task 6 rewrites that file's imports.

---

## Scope & Data Decisions

The design handoff shows a few data points the current schema/services can't produce without new backend work. The handoff's own README explicitly allows dropping these ("wenn das nicht gewünscht ist, entfallen diese beiden Angaben — der Rest funktioniert ohne"). Decisions, so nothing below reads as an accidental placeholder:

1. **No global "compose a verdict" without a fragrance.** The mobile tab-bar `+` and any desktop "Write a verdict" nav button would need a floating composer with no subject. Both route to `/explore` instead (pick a fragrance, then use the existing per-fragrance composer). The inline composer on `PerfumeDetailPage` (desktop) and its sheet variant (mobile) **are** in scope — they have a real perfume as context.
2. **Home "Your shelf" column** shows only the three real counts (Owned / Want to try / Verdicts written). "Notes you follow" and the "3 unopened samples" nudge are dropped — no notes-follow feature or samples concept exists.
3. **Home `--section` CTA block** ("You wore Layton twice…") needs wear-tracking data that doesn't exist. Replaced with a real-data equivalent: if the signed-in user owns at least one perfume, show one random owned perfume with copy "You added {name} to your shelf — got a verdict for it yet?" linking to its detail page. Signed-out / no-owned-perfumes users see nothing (section omitted), same visual weight rule ("the one saturated block") preserved.
4. **Shelf grid cards** drop "Worn N×" and the "Layton has no verdict yet" nudge (need `wear_count` + a per-user review join that don't exist). The card footer shows the perfume's aggregate score (existing `perfumes.performance`) instead of a per-user rating.
5. **Favorite toggle stays, as a small icon button.** The Entry mockup (2a) shows only "On my shelf" + "Want to try" + "Add to list", dropping the old heart/favorite button — but the Shelf mockup (2c) still has a "Favorites" tab. Since nothing else in the redesign can set `is_favorite`, `UserPerfumeActions` keeps a compact heart icon-button (not in the mockup, but required so the existing Favorites tab isn't a permanently-empty dead end) alongside the two redesigned buttons.
6. **List Detail** drops the drag-handle column and the per-item notes column (need new `position`/`note` columns on `list_items` — a schema change, out of scope for a frontend redesign). Row grid becomes `44px | 1fr | 88px | 28px` (rank-by-index | fragrance | score | remove) instead of the mockup's 7-column grid.
7. **Houses page counts** ("`{{h.count}} entries`") — `brandService.getBrands()` doesn't return a count today. Task 7 Step 1 adds one relational-count query (`perfumes(count)`), no migration needed.
8. **Filter counts** ("Extrait 64") in the Index filter column need a grouped count-per-value query that doesn't exist. Dropped — filter rows/chips show the label only, no trailing count.
9. **Concentration / note-family filters stay single-select** (matching `perfumeService.getPerfumes`'s existing single-value params), rendered as a checklist / chip group instead of a `<select>`. Not a multi-select despite the mockup's checkbox glyphs.
10. **Longevity filter is added** (`minLongevity` param + `.gte('longevity', …)` in `getPerfumes`) since the slider is a first-class part of both the desktop filter column and the mobile filter sheet — small, additive, no schema change.
11. **Explore pagination becomes "Load more"** (accumulate pages client-side) instead of Prev/Next, per the 2b mockup.
12. **Home "Verdicts written" count is real**, not a stub — Task 5 adds `getReviewCountByUser` to `reviewService.js` and wires it into the Feed's "Your shelf" column (see Task 5 Step 1a).
13. **`perfumes.longevity`/`perfumes.sillage` are sparse German-text categories, not 0–100 numbers** (discovered live during Task 4: verified against production data — `longevity` is 99% `"Moderat"` with `"Langhaltend"`/`"Sehr langhaltend"`/`"Lang"` making up the rest; `sillage` is similarly dominated by `"Moderat"`). This was already a latent bug in the pre-redesign app (the old `PerfumeDetailPage` fed these text values straight into a percentage bar). Two consequences, both already reflected in the tasks below: Task 4's Explore longevity filter is a categorical single-select over the real text values (`getLongevityLevels()`), not an hours slider; Task 6's Entry-page "Performance · community median" bars are computed by averaging the numeric, per-review `reviews.longevity`/`reviews.sillage` columns (0–100, already fetched alongside every review) instead of reading the broken catalog-level text fields.

---

## Task 0: Install Phosphor Icons

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Install the dependency**

```bash
cd client
npm install @phosphor-icons/react
```

- [ ] **Step 2: Verify**

```bash
npm run build
```
Expected: build succeeds (package resolves, nothing imports it yet).

- [ ] **Step 3: Commit**

```bash
git add client/package.json client/package-lock.json
git commit -m "chore: add @phosphor-icons/react for the Sillage redesign"
```

---

## Task 1: Swap design tokens in `index.css`

**Files:**
- Modify: `client/src/index.css:1-263` (the `:root` block through `.toast-error`/`.toast-success`)

- [ ] **Step 1: Replace the `:root` token block (lines 6–41)**

```css
:root {
  --bg: #161826;
  --surface: #1c1e2e;
  --surface-2: #232532;
  --hairline: #292b31;
  --hairline-strong: #3f424d;

  --text: #f3f5fe;
  --text-body: #b2b6ca;
  --text-muted: #9397ab;
  --text-dim: #75798c;

  --accent: #9184d9;
  --accent-text: #d2cefd;
  --accent-bright: #b5abfc;
  --accent-tint: #2b2741;
  --accent-line: #5d5294;
  --section: #262a60;

  --font: 'Inter', system-ui, sans-serif;
  --weight-heading: 500;
  --weight-label: 500;
  --weight-body: 400;

  --space-1: 2.8px;
  --space-2: 5.6px;
  --space-3: 8.4px;
  --space-4: 11.2px;
  --space-6: 16.8px;
  --space-8: 22.4px;
  --space-10: 28px;
  --space-14: 44px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-pill: 99px;

  --shadow-sm: 0 0 0 1px #3f424d;
  --shadow-md: 0 0 0 1px #595d6c, 0 6px 18px rgba(0, 0, 0, 0.55);
  --shadow-lg: 0 0 0 1px #9397ab, 0 16px 40px rgba(0, 0, 0, 0.65);

  --max-width: 1200px;
  --nav-height: 60px;
  --tabbar-height: 87px;

  /* Aliases — old variable names, so untouched component CSS keeps working */
  --bg-primary: var(--bg);
  --bg-secondary: var(--surface);
  --bg-card: var(--surface);
  --bg-card-hover: var(--surface-2);
  --bg-elevated: var(--surface-2);
  --text-primary: var(--text);
  --text-secondary: var(--text-body);
  --accent-hover: var(--accent-bright);
  --accent-dim: var(--accent-tint);
  --border: var(--hairline);
  --border-hover: var(--hairline-strong);
  --radius-xl: var(--radius-lg);
  --shadow-card: var(--shadow-sm);
  --shadow-elevated: var(--shadow-md);
}
```

- [ ] **Step 2: Update buttons (replace lines 137–199, the `.btn*` block, with the outline style)**

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 40px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: var(--weight-label) 14px var(--font);
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  font-family: inherit;
}
.btn-primary { border-color: var(--accent); color: var(--accent-text); }
.btn-primary:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }
.btn-primary:active { background: color-mix(in srgb, var(--accent) 24%, transparent); }
.btn-secondary { border-color: var(--hairline-strong); color: var(--text-body); }
.btn-secondary:hover { border-color: var(--accent); color: var(--accent-text); }
.btn-ghost { color: var(--text-dim); }
.btn-ghost:hover { color: var(--text); }
.btn-sm { min-height: 32px; padding: var(--space-2) var(--space-6); font-size: 12.5px; }
.btn-lg { min-height: 48px; padding: var(--space-4) var(--space-10); font-size: 15px; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
```

- [ ] **Step 3: Update focus, selection, input (replace lines 227–263, the `.input`/`select.input` block)**

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

::selection { background: color-mix(in srgb, var(--accent) 32%, transparent); }

.input {
  width: 100%;
  min-height: 44px;
  padding: var(--space-4) var(--space-6);
  background: transparent;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-md);
  color: var(--text);
  font: var(--weight-body) 15px var(--font);
  outline: none;
  transition: border-color 0.2s ease;
}
.input:focus { border-color: var(--accent); box-shadow: none; }
.input::placeholder { color: var(--text-dim); }

textarea.input { min-height: 96px; resize: vertical; }

select.input {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239397ab' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 20px;
  padding-right: 40px;
}
```

- [ ] **Step 4: Remove `.badge-gold` (lines 217–220) and repoint `StarRating.css` off `--gold`**

Delete the `.badge-gold { … }` rule entirely from `index.css` — `--gold`/`--gold-dim` no longer exist and nothing should reference them after Task 6 rewrites the one other place that used it (`PerfumeDetailPage.jsx`'s old gold rating badge).

`client/src/components/review/StarRating.css` also references `var(--gold)` twice (filled stars, hover) — fix it now rather than leaving stars broken between this commit and Task 6. Modify `client/src/components/review/StarRating.css:11-13,19-21`:

```css
.star-rating__star.filled {
  color: var(--accent-text);
}

.star-rating--interactive .star-rating__star:hover {
  color: var(--accent-text);
}
```
(Everything else in `StarRating.css`/`StarRating.jsx` is unchanged — this is the one two-line fix needed to keep ratings on-brand, matching the handoff's "Bewertungen im Akzent (`--accent-text`) — Gold entfällt" rule.)

- [ ] **Step 5: Add the new shared primitives (append after the input block from Step 3)**

```css
.chip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 var(--space-4);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-pill);
  font: var(--weight-body) 12.5px var(--font);
  color: var(--text-body);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}
.chip[aria-pressed='true'] {
  border-color: var(--accent);
  color: var(--accent-text);
}

.bottle {
  aspect-ratio: 3 / 4;
  background: var(--surface);
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
```

- [ ] **Step 6: Replace the `.skeleton` rule (lines 124–135) to use hairline instead of the old card colors**

```css
.skeleton {
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--surface) 25%, var(--hairline) 50%, var(--surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
```
(Keep the existing `@keyframes shimmer` at lines 110–113 — same curve as tokens.css's `sb-shimmer`, no need to rename and touch every caller.)

- [ ] **Step 7: Visual check**

```bash
npm run dev
```
Open `http://localhost:5173/`. Nothing should be restructured yet, but the page should already look calmer: darker background (#161826), no purple/gold gradients on buttons, thinner borders. Compare background/button color against `2b` in `Scentboxd Redesign.dc.html`.

- [ ] **Step 8: Lint + build**

```bash
npm run lint
npm run build
```
Expected: both pass.

- [ ] **Step 9: Commit**

```bash
git add client/src/index.css client/src/components/review/StarRating.css
git commit -m "feat: swap to Sillage design tokens in index.css"
```

---

## Task 2: Remove the legacy motion layer and its hooks

**Files:**
- Modify: `client/src/index.css:353-539` (delete the "Modern motion layer" section wholesale)
- Delete: `client/src/hooks/useTilt.js`
- Delete: `client/src/hooks/useCountUp.js`
- Modify: `client/src/components/perfume/PerfumeCard.jsx` (drop `useTilt` import/usage — full rewrite happens in Task 4, this step is just the import removal so the app still builds between commits)

- [ ] **Step 1: Delete the entire "Modern motion layer" block**

In `client/src/index.css`, delete everything from the comment `/* ===== Modern motion layer: 3D, glass, glow, SVG accents ===== */` (line ~354) through the end of the file (the `@media (prefers-reduced-motion: reduce)` block at line 539) — this removes `--grad-accent`, `--shadow-glow`, `--ease-spring`, `@keyframes float-y/float-slow/aurora/gradient-pan/spin-slow/dash-draw/rise-in`, `.reveal`, `.gradient-text`, `.glass`, `.float-deco`, `.tilt-3d`/`.tilt-3d::after`, `.tilt-layer`, the `.card`/`.card:hover` glow override, and the `.btn-primary` sheen override (already superseded by Task 1's plain outline button).

Add back a single reduced-motion rule at the end of the file (global, matches tokens.css's base layer):

```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 2: Delete the hook files**

```bash
rm client/src/hooks/useTilt.js client/src/hooks/useCountUp.js
```

- [ ] **Step 3: Strip the now-broken import/usage from `PerfumeCard.jsx`**

In `client/src/components/perfume/PerfumeCard.jsx`, remove line 3 (`import useTilt from '../../hooks/useTilt';`), remove line 22 (`const tiltRef = useTilt(7);`), remove the `ref={tiltRef}` prop and the `tilt-3d` class from the `<Link>` on line 27, and remove `tilt-layer` from the info `<div>` on line 46. Leave everything else — Task 4 replaces this file's contents fully anyway, this step only exists so the app doesn't reference a deleted hook in the meantime.

- [ ] **Step 4: Grep to confirm nothing else references the deleted hooks or classes**

```bash
cd client && grep -rn "useTilt\|useCountUp\|tilt-3d\|tilt-layer\|float-deco\|gradient-text\|--grad-accent\|--shadow-glow\|--ease-spring\|\.glass\b" src/
```
Expected: no matches (HomePage.jsx still has them at this point — Task 5 rewrites HomePage.jsx and removes them there; if the grep flags `HomePage.jsx`/`HomePage.css`, that's expected and fine to leave until Task 5).

- [ ] **Step 5: Lint + build**

```bash
npm run lint
npm run build
```
Expected: fails only on `HomePage.jsx`/`.css` (still references the deleted classes/hooks) — that's fine, Task 5 fixes it next. If anything *other* than Home fails, stop and fix it here.

- [ ] **Step 6: Commit**

```bash
git add client/src/index.css client/src/hooks/useTilt.js client/src/hooks/useCountUp.js client/src/components/perfume/PerfumeCard.jsx
git commit -m "refactor: remove tilt/glass/aurora motion layer and its hooks"
```

---

## Task 3: Navigation — segment nav + mobile tab bar

**Files:**
- Modify: `client/src/components/layout/Navbar.jsx` (full rewrite)
- Modify: `client/src/components/layout/Navbar.css` (full rewrite)
- Create: `client/src/components/layout/TabBar.jsx`
- Create: `client/src/components/layout/TabBar.css`
- Modify: `client/src/components/layout/Layout.jsx`

- [ ] **Step 1: Rewrite `Navbar.jsx`**

```jsx
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import { getPerfumes } from '../../services/perfumeService';
import './Navbar.css';

function Logo() {
  return (
    <Link to="/" className="navbar__logo">
      <svg width="20" height="20" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <path d="M13 1.5 L24.5 13 L13 24.5 L1.5 13 Z" stroke="#9184d9" strokeWidth="1.6" />
      </svg>
      <span className="navbar__logo-text">Scentboxd</span>
    </Link>
  );
}

export default function Navbar() {
  const { isAuthenticated, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const shelfPath = isAuthenticated ? `/profile/${profile?.username || 'me'}` : '/login';

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    getPerfumes({ search: debouncedSearch, limit: 5 })
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
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleSelectResult = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Logo />

        <div className="navbar__segment" role="tablist" aria-label="Main navigation">
          <NavLink to="/" end className="navbar__segment-item">Feed</NavLink>
          <NavLink to="/explore" className="navbar__segment-item">Index</NavLink>
          <NavLink to="/brands" className="navbar__segment-item">Houses</NavLink>
          <NavLink to={shelfPath} className="navbar__segment-item">Shelf</NavLink>
        </div>

        <div className="navbar__right">
          <div className="navbar__search" ref={searchRef}>
            <button
              type="button"
              className="navbar__search-pill"
              onClick={() => { setSearchOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); }}
            >
              <MagnifyingGlass size={14} weight="regular" />
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
                          to={`/explore?q=${encodeURIComponent(searchQuery)}`}
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
            <div className="navbar__user">
              <Link to={shelfPath} className="navbar__avatar" title={profile?.username || 'Profile'}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" />
                ) : (
                  (profile?.username || 'U')[0].toUpperCase()
                )}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">Sign in</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Rewrite `Navbar.css`**

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
  border-bottom: 1px solid var(--hairline);
  height: var(--nav-height);
}

.navbar__inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-10);
  height: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.navbar__logo {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font: var(--weight-heading) 15px var(--font);
  color: var(--text);
  text-decoration: none;
  flex: none;
}

.navbar__segment {
  display: flex;
  gap: 2px;
  padding: var(--space-1);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
}

.navbar__segment-item {
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-sm);
  font: var(--weight-body) 13px var(--font);
  color: var(--text-muted);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.navbar__segment-item:hover { color: var(--text); }

.navbar__segment-item.active {
  background: var(--accent-tint);
  color: var(--accent-text);
  font-weight: var(--weight-label);
}

.navbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.navbar__search { position: relative; }

.navbar__search-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding: 0 var(--space-6);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-dim);
  font: var(--weight-body) 13px var(--font);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}
.navbar__search-pill:hover { border-color: var(--hairline-strong); color: var(--text-body); }
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
  background: var(--surface);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--space-4);
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
.navbar__search-item:hover { color: var(--accent-text); }

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
.navbar__search-item-brand { font-size: 11.5px; color: var(--text-dim); }
.navbar__search-item--all { justify-content: center; color: var(--accent-text); font-weight: 500; }

.navbar__user { display: flex; align-items: center; gap: var(--space-4); }

.navbar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-tint);
  border: 1px solid var(--accent-line);
  color: var(--accent-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font: var(--weight-label) 13px var(--font);
  overflow: hidden;
  text-decoration: none;
}
.navbar__avatar img { width: 100%; height: 100%; object-fit: cover; }

@media (max-width: 900px) {
  .navbar__segment { display: none; }
  .navbar__inner { padding: 0 var(--space-6); gap: var(--space-4); }
  .navbar__search-panel { position: fixed; top: var(--nav-height); left: 0; right: 0; width: auto; border-radius: 0; }
}
```

- [ ] **Step 3: Create `TabBar.jsx`**

```jsx
import { NavLink } from 'react-router-dom';
import { Compass, House, Plus, Rows, SquaresFour } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import './TabBar.css';

export default function TabBar() {
  const { isAuthenticated, profile } = useAuth();
  const shelfPath = isAuthenticated ? `/profile/${profile?.username || 'me'}` : '/login';

  return (
    <nav className="tabbar" aria-label="Main navigation">
      <NavLink to="/" end className="tabbar__item">
        <Rows size={18} />
        <span>Feed</span>
      </NavLink>
      <NavLink to="/explore" className="tabbar__item">
        <Compass size={18} />
        <span>Index</span>
      </NavLink>
      <NavLink to="/explore" className="tabbar__compose" aria-label="Write a verdict">
        <Plus size={20} weight="bold" />
      </NavLink>
      <NavLink to="/brands" className="tabbar__item">
        <House size={18} />
        <span>Houses</span>
      </NavLink>
      <NavLink to={shelfPath} className="tabbar__item">
        <SquaresFour size={18} />
        <span>Shelf</span>
      </NavLink>
    </nav>
  );
}
```

- [ ] **Step 4: Create `TabBar.css`**

```css
.tabbar {
  display: none;
}

@media (max-width: 900px) {
  .tabbar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    position: sticky;
    bottom: 0;
    z-index: 100;
    background: var(--surface);
    border-top: 1px solid var(--hairline);
    padding: var(--space-3) var(--space-6) calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
    height: var(--tabbar-height);
    box-sizing: border-box;
  }

  .tabbar__item {
    min-height: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font: var(--weight-body) 10.5px var(--font);
    color: var(--text-dim);
    text-decoration: none;
  }
  .tabbar__item.active { color: var(--accent-text); font-weight: var(--weight-label); }

  .tabbar__compose {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tabbar__compose::before {
    content: '';
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--accent);
    position: absolute;
  }
  .tabbar__compose { position: relative; color: var(--accent-text); }
  .tabbar__compose svg { position: relative; z-index: 1; }
}
```

- [ ] **Step 5: Wire `TabBar` into `Layout.jsx`**

```jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import TabBar from './TabBar';

export default function Layout() {
  return (
    <div className="layout">
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

- [ ] **Step 6: Visual check**

```bash
npm run dev
```
Compare desktop nav against `2b`'s header row and mobile (resize to ≤900px, or DevTools device toolbar at 402px) against `3a`'s tab bar in `Scentboxd Redesign.dc.html`. Confirm ⌘K opens the search panel and Escape closes it.

- [ ] **Step 7: Lint + build**

```bash
npm run lint
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add client/src/components/layout/
git commit -m "feat: segment navigation + mobile tab bar"
```

---

## Task 4: Perfume card, perfume row, and the Explore ("Index") page

**Files:**
- Modify: `client/src/components/perfume/PerfumeCard.jsx` (full rewrite)
- Modify: `client/src/components/perfume/PerfumeCard.css` (full rewrite)
- Modify: `client/src/components/perfume/PerfumeGrid.jsx` (skeleton restyle only)
- Modify: `client/src/components/perfume/PerfumeGrid.css`
- Create: `client/src/components/perfume/PerfumeRow.jsx`
- Create: `client/src/components/perfume/PerfumeRow.css`
- Create: `client/src/components/perfume/FilterPanel.jsx`
- Create: `client/src/components/perfume/FilterPanel.css`
- Create: `client/src/components/perfume/FilterSheet.jsx`
- Create: `client/src/components/perfume/FilterSheet.css`
- Modify: `client/src/pages/ExplorePage.jsx` (full rewrite)
- Modify: `client/src/pages/ExplorePage.css` (full rewrite)
- Modify: `client/src/services/perfumeService.js:6-93` (`getPerfumes`, add `minLongevity`)

- [ ] **Step 1: Add `minLongevity` support to `getPerfumes`**

Read `client/src/services/perfumeService.js:6-93` first to see the exact current filter-chaining shape, then add one more param and one more `.gte(...)` clause following the same pattern as the existing `concentration`/`noteFamily` filters (each is an `if (x) query = query.eq(...)` — add `if (minLongevity) query = query.gte('longevity', minLongevity);` alongside them, and add `minLongevity = 0` to the destructured params list).

- [ ] **Step 2: Rewrite `PerfumeCard.jsx`** (grid card — used in Explore grid view, Shelf, similar-perfumes, list detail)

```jsx
import { Link } from 'react-router-dom';
import './PerfumeCard.css';

export default function PerfumeCard({ perfume }) {
  const brandName = perfume.brands?.name || 'Unknown';
  const topNote = perfume.perfume_notes?.[0]?.notes?.name;

  return (
    <Link to={`/perfume/${perfume.id}`} className="perfume-card">
      <div className="bottle perfume-card__image">
        {perfume.image_url ? (
          <img src={perfume.image_url} alt={perfume.name} loading="lazy" />
        ) : (
          <span className="perfume-card__placeholder" aria-hidden="true">◆</span>
        )}
      </div>
      <div className="perfume-card__body">
        <div className="perfume-card__brand">{brandName}</div>
        <div className="perfume-card__name">{perfume.name}</div>
        <div className="perfume-card__foot">
          <span className="perfume-card__note">{topNote || perfume.concentration || '—'}</span>
          {perfume.performance != null && (
            <span className="perfume-card__score">{Number(perfume.performance).toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Rewrite `PerfumeCard.css`**

```css
.perfume-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  overflow: hidden;
  text-decoration: none;
  transition: border-color 0.2s ease;
}
.perfume-card:hover { border-color: var(--hairline-strong); }

.perfume-card__image { border: none; border-radius: 0; border-bottom: 1px solid var(--hairline); }
.perfume-card__placeholder { color: var(--text-dim); font-size: 28px; }

.perfume-card__body { padding: var(--space-4); border-top: 1px solid var(--hairline); }

.perfume-card__brand {
  font: var(--weight-body) 11px var(--font);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.perfume-card__name {
  font: var(--weight-label) 13.5px/1.3 var(--font);
  color: var(--text);
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.perfume-card__foot {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-3);
  font: var(--weight-body) 11.5px var(--font);
}
.perfume-card__note { color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.perfume-card__score { color: var(--accent-text); font-variant-numeric: tabular-nums; flex: none; margin-left: var(--space-2); }
```

- [ ] **Step 4: Restyle `PerfumeGrid.css` skeletons to the new tokens (keep `PerfumeGrid.jsx` logic as-is, just confirm it still imports fine)**

Read `client/src/components/perfume/PerfumeGrid.css` first, then replace any `--bg-card`/gap/radius values with `var(--surface)`, `var(--space-6)` gap, `var(--radius-md)` — the skeleton placeholders inside `PerfumeGrid.jsx` already use inline styles keyed off `.skeleton` (redefined in Task 1), so no JS changes needed here, only confirm the grid container CSS (`.perfume-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: var(--space-6); }`) matches the token spacing.

- [ ] **Step 5: Create `PerfumeRow.jsx`** (row — Explore rows view, mobile Index)

```jsx
import { Link } from 'react-router-dom';
import './PerfumeRow.css';

export default function PerfumeRow({ perfume }) {
  const brandName = perfume.brands?.name || 'Unknown';
  const notes = (perfume.perfume_notes || []).slice(0, 2).map((pn) => pn.notes?.name).filter(Boolean);

  return (
    <Link to={`/perfume/${perfume.id}`} className="perfume-row">
      <div className="bottle perfume-row__image">
        {perfume.image_url ? <img src={perfume.image_url} alt="" loading="lazy" /> : <span aria-hidden="true">◆</span>}
      </div>
      <div className="perfume-row__main">
        <div className="perfume-row__name">{perfume.name}</div>
        <div className="perfume-row__sub">{brandName}{notes[0] ? ` · ${notes[0]}` : ''}</div>
      </div>
      <div className="perfume-row__house">{brandName}</div>
      <div className="perfume-row__notes">
        {notes.map((n) => <span key={n} className="chip">{n}</span>)}
      </div>
      <div className="perfume-row__score">
        <div className="perfume-row__score-value">
          {perfume.performance != null ? Number(perfume.performance).toFixed(1) : '—'}
        </div>
        {perfume.review_count != null && (
          <div className="perfume-row__score-count">{perfume.review_count}</div>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 6: Create `PerfumeRow.css`**

```css
.perfume-row {
  display: grid;
  grid-template-columns: 52px 1fr 200px 220px 88px;
  gap: var(--space-6);
  align-items: center;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--hairline);
  text-decoration: none;
}
.perfume-row:hover .perfume-row__name { color: var(--accent-text); }

.perfume-row__image { border-radius: var(--radius-sm); }
.perfume-row__image img,
.perfume-row__image span { padding: 3px; }

.perfume-row__name { font: var(--weight-label) 16px var(--font); color: var(--text); transition: color 0.2s ease; }
.perfume-row__sub { display: none; font: var(--weight-body) 12px var(--font); color: var(--text-dim); margin-top: 3px; }

.perfume-row__house { font: var(--weight-body) 13.5px var(--font); color: var(--text-body); }

.perfume-row__notes { display: flex; gap: var(--space-2); flex-wrap: wrap; }

.perfume-row__score { text-align: right; }
.perfume-row__score-value { font: var(--weight-label) 16px var(--font); color: var(--accent-text); font-variant-numeric: tabular-nums; }
.perfume-row__score-count { font: var(--weight-body) 11.5px var(--font); color: var(--text-dim); }

@media (max-width: 900px) {
  .perfume-row { grid-template-columns: 44px 1fr 52px; gap: var(--space-4); }
  .perfume-row__house, .perfume-row__notes { display: none; }
  .perfume-row__sub { display: block; }
  .perfume-row__score-value { font-size: 15px; }
}
```

- [ ] **Step 7: Create `FilterPanel.jsx`** (shared control set — rendered as a sidebar on desktop, inside `FilterSheet` on mobile)

```jsx
const SORT_OPTIONS = [
  { value: 'performance', label: 'Best rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export default function FilterPanel({
  sortBy, onSortChange,
  concentrations, concentration, onConcentrationChange,
  noteFamilies, noteFamily, onNoteFamilyChange,
  minLongevity, onMinLongevityChange,
  onReset,
}) {
  return (
    <div className="filter-panel">
      <div className="filter-panel__group">
        <div className="filter-panel__label">Sort</div>
        <div className="filter-panel__sort-list">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`filter-panel__sort-item ${sortBy === opt.value ? 'active' : ''}`}
              onClick={() => onSortChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label">Concentration</div>
        <div className="filter-panel__check-list">
          {concentrations.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-panel__check-item ${concentration === c ? 'active' : ''}`}
              onClick={() => onConcentrationChange(concentration === c ? '' : c)}
            >
              <span className="filter-panel__check-box" aria-hidden="true">{concentration === c ? '◼' : '◻'}</span>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label">Note family</div>
        <div className="filter-panel__chips">
          {noteFamilies.map((nf) => (
            <button
              key={nf}
              type="button"
              className="chip"
              aria-pressed={noteFamily === nf}
              onClick={() => onNoteFamilyChange(noteFamily === nf ? '' : nf)}
            >
              {nf}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label">
          <span>Longevity at least</span>
          <span>{minLongevity} h</span>
        </div>
        <input
          type="range"
          className="filter-panel__slider"
          min={0}
          max={12}
          step={1}
          value={minLongevity}
          onChange={(e) => onMinLongevityChange(Number(e.target.value))}
        />
      </div>

      <button type="button" className="filter-panel__reset" onClick={onReset}>Reset all filters</button>
    </div>
  );
}
```

- [ ] **Step 8: Create `FilterPanel.css`**

```css
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.filter-panel__label {
  font: var(--weight-label) 11.5px var(--font);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: var(--space-4);
  display: flex;
  justify-content: space-between;
}

.filter-panel__sort-list { display: flex; flex-direction: column; gap: 2px; }
.filter-panel__sort-item {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  font: var(--weight-body) 13px var(--font);
  color: var(--text-muted);
  cursor: pointer;
}
.filter-panel__sort-item.active { background: var(--accent-tint); color: var(--accent-text); font-weight: var(--weight-label); }

.filter-panel__check-list { display: flex; flex-direction: column; gap: var(--space-3); }
.filter-panel__check-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: 44px;
  border: none;
  background: transparent;
  font: var(--weight-body) 14px var(--font);
  color: var(--text-muted);
  cursor: pointer;
  text-align: left;
}
.filter-panel__check-item.active { color: var(--text); }
.filter-panel__check-box { color: var(--hairline-strong); }
.filter-panel__check-item.active .filter-panel__check-box { color: var(--accent); }

.filter-panel__chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }

.filter-panel__slider {
  width: 100%;
  accent-color: var(--accent);
}

.filter-panel__reset {
  margin-top: auto;
  align-self: flex-start;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font: var(--weight-body) 12.5px var(--font);
  cursor: pointer;
}
.filter-panel__reset:hover { color: var(--text-body); }
```

- [ ] **Step 9: Create `FilterSheet.jsx`** (mobile bottom sheet wrapping `FilterPanel`)

```jsx
import FilterPanel from './FilterPanel';
import './FilterSheet.css';

export default function FilterSheet({ open, onClose, resultCount, ...filterProps }) {
  if (!open) return null;
  return (
    <div className="filter-sheet__backdrop" onClick={onClose}>
      <div className="filter-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="filter-sheet__handle" />
        <div className="filter-sheet__header">
          <span>Filters</span>
          <button type="button" onClick={filterProps.onReset}>Reset</button>
        </div>
        <div className="filter-sheet__body">
          <FilterPanel {...filterProps} />
        </div>
        <button type="button" className="btn btn-primary filter-sheet__apply" onClick={onClose}>
          Show {resultCount} entries
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Create `FilterSheet.css`**

```css
.filter-sheet__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(22, 24, 38, 0.72);
  z-index: 300;
  display: flex;
  align-items: flex-end;
}

.filter-sheet {
  width: 100%;
  max-height: 76vh;
  background: var(--surface);
  border-top: 1px solid var(--hairline-strong);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--space-4) var(--space-6) calc(var(--space-8) + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  animation: filter-sheet-in 0.25s ease-out;
}

@keyframes filter-sheet-in {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.filter-sheet__handle {
  width: 40px;
  height: 4px;
  border-radius: var(--radius-pill);
  background: var(--hairline-strong);
  margin: 0 auto;
}

.filter-sheet__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font: var(--weight-heading) 20px var(--font);
  color: var(--text);
}
.filter-sheet__header button {
  border: none;
  background: none;
  font: var(--weight-body) 13px var(--font);
  color: var(--text-dim);
}

.filter-sheet__body { overflow-y: auto; }

.filter-sheet__apply { min-height: 48px; }

@media (prefers-reduced-motion: reduce) {
  .filter-sheet { animation: none; }
}
```

- [ ] **Step 11: Rewrite `ExplorePage.jsx`** (rows/grid toggle, sidebar + sheet filters, load-more pagination)

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List as ListIcon, SquaresFour } from '@phosphor-icons/react';
import { getPerfumes, getConcentrations, getNoteFamilies } from '../services/perfumeService';
import { toast } from '../store/toastStore';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import PerfumeRow from '../components/perfume/PerfumeRow';
import FilterPanel from '../components/perfume/FilterPanel';
import FilterSheet from '../components/perfume/FilterSheet';
import './ExplorePage.css';

const PAGE_SIZE = 24;

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [perfumes, setPerfumes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [concentrations, setConcentrations] = useState([]);
  const [noteFamilies, setNoteFamilies] = useState([]);
  const [view, setView] = useState(() => localStorage.getItem('scentboxd:exploreView') || 'rows');
  const [sheetOpen, setSheetOpen] = useState(false);

  const search = searchParams.get('q') || '';
  const concentration = searchParams.get('concentration') || '';
  const noteFamily = searchParams.get('family') || '';
  const minLongevity = Number(searchParams.get('longevity') || 0);
  const sortBy = searchParams.get('sort') || 'performance';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    Promise.all([getConcentrations(), getNoteFamilies()])
      .then(([c, nf]) => { setConcentrations(c); setNoteFamilies(nf); })
      .catch((err) => toast.error('Failed to load filters: ' + err.message));
  }, []);

  const loadPerfumes = useCallback(async (targetPage, append) => {
    (append ? setLoadingMore : setLoading)(true);
    try {
      const result = await getPerfumes({
        search, concentration, noteFamily, minLongevity, sortBy, page: targetPage, pageSize: PAGE_SIZE,
      });
      setPerfumes((prev) => (append ? [...prev, ...result.perfumes] : result.perfumes));
      setTotal(result.total);
    } catch (err) {
      toast.error('Failed to load perfumes: ' + err.message);
    }
    (append ? setLoadingMore : setLoading)(false);
  }, [search, concentration, noteFamily, minLongevity, sortBy]);

  useEffect(() => { loadPerfumes(1, false); }, [loadPerfumes]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    setSearchParams(params);
  };

  const resetAll = () => setSearchParams(new URLSearchParams());

  const loadMore = () => {
    const next = page + 1;
    setSearchParams((p) => { p.set('page', String(next)); return p; }, { replace: true });
    loadPerfumes(next, true);
  };

  const setView_ = (v) => {
    setView(v);
    localStorage.setItem('scentboxd:exploreView', v);
  };

  const activeFilterTags = [];
  if (concentration) activeFilterTags.push({ key: 'concentration', label: concentration });
  if (noteFamily) activeFilterTags.push({ key: 'family', label: noteFamily });
  if (minLongevity > 0) activeFilterTags.push({ key: 'longevity', label: `Longevity ${minLongevity}h+` });

  const filterProps = {
    sortBy, onSortChange: (v) => updateFilter('sort', v),
    concentrations, concentration, onConcentrationChange: (v) => updateFilter('concentration', v),
    noteFamilies, noteFamily, onNoteFamilyChange: (v) => updateFilter('family', v),
    minLongevity, onMinLongevityChange: (v) => updateFilter('longevity', v ? String(v) : ''),
    onReset: resetAll,
  };

  return (
    <div className="explore">
      <div className="explore__layout">
        <aside className="explore__sidebar">
          <FilterPanel {...filterProps} />
        </aside>

        <div className="explore__main">
          <div className="explore__toolbar">
            <div>
              <h1 className="explore__title">Index</h1>
              <div className="explore__meta">{total} entries{concentration ? ` · ${concentration}` : ''} · sorted by {sortBy}</div>
            </div>
            <div className="explore__right">
              <input
                className="input explore__search-input"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => updateFilter('q', e.target.value)}
              />
              <button type="button" className="explore__filter-btn" onClick={() => setSheetOpen(true)}>
                Filters {activeFilterTags.length}
              </button>
              <div className="explore__view-toggle">
                <button
                  type="button"
                  className={view === 'rows' ? 'active' : ''}
                  onClick={() => setView_('rows')}
                  aria-label="Row view"
                ><ListIcon size={14} /></button>
                <button
                  type="button"
                  className={view === 'grid' ? 'active' : ''}
                  onClick={() => setView_('grid')}
                  aria-label="Grid view"
                ><SquaresFour size={14} /></button>
              </div>
            </div>
          </div>

          {activeFilterTags.length > 0 && (
            <div className="explore__active-tags">
              {activeFilterTags.map((tag) => (
                <button key={tag.key} className="chip" aria-pressed="true" onClick={() => updateFilter(tag.key, '')}>
                  {tag.label} ✕
                </button>
              ))}
            </div>
          )}

          {view === 'grid' ? (
            <PerfumeGrid perfumes={perfumes} loading={loading} />
          ) : (
            <div className="explore__rows">
              <div className="explore__rows-head">
                <span></span><span>Fragrance</span><span>House</span><span>Accords</span><span>Rating</span>
              </div>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <div key={i} className="explore__row-skeleton skeleton" />)
              ) : perfumes.length === 0 ? (
                <div className="explore__empty">
                  <div className="explore__empty-title">Nothing matches these filters.</div>
                  <p>Try dropping one of the active filters.</p>
                  <button className="btn btn-primary" onClick={resetAll}>Reset all</button>
                </div>
              ) : (
                perfumes.map((p) => <PerfumeRow key={p.id} perfume={p} />)
              )}
            </div>
          )}

          {!loading && perfumes.length < total && (
            <div className="explore__load-more">
              <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load 24 more'}
              </button>
              <span>Showing {perfumes.length} of {total}</span>
            </div>
          )}
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} resultCount={total} {...filterProps} />
    </div>
  );
}
```

- [ ] **Step 12: Rewrite `ExplorePage.css`**

```css
.explore { padding: 0; }

.explore__layout {
  max-width: var(--max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 248px 1fr;
}

.explore__sidebar {
  border-right: 1px solid var(--hairline);
  padding: var(--space-10);
  display: none;
}

.explore__main { padding: var(--space-10) var(--space-10) var(--space-14); grid-column: 1 / -1; }

.explore__toolbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
.explore__title { font: var(--weight-heading) 30px var(--font); color: var(--text); letter-spacing: -0.02em; }
.explore__meta { font: var(--weight-body) 13px var(--font); color: var(--text-dim); margin-top: var(--space-2); }

.explore__right { display: flex; align-items: center; gap: var(--space-4); }
.explore__search-input { width: 200px; min-height: 36px; }

.explore__filter-btn {
  min-height: 36px;
  padding: 0 var(--space-6);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--accent-text);
  font: var(--weight-label) 12.5px var(--font);
  cursor: pointer;
}

.explore__view-toggle { display: flex; gap: 2px; padding: 2px; border: 1px solid var(--hairline); border-radius: var(--radius-md); }
.explore__view-toggle button {
  min-height: 32px;
  width: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.explore__view-toggle button.active { background: var(--accent-tint); color: var(--accent-text); }

.explore__active-tags { display: flex; gap: var(--space-2); margin-bottom: var(--space-6); }

.explore__rows-head {
  display: grid;
  grid-template-columns: 52px 1fr 200px 220px 88px;
  gap: var(--space-6);
  padding-bottom: var(--space-3);
  font: var(--weight-body) 11.5px var(--font);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.explore__row-skeleton { height: 68px; margin-top: var(--space-3); }

.explore__empty { border: 1px solid var(--hairline); border-radius: var(--radius-lg); background: var(--surface); padding: var(--space-10); text-align: left; }
.explore__empty-title { font: var(--weight-heading) 20px var(--font); color: var(--text); }
.explore__empty p { color: var(--text-muted); margin: var(--space-3) 0 var(--space-6); }

.explore__load-more { display: flex; align-items: center; gap: var(--space-6); margin-top: var(--space-8); padding-top: var(--space-8); border-top: 1px solid var(--hairline); }
.explore__load-more span { font: var(--weight-body) 12.5px var(--font); color: var(--text-dim); }

@media (min-width: 900px) {
  .explore__sidebar { display: flex; flex-direction: column; }
  .explore__main { grid-column: auto; }
  .explore__filter-btn { display: none; }
}

@media (max-width: 899px) {
  .explore__rows-head { display: none; }
}
```

- [ ] **Step 13: Visual check against `2b` (desktop) and `3c` (mobile) in `Scentboxd Redesign.dc.html`**

```bash
npm run dev
```
Check: sidebar filters visible ≥900px, `Filters N` pill + sheet visible <900px; rows/grid toggle persists across reload (localStorage); "Load 24 more" appends rather than replacing results; sort/concentration/note-family selections round-trip through the URL.

- [ ] **Step 14: Lint + build**

```bash
npm run lint
npm run build
```

- [ ] **Step 15: Commit**

```bash
git add client/src/components/perfume/ client/src/pages/ExplorePage.jsx client/src/pages/ExplorePage.css client/src/services/perfumeService.js
git commit -m "feat: rebuild Explore as the Index — filter column/sheet, rows/grid toggle"
```

---

## Task 5: Home page → Feed

**Files:**
- Modify: `client/src/pages/HomePage.jsx` (full rewrite)
- Modify: `client/src/pages/HomePage.css` (full rewrite)
- Modify: `client/src/services/reviewService.js:126-133` (add `getReviewCountByUser`, alongside the existing `getReviewCount`)
- Modify: `client/src/services/userPerfumeService.js` (no signature change — reused as-is)

- [ ] **Step 1a: Add `getReviewCountByUser` to `reviewService.js`**

Add this new function right after `getReviewCount` (`client/src/services/reviewService.js:126-133`), following the same `{ count: 'exact', head: true }` pattern:

```js
export async function getReviewCountByUser(userId) {
  const { count, error } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count;
}
```

- [ ] **Step 1b: Rewrite `HomePage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPerfumes } from '../services/perfumeService';
import { getLatestReviews, getReviewCountByUser } from '../services/reviewService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { useAuth } from '../hooks/useAuth';
import './HomePage.css';

function ActivityRow({ review }) {
  const username = review.profiles?.username || 'Someone';
  return (
    <div className="feed__activity-row">
      <span className="feed__avatar">{username[0].toUpperCase()}</span>
      <div>
        <div className="feed__activity-text">
          <strong>{username}</strong> reviewed <strong className="feed__activity-item">{review.perfumes?.name}</strong>
        </div>
        <div className="feed__activity-time">{new Date(review.created_at).toLocaleDateString()}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [bottleOfDay, setBottleOfDay] = useState(null);
  const [activity, setActivity] = useState([]);
  const [verdicts, setVerdicts] = useState([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [wantCount, setWantCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [nudgePerfume, setNudgePerfume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getPerfumes({ sortBy: 'performance', pageSize: 1 }),
      getLatestReviews(4),
      getLatestReviews(2),
    ]).then(([bottle, feed, top]) => {
      if (bottle.status === 'fulfilled') setBottleOfDay(bottle.value.perfumes?.[0] || null);
      if (feed.status === 'fulfilled') setActivity(feed.value);
      if (top.status === 'fulfilled') setVerdicts(top.value);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    getUserPerfumesByStatus(user.id, 'is_owned')
      .then((rows) => {
        setOwnedCount(rows.length);
        if (rows.length > 0) {
          const pick = rows[Math.floor(Math.random() * rows.length)].perfumes;
          if (pick) setNudgePerfume(pick);
        }
      })
      .catch(() => {});
    getUserPerfumesByStatus(user.id, 'is_want_to_try').then((rows) => setWantCount(rows.length)).catch(() => {});
    getReviewCountByUser(user.id).then(setReviewCount).catch(() => {});
  }, [isAuthenticated, user]);

  return (
    <div className="feed">
      <div className="feed__columns">
        <div className="feed__col feed__col--shelf">
          <span className="feed__label">Your shelf</span>
          <div className="feed__stats">
            <div className="feed__stat-row"><span>Owned</span><span>{ownedCount}</span></div>
            <div className="feed__hr" />
            <div className="feed__stat-row"><span>Want to try</span><span>{wantCount}</span></div>
            <div className="feed__hr" />
            <div className="feed__stat-row"><span>Verdicts written</span><span>{reviewCount}</span></div>
          </div>
          {!isAuthenticated && (
            <Link to="/login" className="btn btn-secondary">Sign in to track your shelf</Link>
          )}
        </div>

        <div className="feed__col feed__col--bottle">
          <span className="feed__label feed__label--accent">Bottle of the day</span>
          {loading || !bottleOfDay ? (
            <div className="feed__bottle-skeleton skeleton" />
          ) : (
            <div className="feed__bottle">
              <div className="bottle feed__bottle-img">
                {bottleOfDay.image_url ? <img src={bottleOfDay.image_url} alt="" /> : <span>◆</span>}
              </div>
              <div>
                <div className="feed__bottle-brand">{bottleOfDay.brands?.name}</div>
                <h2 className="feed__bottle-name">{bottleOfDay.name}</h2>
                {bottleOfDay.desc && <p className="feed__bottle-desc">{bottleOfDay.desc}</p>}
                <div className="feed__bottle-actions">
                  <Link to={`/perfume/${bottleOfDay.id}`} className="btn btn-primary">Full entry</Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="feed__col feed__col--activity">
          <span className="feed__label">Right now</span>
          <div className="feed__activity">
            {activity.map((r) => <ActivityRow key={r.id} review={r} />)}
            {!loading && activity.length === 0 && <p className="feed__empty">No activity yet.</p>}
          </div>
        </div>
      </div>

      {nudgePerfume && (
        <div className="feed__section">
          <div>
            <div className="feed__section-title">You added {nudgePerfume.name} to your shelf.</div>
            <div className="feed__section-sub">Got a verdict for it yet?</div>
          </div>
          <Link to={`/perfume/${nudgePerfume.id}`} className="btn feed__section-btn">Write it</Link>
        </div>
      )}

      <div className="feed__verdicts">
        <div className="feed__verdicts-head">
          <h2>Verdicts worth reading</h2>
          <Link to="/explore">All verdicts →</Link>
        </div>
        <div className="feed__verdicts-grid">
          {verdicts.map((v) => (
            <div key={v.id} className="feed__verdict-card">
              <div className="feed__verdict-head">
                <span className="feed__avatar">{(v.profiles?.username || 'U')[0].toUpperCase()}</span>
                <div>
                  <div className="feed__verdict-user">{v.profiles?.username || 'Anonymous'}</div>
                  <div className="feed__verdict-on">on {v.perfumes?.name}</div>
                </div>
                <span className="feed__verdict-score">{v.rating?.toFixed?.(1) ?? v.rating}</span>
              </div>
              <p className="feed__verdict-text">{v.text}</p>
            </div>
          ))}
          {!loading && verdicts.length === 0 && <p className="feed__empty">No verdicts yet.</p>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `HomePage.css`**

```css
.feed { max-width: var(--max-width); margin: 0 auto; }

.feed__columns {
  display: grid;
  grid-template-columns: 264px 1fr 300px;
  border-bottom: 1px solid var(--hairline);
}

.feed__col { padding: var(--space-10); border-right: 1px solid var(--hairline); display: flex; flex-direction: column; gap: var(--space-6); }
.feed__col--activity { border-right: none; }

.feed__label { font: var(--weight-label) 11.5px var(--font); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); }
.feed__label--accent { color: var(--accent); }

.feed__stats { display: flex; flex-direction: column; gap: var(--space-4); }
.feed__stat-row { display: flex; justify-content: space-between; align-items: baseline; font: var(--weight-body) 14px var(--font); color: var(--text-body); }
.feed__stat-row span:last-child { font: var(--weight-heading) 20px var(--font); color: var(--text); font-variant-numeric: tabular-nums; }
.feed__hr { height: 1px; background: var(--hairline); }

.feed__bottle { display: grid; grid-template-columns: 200px 1fr; gap: var(--space-10); align-items: start; }
.feed__bottle-img img { padding: var(--space-6); }
.feed__bottle-brand { font: var(--weight-body) 12px var(--font); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
.feed__bottle-name { font: var(--weight-heading) 34px/1.1 var(--font); letter-spacing: -0.02em; color: var(--text); margin: var(--space-2) 0 var(--space-4); }
.feed__bottle-desc { font: var(--weight-body) 14.5px/1.6 var(--font); color: var(--text-body); margin-bottom: var(--space-6); }
.feed__bottle-actions { display: flex; gap: var(--space-3); }
.feed__bottle-skeleton { height: 260px; }

.feed__activity { display: flex; flex-direction: column; }
.feed__activity-row { display: flex; gap: var(--space-4); padding: var(--space-4) 0; border-top: 1px solid var(--hairline); }
.feed__avatar {
  width: 28px; height: 28px; flex: none; border-radius: 50%;
  background: var(--accent-tint); color: var(--accent-text);
  display: flex; align-items: center; justify-content: center;
  font: var(--weight-label) 12px var(--font);
}
.feed__activity-text { font: var(--weight-body) 13px/1.5 var(--font); color: var(--text-body); }
.feed__activity-item { color: var(--accent-text); font-weight: var(--weight-label); }
.feed__activity-time { font: var(--weight-body) 11.5px var(--font); color: var(--text-dim); margin-top: 4px; }
.feed__empty { color: var(--text-dim); font-size: 13px; }

.feed__section {
  background: var(--section);
  padding: var(--space-10) var(--space-14);
  display: flex;
  align-items: center;
  gap: var(--space-10);
}
.feed__section-title { font: var(--weight-heading) 20px var(--font); color: var(--text); }
.feed__section-sub { font: var(--weight-body) 14px var(--font); color: var(--accent-text); margin-top: var(--space-2); }
.feed__section-btn { border: 1px solid var(--accent-text); color: var(--text); flex: none; }

.feed__verdicts { padding: var(--space-10) var(--space-14) var(--space-14); }
.feed__verdicts-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: var(--space-8); }
.feed__verdicts-head h2 { font: var(--weight-heading) 22px var(--font); color: var(--text); }
.feed__verdicts-head a { font: var(--weight-body) 13px var(--font); color: var(--text-dim); }

.feed__verdicts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-8); }
.feed__verdict-card { border: 1px solid var(--hairline); border-radius: var(--radius-lg); background: var(--surface); padding: var(--space-8); }
.feed__verdict-head { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); }
.feed__verdict-user { font: var(--weight-label) 13.5px var(--font); color: var(--text); }
.feed__verdict-on { font: var(--weight-body) 11.5px var(--font); color: var(--text-dim); }
.feed__verdict-score { margin-left: auto; font: var(--weight-label) 13px var(--font); color: var(--accent-text); font-variant-numeric: tabular-nums; }
.feed__verdict-text { font: var(--weight-body) 15px/1.65 var(--font); color: var(--text-body); }

@media (max-width: 900px) {
  .feed__columns { grid-template-columns: 1fr; }
  .feed__col { border-right: none; border-bottom: 1px solid var(--hairline); }
  .feed__bottle { grid-template-columns: 116px 1fr; gap: var(--space-6); }
  .feed__bottle-name { font-size: 26px; }
  .feed__section { padding: var(--space-6); flex-direction: column; align-items: flex-start; }
  .feed__verdicts { padding: var(--space-6); }
  .feed__verdicts-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Grep for leftover motion-layer references now that HomePage no longer has them**

```bash
cd client && grep -rn "useTilt\|useCountUp\|tilt-3d\|float-deco\|gradient-text\|home__hero\|home__aurora\|home__deco" src/
```
Expected: no matches.

- [ ] **Step 4: Visual check against `1b` (desktop) and `3a` (mobile) in `Scentboxd Redesign.dc.html`**

```bash
npm run dev
```
Check both signed-out (no "Your shelf" counts / no nudge block, but Bottle of the day + Right now + Verdicts still render) and signed-in (counts populate — including a real "Verdicts written" number — and the nudge block appears if the user owns ≥1 perfume) states.

- [ ] **Step 5: Lint + build**

```bash
npm run lint
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/HomePage.jsx client/src/pages/HomePage.css client/src/services/reviewService.js
git commit -m "feat: rebuild Home as the community Feed"
```

---

## Task 6: Perfume Detail page → "Entry"

**Files:**
- Modify: `client/src/components/perfume/FragrancePyramid.jsx` (full rewrite)
- Modify: `client/src/components/perfume/FragrancePyramid.css` (full rewrite)
- Modify: `client/src/components/perfume/PerformanceBar.jsx` (full rewrite)
- Modify: `client/src/components/perfume/PerformanceBar.css` (full rewrite)
- Modify: `client/src/components/review/ReviewForm.jsx` (composer restyle — markup/class changes, logic untouched)
- Modify: `client/src/components/review/ReviewForm.css` (full rewrite)
- Modify: `client/src/components/review/ReviewCard.jsx` (restyle as a verdict row — markup/class changes)
- Modify: `client/src/components/review/ReviewCard.css` (full rewrite)
- Modify: `client/src/components/perfume/UserPerfumeActions.jsx` (restyle as primary/secondary buttons — logic untouched)
- Modify: `client/src/components/perfume/UserPerfumeActions.css` (full rewrite)
- Modify: `client/src/pages/PerfumeDetailPage.jsx` (full rewrite)
- Modify: `client/src/pages/PerfumeDetailPage.css` (full rewrite)

- [ ] **Step 1: Rewrite `FragrancePyramid.jsx`** (3 guided rows instead of 3 stacked blocks)

```jsx
import './FragrancePyramid.css';

export default function FragrancePyramid({ notes }) {
  if (!notes || notes.length === 0) return null;

  const rows = [
    { key: 'top', label: 'Top', list: notes.filter((n) => n.note_type === 'top') },
    { key: 'mid', label: 'Heart', list: notes.filter((n) => n.note_type === 'mid') },
    { key: 'base', label: 'Base', list: notes.filter((n) => n.note_type === 'base') },
  ].filter((row) => row.list.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className="pyramid">
      <div className="pyramid__label-row">Notes</div>
      {rows.map((row) => (
        <div key={row.key} className="pyramid__row">
          <span className="pyramid__row-label">{row.label}</span>
          <div className="pyramid__row-notes">
            {row.list.map((pn, i) => (
              <span key={i} className="chip">{pn.notes?.name || 'Unknown'}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `FragrancePyramid.css`**

```css
.pyramid__label-row {
  font: var(--weight-label) 11.5px var(--font);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: var(--space-4);
}

.pyramid__row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: var(--space-6);
  align-items: center;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--hairline);
}
.pyramid__row:last-child { border-bottom: 1px solid var(--hairline); }

.pyramid__row-label {
  font: var(--weight-body) 12.5px var(--font);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.pyramid__row-notes { display: flex; gap: var(--space-2); flex-wrap: wrap; }
```

- [ ] **Step 3: Rewrite `PerformanceBar.jsx`** (drop the emoji icon prop usage, keep the API so callers don't need to change beyond dropping `icon`)

```jsx
import './PerformanceBar.css';

export default function PerformanceBar({ label, value, maxValue = 100, suffix = '' }) {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
  return (
    <div className="perf-bar">
      <div className="perf-bar__header">
        <span>{label}</span>
        <span>{value !== null && value !== undefined ? `${value}${suffix}` : '—'}</span>
      </div>
      <div className="perf-bar__track">
        <div className="perf-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `PerformanceBar.css`**

```css
.perf-bar__header {
  display: flex;
  justify-content: space-between;
  font: var(--weight-body) 12.5px var(--font);
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}

.perf-bar__track { height: 2px; background: var(--hairline); }
.perf-bar__fill { height: 2px; background: var(--accent); }
```

- [ ] **Step 5: Restyle `UserPerfumeActions.jsx`** (drop emoji; primary = "On my shelf" + a compact heart favorite-toggle in the same row per Scope Decision #5, secondary = "Want to try")

```jsx
import { useState, useEffect } from 'react';
import { Check, Heart } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import { getUserPerfumeStatus, togglePerfumeStatus } from '../../services/userPerfumeService';
import { toast } from '../../store/toastStore';
import './UserPerfumeActions.css';

export default function UserPerfumeActions({ perfumeId }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !perfumeId) return;
    getUserPerfumeStatus(perfumeId).then(setStatus).catch(() => {});
  }, [isAuthenticated, perfumeId]);

  if (!isAuthenticated) return null;

  const handleToggle = async (field) => {
    if (loading) return;
    setLoading(true);
    try {
      setStatus(await togglePerfumeStatus(perfumeId, field));
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
    setLoading(false);
  };

  const owned = status?.is_owned || false;
  const wantToTry = status?.is_want_to_try || false;
  const favorite = status?.is_favorite || false;

  return (
    <div className="user-actions">
      <div className="user-actions__top">
        <button
          className={`btn user-actions__primary ${owned ? 'user-actions__primary--active' : ''}`}
          onClick={() => handleToggle('is_owned')}
          disabled={loading}
        >
          On my shelf {owned && <Check size={14} weight="bold" />}
        </button>
        <button
          className={`user-actions__favorite ${favorite ? 'user-actions__favorite--active' : ''}`}
          onClick={() => handleToggle('is_favorite')}
          disabled={loading}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={favorite}
        >
          <Heart size={16} weight={favorite ? 'fill' : 'regular'} />
        </button>
      </div>
      <button
        className={`btn btn-secondary ${wantToTry ? 'user-actions__secondary--active' : ''}`}
        onClick={() => handleToggle('is_want_to_try')}
        disabled={loading}
      >
        Want to try
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Rewrite `UserPerfumeActions.css`**

```css
.user-actions { display: flex; flex-direction: column; gap: var(--space-3); }

.user-actions__top { display: flex; gap: var(--space-3); }

.user-actions__primary {
  flex: 1;
  border: 1px solid var(--hairline-strong);
  color: var(--text-body);
}
.user-actions__primary--active { border-color: var(--accent); color: var(--accent-text); }

.user-actions__favorite {
  flex: none;
  width: 40px;
  min-height: 40px;
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.user-actions__favorite--active { border-color: var(--accent); color: var(--accent-text); }

.user-actions__secondary--active { border-color: var(--accent); color: var(--accent-text); }
```

- [ ] **Step 7: Restyle `ReviewForm.jsx`** (this becomes the "verdict composer" — same fields/logic, new class names, star rating shown as filled/outline glyphs matching the design)

Read the current file (already shown above) and apply these class-name-only edits: rename the root `review-form` class usages to `composer`, rename `review-form__*` to `composer__*` throughout (title, error, rating, field, row, occasions, occ-btn, actions, charcount), and change the submit button copy from `{initialData ? 'Save Changes' : 'Submit Review'}` to `{initialData ? 'Save changes' : 'Post verdict'}`. No logic, validation, or service-call changes — this is a pure re-skin so `ReviewForm.css` below can restyle it.

- [ ] **Step 8: Rewrite `ReviewForm.css`**

```css
.composer { border: 1px solid var(--hairline); border-radius: var(--radius-lg); background: var(--surface); padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); margin-bottom: var(--space-8); }

.composer__title { font: var(--weight-heading) 17px var(--font); color: var(--text); }
.composer__error { color: var(--accent-text); font-size: 13px; }

.composer__rating label { display: block; font: var(--weight-label) 11.5px var(--font); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); margin-bottom: var(--space-3); }

.composer__field label { display: block; font: var(--weight-body) 12px var(--font); color: var(--text-dim); margin-bottom: var(--space-2); }
.composer__charcount { display: block; text-align: right; font: var(--weight-body) 11.5px var(--font); color: var(--text-dim); margin-top: var(--space-2); }

.composer__row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }

.composer__occasions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.composer__occ-btn {
  min-height: 36px;
  padding: 0 var(--space-4);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-body);
  font: var(--weight-body) 12.5px var(--font);
  cursor: pointer;
}
.composer__occ-btn.active { border-color: var(--accent); color: var(--accent-text); }

.composer__actions { display: flex; gap: var(--space-4); }
```

- [ ] **Step 9: Restyle `ReviewCard.jsx`** (as a "verdict" row — drop the card border/background, use `border-top` like the 2a mockup; keep all like/edit/delete logic untouched, only class renames)

Apply the same pattern as Step 7: rename `review-card` → `verdict-row` and its `__` children throughout; keep `<ReviewForm>` embed for the edit state as-is (it already inherits the Step 7/8 composer styling).

- [ ] **Step 10: Rewrite `ReviewCard.css`** (as `verdict-row` selectors)

```css
.verdict-row { border-top: 1px solid var(--hairline); padding-top: var(--space-6); }

.verdict-row__header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); }
.verdict-row__avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--accent-tint); color: var(--accent-text);
  display: flex; align-items: center; justify-content: center;
  font: var(--weight-label) 12.5px var(--font); overflow: hidden;
}
.verdict-row__avatar img { width: 100%; height: 100%; object-fit: cover; }
.verdict-row__username { font: var(--weight-label) 13.5px var(--font); color: var(--text); }
.verdict-row__date { font: var(--weight-body) 11.5px var(--font); color: var(--text-dim); }

.verdict-row__title { display: none; } /* titles dropped — the design shows body text only */
.verdict-row__text { font: var(--weight-body) 15px/1.7 var(--font); color: var(--text-body); margin-bottom: var(--space-4); }

.verdict-row__metrics { display: flex; gap: var(--space-6); font: var(--weight-body) 12px var(--font); color: var(--text-dim); margin-bottom: var(--space-4); }
.verdict-row__occasions { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-4); }

.verdict-row__footer { display: flex; align-items: center; gap: var(--space-6); }
.verdict-row__like-btn { display: flex; align-items: center; gap: var(--space-2); border: none; background: none; color: var(--text-dim); cursor: pointer; font-size: 12px; }
.verdict-row__like-btn--liked { color: var(--accent-text); }
.verdict-row__actions { margin-left: auto; display: flex; gap: var(--space-3); }
```

- [ ] **Step 11: Rewrite `PerfumeDetailPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPerfumeById, getSimilarPerfumes } from '../services/perfumeService';
import { getReviewsByPerfume, deleteReview } from '../services/reviewService';
import FragrancePyramid from '../components/perfume/FragrancePyramid';
import PerformanceBar from '../components/perfume/PerformanceBar';
import UserPerfumeActions from '../components/perfume/UserPerfumeActions';
import AddToListButton from '../components/perfume/AddToListButton';
import ReviewCard from '../components/review/ReviewCard';
import ReviewForm from '../components/review/ReviewForm';
import PerfumeCard from '../components/perfume/PerfumeCard';
import { useAuth } from '../hooks/useAuth';
import './PerfumeDetailPage.css';

export default function PerfumeDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [perfume, setPerfume] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getPerfumeById(id)
      .then((data) => {
        setPerfume(data);
        getReviewsByPerfume(id).then(setReviews).catch(() => {});
        if (data.brand_id) getSimilarPerfumes(data.brand_id, id).then(setSimilar).catch(() => {});
      })
      .catch((err) => setError(err.message || 'Failed to load perfume'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      alert('Failed to delete review: ' + err.message);
    }
  };

  const handleUpdateReview = (updated) => {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="skeleton detail-loading__image" />
        <div className="detail-loading__lines">
          <div className="skeleton" style={{ height: 11, width: '30%' }} />
          <div className="skeleton" style={{ height: 28, width: '70%', marginTop: 11 }} />
          <div className="skeleton" style={{ height: 12, width: '100%', marginTop: 17 }} />
        </div>
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="entry__error">
        <div className="entry__error-title">Couldn't reach the database</div>
        <p>{error || 'Fragrance not found.'}</p>
        <Link to="/explore" className="btn btn-primary">Back to Index</Link>
      </div>
    );
  }

  const brandName = perfume.brands?.name || 'Unknown';
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const longevityValues = reviews.map((r) => r.longevity).filter((v) => v != null);
  const sillageValues = reviews.map((r) => r.sillage).filter((v) => v != null);
  const avgLongevity = longevityValues.length
    ? Math.round(longevityValues.reduce((a, b) => a + b, 0) / longevityValues.length)
    : null;
  const avgSillage = sillageValues.length
    ? Math.round(sillageValues.reduce((a, b) => a + b, 0) / sillageValues.length)
    : null;

  return (
    <div className="entry">
      <div className="entry__layout">
        <aside className="entry__side">
          <div className="bottle entry__image">
            {perfume.image_url ? <img src={perfume.image_url} alt={perfume.name} /> : <span>◆</span>}
          </div>
          <UserPerfumeActions perfumeId={perfume.id} />
          <AddToListButton perfumeId={perfume.id} />
          <div className="entry__fade" />
          <div className="entry__facts">
            {perfume.release_year && <div><span>Released</span><span>{perfume.release_year}</span></div>}
            {perfume.concentration && <div><span>Concentration</span><span>{perfume.concentration}</span></div>}
            {perfume.ean && <div><span>EAN</span><span className="entry__facts-mono">{perfume.ean}</span></div>}
          </div>
        </aside>

        <div className="entry__main">
          <div className="entry__house">{brandName}</div>
          <h1 className="entry__name">{perfume.name}</h1>
          <div className="entry__meta">
            {avgRating && <span className="entry__score">{avgRating}</span>}
            <span>{reviews.length} verdict{reviews.length !== 1 ? 's' : ''}</span>
          </div>
          {perfume.desc && <p className="entry__desc">{perfume.desc}</p>}

          <div className="entry__perf-grid">
            <div>
              <div className="pyramid__label-row">Accords</div>
              {/* Accords data isn't in the current schema — omitted; Performance below covers the numeric metrics that do exist. */}
            </div>
            <div>
              <div className="pyramid__label-row">Performance · community median</div>
              {avgLongevity != null && <PerformanceBar label="Longevity" value={avgLongevity} maxValue={100} suffix="%" />}
              {avgSillage != null && <PerformanceBar label="Sillage" value={avgSillage} maxValue={100} suffix="%" />}
              {avgLongevity == null && avgSillage == null && (
                <p className="entry__no-performance">No verdicts yet — performance data appears once someone rates this one.</p>
              )}
            </div>
          </div>

          <FragrancePyramid notes={perfume.perfume_notes} />

          <div className="entry__verdicts-head">
            <h2>{reviews.length} verdicts</h2>
          </div>

          {isAuthenticated ? (
            <ReviewForm perfumeId={perfume.id} onReviewAdded={(r) => setReviews((prev) => [r, ...prev])} />
          ) : (
            <div className="entry__login-prompt">
              <Link to="/login" className="btn btn-secondary">Sign in to write a verdict</Link>
            </div>
          )}

          <div className="entry__verdicts-list">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} currentUserId={user?.id} onDelete={handleDeleteReview} onUpdate={handleUpdateReview} />
            ))}
            {reviews.length === 0 && (
              <div className="entry__empty-verdicts">
                <div>No verdicts on this one yet</div>
                <p>Be the first to say something.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="entry__similar">
          <h2>More from {brandName}</h2>
          <div className="perfume-grid">
            {similar.map((p) => <PerfumeCard key={p.id} perfume={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 12: Rewrite `PerfumeDetailPage.css`**

```css
.entry { max-width: var(--max-width); margin: 0 auto; }

.entry__layout { display: grid; grid-template-columns: 344px 1fr; }

.entry__side {
  border-right: 1px solid var(--hairline);
  padding: var(--space-10);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  align-self: flex-start;
  position: sticky;
  top: var(--nav-height);
}
.entry__image { border-radius: var(--radius-lg); }
.entry__image img { padding: var(--space-10); }

.entry__fade { height: 1px; background: linear-gradient(90deg, transparent, var(--hairline) 20%, var(--hairline) 80%, transparent); }

.entry__facts { display: flex; flex-direction: column; gap: var(--space-3); }
.entry__facts div { display: flex; justify-content: space-between; font: var(--weight-body) 12.5px var(--font); }
.entry__facts span:first-child { color: var(--text-dim); }
.entry__facts span:last-child { color: var(--text-body); }
.entry__facts-mono { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; color: var(--text-dim) !important; }

.entry__main { padding: var(--space-10) var(--space-14) var(--space-14); }
.entry__house { font: var(--weight-body) 12px var(--font); letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
.entry__name { font: var(--weight-heading) 44px/1.08 var(--font); letter-spacing: -0.025em; color: var(--text); margin: var(--space-4) 0 var(--space-6); }
.entry__meta { display: flex; align-items: center; gap: var(--space-6); margin-bottom: var(--space-8); font: var(--weight-body) 13px var(--font); color: var(--text-dim); }
.entry__score { font: var(--weight-heading) 22px var(--font); color: var(--accent-text); font-variant-numeric: tabular-nums; }
.entry__desc { font: var(--weight-body) 16px/1.7 var(--font); color: var(--text-body); max-width: 62ch; margin-bottom: var(--space-8); }

.entry__perf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-10); margin-bottom: var(--space-8); }
.entry__perf-grid .perf-bar { margin-bottom: var(--space-4); }
.entry__no-performance { font: var(--weight-body) 13px var(--font); color: var(--text-dim); }

.entry__verdicts-head { margin: var(--space-8) 0 var(--space-6); }
.entry__verdicts-head h2 { font: var(--weight-heading) 20px var(--font); color: var(--text); }

.entry__verdicts-list { display: flex; flex-direction: column; gap: var(--space-6); }
.entry__login-prompt { margin-bottom: var(--space-8); }
.entry__empty-verdicts { color: var(--text-dim); }
.entry__empty-verdicts div { font: var(--weight-heading) 17px var(--font); color: var(--text); }

.entry__similar { max-width: var(--max-width); margin: 0 auto; padding: 0 var(--space-14) var(--space-14); }
.entry__similar h2 { font: var(--weight-heading) 20px var(--font); color: var(--text); margin-bottom: var(--space-6); }

.entry__error { max-width: 480px; margin: var(--space-14) auto; text-align: center; }
.entry__error-title { font: var(--weight-heading) 20px var(--font); color: var(--accent-text); margin-bottom: var(--space-3); }

.detail-loading { max-width: var(--max-width); margin: 0 auto; padding: var(--space-10) var(--space-14); display: grid; grid-template-columns: 344px 1fr; gap: var(--space-10); }
.detail-loading__image { aspect-ratio: 3/4; border-radius: var(--radius-lg); }

@media (max-width: 900px) {
  .entry__layout { grid-template-columns: 1fr; }
  .entry__side { position: static; border-right: none; border-bottom: 1px solid var(--hairline); }
  .entry__name { font-size: 30px; }
  .entry__perf-grid { grid-template-columns: 1fr; }
  .detail-loading { grid-template-columns: 1fr; }
}
```

- [ ] **Step 13: Visual check against `2a` (desktop) and `3b` (mobile) in `Scentboxd Redesign.dc.html`**

```bash
npm run dev
```
Open any `/perfume/:id`. Confirm: left column sticks on scroll (desktop), composer appears above the verdict list (not below), score uses `--accent-text` (no gold anywhere), performance bars are 2px lines.

- [ ] **Step 14: Lint + build**

```bash
npm run lint
npm run build
```

- [ ] **Step 15: Commit**

```bash
git add client/src/components/perfume/FragrancePyramid.* client/src/components/perfume/PerformanceBar.* client/src/components/perfume/UserPerfumeActions.* client/src/components/review/ client/src/pages/PerfumeDetailPage.*
git commit -m "feat: rebuild Perfume Detail as the Entry screen"
```

---

## Task 7: Houses (Brands), Shelf (Profile + Lists), and Auth

**Files:**
- Modify: `client/src/services/brandService.js:6-14` (`getBrands`, add relational perfume count)
- Modify: `client/src/pages/BrandsOverviewPage.jsx` (full rewrite)
- Modify: `client/src/pages/BrandsOverviewPage.css` (full rewrite)
- Modify: `client/src/pages/ProfilePage.jsx` (full rewrite)
- Modify: `client/src/pages/ProfilePage.css` (full rewrite)
- Modify: `client/src/pages/ListDetailPage.jsx` (full rewrite)
- Modify: `client/src/pages/ListDetailPage.css` (full rewrite)
- Modify: `client/src/pages/LoginPage.jsx` / `client/src/pages/RegisterPage.jsx` (both become thin wrappers around one shared component)
- Create: `client/src/pages/AuthPage.jsx`
- Modify: `client/src/pages/AuthPage.css` (full rewrite)

- [ ] **Step 1: Add a relational perfume count to `getBrands`**

In `client/src/services/brandService.js:6-14`, change the select from `'*'` to `'*, perfumes(count)'`, then flatten the result before returning:

```js
export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*, perfumes(count)')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map((b) => ({ ...b, perfume_count: b.perfumes?.[0]?.count ?? 0 }));
}
```

- [ ] **Step 2: Rewrite `BrandsOverviewPage.jsx`** as "Houses"

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBrands } from '../services/brandService';
import { toast } from '../store/toastStore';
import './BrandsOverviewPage.css';

export default function BrandsOverviewPage() {
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBrands()
      .then(setBrands)
      .catch((err) => toast.error('Failed to load brands: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  const letters = [...new Set(filtered.map((b) => b.name[0].toUpperCase()))].sort();

  if (loading) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;

  return (
    <div className="houses">
      <h1 className="houses__title">Houses</h1>
      <div className="houses__meta">{brands.length} houses · {brands.reduce((s, b) => s + b.perfume_count, 0)} entries</div>

      <input className="input houses__search" placeholder="Search houses…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="houses__letters">
        {letters.map((l) => <a key={l} href={`#letter-${l}`}>{l}</a>)}
      </div>

      {letters.map((letter) => (
        <div key={letter} id={`letter-${letter}`}>
          {filtered.filter((b) => b.name[0].toUpperCase() === letter).map((brand) => (
            <Link key={brand.id} to={`/brand/${brand.id}`} className="houses__row">
              <span className="houses__row-name">{brand.name}</span>
              <span className="houses__row-country">{brand.country}</span>
              <span className="houses__row-count">{brand.perfume_count} entries</span>
            </Link>
          ))}
        </div>
      ))}

      {filtered.length === 0 && <div className="empty-state"><h3>No houses found</h3></div>}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `BrandsOverviewPage.css`**

```css
.houses { max-width: var(--max-width); margin: 0 auto; padding: var(--space-10) var(--space-14) var(--space-14); }
.houses__title { font: var(--weight-heading) 30px var(--font); color: var(--text); letter-spacing: -0.02em; }
.houses__meta { font: var(--weight-body) 13px var(--font); color: var(--text-dim); margin: var(--space-2) 0 var(--space-8); }
.houses__search { max-width: 340px; margin-bottom: var(--space-8); }

.houses__letters { display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: var(--space-8); }
.houses__letters a { min-width: 24px; text-align: center; padding: 4px 6px; border-radius: var(--radius-sm); font: var(--weight-body) 12.5px ui-monospace, Menlo, monospace; color: var(--text-muted); text-decoration: none; }
.houses__letters a:hover { color: var(--accent-text); }

.houses__row {
  display: grid;
  grid-template-columns: 1fr 140px 88px;
  gap: var(--space-6);
  align-items: center;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--hairline);
  text-decoration: none;
}
.houses__row-name { font: var(--weight-label) 16px var(--font); color: var(--text); }
.houses__row-country { font: var(--weight-body) 13px var(--font); color: var(--text-dim); }
.houses__row-count { text-align: right; font: var(--weight-body) 13px var(--font); color: var(--text-body); font-variant-numeric: tabular-nums; }

@media (max-width: 900px) {
  .houses__row { grid-template-columns: 1fr 88px; }
  .houses__row-country { display: none; }
}
```

- [ ] **Step 4: Rewrite `ProfilePage.jsx`** as "Shelf" (2c layout — header + tabs/grid left, lists column right)

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProfileByUsername } from '../services/profileService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getUserLists, deleteList } from '../services/listService';
import { toast } from '../store/toastStore';
import PerfumeCard from '../components/perfume/PerfumeCard';
import EditProfileModal from '../components/profile/EditProfileModal';
import ListFormModal from '../components/list/ListFormModal';
import { useAuth } from '../hooks/useAuth';
import './ProfilePage.css';

const TABS = [
  { key: 'owned', field: 'is_owned', label: 'Owned' },
  { key: 'want_to_try', field: 'is_want_to_try', label: 'Want to try' },
  { key: 'favorites', field: 'is_favorite', label: 'Favorites' },
];

export default function ProfilePage() {
  const { username } = useParams();
  const { user, setProfile: setAuthProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ owned: 0, want_to_try: 0, favorites: 0 });
  const [activeTab, setActiveTab] = useState('owned');
  const [perfumes, setPerfumes] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        const [owned, want, fav, listData] = await Promise.all([
          getUserPerfumesByStatus(p.id, 'is_owned'),
          getUserPerfumesByStatus(p.id, 'is_want_to_try'),
          getUserPerfumesByStatus(p.id, 'is_favorite'),
          getUserLists(p.id),
        ]);
        setCounts({ owned: owned.length, want_to_try: want.length, favorites: fav.length });
        setPerfumes(owned.map((d) => d.perfumes).filter(Boolean));
        setLists(listData || []);
      })
      .catch((err) => toast.error('Failed to load profile: ' + err.message))
      .finally(() => setLoading(false));
  }, [username]);

  const loadTab = async (tab) => {
    setActiveTab(tab.key);
    const data = await getUserPerfumesByStatus(profile.id, tab.field);
    setPerfumes(data.map((d) => d.perfumes).filter(Boolean));
  };

  if (loading) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;
  if (!profile) return <div className="empty-state"><h3>User not found</h3></div>;

  const isOwn = user?.id === profile.id;

  const handleListCreated = (newList) => {
    setLists((prev) => [newList, ...prev]);
    setShowCreateListModal(false);
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    await deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const handleProfileSave = (updated) => {
    setProfile(updated);
    setAuthProfile(updated);
    setShowEditModal(false);
    if (updated.username !== username) navigate(`/profile/${updated.username}`, { replace: true });
  };

  return (
    <>
      <div className="shelf">
        <div className="shelf__head">
          <div className="shelf__avatar">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile.username || 'U')[0].toUpperCase()}
          </div>
          <div className="shelf__head-info">
            <h1>{profile.username}</h1>
            {profile.bio && <p>{profile.bio}</p>}
          </div>
          <div className="shelf__head-stats">
            <div><span>{counts.owned}</span><label>Owned</label></div>
            <div><span>{counts.want_to_try}</span><label>Wishlist</label></div>
          </div>
          {isOwn && <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Edit profile</button>}
        </div>

        <div className="shelf__body">
          <div className="shelf__main">
            <div className="shelf__tabs">
              {TABS.map((tab) => (
                <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => loadTab(tab)}>
                  {tab.label} {counts[tab.key]}
                </button>
              ))}
            </div>
            {perfumes.length > 0 ? (
              <div className="shelf__grid">
                {perfumes.map((p) => <PerfumeCard key={p.id} perfume={p} />)}
              </div>
            ) : (
              <div className="shelf__empty">
                <div className="shelf__empty-outlines">
                  <span /><span /><span />
                </div>
                <div>
                  <div>Nothing here yet</div>
                  {isOwn && <p>Add the bottle you wore today.</p>}
                </div>
              </div>
            )}
          </div>

          <aside className="shelf__lists">
            <div className="shelf__lists-head">
              <span>Lists</span>
              {isOwn && <button onClick={() => setShowCreateListModal(true)}>+ New</button>}
            </div>
            {lists.length > 0 ? lists.map((list) => (
              <div key={list.id} className="shelf__list-row">
                <Link to={`/list/${list.id}`}>
                  <div>{list.name}</div>
                  <div>{list.list_items?.[0]?.count ?? 0} fragrances · {list.is_public ? 'Public' : 'Private'}</div>
                </Link>
                {isOwn && <button onClick={() => handleDeleteList(list.id)}>Delete</button>}
              </div>
            )) : <p className="shelf__empty-lists">No lists yet.</p>}
          </aside>
        </div>
      </div>

      {showEditModal && <EditProfileModal profile={profile} onSave={handleProfileSave} onClose={() => setShowEditModal(false)} />}
      {showCreateListModal && <ListFormModal onSave={handleListCreated} onClose={() => setShowCreateListModal(false)} />}
    </>
  );
}
```

- [ ] **Step 5: Rewrite `ProfilePage.css`**

```css
.shelf { max-width: var(--max-width); margin: 0 auto; }

.shelf__head { display: flex; align-items: center; gap: var(--space-10); padding: var(--space-10) var(--space-14); border-bottom: 1px solid var(--hairline); }
.shelf__avatar {
  width: 72px; height: 72px; border-radius: 50%; flex: none;
  background: var(--accent-tint); border: 1px solid var(--accent-line); color: var(--accent-text);
  display: flex; align-items: center; justify-content: center; font: var(--weight-heading) 26px var(--font); overflow: hidden;
}
.shelf__avatar img { width: 100%; height: 100%; object-fit: cover; }
.shelf__head-info h1 { font: var(--weight-heading) 26px var(--font); color: var(--text); }
.shelf__head-info p { font: var(--weight-body) 14px var(--font); color: var(--text-muted); margin-top: var(--space-2); }
.shelf__head-stats { margin-left: auto; display: flex; gap: var(--space-10); text-align: right; }
.shelf__head-stats span { display: block; font: var(--weight-heading) 22px var(--font); color: var(--text); font-variant-numeric: tabular-nums; }
.shelf__head-stats label { font: var(--weight-body) 11.5px var(--font); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }

.shelf__body { display: grid; grid-template-columns: 1fr 300px; }
.shelf__main { padding: var(--space-10) var(--space-14) var(--space-14); border-right: 1px solid var(--hairline); }

.shelf__tabs { display: inline-flex; gap: 2px; padding: 2px; border: 1px solid var(--hairline); border-radius: var(--radius-md); margin-bottom: var(--space-8); }
.shelf__tabs button { padding: var(--space-2) var(--space-6); border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); font: var(--weight-body) 13px var(--font); cursor: pointer; }
.shelf__tabs button.active { background: var(--accent-tint); color: var(--accent-text); font-weight: var(--weight-label); }

.shelf__grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-6); }

.shelf__empty { display: flex; align-items: center; gap: var(--space-8); color: var(--text-muted); }
.shelf__empty-outlines { display: flex; gap: var(--space-3); }
.shelf__empty-outlines span { width: 44px; aspect-ratio: 3/4; border-radius: var(--radius-sm); border: 1px dashed var(--hairline-strong); }
.shelf__empty div div { font: var(--weight-heading) 18px var(--font); color: var(--text); }

.shelf__lists { padding: var(--space-10); }
.shelf__lists-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: var(--space-6); font: var(--weight-label) 11.5px var(--font); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); }
.shelf__lists-head button { border: none; background: none; color: var(--accent-text); font: var(--weight-body) 12.5px var(--font); }
.shelf__list-row { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) 0; border-top: 1px solid var(--hairline); }
.shelf__list-row a { text-decoration: none; }
.shelf__list-row a > div:first-child { font: var(--weight-label) 14px var(--font); color: var(--text); }
.shelf__list-row a > div:last-child { font: var(--weight-body) 12px var(--font); color: var(--text-dim); margin-top: var(--space-1); }
.shelf__list-row button { border: none; background: none; color: var(--text-dim); font-size: 12px; }
.shelf__empty-lists { color: var(--text-dim); font-size: 13px; }

@media (max-width: 900px) {
  .shelf__head { flex-wrap: wrap; padding: var(--space-6); }
  .shelf__body { grid-template-columns: 1fr; }
  .shelf__main { border-right: none; padding: var(--space-6); }
  .shelf__grid { grid-template-columns: repeat(2, 1fr); }
  .shelf__lists { border-top: 1px solid var(--hairline); padding: var(--space-6); }
}
```

- [ ] **Step 6: Rewrite `ListDetailPage.jsx`** (per Scope Decision #5 — no drag handle, no notes column)

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getListById, deleteList, removeFromList } from '../services/listService';
import { getProfileById } from '../services/profileService';
import { toast } from '../store/toastStore';
import ListFormModal from '../components/list/ListFormModal';
import { useAuth } from '../hooks/useAuth';
import './ListDetailPage.css';

export default function ListDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    getListById(id)
      .then((data) => {
        setList(data);
        if (data?.user_id) getProfileById(data.user_id).then(setAuthorProfile).catch(() => {});
      })
      .catch((err) => toast.error('Failed to load list details: ' + err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;
  if (!list) return <div className="empty-state"><h3>List not found</h3></div>;

  const isOwner = user?.id === list.user_id;
  const items = list.list_items || [];

  const handleDelete = async () => {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    await deleteList(list.id);
    navigate(`/profile/${authorProfile?.username}`, { replace: true });
  };

  const handleRemovePerfume = async (perfumeId) => {
    await removeFromList(list.id, perfumeId);
    setList((prev) => ({ ...prev, list_items: prev.list_items.filter((item) => item.perfumes?.id !== perfumeId) }));
  };

  return (
    <>
      <div className="list-detail">
        <div className="list-detail__crumb">Shelf › Lists</div>
        <header className="list-detail__header">
          <div>
            <h1>{list.name}</h1>
            {list.description && <p>{list.description}</p>}
            <div className="list-detail__meta">
              {authorProfile?.username && <Link to={`/profile/${authorProfile.username}`}>by {authorProfile.username}</Link>}
              <span>{items.length} fragrances</span>
              <span>{list.is_public ? 'Public' : 'Private'}</span>
            </div>
          </div>
          {isOwner && (
            <div className="list-detail__actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Edit</button>
              <button className="btn btn-ghost" onClick={handleDelete}>Delete</button>
            </div>
          )}
        </header>

        {items.length > 0 ? (
          <div className="list-detail__rows">
            {items.map((item, i) => {
              const perfume = item.perfumes;
              if (!perfume) return null;
              return (
                <div key={item.id} className="list-detail__row">
                  <span className="list-detail__rank">{i + 1}</span>
                  <div className="bottle list-detail__img">
                    {perfume.image_url ? <img src={perfume.image_url} alt="" /> : <span>◆</span>}
                  </div>
                  <div className="list-detail__info">
                    <Link to={`/perfume/${perfume.id}`}>{perfume.name}</Link>
                    <span>{perfume.brands?.name} · {perfume.concentration}</span>
                  </div>
                  <span className="list-detail__score">
                    {perfume.performance != null ? Number(perfume.performance).toFixed(1) : '—'}
                  </span>
                  {isOwner && (
                    <button className="list-detail__remove" onClick={() => handleRemovePerfume(perfume.id)} title="Remove">✕</button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>This list is empty</h3>
            {isOwner && <p>Browse fragrances and add them to this list.</p>}
          </div>
        )}
      </div>

      {showEditModal && <ListFormModal initialData={list} onSave={(u) => { setList((p) => ({ ...p, ...u })); setShowEditModal(false); }} onClose={() => setShowEditModal(false)} />}
    </>
  );
}
```

- [ ] **Step 7: Rewrite `ListDetailPage.css`**

```css
.list-detail { max-width: var(--max-width); margin: 0 auto; padding: var(--space-10) var(--space-14) var(--space-14); }
.list-detail__crumb { font: var(--weight-body) 13px var(--font); color: var(--text-dim); margin-bottom: var(--space-6); }

.list-detail__header { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-8); padding-bottom: var(--space-8); border-bottom: 1px solid var(--hairline); }
.list-detail__header h1 { font: var(--weight-heading) 36px var(--font); letter-spacing: -0.025em; color: var(--text); }
.list-detail__header p { font: var(--weight-body) 15px/1.6 var(--font); color: var(--text-muted); margin-top: var(--space-4); max-width: 64ch; }
.list-detail__meta { display: flex; gap: var(--space-6); margin-top: var(--space-4); font: var(--weight-body) 13px var(--font); color: var(--text-dim); }
.list-detail__meta a { color: var(--accent-text); }
.list-detail__actions { display: flex; gap: var(--space-3); flex: none; }

.list-detail__rows { margin-top: var(--space-4); }
.list-detail__row { display: grid; grid-template-columns: 44px 1fr 88px 28px; gap: var(--space-6); align-items: center; padding: var(--space-6) 0; border-bottom: 1px solid var(--hairline); }
.list-detail__rank { font: var(--weight-body) 15px ui-monospace, Menlo, monospace; color: var(--accent-bright); }
.list-detail__info a { display: block; font: var(--weight-heading) 16px var(--font); color: var(--text); }
.list-detail__info span { font: var(--weight-body) 12.5px var(--font); color: var(--text-dim); }
.list-detail__score { text-align: right; font: var(--weight-heading) 16px var(--font); color: var(--accent-text); font-variant-numeric: tabular-nums; }
.list-detail__remove { border: none; background: none; color: var(--text-muted); cursor: pointer; }

@media (max-width: 900px) {
  .list-detail__header { flex-direction: column; align-items: flex-start; }
  .list-detail__row { grid-template-columns: 40px 1fr 60px 24px; }
}
```

- [ ] **Step 8: Create `AuthPage.jsx`** (shared segment component for both `/login` and `/register`)

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

export default function AuthPage({ initialMode = 'signin' }) {
  const { login, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const switchMode = (next) => {
    clearError();
    setMode(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (mode === 'signin') {
      if (await login(email, password)) navigate('/');
    } else if (await register(email, password, username)) {
      switchMode('signin');
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <h1 className="auth__headline">Keep a shelf, not a browser tab full of names.</h1>
        <p className="auth__sub">Free. Rate what you wear, follow the notes you like, and never blind-buy the same mistake twice.</p>

        <div className="auth__segment">
          <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => switchMode('signin')}>Sign in</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Create account</button>
        </div>

        {error && <p className="auth__error">{error}</p>}

        <form className="auth__form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth__field">
              <label>Username</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="scentlover42" pattern="^[a-zA-Z0-9_]{3,20}$" required />
            </div>
          )}
          <div className="auth__field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="auth__field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={mode === 'register' ? 6 : undefined} required />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account')}
          </button>
          {mode === 'signin' && (
            <div className="auth__links">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          )}
        </form>

        <div className="auth__footnote">By continuing you agree to the terms. We only email you about your own account.</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Reduce `LoginPage.jsx` and `RegisterPage.jsx` to thin wrappers**

```jsx
// client/src/pages/LoginPage.jsx
import AuthPage from './AuthPage';
export default function LoginPage() { return <AuthPage initialMode="signin" />; }
```

```jsx
// client/src/pages/RegisterPage.jsx
import AuthPage from './AuthPage';
export default function RegisterPage() { return <AuthPage initialMode="register" />; }
```

- [ ] **Step 10: Rewrite `AuthPage.css`** (replaces the old `AuthPage.css` content wholesale — same filename, new rules)

```css
.auth { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - var(--nav-height)); padding: var(--space-10); }

.auth__card { max-width: 420px; width: 100%; }
.auth__headline { font: var(--weight-heading) 30px/1.15 var(--font); letter-spacing: -0.02em; color: var(--text); margin-bottom: var(--space-4); }
.auth__sub { font: var(--weight-body) 14.5px/1.6 var(--font); color: var(--text-muted); margin-bottom: var(--space-8); }

.auth__segment { display: flex; gap: 2px; padding: 2px; border: 1px solid var(--hairline); border-radius: var(--radius-md); margin-bottom: var(--space-8); }
.auth__segment button { flex: 1; min-height: 40px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); font: var(--weight-body) 13.5px var(--font); cursor: pointer; }
.auth__segment button.active { background: var(--accent-tint); color: var(--accent-text); font-weight: var(--weight-label); }

.auth__error { color: var(--accent-text); font-size: 13px; margin-bottom: var(--space-4); }

.auth__form { display: flex; flex-direction: column; gap: var(--space-6); }
.auth__field label { display: block; font: var(--weight-body) 11.5px var(--font); letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); margin-bottom: var(--space-2); }

.auth__links { display: flex; justify-content: space-between; font: var(--weight-body) 13px var(--font); color: var(--text-dim); }
.auth__links a { color: var(--text-dim); }

.auth__footnote { margin-top: var(--space-8); padding-top: var(--space-8); border-top: 1px solid var(--hairline); font: var(--weight-body) 12px/1.6 var(--font); color: var(--text-dim); }
```

- [ ] **Step 11: Grep for lingering usages of `.auth-page`/`.auth-card` (the old class names, in case `ForgotPasswordPage.jsx`/`ResetPasswordPage.jsx` reuse them)**

```bash
cd client && grep -rln "auth-page\|auth-card" src/pages/ForgotPasswordPage.jsx src/pages/ResetPasswordPage.jsx
```
If either file uses the old classes, restyle just their wrapper `<div>` className to `auth` / `auth__card` so they inherit the new look (they're one-off flows, no structural rewrite needed — CLAUDE.md's routes table doesn't list them as redesign targets and the handoff doesn't cover them, but leaving them on deleted classes would visually break them).

- [ ] **Step 12: Visual check against `2c`+`3d` (Shelf), `4d` (List Detail), `2d` (Houses), `4c` (Auth) in `Scentboxd Redesign.dc.html`**

```bash
npm run dev
```
Walk through: `/brands`, a `/profile/:username` you own (edit profile, switch tabs, create a list), a `/list/:id` you own (remove an item), `/login` and `/register` (confirm the segment toggle switches forms without a page reload and preserves the `AuthPage` URL you started on).

- [ ] **Step 13: Lint + build**

```bash
npm run lint
npm run build
```

- [ ] **Step 14: Commit**

```bash
git add client/src/services/brandService.js client/src/pages/BrandsOverviewPage.* client/src/pages/ProfilePage.* client/src/pages/ListDetailPage.* client/src/pages/LoginPage.jsx client/src/pages/RegisterPage.jsx client/src/pages/AuthPage.*
git commit -m "feat: rebuild Houses, Shelf, List Detail, and Auth on Sillage tokens"
```

---

## Task 8: Loading / empty / error states pass

**Files:**
- Create: `client/src/components/layout/SkeletonRow.jsx`
- Create: `client/src/components/layout/SkeletonRow.css`
- Modify: `client/src/components/perfume/PerfumeGrid.jsx` (grid skeleton already token-styled from Task 4 — confirm, no further change expected)
- Modify: `client/src/pages/PerfumeDetailPage.jsx` (already has an inline skeleton from Task 6 — no change)
- Modify: `client/src/pages/ProfilePage.jsx` / `client/src/pages/ExplorePage.jsx` (replace remaining `spinner-container`/`spinner` usages with skeletons where they gate primary content)

- [ ] **Step 1: Create `SkeletonRow.jsx`** (same row height as `PerfumeRow`/`list-detail__row`, so nothing jumps when real content lands)

```jsx
import './SkeletonRow.css';

export default function SkeletonRow({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton skeleton-row__thumb" />
          <div className="skeleton-row__lines">
            <div className="skeleton" style={{ height: 14, width: '60%' }} />
            <div className="skeleton" style={{ height: 11, width: '38%', marginTop: 8 }} />
          </div>
          <div className="skeleton" style={{ height: 14, width: 40 }} />
        </div>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Create `SkeletonRow.css`**

```css
.skeleton-row {
  display: grid;
  grid-template-columns: 52px 1fr 88px;
  gap: var(--space-6);
  align-items: center;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--hairline);
}
.skeleton-row__thumb { aspect-ratio: 3/4; border-radius: var(--radius-sm); }
.skeleton-row__lines { display: flex; flex-direction: column; }
```

- [ ] **Step 3: Swap `ExplorePage.jsx`'s row-loading branch to use `SkeletonRow`**

In the `explore__rows` block written in Task 4 Step 11, replace `Array.from({ length: 8 }).map((_, i) => <div key={i} className="explore__row-skeleton skeleton" />)` with `<SkeletonRow count={8} />` (add the import `import SkeletonRow from '../components/layout/SkeletonRow';`), and delete the now-unused `.explore__row-skeleton` rule from `ExplorePage.css`.

- [ ] **Step 4: Swap `ProfilePage.jsx`'s top-level `spinner-container` for an inline skeleton head + grid**

Read the current `ProfilePage.jsx` (rewritten in Task 7) and replace the `if (loading) return <div className="spinner-container">…</div>;` line with a skeleton that mirrors `.shelf__head` + `.shelf__grid` structure:

```jsx
if (loading) {
  return (
    <div className="shelf">
      <div className="shelf__head">
        <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
        <div className="shelf__head-info">
          <div className="skeleton" style={{ height: 22, width: 140 }} />
        </div>
      </div>
      <div className="shelf__main" style={{ borderRight: 'none' }}>
        <div className="shelf__grid">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md)' }} />)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Confirm the inline error card pattern is used consistently**

Grep for any remaining bare `alert(...)` or unstyled error text that should instead be an inline card per the 4e spec ("Fehler bleibt im Inhalt… nicht als Toast"):

```bash
cd client && grep -rn "alert(" src/pages src/components
```
`PerfumeDetailPage.jsx`'s `handleDeleteReview` still uses `alert(...)` for delete failures — leave it (it's a destructive-action failure, not a content-load failure, and `window.confirm`/`alert` for destructive confirmations is out of scope for this visual redesign). Anything that gates *page content* on load failure (the `error || !perfume` branch in `PerfumeDetailPage.jsx`, already rewritten in Task 6 Step 11 as `.entry__error`) already matches the inline-card pattern — no further change needed here.

- [ ] **Step 6: Visual check against `4e` in `Scentboxd Redesign.dc.html`**

```bash
npm run dev
```
Throttle network (DevTools → Network → Slow 3G) and reload `/explore` and a `/profile/:username` to see the skeletons; visit a nonexistent `/perfume/does-not-exist` to see the inline error card.

- [ ] **Step 7: Lint + build**

```bash
npm run lint
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add client/src/components/layout/SkeletonRow.* client/src/pages/ExplorePage.jsx client/src/pages/ExplorePage.css client/src/pages/ProfilePage.jsx
git commit -m "feat: row skeletons and inline loading states for Index and Shelf"
```

---

## Final Self-Review Checklist (run once all tasks are done)

- [ ] `npm run lint && npm run build` clean from a fresh `client/` checkout.
- [ ] Every route in `CLAUDE.md`'s routing table renders without console errors: `/`, `/explore`, `/perfume/:id`, `/brands`, `/brand/:id`, `/login`, `/register`, `/profile/:username`, `/list/:id`.
- [ ] `grep -rn "gold\|--grad-accent\|--shadow-glow\|tilt-3d\|float-deco\|gradient-text\|useTilt\|useCountUp" client/src` returns nothing.
- [ ] Resize to 900px and 640px breakpoints on every rebuilt page — nav collapses to tab bar, Explore sidebar collapses to sheet, Shelf grid drops to 2 columns.
- [ ] `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate CSS media) disables all transitions/animations including skeleton shimmer and the filter sheet's slide-in.
