const API_URL = 'https://www.omdbapi.com/'

function getApiKey(optional = false) {
  const key = import.meta.env.VITE_OMDB_API_KEY
  if (!key || key === 'YOUR_KEY_HERE') {
    if (optional) return null
    throw new Error('Missing OMDb API key')
  }
  return key
}

export async function searchMovies({ query, page = 1, year, type, signal }) {
  const key = getApiKey(true)
  if (!key) return { list: [], total: 0 }
  if (!query || query.trim().length < 2) return { list: [], total: 0 }
  const params = new URLSearchParams({ apikey: key, s: query, page: String(page) })
  if (type) params.set('type', type)
  if (year) params.set('y', year)
  const url = `${API_URL}?${params.toString()}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('Network error')
  const data = await res.json()
  if (data.Response === 'False') throw new Error(data.Error || 'No results')
  return { list: data.Search, total: Number(data.totalResults || data.Search?.length || 0) }
}

export async function getMovieDetails(id) {
  const key = getApiKey(true)
  if (!key) throw new Error('Missing OMDb API key')
  const url = `${API_URL}?apikey=${key}&i=${encodeURIComponent(id)}&plot=full`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Network error')
  const data = await res.json()
  if (data.Response === 'False') throw new Error(data.Error || 'Not found')
  return data
}
