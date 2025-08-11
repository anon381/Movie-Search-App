import { useCallback, useEffect, useState } from 'react'

const KEY = 'movie_favorites_v1'

export default function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(favorites)) } catch {}
  }, [favorites])

  const toggleFavorite = useCallback((id, movie) => {
    setFavorites(prev => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id]
      } else {
        next[id] = movie
      }
      return next
    })
  }, [])

  return {
    favorites,
    favoritesArray: Object.values(favorites),
    favoritesSet: new Set(Object.keys(favorites)),
    toggleFavorite
  }
}
