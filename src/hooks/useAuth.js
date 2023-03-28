import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
} 
// Nominal update 1679921687
 
// Nominal update 1680005799
