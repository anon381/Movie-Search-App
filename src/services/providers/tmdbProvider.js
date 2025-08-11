const API = 'https://api.themoviedb.org/3'

function getKey() {
  const k = import.meta.env.VITE_TMDB_API_KEY
  if (!k) throw new Error('Missing TMDB API key')
  return k
}

const IMG_BASE = import.meta.env.VITE_TMDB_IMG_BASE || 'https://image.tmdb.org/t/p'

function posterUrl(path, size='w342') {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

export const tmdbProvider = {
  id: 'tmdb',
  async search({ query, page = 1, year, type, signal }) {
    const key = getKey()
    if (!query || query.trim().length < 2) return { list: [], total: 0 }
    let endpoint = 'search/movie'
    if (type === 'series') endpoint = 'search/tv'
    if (type === 'all') endpoint = 'search/multi'
    const params = new URLSearchParams({ api_key: key, query, page: String(page) })
    if (year && endpoint === 'search/movie') params.set('year', year)
    if (year && endpoint === 'search/tv') params.set('first_air_date_year', year)
    const url = `${API}/${endpoint}?${params.toString()}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error('Network error')
    const data = await res.json()
    if (!data.results) return { list: [], total: 0 }
    const mapped = data.results
      .filter(r => r.media_type !== 'person')
      .map(r => ({
        id: r.id.toString(),
        imdbID: r.id.toString(),
        Title: r.title || r.name || 'Untitled',
        Year: (r.release_date || r.first_air_date || '').slice(0,4),
        Poster: posterUrl(r.poster_path),
        Type: r.media_type === 'tv' || endpoint === 'search/tv' ? 'series' : 'movie'
      }))
    return { list: mapped, total: data.total_results || mapped.length }
  },
  async details(id) {
    const key = getKey()
    // include credits so we can map director/cast
    const url = `${API}/movie/${id}?api_key=${key}&append_to_response=credits`
    const altUrl = `${API}/tv/${id}?api_key=${key}&append_to_response=credits`
    let res = await fetch(url)
    if (res.status === 404) res = await fetch(altUrl)
    if (!res.ok) throw new Error('Not found')
    const d = await res.json()
    return {
      id: d.id.toString(),
      imdbID: d.imdb_id || d.id.toString(),
      Title: d.title || d.name,
      Year: (d.release_date || d.first_air_date || '').slice(0,4),
      Poster: posterUrl(d.poster_path, 'w500'),
      Plot: d.overview,
      Genre: d.genres?.map(g=>g.name).join(', '),
      Director: (d.credits?.crew?.find(c=>c.job==='Director')?.name) || '—',
      Actors: (d.credits?.cast?.slice(0,5).map(c=>c.name).join(', ')) || '—',
      Runtime: (d.runtime || (d.episode_run_time && d.episode_run_time[0])) ? `${d.runtime || d.episode_run_time[0]} min` : '—',
      Rated: d.adult ? 'Adult' : 'PG',
      imdbRating: d.vote_average ? d.vote_average.toFixed(1) : '—'
    }
  }
}
