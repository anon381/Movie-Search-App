import { useState } from 'react'
import { Link } from 'react-router-dom'
import MovieGrid from '../components/MovieGrid'
import MovieModal from '../components/MovieModal'
import useSupabaseAuth from '../hooks/useSupabaseAuth'
import useSupabaseFavorites from '../hooks/useSupabaseFavorites'
import useFavorites from '../hooks/useFavorites'
import { getProvider } from '../services/providers'

export default function FavoritesPage() {
  const { session, loading } = useSupabaseAuth()
  const localFav = useFavorites()
  const remoteFav = useSupabaseFavorites(session)
  const favoritesArray = (remoteFav.remote && remoteFav.favoritesArray.length) ? remoteFav.favoritesArray : localFav.favoritesArray
  const favoritesSet = (remoteFav.remote && remoteFav.favoritesArray.length) ? remoteFav.favoritesSet : localFav.favoritesSet
  const provider = getProvider()
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  const toggleFavorite = (id, movie) => {
    if (remoteFav.remote) remoteFav.toggleFavorite(movie || { imdbID: id })
    else localFav.toggleFavorite(id, movie)
  }

  const openDetails = async (id) => {
    setSelectedId(id)
    setModalLoading(true)
    setSelected(null)
    try { const data = await provider.details(id); setSelected(data) } catch (e) { setSelected({ error: e.message || 'Failed to load details' }) } finally { setModalLoading(false) }
  }
  const closeModal = () => { setSelectedId(null); setSelected(null); setModalLoading(false) }

  if (loading) return <div style={{padding:'2rem'}}>Loading...</div>

  return (
    <div className="app-container">
      <header className="app-header" style={{marginBottom:'1rem'}}>
        <h1 style={{marginBottom:'.25rem'}}>Favorites</h1>
        <p className="tagline" style={{fontSize:'.7rem'}}>Your saved titles {session && '(cloud synced)'}</p>
        <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
          <Link to="/" className="pill-btn">← Back</Link>
          {session && <span style={{fontSize:'.6rem',opacity:.6}}>Signed in: {session.user.email}</span>}
        </div>
      </header>
      {favoritesArray.length ? (
        <MovieGrid
          className="favorites"
          movies={favoritesArray}
          onSelect={openDetails}
          favoritesSet={favoritesSet}
          toggleFavorite={toggleFavorite}
        />
      ) : <div className="status" style={{padding:'2rem 0'}}>No favorites yet</div>}
      <MovieModal open={!!selectedId} loading={modalLoading} movie={selected} onClose={closeModal} />
      <footer className="app-footer">Data courtesy of TMDB</footer>
    </div>
  )
}
