import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !anonKey) {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY nao configurados - modo mock')
}

export const supabase =
  url && anonKey ? createClient(url, anonKey) : (null as unknown as ReturnType<typeof createClient>)

export const isSupabaseConfigured = !!supabase
