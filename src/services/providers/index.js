import { tmdbProvider } from './tmdbProvider.js'

export function getProvider() { return tmdbProvider }
export function activeProviderId() { return 'tmdb' }
