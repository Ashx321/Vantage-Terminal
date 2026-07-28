import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-ref')) {
  throw new Error(
    'Missing Supabase config. Copy .env.example to .env.local and fill in ' +
    'your real Project URL and anon key from Supabase -> Project Settings -> API.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
