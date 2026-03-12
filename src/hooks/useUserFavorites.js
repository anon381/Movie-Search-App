import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const LEGACY_KEY = 'movie_favorites_v1'

function getFavoritesKey(userId) {
  return `movie_user_favorites_${userId}_v1`
}

function readFavorites(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}

export default function useUserFavorites(session) {
  const userId = session?.user?.id
  const [favorites, setFavorites] = useState({})
  const migratedRef = useRef(false)

  useEffect(() => {
    if (!userId) {
      setFavorites({})
      migratedRef.current = false
      return
    }

    setFavorites(readFavorites(getFavoritesKey(userId)))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    localStorage.setItem(getFavoritesKey(userId), JSON.stringify(favorites))
  }, [favorites, userId])

  useEffect(() => {
    if (!userId || migratedRef.current || Object.keys(favorites).length > 0) return

    const legacyFavorites = readFavorites(LEGACY_KEY)
    if (!Object.keys(legacyFavorites).length) {
      migratedRef.current = true
      return
    }

    setFavorites(legacyFavorites)
    migratedRef.current = true
  }, [favorites, userId])

  const toggleFavorite = useCallback((movie) => {
    if (!userId || !movie?.imdbID) return

    setFavorites(prev => {
      const next = { ...prev }
      if (next[movie.imdbID]) {
        delete next[movie.imdbID]
      } else {
        next[movie.imdbID] = movie
      }
      return next
    })
  }, [userId])

  const favoriteIds = useMemo(() => Object.keys(favorites), [favorites])

  return {
    loading: false,
    error: null,
    favorites,
    favoritesArray: Object.values(favorites),
    favoritesSet: new Set(favoriteIds),
    toggleFavorite
  }
}