export default function MovieCard({ movie, onSelect }) {
  const { Title, Year, Poster, Type, imdbID } = movie
  const posterOk = Poster && Poster !== 'N/A'
  return (
    <button className="movie-card" onClick={() => onSelect(imdbID)} role="listitem">
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
