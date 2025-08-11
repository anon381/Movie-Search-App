export default function MovieCard({ movie, onSelect, isFavorite, toggleFavorite }) {
  const { Title, Year, Poster, Type, imdbID } = movie
  const posterOk = Poster && Poster !== 'N/A'
  return (
    <button className={`movie-card${isFavorite ? ' fav' : ''}`} onClick={() => onSelect(imdbID)} role="listitem">
      {isFavorite && <span className="fav-badge">FAV</span>}
      <span
        className="fav-toggle"
        title={isFavorite ? 'Remove favorite' : 'Add favorite'}
        onClick={(e) => {
          e.stopPropagation()
          toggleFavorite(imdbID, movie)
        }}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >{isFavorite ? '★' : '☆'}</span>
      <div className="poster-wrapper">
        {posterOk ? (
          <img src={Poster} alt={`${Title} poster`} loading="lazy" />
        ) : (
          <div className="poster-fallback">No Image</div>
        )}
      </div>
      <div className="movie-meta">
        <h3 className="movie-title">{Title}</h3>
        <p className="movie-sub">{Year} · {Type}</p>
      </div>
    </button>
  )
}
