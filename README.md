# Movie Search App

React + Vite application to search The Movie Database (TMDB) with browser-local email/password auth, per-account favorites, and per-account search history.

## Features

- Instant TMDB search with debounced input, abort control, and result caching
- Movie / Series / All filter with optional year filter
- Paginated results and detail modal
- Account sign up and sign in using local browser storage
- Favorites stored per signed-in account in the current browser
- Search history stored per signed-in account in the current browser
- Automatic migration of older anonymous favorites into the first local account that signs in on this browser

## Stack

- React 19
- Vite 7
- React Router 6
- TMDB REST API

## Environment Variables

Create `.env.local` with:

```bash
VITE_TMDB_API_KEY=YOUR_TMDB_KEY
```

Restart the dev server after changing environment variables.

## Running Locally

```bash
npm install
npm run dev
```

## Auth Model

Authentication is now fully local to the browser:

- Accounts are stored in `localStorage`
- Passwords are hashed client-side before storage
- Session state is stored in `localStorage`
- Clearing site data removes accounts, favorites, and search history for that browser profile

This is suitable for a local/demo setup, not for production-grade multi-device authentication.

## Build

```bash
npm run build
npm run preview
```

## Troubleshooting

- If search does not work, verify `VITE_TMDB_API_KEY` is set and restart the dev server.
- If sign-in fails, verify the email and password were created in this same browser profile.
- If account data disappears, check whether browser storage or site data was cleared.

---
Data provided by TMDB; this product uses the TMDB API but is not endorsed or certified by TMDB.

