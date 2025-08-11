import { useState, useEffect, useCallback } from 'react'
import './App.css'
import SearchBar from './components/SearchBar'
import MovieGrid from './components/MovieGrid'
import MovieModal from './components/MovieModal'
import { searchMovies, getMovieDetails } from './services/omdb'
import useDebounce from './hooks/useDebounce'

function App() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  const performSearch = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setMovies([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await searchMovies(debouncedQuery.trim())
      setMovies(results)
    } catch (e) {
      setError(e.message || 'Search failed')
      setMovies([])
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery])

  useEffect(() => {
    performSearch()
  }, [performSearch])

  const openDetails = async (id) => {
    setSelectedId(id)
    setModalLoading(true)
    setSelected(null)
    try {
      const data = await getMovieDetails(id)
      setSelected(data)
    } catch (e) {
      setSelected({ error: e.message || 'Failed to load details' })
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedId(null)
    setSelected(null)
    setModalLoading(false)
  }

  const apiKey = import.meta.env.VITE_OMDB_API_KEY
  const apiKeyMissing = !apiKey || apiKey === 'YOUR_KEY_HERE'

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Movie Search</h1>
        <p className="tagline">Find movies powered by OMDb (IMDb data)</p>
      </header>
      <SearchBar value={query} onChange={setQuery} />
      {apiKeyMissing && (
        <div className="info-banner warning">Add VITE_OMDB_API_KEY=YOUR_REAL_KEY to .env(.local) then restart dev server.</div>
      )}
      {error && <div className="info-banner error">{error}</div>}
  {loading && <div className="status">Loading...</div>}
      {!loading && !error && debouncedQuery && movies.length === 0 && (
        <div className="status">No results</div>
      )}
      <MovieGrid movies={movies} onSelect={openDetails} />
      <MovieModal
        open={!!selectedId}
        loading={modalLoading}
        movie={selected}
        onClose={closeModal}
      />
      <footer className="app-footer">Data courtesy of OMDb API</footer>
    </div>
  )
}

export default App
