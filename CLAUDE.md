# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands must be run from the `client/` directory:

```bash
cd client
npm install       # Install dependencies
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint (must be clean)
npm test          # Run the Vitest test suite once
npm run test:watch # Run Vitest in watch mode
```

Tests use Vitest + React Testing Library (`client/vite.config.js` `test` block, jsdom environment, setup file at `client/src/test/setup.js`). Service tests mock `../lib/supabaseClient` via the chainable builder mock in `client/src/test/supabaseMock.js` — see `perfumeService.test.js` for the pattern. Tests are colocated with the file they cover (`Foo.js` → `Foo.test.js`/`Foo.test.jsx`).

## Architecture

**Scentboxd** is a fragrance encyclopedia SPA. There is no custom backend — all data and auth are handled by Supabase (PostgreSQL + Supabase Auth). The frontend talks directly to Supabase from the browser.

### Data flow

```
Pages → Services → supabaseClient → Supabase (cloud)
```

- **`src/lib/supabaseClient.js`** — single Supabase client instance, reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`
- **`src/services/`** — one file per domain (`perfumeService`, `brandService`, `reviewService`, `userPerfumeService`, `listService`, `profileService`); each exports async functions that call the Supabase client directly
- **`src/pages/`** — full-page route components; they call services and manage local state
- **`src/components/`** — reusable UI split into `layout/`, `perfume/`, and `review/` subdirectories
- **`src/store/userPerfumeStore.js`** — favorite/collection state for all perfume cards
- **`src/lib/`** — pure functions (`today.js`, `catalog.js`, `performance.js`) besides `supabaseClient.js`
- **`src/store/authStore.js`** — Zustand store holding the authenticated user; all auth state flows through this
- **`src/hooks/useAuth.js`** — convenience hook wrapping the auth store

### Routing

React Router v7 in `App.jsx`. All routes share the `<Layout />` wrapper (Navbar + Footer). Routes:

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

### Database tables (inferred from services)

`perfumes`, `brands`, `notes`, `perfume_notes` (junction), `reviews`, `review_likes`, `profiles`, `user_perfumes`, `lists`

### Styling

Vanilla CSS with design tokens in `client/src/index.css`; the visual language (colors, type, motion, effects) is documented in `DESIGN.md` — treat that as the source of truth when touching UI.

## Environment

The `client/.env` file must exist with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The anon key is safe to expose publicly — Supabase Row Level Security controls data access.
