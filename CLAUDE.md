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
npm run lint      # Run ESLint
```

There is no test suite configured.

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
- **`src/store/authStore.js`** — Zustand store holding the authenticated user; all auth state flows through this
- **`src/hooks/useAuth.js`** — convenience hook wrapping the auth store

### Routing

React Router v7 in `App.jsx`. All routes share the `<Layout />` wrapper (Navbar + Footer). Routes:

| Path | Page |
|------|------|
| `/` | HomePage |
| `/explore` | ExplorePage |
| `/perfume/:id` | PerfumeDetailPage |
| `/brands` | BrandsOverviewPage |
| `/brand/:id` | BrandPage |
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/profile/:username` | ProfilePage |
| `/list/:id` | ListDetailPage |

### Database tables (inferred from services)

`perfumes`, `brands`, `notes`, `perfume_notes` (junction), `reviews`, `review_likes`, `profiles`, `user_perfumes`, `lists`

### Styling

TailwindCSS v4 with a custom theme. Custom colors extend the default palette:
- **Primary:** `primary-{400..800}` — purple scale
- **Dark backgrounds:** `dark-{600..900}` — near-black purples

Tailwind classes and component-scoped CSS files coexist. The overall look is a dark-theme app.

## Environment

The `client/.env` file must exist with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The anon key is safe to expose publicly — Supabase Row Level Security controls data access.
