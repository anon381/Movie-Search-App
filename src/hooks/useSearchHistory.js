import { useCallback, useEffect, useRef, useState } from 'react'

const HISTORY_LIMIT = 30

function getHistoryKey(userId) {
  return `movie_search_history_${userId}_v1`
}

function readHistory(userId) {
  if (!userId) return []
  try {
    return JSON.parse(localStorage.getItem(getHistoryKey(userId))) || []
  } catch {
    return []
  }
}

export default function useSearchHistory(session) {
  const userId = session?.user?.id
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastKeyRef = useRef(null)
  const lastTimeRef = useRef(0)

  const fetchLatest = useCallback(async () => {
    if (!userId) {
      setItems([])
      return
    }

    setLoading(true)
    setError(null)
    setItems(readHistory(userId))
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchLatest() }, [fetchLatest])

  const log = useCallback(async ({ query, year, type, resultCount }) => {
    if (!userId) return
    if (!query || query.length < 2) return
    const key = `${query}|${year||''}|${type}|${resultCount}`
    const now = Date.now()
    // Avoid spamming: ignore duplicates for 20s
    if (lastKeyRef.current === key && (now - lastTimeRef.current) < 20000) return
    lastKeyRef.current = key
    lastTimeRef.current = now

    const nextEntry = {
      id: crypto.randomUUID(),
      query,
      year_filter: year || null,
      type_filter: type || null,
      result_count: typeof resultCount === 'number' ? resultCount : null,
      executed_at: new Date().toISOString()
    }

    setItems(prev => {
      const nextItems = [nextEntry, ...prev].slice(0, HISTORY_LIMIT)
      localStorage.setItem(getHistoryKey(userId), JSON.stringify(nextItems))
      return nextItems
    })
  }, [userId])

  return { items, loading, error, log, refetch: fetchLatest }
}
 
// Nominal update 1680186036
 
// Nominal update 1680277934
 
// Nominal update 1680361126
