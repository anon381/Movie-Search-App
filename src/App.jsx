import { useState, useEffect, useCallback, useRef } from 'react'
// Debug env visibility
// eslint-disable-next-line no-console
console.log('VITE_TMDB_API_KEY (debug):', JSON.stringify(import.meta.env.VITE_TMDB_API_KEY), 'presentFlag:', __TMDB_KEY_PRESENT__)
import './App.css'
import SearchBar from './components/SearchBar'
import MovieGrid from './components/MovieGrid'
import MovieModal from './components/MovieModal'
import { getProvider } from './services/providers'
import useDebounce from './hooks/useDebounce'
import useFavorites from './hooks/useFavorites'

const DEFAULT_TYPE = 'movie' // or 'all'

function App() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [showFavorites, setShowFavorites] = useState(false)
  const [year, setYear] = useState('')
  const [type, setType] = useState(DEFAULT_TYPE)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme_pref') || 'dark')
  const abortRef = useRef(null)
  const cacheRef = useRef(new Map())
  const { favoritesArray, favoritesSet, toggleFavorite } = useFavorites()

  const provider = getProvider()
  const tmdbMissing = !import.meta.env.VITE_TMDB_API_KEY
  const apiKeyMissing = tmdbMissing
  const pageSize = 20

  const performSearch = useCallback(async () => {
    if (apiKeyMissing) { setLoading(false); return }
    if (!debouncedQuery || debouncedQuery.trim().length < 2) { setMovies([]); setError(null); setTotalResults(0); return }
    const key = `${debouncedQuery.trim().toLowerCase()}|${page}|${year}|${type}`
    if (cacheRef.current.has(key)) { const cached = cacheRef.current.get(key); setMovies(cached.movies); setTotalResults(cached.total); return }
    abortRef.current?.abort()
    const controller = new AbortController(); abortRef.current = controller
    setLoading(true); setError(null)
    try {
      const { list, total } = await provider.search({ query: debouncedQuery.trim(), page, year: year.trim(), type: type === 'all' ? 'all' : type, signal: controller.signal })
      setMovies(list); setTotalResults(total); cacheRef.current.set(key, { movies: list, total })
    } catch (e) { if (e.name === 'AbortError') return; setError(e.message || 'Search failed'); setMovies([]); setTotalResults(0) } finally { setLoading(false) }
  }, [debouncedQuery, page, year, type, provider, apiKeyMissing])

  useEffect(() => { setPage(1) }, [debouncedQuery])
  useEffect(() => { setPage(1) }, [year, type])
  useEffect(() => { performSearch() }, [performSearch])
  const totalPages = Math.ceil(totalResults / pageSize) || 0

  const skeletons = Array.from({ length: Math.min(pageSize, 10) })

  // Theme management
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.classList.add('theme-light')
    else root.classList.remove('theme-light')
    try { localStorage.setItem('theme_pref', theme) } catch {}
  }, [theme])

  const openDetails = async (id) => {
    setSelectedId(id)
    setModalLoading(true)
    setSelected(null)
    try {
      const data = await provider.details(id)
      setSelected(data)
    } catch (e) {
      setSelected({ error: e.message || 'Failed to load details' })
    } finally { setModalLoading(false) }
  }

  const closeModal = () => { setSelectedId(null); setSelected(null); setModalLoading(false) }

  const minQueryOk = debouncedQuery.trim().length >= 2
  const providerLabel = 'TMDB'

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Movie Search</h1>
        <p className="tagline">Find movies powered by {providerLabel}</p>
  {!apiKeyMissing && <div style={{fontSize:'.6rem',opacity:.4}}>API key loaded</div>}
        <div className="app-header-actions">
          <button className={`pill-btn ${showFavorites ? '' : 'active'}`} onClick={() => setShowFavorites(false)}>Results</button>
          <button className={`pill-btn ${showFavorites ? 'active' : ''}`} onClick={() => setShowFavorites(true)}>Favorites ({favoritesArray.length})</button>
          <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="\\d{4}"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value.slice(0,4))}
              style={{ width:'4.5rem', padding:'.4rem .5rem', background:'#1d1f22', border:'1px solid #2c3136', borderRadius:8, color:'inherit' }}
              aria-label="Filter by year"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ padding:'.45rem .6rem', background:'#1d1f22', border:'1px solid #2c3136', borderRadius:8, color:'inherit' }}
              aria-label="Filter by type"
            >
              <option value="movie">Movies</option>
              <option value="series">Series</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </header>
      <SearchBar value={query} onChange={setQuery} />
      {apiKeyMissing && (
        <div className="info-banner warning">Add VITE_TMDB_API_KEY to .env.local then restart the dev server.</div>
      )}
      {error && <div className="info-banner error">{error}</div>}
      {(!apiKeyMissing && loading) && !error && (
        <div className="skeleton-grid" aria-hidden="true">
          {skeletons.map((_, i) => (
            <div key={i} className="skeleton-card"><div className="shimmer"/></div>
          ))}
        </div>
      )}
      {!apiKeyMissing && !loading && !error && debouncedQuery.trim().length > 0 && debouncedQuery.trim().length < 2 && (
        <div className="status">Type at least 2 characters to search</div>
      )}
      {apiKeyMissing && debouncedQuery && minQueryOk && (
        <div className="status">Cannot search without a valid API key.</div>
      )}
      {!apiKeyMissing && !loading && !error && !showFavorites && minQueryOk && movies.length === 0 && (
        <div className="status">No results</div>
      )}
      {!showFavorites && (
        <>
          <MovieGrid
            movies={movies}
            onSelect={openDetails}
            favoritesSet={favoritesSet}
            toggleFavorite={toggleFavorite}
          />
          {totalPages > 1 && (
            <div className="pagination" role="navigation" aria-label="Pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span style={{ display:'flex', alignItems:'center', fontSize:'.75rem', letterSpacing:'.05em' }}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
      {showFavorites && (favoritesArray.length ? (
        <MovieGrid
          className="favorites"
          movies={favoritesArray}
          onSelect={openDetails}
          favoritesSet={favoritesSet}
          toggleFavorite={toggleFavorite}
        />
      ) : <div className="status">No favorites yet</div>)}
      <MovieModal
        open={!!selectedId}
        loading={modalLoading}
        movie={selected}
        onClose={closeModal}
      />
  <footer className="app-footer">Data courtesy of TMDB</footer>
      <button
        className="theme-toggle"
        onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle color theme"
      >Theme: {theme === 'dark' ? 'Dark' : 'Light'}</button>
    </div>
  )
}

export default App
