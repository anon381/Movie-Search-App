import { useEffect } from 'react'

export default function MovieModal({ open, movie, onClose, loading }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  const hasError = movie && movie.error
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        {loading && <div className="modal-status">Loading...</div>}
        {hasError && <div className="modal-status error">{movie.error}</div>}
        {!loading && movie && !hasError && (
          <div className="modal-content">
            <div className="modal-header">
              <h2>{movie.Title}</h2>
              <p className="muted">{movie.Year} · {movie.Rated} · {movie.Runtime}</p>
            </div>
            <div className="modal-body">
              <div className="modal-poster">
                {movie.Poster && movie.Poster !== 'N/A' ? (
                  <img src={movie.Poster} alt={`${movie.Title} poster`} />
                ) : (
                  <div className="poster-fallback large">No Image</div>
                )}
              </div>
              <div className="modal-details">
                <p>{movie.Plot}</p>
                <p className="muted small">Genre: {movie.Genre}</p>
                <p className="muted small">Director: {movie.Director}</p>
                <p className="muted small">Actors: {movie.Actors}</p>
                <p className="muted small">IMDb Rating: {movie.imdbRating}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
