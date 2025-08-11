
# Movie Search App

This project was bootstrapped with [Vite](https://vitejs.dev/) and uses React.

## Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in development mode.

### `npm run build`
Builds the app for production.

### `npm run preview`
Previews the production build locally.

## Getting Started
1. Install dependencies:
	```
npm install
	```
2. Start the development server:
	```
npm run dev
	```

## Project Structure
- `src/` - Source code
- `public/` - Static assets

---

## OMDb API Setup
Create a `.env` file in the project root with:

```
VITE_OMDB_API_KEY=YOUR_KEY_HERE
```

Replace `YOUR_KEY_HERE` with your OMDb API key (get one free at http://www.omdbapi.com/apikey.aspx). Restart the dev server after adding.

## Features Implemented
- Debounced movie search (min 2 chars)
- Grid of results with posters
- Modal with detailed info (plot, cast, ratings)
- Graceful handling of missing posters & errors
- Responsive design & accessible semantics

## Next Ideas
- Add pagination (OMDb `page` param)
- Favorites (localStorage)
- TypeScript migration
- Tests for API layer


