import { supabase, isSupabaseConfigured } from './supabaseClient'

// ---------------------------------------------------------------------------
// Data layer. Kalau Supabase sudah dikonfigurasi (lihat .env), semua fungsi
// di bawah ini membaca/menulis ke Supabase dan otomatis ter-scope ke user
// yang sedang login lewat Row Level Security. Kalau belum, otomatis pakai
// localStorage (per-username) supaya aplikasi tetap bisa dicoba tanpa setup
// database.
// ---------------------------------------------------------------------------

export const usingSupabase = isSupabaseConfigured

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function lsKey(base, userId) {
  return `tugas-sma:${base}:${userId}`
}

function readLS(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ---- MAPEL -----------------------------------------------------------------

export async function listMapel(userId) {
  if (usingSupabase) {
    const { data, error } = await supabase.from('tugassma_mapel').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return data
  }
  return readLS(lsKey('mapel', userId)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

export async function createMapel(userId, { nama, warna }) {
  if (usingSupabase) {
    const { data, error } = await supabase.from('tugassma_mapel').insert({ nama, warna, user_id: userId }).select().single()
    if (error) throw error
    return data
  }
  const key = lsKey('mapel', userId)
  const list = readLS(key)
  const row = { id: uid(), nama, warna, user_id: userId, created_at: new Date().toISOString() }
  writeLS(key, [...list, row])
  return row
}

export async function deleteMapel(userId, id) {
  if (usingSupabase) {
    const { error } = await supabase.from('tugassma_mapel').delete().eq('id', id)
    if (error) throw error
    return
  }
  writeLS(lsKey('mapel', userId), readLS(lsKey('mapel', userId)).filter((m) => m.id !== id))
  writeLS(lsKey('tugas', userId), readLS(lsKey('tugas', userId)).filter((t) => t.mapel_id !== id))
}

// ---- TUGAS -------------------------------------------------------------

export async function listTugas(userId, mapelId) {
  if (usingSupabase) {
    const { data, error } = await supabase
      .from('tugassma_tugas')
      .select('*')
      .eq('mapel_id', mapelId)
      .order('deadline', { ascending: true, nullsFirst: false })
    if (error) throw error
    return data
  }
  return readLS(lsKey('tugas', userId))
    .filter((t) => t.mapel_id === mapelId)
    .sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline) - new Date(b.deadline)
    })
}

export async function listAllTugas(userId) {
  if (usingSupabase) {
    const { data, error } = await supabase.from('tugassma_tugas').select('*')
    if (error) throw error
    return data
  }
  return readLS(lsKey('tugas', userId))
}

export async function createTugas(userId, { mapel_id, judul, deskripsi, deadline }) {
  if (usingSupabase) {
    const { data, error } = await supabase
      .from('tugassma_tugas')
      .insert({ mapel_id, judul, deskripsi, deadline, selesai: false })
      .select()
      .single()
    if (error) throw error
    return data
  }
  const key = lsKey('tugas', userId)
  const list = readLS(key)
  const row = {
    id: uid(),
    mapel_id,
    judul,
    deskripsi: deskripsi || '',
    deadline: deadline || null,
    selesai: false,
    created_at: new Date().toISOString(),
  }
  writeLS(key, [...list, row])
  return row
}

export async function toggleTugas(userId, id, selesai) {
  if (usingSupabase) {
    const { error } = await supabase.from('tugassma_tugas').update({ selesai }).eq('id', id)
    if (error) throw error
    return
  }
  const key = lsKey('tugas', userId)
  writeLS(
    key,
    readLS(key).map((t) => (t.id === id ? { ...t, selesai } : t))
  )
}

export async function deleteTugas(userId, id) {
  if (usingSupabase) {
    const { error } = await supabase.from('tugassma_tugas').delete().eq('id', id)
    if (error) throw error
    return
  }
  const key = lsKey('tugas', userId)
  writeLS(key, readLS(key).filter((t) => t.id !== id))
}
