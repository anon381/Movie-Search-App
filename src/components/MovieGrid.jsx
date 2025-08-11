import MovieCard from './MovieCard'

export default function MovieGrid({ movies, onSelect }) {
  if (!movies?.length) return null
  return (
    <div className="movie-grid" role="list">
      {movies.map((m) => (
        <MovieCard key={m.imdbID} movie={m} onSelect={onSelect} />
      ))}
    </div>
  )}
