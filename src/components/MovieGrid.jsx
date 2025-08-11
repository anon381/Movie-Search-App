import MovieCard from './MovieCard'

export default function MovieGrid({ movies, onSelect, favoritesSet, toggleFavorite, className='', showFavBadge=true }) {
  if (!movies?.length) return null
  return (
    <div className={`movie-grid ${className}`.trim()} role="list">
      {movies.map((m) => (
        <MovieCard
          key={m.imdbID}
          movie={m}
          onSelect={onSelect}
          isFavorite={favoritesSet.has(m.imdbID)}
          toggleFavorite={toggleFavorite}
          showFavBadge={showFavBadge}
        />
      ))}
    </div>
  )}
