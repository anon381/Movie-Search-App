# Movie Search App

Vite + React app for searching movies (and series) using TMDB.

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview build

## Quick Start
1. Install deps
```
npm install
```
2. Create `.env.local` (or `.env`) with at least one provider key (see below)
3. Run
```
npm run dev
```
4. Open the shown local URL.

## Data Provider
Currently only TMDB is included (simplified from earlier multi-provider abstraction).

## Environment Variables
Add these to `.env.local` (preferred) or `.env`:
```
# TMDB (https://www.themoviedb.org/settings/api) – create a (free) account and request an API key
VITE_TMDB_API_KEY=YOUR_TMDB_KEY
# Optional custom image base (default https://image.tmdb.org/t/p)
VITE_TMDB_IMG_BASE=https://image.tmdb.org/t/p
```
Restart the dev server after changes.

## Features
- Debounced search (min 2 chars, abortable requests)
- TMDB search & details
- Pagination (auto page size per provider)
- Favorites (persisted in `localStorage`)
- Filters: year, type (movie / series / all)
- Caching of search pages within session
- Skeleton loading states with shimmer
- Accessible modal with details
- Responsive layout & dark/light theme toggle
- Graceful handling of missing API keys & empty states

## Roadmap / Ideas
- Infinite scroll option
- Advanced filtering (genre, rating)
- Add cast/crew expansion for TMDB (credits endpoint)
- Migrate to TypeScript fully
- Unit tests for provider adapters

## Project Structure (selected)
```
src/
  App.jsx
  services/
    providers/
      base.js
      tmdbProvider.js
      index.js
  components/
  hooks/
```

## Troubleshooting
- Search disabled? Ensure the active provider has a valid key and query length >= 2.
- Changed env vars? Stop and restart `npm run dev`.
- No images on TMDB? Confirm `VITE_TMDB_IMG_BASE` (default works) and that poster paths exist.

## License
Personal / educational use. Add your license of choice.


