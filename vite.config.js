import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Explicitly load env to ensure .env.local is included
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react()],
    define: {
      __TMDB_KEY_PRESENT__: JSON.stringify(!!env.VITE_TMDB_API_KEY)
    }
  }
})
