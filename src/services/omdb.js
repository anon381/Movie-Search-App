const API_URL = 'https://www.omdbapi.com/'

function getApiKey(optional = false) {
  const key = import.meta.env.VITE_OMDB_API_KEY
  if (!key || key === 'YOUR_KEY_HERE') {
    if (optional) return null
    throw new Error('Missing OMDb API key')
  }
  return key
}

export async function searchMovies(query) {
  const key = getApiKey(true)
  if (!key) return []
  const url = `${API_URL}?apikey=${key}&s=${encodeURIComponent(query)}&type=movie`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Network error')
  const data = await res.json()
  if (data.Response === 'False') throw new Error(data.Error || 'No results')
  return data.Search
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
