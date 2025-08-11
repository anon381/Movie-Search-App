import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseReady } from '../services/supabaseClient'

// Expected table schema:
// create table favorites (
//   user_id uuid not null references auth.users(id) on delete cascade,
//   movie_id text not null,
//   title text,
//   poster text,
//   created_at timestamptz default now(),
//   primary key (user_id, movie_id)
// );

export default function useSupabaseFavorites(session) {
  const enabled = supabaseReady() && !!session
  const userId = session?.user?.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [favorites, setFavorites] = useState({})

  const fetchFavorites = useCallback(async () => {
    if (!enabled) return
    setLoading(true); setError(null)
    const { data, error } = await supabase.from('favorites').select('movie_id,title,poster').eq('user_id', userId)
    if (error) setError(error.message)
    else {
      const map = {}
      data.forEach(r => { map[r.movie_id] = { imdbID: r.movie_id, Title: r.title, Poster: r.poster } })
      setFavorites(map)
    }
    setLoading(false)
  }, [enabled, userId])

  useEffect(() => { fetchFavorites() }, [fetchFavorites])

  const toggle = useCallback(async (movie) => {
    if (!enabled || !movie?.imdbID) return
    const id = movie.imdbID
    const exists = !!favorites[id]
    setFavorites(prev => {
      const next = { ...prev }
      if (exists) delete next[id]; else next[id] = movie
      return next
    })
    if (exists) {
      await supabase.from('favorites').delete().match({ user_id: userId, movie_id: id })
    } else {
      await supabase.from('favorites').upsert({ user_id: userId, movie_id: id, title: movie.Title, poster: movie.Poster })
    }
  }, [enabled, favorites, userId])

  return {
    remote: true,
    loading,
    error,
    favorites,
    favoritesArray: Object.values(favorites),
    favoritesSet: new Set(Object.keys(favorites)),
    toggleFavorite: toggle,
    refetch: fetchFavorites
  }
}
