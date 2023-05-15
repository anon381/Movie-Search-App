import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import MovieGrid from './components/MovieGrid'
import MovieModal from './components/MovieModal'
import { getProvider } from './services/providers'
import useDebounce from './hooks/useDebounce'
import useAuth from './hooks/useAuth'
import useUserFavorites from './hooks/useUserFavorites'
import useSearchHistory from './hooks/useSearchHistory'

const DEFAULT_TYPE = 'movie' // or 'All'

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
  const [showHistory, setShowHistory] = useState(false)
  const [yearMode, setYearMode] = useState('none')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [type, setType] = useState(DEFAULT_TYPE)
  const abortRef = useRef(null)
  const cacheRef = useRef(new Map())
  const { session, signOut } = useAuth()
  const favorites = useUserFavorites(session)
  const history = useSearchHistory(session)
  const favoritesArray = favorites.favoritesArray
  const favoritesSet = favorites.favoritesSet

  const toggleFavorite = (movieId, movieObj) => {
    const movie = movieObj && movieObj.imdbID ? movieObj : { imdbID: movieId, ...movieObj }
    favorites.toggleFavorite(movie)
  }

  const provider = getProvider()
  const tmdbMissing = !import.meta.env.VITE_TMDB_API_KEY
  const apiKeyMissing = tmdbMissing
  const pageSize = 20

  const parseYear = (value) => {
    const y = Number.parseInt(value, 10)
    return Number.isFinite(y) ? y : null
  }

  const applyYearFilter = useCallback((list) => {
    if (!Array.isArray(list) || yearMode === 'none') return list

    const from = parseYear(yearFrom)
    const to = parseYear(yearTo)

    return list.filter((movie) => {
      const y = parseYear(movie.Year)
      if (!y) return false

      if (yearMode === 'exact' && from) return y === from
      if (yearMode === 'gte' && from) return y >= from
      if (yearMode === 'lte' && from) return y <= from
      if (yearMode === 'between' && from && to) {
        const min = Math.min(from, to)
        const max = Math.max(from, to)
        return y >= min && y <= max
      }

      return true
    })
  }, [yearFrom, yearMode, yearTo])

  const yearLabel = (() => {
    if (yearMode === 'none') return ''
    if (yearMode === 'exact' && yearFrom) return `=${yearFrom}`
    if (yearMode === 'gte' && yearFrom) return `>=${yearFrom}`
    if (yearMode === 'lte' && yearFrom) return `<=${yearFrom}`
    if (yearMode === 'between' && yearFrom && yearTo) return `${yearFrom}-${yearTo}`
    return ''
  })()

  const performSearch = useCallback(async () => {
    if (apiKeyMissing) { setLoading(false); return }
    if (!debouncedQuery || debouncedQuery.trim().length < 2) { setMovies([]); setError(null); setTotalResults(0); return }
    const key = `${debouncedQuery.trim().toLowerCase()}|${page}|${yearMode}|${yearFrom}|${yearTo}|${type}`
    if (cacheRef.current.has(key)) { const cached = cacheRef.current.get(key); setMovies(cached.movies); setTotalResults(cached.total); return }
    abortRef.current?.abort()
    const controller = new AbortController(); abortRef.current = controller
    setLoading(true); setError(null)
    try {
      const exactYear = yearMode === 'exact' ? yearFrom.trim() : ''
      const { list } = await provider.search({ query: debouncedQuery.trim(), page, year: exactYear, type: type === 'all' ? 'all' : type, signal: controller.signal })
      const filteredList = applyYearFilter(list)
      const total = filteredList.length
      setMovies(filteredList)
      setTotalResults(total)
      cacheRef.current.set(key, { movies: filteredList, total })
      history.log({ query: debouncedQuery.trim(), year: yearLabel, type, resultCount: total })
    } catch (e) { if (e.name === 'AbortError') return; setError(e.message || 'Search failed'); setMovies([]); setTotalResults(0) } finally { setLoading(false) }
  }, [debouncedQuery, page, yearMode, yearFrom, yearTo, type, provider, apiKeyMissing, history, applyYearFilter, yearLabel])

  useEffect(() => { setPage(1) }, [debouncedQuery])
  useEffect(() => { setPage(1) }, [yearMode, yearFrom, yearTo, type])
  useEffect(() => { performSearch() }, [performSearch])
  const totalPages = Math.ceil(totalResults / pageSize) || 0

  const skeletons = Array.from({ length: Math.min(pageSize, 10) })

  const openDetails = async (id) => {
    setSelectedId(id)
    setModalLoading(true)
    setSelected(null)
    try {
      const movie = [...movies, ...favoritesArray].find((m) => m.imdbID === id)
      const data = await provider.details(id, movie?.Type)
      setSelected(data)
    } catch (e) {
      setSelected({ error: e.message || 'Failed to load details' })
    } finally { setModalLoading(false) }
  }

  const closeModal = () => { setSelectedId(null); setSelected(null); setModalLoading(false) }

  const minQueryOk = debouncedQuery.trim().length >= 2

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Movie Search</h1>
        <div className="auth-cluster">
          <span className="user-email">Signed in: {session?.user?.email}</span>
          <button className="pill-btn" onClick={signOut}>Sign Out</button>
        </div>
      </header>
      <SearchBar
        value={query}
        onChange={setQuery}
        suggestions={history.items.map(h => h.query)}
        onSuggestion={(s) => {
          setQuery(s)
        }}
      />
      <div className="post-search-actions">
        <div className="action-chip-group">
          <button className={`pill-btn ${showFavorites ? '' : 'active'}`} onClick={() => { setShowFavorites(false); setShowHistory(false) }}>Results</button>
          <button className={`pill-btn ${showFavorites ? 'active' : ''}`} onClick={() => { setShowFavorites(true); setShowHistory(false) }}>Favorites ({favoritesArray.length})</button>
          <button className={`pill-btn ${showHistory ? 'active' : ''}`} onClick={() => { setShowHistory(s => !s); setShowFavorites(false) }}>History</button>
        </div>
        <div className="filter-group">
          <select className="filter-field filter-select" value={yearMode} onChange={e => setYearMode(e.target.value)} aria-label="Year filter mode">
            <option value="none">Any year</option>
            <option value="exact">Exact year</option>
            <option value="between">Between years</option>
            <option value="gte">Year and newer</option>
            <option value="lte">Year and older</option>
          </select>
          {yearMode !== 'none' && (
            <input className="filter-field" type="text" inputMode="numeric" pattern="\\d{4}" placeholder={yearMode === 'between' ? 'From' : 'Year'} value={yearFrom} onChange={e=> setYearFrom(e.target.value.slice(0,4))} aria-label="Start year" />
          )}
          {yearMode === 'between' && (
            <input className="filter-field" type="text" inputMode="numeric" pattern="\\d{4}" placeholder="To" value={yearTo} onChange={e=> setYearTo(e.target.value.slice(0,4))} aria-label="End year" />
          )}
          <select className="filter-field filter-select" value={type} onChange={e=> setType(e.target.value)} aria-label="Filter by type">
            <option value="movie">Movies</option>
            <option value="series">Series</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
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
        <div className="status">Can't search without a valid API key.</div>
      )}
      {!apiKeyMissing && !loading && !error && !showFavorites && !showHistory && minQueryOk && movies.length === 0 && (
        <div className="status">No results</div>
      )}
      {!showFavorites && !showHistory && (
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
      {showFavorites && !showHistory && (favoritesArray.length ? (
        <MovieGrid
          className="favorites"
          movies={favoritesArray}
          onSelect={openDetails}
          favoritesSet={favoritesSet}
          toggleFavorite={toggleFavorite}
        />
      ) : <div className="status">No favorites yet</div>)}
      {showHistory && (
        <div style={{padding:'1rem 0'}}>
          {history.loading && <div className="status">Loading history...</div>}
          {history.error && <div className="info-banner error">{history.error}</div>}
          {!history.loading && !history.error && (
            history.items.length ? (
              <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'.4rem'}}>
                {history.items.map(item => (
                  <li key={item.id} style={{background:'#1d1f22', border:'1px solid #2c3136', borderRadius:8, padding:'.6rem .75rem', fontSize:'.65rem', display:'flex', justifyContent:'space-between', gap:'.75rem'}}>
                    <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      {item.query}
                      {item.year_filter && <span style={{opacity:.5}}> · {item.year_filter}</span>}
                      {item.type_filter && <span style={{opacity:.6}}> · {item.type_filter}</span>}
                    </span>
                    <span style={{opacity:.55}}>{item.result_count ?? '-'} res</span>
                    <time style={{opacity:.4}}>{new Date(item.executed_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</time>
                  </li>
                ))}
              </ul>
            ) : <div className="status">No history yet</div>
          )}
        </div>
      )}
      <MovieModal
        open={!!selectedId}
        loading={modalLoading}
        movie={selected}
        onClose={closeModal}
      />
    </div>
  )
}

export default App
 
// Nominal update 1683960481
 
// Nominal update 1684048072
 
// Nominal update 1684147501
