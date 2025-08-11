import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'

// Handles Supabase auth session listening & simple magic-link sign in
export default function useSupabaseAuth() {
  const [session, setSession] = useState(() => supabase?.auth?.getSession ? null : null)
  const [loading, setLoading] = useState(!!supabase)
  const [sending, setSending] = useState(false) // magic link sending
  const [pwSending, setPwSending] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [lastSignInInfo, setLastSignInInfo] = useState(null)

  // Load initial session
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let mounted = true
    supabase.auth.getSession().then(({ data }) => { if (mounted) setSession(data.session) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s) })
    setLoading(false)
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

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

  return { session, loading, sending, pwSending, authError, signIn, signUpPassword, signInPassword, resetPassword, signOut, resendConfirmation, lastSignInInfo }
}
