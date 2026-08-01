import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Pulse] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. ' +
    'Salin .env.example menjadi .env dan isi dengan kredensial project Supabase kamu.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Kedua app (Pulse & FinanceTrack) sekarang dilayani dari domain yang
    // sama (lifegoal.direction.my.id), jadi berbagi localStorage. Beri
    // storageKey unik supaya sesi login masing-masing app tidak saling
    // menimpa — user bisa login ke Pulse dan FinanceTrack sekaligus, baik
    // di tab yang sama maupun berbeda.
    storageKey: 'pulse-hbits-auth',
  },
})

// Supabase Auth butuh format email. Karena app ini pakai login username,
// kita ubah username jadi email "palsu" yang deterministik & unik.
const USERNAME_DOMAIN = 'habits.local'

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`
}
