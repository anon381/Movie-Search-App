import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'

// Hook to (a) fetch existing history for the session user, (b) log new searches.
// Requires table `search_history` created per README.
// Schema expected:
// create table search_history (
//   id bigserial primary key,
//   user_id uuid not null references auth.users(id) on delete cascade,
//   query text not null,
//   year_filter text,
//   type_filter text,
//   result_count int,
//   executed_at timestamptz default now()
// ); (RLS policies for own rows)

export default function useSearchHistory(session) {
  const userId = session?.user?.id
  const enabled = !!supabase && !!userId
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastKeyRef = useRef(null)
  const lastTimeRef = useRef(0)

  const fetchLatest = useCallback(async () => {
    if (!enabled) return
    setLoading(true); setError(null)
    const { data, error } = await supabase
      .from('search_history')
      .select('id,query,year_filter,type_filter,result_count,executed_at')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(30)
    if (error) setError(error.message)
    else setItems(data || [])
    setLoading(false)
  }, [enabled, userId])

  useEffect(() => { fetchLatest() }, [fetchLatest])

  const log = useCallback(async ({ query, year, type, resultCount }) => {
    if (!enabled) return
    if (!query || query.length < 2) return
    const key = `${query}|${year||''}|${type}|${resultCount}`
    const now = Date.now()
    // Avoid spamming: ignore duplicates for 20s
    if (lastKeyRef.current === key && (now - lastTimeRef.current) < 20000) return
    lastKeyRef.current = key
    lastTimeRef.current = now
    const { error } = await supabase.from('search_history').insert({
      user_id: userId,
      query,
      year_filter: year || null,
      type_filter: type || null,
      result_count: typeof resultCount === 'number' ? resultCount : null
    })
    if (!error) {
      // optimistic prepend
      setItems(prev => [{ id: crypto.randomUUID(), query, year_filter: year||null, type_filter: type||null, result_count: resultCount, executed_at: new Date().toISOString() }, ...prev].slice(0, 30))
    }
  }, [enabled, userId])

  return { items, loading, error, log, refetch: fetchLatest }
}
