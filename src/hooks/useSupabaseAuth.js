import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'

// Handles Supabase auth session listening & simple magic-link sign in
export default function useSupabaseAuth() {
  const [session, setSession] = useState(() => supabase?.auth?.getSession ? null : null)
  const [loading, setLoading] = useState(!!supabase)
  const [sending, setSending] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Load initial session
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let mounted = true
    supabase.auth.getSession().then(({ data }) => { if (mounted) setSession(data.session) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s) })
    setLoading(false)
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  const signIn = useCallback(async (email) => {
    if (!supabase) return
    setSending(true); setAuthError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    if (error) setAuthError(error.message)
    setSending(false)
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return { session, loading, sending, authError, signIn, signOut }
}
