import { useState } from 'react'
import * as auth from '../lib/auth.js'
import './AuthScreen.css'

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login') // 'login' | 'daftar'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = mode === 'login' ? await auth.signIn(username, password) : await auth.signUp(username, password)
      onAuthed(user)
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan, coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">📋</div>
        <h1>Papan Tugas</h1>
        <p className="auth-tagline">
          {mode === 'login' ? 'Masuk untuk lihat tugas-tugasmu.' : 'Buat akun untuk mulai mencatat tugas.'}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('login')
              setError('')
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            className={mode === 'daftar' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => {
              setMode('daftar')
              setError('')
            }}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              type="text"
              placeholder="contoh: budi_smanic"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Buat akun'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              Belum punya akun?{' '}
              <button type="button" onClick={() => setMode('daftar')}>
                Daftar di sini
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Masuk di sini
              </button>
            </>
          )}
        </p>

        <p className={`auth-storage-hint ${auth.usingSupabaseAuth ? 'is-supabase' : 'is-local'}`}>
          {auth.usingSupabaseAuth
            ? '☁️ Akun tersimpan di Supabase.'
            : '💾 Belum terhubung ke Supabase — akun tersimpan di perangkat ini saja.'}
        </p>
      </div>
    </div>
  )
}
