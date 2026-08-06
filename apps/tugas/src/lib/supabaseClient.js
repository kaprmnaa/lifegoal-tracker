import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Papan Tugas sekarang satu domain dengan Pulse & FinanceTrack
        // (lifegoal.direction.my.id), jadi berbagi localStorage. storageKey
        // unik supaya sesi login masing-masing app tidak saling menimpa.
        storageKey: 'tugassma-auth',
      },
    })
  : null
