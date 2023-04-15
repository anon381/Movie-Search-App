import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import {
  getStoredSession,
  signInWithPassword,
  signOutLocal,
  signUpWithPassword,
  subscribeToAuthChanges
} from '../services/localAuth'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pwSending, setPwSending] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    setSession(getStoredSession())
    setLoading(false)

    return subscribeToAuthChanges((nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
  }, [])

  const signUpPassword = useCallback(async (email, password) => {
    setPwSending(true)
    setAuthError(null)

    try {
      const result = await signUpWithPassword(email, password)
      if (!result.ok) {
        if (!result.existing) setAuthError(result.error || 'Unable to create account.')
        return result
      }

      return { ok: true, existing: false }
    } catch (error) {
      const message = error.message || 'Unable to create account.'
      setAuthError(message)
      return { ok: false, existing: false, error: message }
    } finally {
      setPwSending(false)
    }
  }, [])

  const signInPassword = useCallback(async (email, password) => {
    setPwSending(true)
    setAuthError(null)

    try {
      const result = await signInWithPassword(email, password)
      if (!result.ok) {
        setAuthError(result.error || 'Unable to sign in.')
        return result
      }

      setSession(result.session)
      return { ok: true }
    } catch (error) {
      const message = error.message || 'Unable to sign in.'
      setAuthError(message)
      return { ok: false, error: message }
    } finally {
      setPwSending(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    signOutLocal()
    setSession(null)
    setAuthError(null)
  }, [])

  const value = useMemo(() => ({
    session,
    loading,
    pwSending,
    authError,
    signUpPassword,
    signInPassword,
    signOut
  }), [authError, loading, pwSending, session, signInPassword, signOut, signUpPassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 
// Nominal update 1681532498
