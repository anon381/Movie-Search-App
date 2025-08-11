import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import MovieGrid from './components/MovieGrid'
import MovieModal from './components/MovieModal'
import { getProvider } from './services/providers'
import useDebounce from './hooks/useDebounce'
import useFavorites from './hooks/useFavorites'
import useSupabaseAuth from './hooks/useSupabaseAuth'
import useSupabaseFavorites from './hooks/useSupabaseFavorites'
import useSearchHistory from './hooks/useSearchHistory'

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
  const [showHistory, setShowHistory] = useState(false)
  const [year, setYear] = useState('')
  const [type, setType] = useState(DEFAULT_TYPE)
  const abortRef = useRef(null)
  const cacheRef = useRef(new Map())
  const migratedRef = useRef(false)
  const localFav = useFavorites()
  const { session, loading: authLoading, sending, authError, signIn, signOut, sessionExpired, clearSessionExpired } = useSupabaseAuth()
  const remoteFav = useSupabaseFavorites(session)
  const history = useSearchHistory(session)
  const favoritesArray = (remoteFav.remote && remoteFav.favoritesArray.length) ? remoteFav.favoritesArray : localFav.favoritesArray
  const favoritesSet = (remoteFav.remote && remoteFav.favoritesArray.length) ? remoteFav.favoritesSet : localFav.favoritesSet
  const toggleFavorite = (movieId, movieObj) => {
    if (session) {
      // movieObj might be passed as (id, movie). Normalize.
      const movie = movieObj && movieObj.imdbID ? movieObj : { imdbID: movieId, ...movieObj }
      remoteFav.toggleFavorite(movie)
    } else {
      localFav.toggleFavorite(movieId, movieObj)
    }
  }

  // One-time migration of local favorites to cloud after first sign-in if remote empty
  useEffect(() => {
    if (!session) return
    if (migratedRef.current) return
    if (!remoteFav.remote) return
    if (remoteFav.favoritesArray.length > 0) { migratedRef.current = true; return }
    const localList = localFav.favoritesArray
    if (!localList.length) { migratedRef.current = true; return }
    (async () => {
      for (const m of localList) {
        try { remoteFav.toggleFavorite(m) } catch { /* ignore */ }
      }
      migratedRef.current = true
    })()
  }, [session, remoteFav.remote, remoteFav.favoritesArray.length, localFav.favoritesArray])

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
      history.log({ query: debouncedQuery.trim(), year: year.trim(), type, resultCount: total })
    } catch (e) { if (e.name === 'AbortError') return; setError(e.message || 'Search failed'); setMovies([]); setTotalResults(0) } finally { setLoading(false) }
  }, [debouncedQuery, page, year, type, provider, apiKeyMissing, history])

  useEffect(() => { setPage(1) }, [debouncedQuery])
  useEffect(() => { setPage(1) }, [year, type])
  useEffect(() => { performSearch() }, [performSearch])
  const totalPages = Math.ceil(totalResults / pageSize) || 0

  const skeletons = Array.from({ length: Math.min(pageSize, 10) })


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
  <div className="auth-cluster">
          {session ? (
            <>
              <span style={{fontSize:'.65rem',opacity:.7}}>Signed in: {session.user.email}</span>
              <button className="pill-btn" onClick={signOut}>Sign Out</button>
            </>
          ) : (
            <form onSubmit={(e)=>{e.preventDefault(); const email=e.target.elements.email.value; if(email) signIn(email)}} style={{display:'flex',gap:'.4rem',alignItems:'center'}}>
              <input name="email" type="email" placeholder="Email for favorites sync" required style={{padding:'.3rem .5rem',background:'#1d1f22',border:'1px solid #2c3136',borderRadius:6,color:'inherit',fontSize:'.7rem'}} />
              <button disabled={sending} className="pill-btn" type="submit" style={{fontSize:'.65rem'}}>{sending?'Sending...':'Link'}</button>
            </form>
          )}
          {authError && <span style={{color:'#f55',fontSize:'.6rem'}}>{authError}</span>}
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
      <div className="post-search-actions" style={{display:'flex', flexWrap:'wrap', gap:'.6rem', alignItems:'center', justifyContent:'center', marginBottom:'1rem'}}>
        <button className={`pill-btn ${showFavorites ? '' : 'active'}`} onClick={() => { setShowFavorites(false); setShowHistory(false) }}>Results</button>
        <button className={`pill-btn ${showFavorites ? 'active' : ''}`} onClick={() => { setShowFavorites(true); setShowHistory(false) }}>Favorites ({favoritesArray.length}){session && <span style={{marginLeft:4,fontSize:'.55rem',opacity:.6}}>cloud</span>}</button>
        {session && <button className={`pill-btn ${showHistory ? 'active' : ''}`} onClick={() => { setShowHistory(s => !s); setShowFavorites(false) }}>History</button>}
        <div style={{display:'flex', gap:'.4rem', flexWrap:'wrap'}}>
          <input type="text" inputMode="numeric" pattern="\\d{4}" placeholder="Year" value={year} onChange={e=> setYear(e.target.value.slice(0,4))} aria-label="Filter by year" style={{ width:'4.5rem', padding:'.4rem .5rem', background:'#1d1f22', border:'1px solid #2c3136', borderRadius:8, color:'inherit', fontSize:'.65rem' }} />
          <select value={type} onChange={e=> setType(e.target.value)} aria-label="Filter by type" style={{ padding:'.45rem .6rem', background:'#1d1f22', border:'1px solid #2c3136', borderRadius:8, color:'inherit', fontSize:'.65rem' }}>
            <option value="movie">Movies</option>
            <option value="series">Series</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      {apiKeyMissing && (
        <div className="info-banner warning">Add VITE_TMDB_API_KEY to .env.local then restart the dev server.</div>
      )}
      {sessionExpired && (
        <div className="info-banner error" style={{maxWidth:620}}>
          <div style={{fontWeight:600, marginBottom:'.35rem'}}>Session expired</div>
          <div style={{fontSize:'.7rem', opacity:.85, marginBottom:'.6rem'}}>Your authentication token is no longer valid. Please sign in again to continue syncing favorites & history.</div>
          <div style={{display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
            <button className="pill-btn" onClick={() => { signOut().finally(() => clearSessionExpired()) }}>Re-Authenticate</button>
            <button className="pill-btn" style={{background:'#2a2f35'}} onClick={clearSessionExpired}>Dismiss</button>
          </div>
        </div>
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
      {showHistory && session && (
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
                      {item.year_filter && <span style={{opacity:.6}}> · {item.year_filter}</span>}
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
  <footer className="app-footer">Data courtesy of TMDB</footer>
    </div>
  )
}

export default App
