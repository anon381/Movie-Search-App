// Supabase client initialization
// Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if ((!url || !anon) && typeof window !== 'undefined') {
	// eslint-disable-next-line no-console
	console.error('[supabase] Not initialized: missing env variable(s). Present SUPABASE-related keys:', Object.keys(import.meta.env).filter(k => k.toLowerCase().includes('supabase')))
}

export const supabase = (url && anon) ? createClient(url, anon, { auth: { persistSession: true } }) : null

export function debugSupabaseConfig() {
	return {
		hasUrl: !!url,
		hasAnon: !!anon,
		urlPreview: url ? url.replace(/^(https:\/\/)/,'$1***') : null
	}
}

export function supabaseReady() { return !!supabase }
