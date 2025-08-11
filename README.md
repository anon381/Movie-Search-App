# Movie Search App

React + Vite application to search The Movie Database (TMDB) and manage favorites locally or synced to the cloud using Supabase (Auth + Postgres). Includes email/password auth with confirmation & password reset flow.

## Features

- Instant TMDB search with debounced input, abort & result caching
- Movie / Series / All type filter + optional year filter
- Paginated results (20 per page)
- Detailed modal (credits included)
- Favorites (grid on main page + dedicated `/favorites` route):
	- Anonymous: stored locally (localStorage)
	- Signed in: stored in Supabase `favorites` table (cloud sync)
	- Automatic one‑time migration of existing local favorites after first successful sign‑in
- Search history (per signed-in user, last 30 entries, deduplicated & rate limited) + inline type‑ahead suggestions while typing
- Email/password authentication with email confirmation, existing user detection, resend confirmation, and password reset request (Supabase)
- Light / Dark theme toggle (persisted)
- Responsive grid, skeleton loading states & accessible status messaging

## Stack

- React 19, Vite 7, React Router 6
- Supabase JS v2 (Auth + Postgres)
- TMDB REST API

## Environment Variables

Create a `.env.local` (never commit) using the template below (also see `.env.example`):

```
VITE_TMDB_API_KEY=YOUR_TMDB_KEY
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_your_KEY
```

Restart `npm run dev` after changes. Vite in this project loads `.env.local` explicitly; `.env` backup is optional.

## Supabase Setup

1. Create project → note Project URL (use as `VITE_SUPABASE_URL`).
2. Copy the anon public key (NOT the service_role) → `VITE_SUPABASE_ANON_KEY`.
3. Open the SQL editor and run the contents of `db/schema.sql` from this repo (creates `profiles`, `favorites`, `search_history`, extensions, RLS policies, trigger for profile auto‑insert, indexes). Adjust if any objects already exist.
4. Ensure Email auth is enabled (Authentication → Providers → Email) and (optionally) require email confirmation.
5. Add your site URL / localhost to Authentication → URL Configuration (redirects).
6. (Optional) Add rate limits or Edge Functions later for heavier workloads.

## Running Locally

Install deps & start dev server:

```bash
npm install
npm run dev
```

Open the shown local URL (usually `http://localhost:5173`).

## Auth Flow (Email & Password)

1. Sign Up: Enter email + password + confirm password. If confirmation is required, a confirmation email is sent and the form switches to Sign In mode automatically.
2. Confirm: Click the email link → you return with an active session (or simply sign in after confirming).
3. Existing email detection: If the email is already registered, the UI switches to Sign In with a message instead of re-sending confirmation.
4. Resend: While waiting for confirmation you can press the Resend button (rate limited by Supabase).
5. Sign In: Enter email + password → session stored (persisted). Favorites switch to cloud mode.
6. Password Reset: Enter your email in the reset box to receive a reset link (route handler page placeholder can be added at `/#/password-reset`).
7. Migration: On first sign‑in, existing local favorites (if any) are auto‑migrated to Supabase.

## Favorites Migration Logic

Implemented in `App.jsx`: When a user signs in and has zero remote favorites but some local favorites, each local favorite is upserted to Supabase. Remote list then drives the UI; local copy remains as fallback but is ignored once remote contains items.

## Building / Preview

```bash
npm run build
npm run preview
```

## Troubleshooting

- API key banner appears: Ensure `VITE_TMDB_API_KEY` is set and dev server restarted.
- Supabase favorites not syncing: Verify tables + policies via `db/schema.sql`, and confirm anon key/env vars.
- Confirmation email missing: Check Supabase Auth logs, spam folder, allowed redirect URLs; use Resend.
- Existing email loops: The UI should auto-switch to Sign In; if not, clear site data and retry.
- Search suggestions not showing: Requires at least one prior search while signed in (history is per-user) or local (anonymous) queries (limited set).

## Security Notes

- Never expose the service_role key in client code or `.env` committed to git.
- Rotate any key that was accidentally printed or shared.

## Future Enhancements (Ideas)

- OAuth providers (GitHub/Google) via Supabase
- Offline queue for favorites when network unavailable
- Advanced filtering (genres, people, ratings)
- Server-side rendering or static pre-render
- Profile editing (display name / avatar) referencing `profiles` table
- Dedicated password reset completion page

---
Data provided by TMDB; this product uses the TMDB API but is not endorsed or certified by TMDB.

