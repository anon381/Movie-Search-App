// Supabase client initialization
// Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && anon) ? createClient(url, anon, { auth: { persistSession: true } }) : null

export function supabaseReady() { return !!supabase }
