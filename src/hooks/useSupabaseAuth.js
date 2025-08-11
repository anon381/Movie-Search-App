import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'

// Handles Supabase auth session listening & simple magic-link sign in
export default function useSupabaseAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false) // magic link sending
  const [pwSending, setPwSending] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [lastSignInInfo, setLastSignInInfo] = useState(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Load initial session
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let active = true
    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          // eslint-disable-next-line no-console
          console.error('[auth] getSession error', error)
        }
        if (active) setSession(data?.session ?? null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // eslint-disable-next-line no-console
      console.log('[auth] event', event, 'at', new Date().toISOString())
      setSession(s)
      if (event === 'TOKEN_REFRESHED') {
        setSessionExpired(false)
      }
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        // explicit sign out resets expiry state
        setSessionExpired(false)
      }
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  // Visibility / network resume triggers a session check which can refresh tokens if near expiry
  useEffect(() => {
    if (!supabase) return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().catch(() => {})
      }
    }
    const handleOnline = () => {
      supabase.auth.getSession().catch(() => {})
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleOnline)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Helper to wrap Supabase RPC / query calls and detect expired JWTs
  const safeCall = useCallback(async (fn, opts = {}) => {
    try {
      const result = await fn()
      if (result && result.error) {
        const msg = (result.error.message || '').toLowerCase()
        if (msg.includes('jwt expired') || msg.includes('invalid jwt')) {
          setSessionExpired(true)
          // attempt a silent refresh once
          try { await supabase.auth.getSession() } catch { /* ignore */ }
        }
        if (opts.throwOnError !== false) throw result.error
      }
      return result
    } catch (e) {
      const msg = (e.message || '').toLowerCase()
      if (msg.includes('jwt expired') || msg.includes('invalid jwt')) {
        setSessionExpired(true)
      }
      if (opts.rethrow === false) return { error: e }
      throw e
    }
  }, [])

  const clearSessionExpired = useCallback(() => setSessionExpired(false), [])

  // Magic link sign-in
  const signIn = useCallback(async (email) => {
    if (!supabase) { setAuthError('Supabase not initialized (check env vars)'); return }
    setSending(true); setAuthError(null)
    try {
      const redirect = window.location.origin
  const { data, error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } })
      setLastSignInInfo({ ts: Date.now(), redirect, data, error: error ? { message: error.message, name: error.name, status: error.status } : null })
      // eslint-disable-next-line no-console
      console.log('[auth] signInWithOtp result:', { redirect, data, error })
      if (error) setAuthError(error.message)
    } catch (e) {
      setAuthError(e.message || 'Unexpected error')
      setLastSignInInfo({ ts: Date.now(), caught: true, message: e.message })
      // eslint-disable-next-line no-console
      console.error('[auth] signInWithOtp threw:', e)
    } finally {
      setSending(false)
    }
  }, [])

  // Password sign-up (creates user). If email confirmation is enabled, user must click link before session.
  const signUpPassword = useCallback(async (email, password) => {
    if (!supabase) { setAuthError('Supabase not initialized'); return }
    setPwSending(true); setAuthError(null)
    try {
      const redirect = window.location.origin
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect } })
      setLastSignInInfo({ ts: Date.now(), mode: 'signUpPassword', data, error: error ? { message: error.message, name: error.name, status: error.status } : null })
      // eslint-disable-next-line no-console
      console.log('[auth] signUpPassword result:', { data, error })
      if (error) {
        const msg = error.message || ''
        const lower = msg.toLowerCase()
        const existing = (
          lower.includes('already registered') ||
          lower.includes('already exists') ||
          lower.includes('user already registered') ||
          lower.includes('user already exists') ||
          lower.includes('duplicate key value') ||
          error.status === 422
        )
        if (!existing) setAuthError(error.message)
        return { ok: false, existing, error: error.message }
      }
      const requiresConfirmation = !!data?.user && !data?.session
      return { ok: true, existing: false, requiresConfirmation }
    } catch (e) {
      setAuthError(e.message || 'Unexpected error')
      return { ok: false, existing: false, error: e.message }
    } finally { setPwSending(false) }
  }, [])

  // Password sign-in
  const signInPassword = useCallback(async (email, password) => {
    if (!supabase) { setAuthError('Supabase not initialized'); return }
    setPwSending(true); setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      setLastSignInInfo({ ts: Date.now(), mode: 'signInPassword', data, error: error ? { message: error.message, name: error.name, status: error.status } : null })
      // eslint-disable-next-line no-console
      console.log('[auth] signInPassword result:', { data, error })
      if (error) setAuthError(error.message)
    } catch (e) {
      setAuthError(e.message || 'Unexpected error')
    } finally { setPwSending(false) }
  }, [])

  // Request password reset (magic link to set new password)
  const resetPassword = useCallback(async (email) => {
    if (!supabase) { setAuthError('Supabase not initialized'); return }
    setPwSending(true); setAuthError(null)
    try {
      const redirect = window.location.origin + '/#/password-reset' // adjust route if you implement a handler
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect })
      setLastSignInInfo({ ts: Date.now(), mode: 'resetPassword', data, error: error ? { message: error.message, name: error.name, status: error.status } : null })
      if (error) setAuthError(error.message)
    } catch (e) { setAuthError(e.message || 'Unexpected error') } finally { setPwSending(false) }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  // Resend confirmation email for pending signup
  const resendConfirmation = useCallback(async (email) => {
    if (!supabase) { setAuthError('Supabase not initialized'); return { ok:false, error:'not ready' } }
    if (!email) return { ok:false, error:'missing email' }
    setPwSending(true); setAuthError(null)
    try {
      const { data, error } = await supabase.auth.resend({ type: 'signup', email })
      setLastSignInInfo({ ts: Date.now(), mode: 'resendConfirmation', data, error: error ? { message: error.message, name: error.name, status: error.status } : null })
      // eslint-disable-next-line no-console
      console.log('[auth] resendConfirmation result:', { data, error })
      if (error) { setAuthError(error.message); return { ok:false, error:error.message } }
      return { ok:true }
    } catch (e) { setAuthError(e.message || 'Unexpected error'); return { ok:false, error:e.message } } finally { setPwSending(false) }
  }, [])

  return {
    session,
    loading,
    sending,
    pwSending,
    authError,
    sessionExpired,
    clearSessionExpired,
    signIn,
    signUpPassword,
    signInPassword,
    resetPassword,
    signOut,
    resendConfirmation,
    lastSignInInfo,
    safeCall
  }
}
