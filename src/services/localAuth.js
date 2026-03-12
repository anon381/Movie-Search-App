const ACCOUNTS_KEY = 'movie_auth_accounts_v1'
const SESSION_KEY = 'movie_auth_session_v1'
const AUTH_EVENT = 'movie-auth-change'

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function emitAuthChange() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT))
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

function randomSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)))
}

async function hashPassword(password, salt) {
  const payload = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', payload)
  return toHex(digest)
}

function getAccounts() {
  return readStorage(ACCOUNTS_KEY, [])
}

function saveAccounts(accounts) {
  writeStorage(ACCOUNTS_KEY, accounts)
}

function createSession(account) {
  return {
    user: {
      id: account.id,
      email: account.email
    },
    startedAt: new Date().toISOString()
  }
}

function persistSession(account) {
  const session = createSession(account)
  writeStorage(SESSION_KEY, session)
  emitAuthChange()
  return session
}

export function getStoredSession() {
  const session = readStorage(SESSION_KEY, null)
  if (!session?.user?.id) return null

  const account = getAccounts().find(item => item.id === session.user.id)
  if (!account) {
    localStorage.removeItem(SESSION_KEY)
    return null
  }

  return createSession(account)
}

export async function signUpWithPassword(email, password) {
  const normalizedEmail = normalizeEmail(email)
  const accounts = getAccounts()
  const existing = accounts.find(account => account.email === normalizedEmail)

  if (existing) {
    return { ok: false, existing: true, error: 'Email already registered.' }
  }

  const account = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    salt: randomSalt(),
    passwordHash: '',
    createdAt: new Date().toISOString()
  }

  account.passwordHash = await hashPassword(password, account.salt)
  accounts.push(account)
  saveAccounts(accounts)

  return { ok: true, existing: false }
}

export async function signInWithPassword(email, password) {
  const normalizedEmail = normalizeEmail(email)
  const account = getAccounts().find(item => item.email === normalizedEmail)
  if (!account) {
    return { ok: false, error: 'Invalid email or password.' }
  }

  const attemptedHash = await hashPassword(password, account.salt)
  if (attemptedHash !== account.passwordHash) {
    return { ok: false, error: 'Invalid email or password.' }
  }

  return { ok: true, session: persistSession(account) }
}

export function signOutLocal() {
  localStorage.removeItem(SESSION_KEY)
  emitAuthChange()
}

export function subscribeToAuthChanges(callback) {
  const handleChange = () => callback(getStoredSession())
  const handleStorage = (event) => {
    if (event.key === SESSION_KEY || event.key === ACCOUNTS_KEY) {
      handleChange()
    }
  }

  window.addEventListener(AUTH_EVENT, handleChange)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(AUTH_EVENT, handleChange)
    window.removeEventListener('storage', handleStorage)
  }
}