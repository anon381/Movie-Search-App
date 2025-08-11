import { searchMovies, getMovieDetails } from '../omdb'

export const omdbProvider = {
  id: 'omdb',
  async search(args) {
    const { list, total } = await searchMovies(args)
    const mapped = list.map(m => ({
      id: m.imdbID,
      imdbID: m.imdbID,
      Title: m.Title,
      Year: m.Year,
      Poster: m.Poster,
      Type: m.Type || 'movie'
    }))
    return { list: mapped, total }
  },
  async details(id) {
    const d = await getMovieDetails(id)
    return {
      id: d.imdbID,
      imdbID: d.imdbID,
      Title: d.Title,
      Year: d.Year,
      Poster: d.Poster,
      Plot: d.Plot,
      Genre: d.Genre,
      Director: d.Director,
      Actors: d.Actors,
      Runtime: d.Runtime,
      Rated: d.Rated,
      imdbRating: d.imdbRating
    }
  }
}
