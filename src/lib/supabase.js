import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[VRO] Missing Supabase environment variables.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project settings.'
  )
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
