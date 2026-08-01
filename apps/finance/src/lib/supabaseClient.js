import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[financetrack] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diset. ' +
    'Salin .env.example ke .env dan isi kredensial Supabase kamu.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // App ini sekarang satu domain dengan Pulse (habit tracker) di
    // lifegoal.direction.my.id, jadi berbagi localStorage. storageKey unik
    // supaya sesi login FinanceTrack tidak menimpa/ketimpa sesi Pulse.
    storageKey: 'financetrack-auth',
  },
})

// Username-based auth works by mapping each username to a deterministic,
// non-routable "shadow" email address. Supabase Auth still handles password
// hashing, sessions and JWTs — we just never surface the email to the user.
const EMAIL_DOMAIN = 'financetrack.local'

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`
}

export function isValidUsername(username) {
  return /^[a-z0-9_]{3,20}$/i.test(username.trim())
}
