import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import useSupabaseAuth from './hooks/useSupabaseAuth'

function Root() {
  const { session, loading } = useSupabaseAuth()
  if (loading) return <div style={{padding:'2rem',fontSize:'0.85rem'}}>Loading...</div>
  return (
    <Routes>
  <Route path="/signup" element={session ? <Navigate to="/" replace /> : <SignUpPage />} />
  <Route path="/" element={session ? <App /> : <Navigate to="/signup" replace />} />
  <Route path="/favorites" element={session ? <FavoritesPage /> : <Navigate to="/signup" replace />} />
      <Route path="*" element={<Navigate to={session ? '/' : '/signup'} replace />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>
)
