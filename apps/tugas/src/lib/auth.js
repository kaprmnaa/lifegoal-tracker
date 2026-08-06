import { supabase, isSupabaseConfigured } from './supabaseClient'

// ---------------------------------------------------------------------------
// Login pakai USERNAME (bukan email). Supabase Auth sendiri butuh email, jadi
// di balik layar kita ubah username jadi "email palsu" (username@tugas-sma.local).
// Ini aman dipakai selama fitur "Confirm email" di Supabase Auth Settings
// dimatikan, supaya user langsung login begitu daftar tanpa perlu klik link
// verifikasi ke alamat yang memang tidak nyata itu.
//
// PENTING (project Supabase dipakai bareng Pulse & FinanceTrack): signUp() di
// bawah ini SENGAJA tidak mengirim `username` lewat `options.data` (user
// metadata) — kalau dikirim, trigger `financetrack_on_auth_user_created` di
// project yang sama akan ikut jalan untuk setiap signup baru (dari app
// manapun) dan mencoba insert ke `financetrack_profiles`. Username disimpan
// manual ke tabel `tugassma_profiles` sesudah signUp berhasil, persis pola
// yang dipakai Pulse (`hbits_profiles`) untuk menghindari hal yang sama.
//
// Kalau Supabase belum dikonfigurasi, dipakai mode lokal sederhana (akun &
// sesi disimpan di localStorage). Ini bukan otentikasi yang aman — hanya
// supaya alur login tetap bisa dicoba tanpa setup database.
// ---------------------------------------------------------------------------

const FAKE_DOMAIN = 'tugas-sma.local'
const LS_SESSION = 'tugas-sma:local-session'
const LS_USERS = 'tugas-sma:local-users'
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/

export const usingSupabaseAuth = isSupabaseConfigured

function usernameToEmail(username) {
  return `${username}@${FAKE_DOMAIN}`
}

function validateUsername(username) {
  const clean = (username || '').trim()
  if (!USERNAME_RE.test(clean)) {
    throw new Error('Username 3–20 karakter, hanya huruf, angka, titik, atau underscore.')
  }
  return clean
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    throw new Error('Password minimal 6 karakter.')
  }
}

function readLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS) || '{}')
  } catch {
    return {}
  }
}

async function fetchUsername(userId, fallback) {
  const { data, error } = await supabase.from('tugassma_profiles').select('username').eq('id', userId).single()
  if (error || !data) return fallback
  return data.username
}

export async function signUp(username, password) {
  const clean = validateUsername(username)
  validatePassword(password)

  if (usingSupabaseAuth) {
    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(clean),
      password,
      // Tidak mengirim options.data / user metadata di sini — lihat catatan di atas.
    })
    if (error) {
      if (/already registered|already exists|duplicate/i.test(error.message)) {
        throw new Error('Username sudah dipakai, coba username lain.')
      }
      throw error
    }
    if (!data.session) {
      // Ini kejadian kalau "Confirm email" masih AKTIF di Supabase Auth Settings.
      throw new Error(
        'Pendaftaran berhasil tapi belum bisa login otomatis. Matikan "Confirm email" di Supabase Authentication Settings, lalu coba lagi.'
      )
    }
    if (data.user) {
      const { error: profileError } = await supabase
        .from('tugassma_profiles')
        .insert({ id: data.user.id, username: clean })
      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('Username sudah dipakai, coba username lain.')
        }
        throw profileError
      }
    }
    return { id: data.user.id, username: clean }
  }

  const users = readLocalUsers()
  if (users[clean]) throw new Error('Username sudah dipakai, coba username lain.')
  users[clean] = { password }
  localStorage.setItem(LS_USERS, JSON.stringify(users))
  localStorage.setItem(LS_SESSION, clean)
  return { id: clean, username: clean }
}

export async function signIn(username, password) {
  const clean = validateUsername(username)

  if (usingSupabaseAuth) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(clean),
      password,
    })
    if (error) throw new Error('Username atau password salah.')
    const resolvedUsername = await fetchUsername(data.user.id, clean)
    return { id: data.user.id, username: resolvedUsername }
  }

  const users = readLocalUsers()
  if (!users[clean] || users[clean].password !== password) {
    throw new Error('Username atau password salah.')
  }
  localStorage.setItem(LS_SESSION, clean)
  return { id: clean, username: clean }
}

export async function signOut() {
  if (usingSupabaseAuth) {
    await supabase.auth.signOut()
    return
  }
  localStorage.removeItem(LS_SESSION)
}

export async function getCurrentUser() {
  if (usingSupabaseAuth) {
    const { data } = await supabase.auth.getSession()
    const session = data.session
    if (!session) return null
    const fallback = session.user.email.split('@')[0]
    const username = await fetchUsername(session.user.id, fallback)
    return { id: session.user.id, username }
  }
  const username = localStorage.getItem(LS_SESSION)
  return username ? { id: username, username } : null
}

// Memberi tahu App.jsx setiap kali status login berubah. Mengembalikan fungsi unsubscribe.
export function onAuthChange(callback) {
  if (usingSupabaseAuth) {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const fallback = session.user.email.split('@')[0]
        fetchUsername(session.user.id, fallback).then((username) => {
          callback({ id: session.user.id, username })
        })
      } else {
        callback(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }
  return () => {}
}
