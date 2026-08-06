import { useEffect, useMemo, useState } from 'react'
import * as store from './lib/dataStore.js'
import * as auth from './lib/auth.js'
import AuthScreen from './components/AuthScreen.jsx'
import MapelGrid from './components/MapelGrid.jsx'
import TugasList from './components/TugasList.jsx'
import AddMapelModal from './components/AddMapelModal.jsx'
import AddTugasModal from './components/AddTugasModal.jsx'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [mapelList, setMapelList] = useState([])
  const [allTugas, setAllTugas] = useState([])
  const [selectedMapel, setSelectedMapel] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddMapel, setShowAddMapel] = useState(false)
  const [showAddTugas, setShowAddTugas] = useState(false)

  // Cek sesi yang sedang login + pantau perubahan status login
  useEffect(() => {
    let active = true
    auth.getCurrentUser().then((u) => {
      if (active) {
        setUser(u)
        setCheckingAuth(false)
      }
    })
    const unsubscribe = auth.onAuthChange((u) => {
      setUser(u)
      setCheckingAuth(false)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  // Muat data tiap kali user (login) berubah
  useEffect(() => {
    if (user) loadAll(user.id)
    else {
      setMapelList([])
      setAllTugas([])
      setSelectedMapel(null)
    }
  }, [user])

  async function loadAll(userId) {
    setLoading(true)
    setError('')
    try {
      const [mapel, tugas] = await Promise.all([store.listMapel(userId), store.listAllTugas(userId)])
      setMapelList(mapel)
      setAllTugas(tugas)
    } catch (err) {
      setError(err.message || 'Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(() => {
    const map = {}
    for (const m of mapelList) map[m.id] = { total: 0, belum: 0, overdue: 0 }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (const t of allTugas) {
      if (!map[t.mapel_id]) continue
      map[t.mapel_id].total += 1
      if (!t.selesai) {
        map[t.mapel_id].belum += 1
        if (t.deadline && new Date(t.deadline) < today) map[t.mapel_id].overdue += 1
      }
    }
    return map
  }, [mapelList, allTugas])

  const tugasForSelected = useMemo(
    () => (selectedMapel ? allTugas.filter((t) => t.mapel_id === selectedMapel.id) : []),
    [allTugas, selectedMapel]
  )

  async function handleAddMapel({ nama, warna }) {
    const row = await store.createMapel(user.id, { nama, warna })
    setMapelList((prev) => [...prev, row])
    setShowAddMapel(false)
  }

  async function handleDeleteMapel(m) {
    if (!confirm(`Hapus mapel "${m.nama}" beserta semua tugasnya?`)) return
    await store.deleteMapel(user.id, m.id)
    setMapelList((prev) => prev.filter((x) => x.id !== m.id))
    setAllTugas((prev) => prev.filter((t) => t.mapel_id !== m.id))
    if (selectedMapel?.id === m.id) setSelectedMapel(null)
  }

  async function handleAddTugas({ judul, deskripsi, deadline }) {
    const row = await store.createTugas(user.id, { mapel_id: selectedMapel.id, judul, deskripsi, deadline })
    setAllTugas((prev) => [...prev, row])
    setShowAddTugas(false)
  }

  async function handleToggleTugas(tugas, selesai) {
    setAllTugas((prev) => prev.map((t) => (t.id === tugas.id ? { ...t, selesai } : t)))
    try {
      await store.toggleTugas(user.id, tugas.id, selesai)
    } catch (err) {
      setAllTugas((prev) => prev.map((t) => (t.id === tugas.id ? { ...t, selesai: !selesai } : t)))
      setError(err.message || 'Gagal memperbarui tugas.')
    }
  }

  async function handleDeleteTugas(tugas) {
    if (!confirm(`Hapus tugas "${tugas.judul}"?`)) return
    await store.deleteTugas(user.id, tugas.id)
    setAllTugas((prev) => prev.filter((t) => t.id !== tugas.id))
  }

  async function handleLogout() {
    await auth.signOut()
    setUser(null)
  }

  if (checkingAuth) {
    return (
      <div className="app-shell">
        <p className="status-text">Memuat…</p>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onAuthed={setUser} />
  }

  const totalBelum = allTugas.filter((t) => !t.selesai).length

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">📋</div>
          <div>
            <h1>Papan Tugas</h1>
            <p className="app-tagline">
              Halo, {user.username} —{' '}
              {totalBelum === 0 ? 'semua tugas beres, mantap!' : `${totalBelum} tugas menunggu`}
            </p>
          </div>
        </div>
        <div className="app-header-right">
          <span className={`storage-badge ${store.usingSupabase ? 'is-supabase' : 'is-local'}`}>
            {store.usingSupabase ? '☁️ Supabase' : '💾 Perangkat ini'}
          </span>
          <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </header>

      <main className="app-main">
        {loading && <p className="status-text">Memuat data…</p>}
        {error && <p className="status-text status-error">{error}</p>}

        {!loading && !selectedMapel && (
          <MapelGrid
            mapelList={mapelList}
            counts={counts}
            onSelect={setSelectedMapel}
            onDelete={handleDeleteMapel}
            onAdd={() => setShowAddMapel(true)}
          />
        )}

        {!loading && selectedMapel && (
          <TugasList
            mapel={selectedMapel}
            tugasList={tugasForSelected}
            onBack={() => setSelectedMapel(null)}
            onAdd={() => setShowAddTugas(true)}
            onToggle={handleToggleTugas}
            onDelete={handleDeleteTugas}
          />
        )}
      </main>

      {showAddMapel && <AddMapelModal onClose={() => setShowAddMapel(false)} onSubmit={handleAddMapel} />}
      {showAddTugas && selectedMapel && (
        <AddTugasModal
          mapelNama={selectedMapel.nama}
          onClose={() => setShowAddTugas(false)}
          onSubmit={handleAddTugas}
        />
      )}
    </div>
  )
}
