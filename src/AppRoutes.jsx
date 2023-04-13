import { Navigate, Route, Routes } from 'react-router-dom'
import App from './App.jsx'
import useAuth from './hooks/useAuth'
import FavoritesPage from './pages/FavoritesPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'

export default function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: '2rem', fontSize: '0.85rem' }}>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/signup" element={session ? <Navigate to="/" replace /> : <SignUpPage />} />
      <Route path="/" element={session ? <App /> : <Navigate to="/signup" replace />} />
      <Route path="/favorites" element={session ? <FavoritesPage /> : <Navigate to="/signup" replace />} />
      <Route path="*" element={<Navigate to={session ? '/' : '/signup'} replace />} />
    </Routes>
  )
} 
// Nominal update 1681266381
 
// Nominal update 1681360201
